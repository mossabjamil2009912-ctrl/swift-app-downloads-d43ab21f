import { createServerFn } from "@tanstack/react-start";
import { createHash, timingSafeEqual } from "node:crypto";

// وصول آمن للطلبات والإشعارات بعد قفل الجدولين أمام الوصول العام:
// - حساب العميل هو رقمه: يجلب طلبات رقمه فقط، ويحدّث طلباً يملك رمز وصوله (accessToken).
// - الإدارة تصل لكل شيء بكلمة المرور التي تُفحص في الخادم.

function matches(input: string, expected: string): boolean {
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

function checkAdmin(password: string): void {
  const expected = process.env["ADMIN_PASSWORD"];
  if (!expected || !password || !matches(password, expected)) {
    throw new Error("Unauthorized");
  }
}

async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

type AnyPayload = Record<string, any>;
interface Row {
  id: string;
  payload: AnyPayload;
}

const nowIso = () => new Date().toISOString();

/** الإدارة: جلب كل الطلبات والإشعارات. */
export const adminPullStore = createServerFn({ method: "POST" })
  .inputValidator((data: { password: string }) => ({ password: String(data?.password ?? "") }))
  .handler(async ({ data }) => {
    checkAdmin(data.password);
    const supabase = await db();
    const [ordersRes, notifsRes] = await Promise.all([
      supabase.from("orders").select("id, payload").limit(2000),
      supabase.from("notifications").select("id, payload").limit(5000),
    ]);
    if (ordersRes.error) throw new Error(ordersRes.error.message);
    if (notifsRes.error) throw new Error(notifsRes.error.message);
    return {
      orders: (ordersRes.data ?? []).map((row) => (row as Row).payload),
      notifs: (notifsRes.data ?? []).map((row) => (row as Row).payload),
    };
  });

/** الإدارة: رفع نسخة محدثة من الطلبات والإشعارات. */
export const adminPushStore = createServerFn({ method: "POST" })
  .inputValidator((data: { password: string; orders: AnyPayload[]; notifs: AnyPayload[] }) => ({
    password: String(data?.password ?? ""),
    orders: Array.isArray(data?.orders) ? data.orders.slice(0, 2000) : [],
    notifs: Array.isArray(data?.notifs) ? data.notifs.slice(0, 5000) : [],
  }))
  .handler(async ({ data }) => {
    checkAdmin(data.password);
    const supabase = await db();
    if (data.orders.length) {
      const res = await supabase.from("orders").upsert(
        data.orders.map((order) => ({ id: String(order["id"]), payload: order as never, updated_at: nowIso() })),
      );
      if (res.error) throw new Error(res.error.message);
    }
    if (data.notifs.length) {
      const res = await supabase.from("notifications").upsert(
        data.notifs.map((item) => ({ id: String(item["id"]), payload: item as never, updated_at: nowIso() })),
      );
      if (res.error) throw new Error(res.error.message);
    }
    return { ok: true as const };
  });

/** العميل: إنشاء طلب جديد أو تحديث طلب يملك رمزه، مع إشعاراته. */
export const pushClientOrder = createServerFn({ method: "POST" })
  .inputValidator((data: { order: AnyPayload; notifs: AnyPayload[] }) => ({
    order: (data?.order ?? {}) as AnyPayload,
    notifs: Array.isArray(data?.notifs) ? data.notifs.slice(0, 200) : [],
  }))
  .handler(async ({ data }) => {
    const order = data.order;
    const id = String(order["id"] ?? "");
    const token = String(order["accessToken"] ?? "");
    if (!id || !token) return { ok: false as const, error: "missing_fields" };

    const supabase = await db();
    const existing = await supabase.from("orders").select("payload").eq("id", id).maybeSingle();
    if (existing.error) throw new Error(existing.error.message);
    if (existing.data) {
      const storedToken = String((existing.data.payload as AnyPayload)?.["accessToken"] ?? "");
      if (!storedToken || storedToken !== token) return { ok: false as const, error: "forbidden" };
    }

    const up = await supabase
      .from("orders")
      .upsert({ id, payload: order as never, updated_at: nowIso() });
    if (up.error) throw new Error(up.error.message);

    const ownNotifs = data.notifs.filter((item) => String(item?.["orderId"] ?? "") === id && item?.["id"]);
    if (ownNotifs.length) {
      const res = await supabase.from("notifications").upsert(
        ownNotifs.map((item) => ({ id: String(item["id"]), payload: item as never, updated_at: nowIso() })),
      );
      if (res.error) throw new Error(res.error.message);
    }
    return { ok: true as const };
  });

/** العميل: جلب طلباته — برقم العميل (هوية الحساب) و/أو برموز الوصول المحفوظة محلياً. */
export const pullClientOrders = createServerFn({ method: "POST" })
  .inputValidator((data: { items?: { id: string; token: string }[]; phone?: string }) => ({
    items: Array.isArray(data?.items)
      ? data.items.slice(0, 100).map((item) => ({ id: String(item?.id ?? ""), token: String(item?.token ?? "") }))
      : [],
    phone: String(data?.phone ?? "").trim(),
  }))
  .handler(async ({ data }) => {
    const supabase = await db();
    const byId = new Map<string, AnyPayload>();

    // حساب العميل هو رقمه: نجلب كل الطلبات المسجلة على نفس الرقم.
    if (data.phone) {
      const phoneRes = await supabase
        .from("orders")
        .select("id, payload")
        .eq("payload->>clientPhone", data.phone)
        .limit(500);
      if (phoneRes.error) throw new Error(phoneRes.error.message);
      (phoneRes.data ?? []).forEach((row) => byId.set(String((row as Row).id), (row as Row).payload));
    }

    // الطلبات المحفوظة على هذا الجهاز: تُطابَق برمز الوصول الخاص بها.
    const items = data.items.filter((item) => item.id && item.token);
    if (items.length) {
      const ordersRes = await supabase
        .from("orders")
        .select("id, payload")
        .in("id", items.map((item) => item.id));
      if (ordersRes.error) throw new Error(ordersRes.error.message);
      const tokenById = new Map(items.map((item) => [item.id, item.token]));
      (ordersRes.data ?? []).forEach((row) => {
        const stored = String(((row as Row).payload?.["accessToken"] ?? "") as string);
        if (stored && stored === tokenById.get((row as Row).id)) byId.set(String((row as Row).id), (row as Row).payload);
      });
    }

    if (!byId.size) return { orders: [] as AnyPayload[], notifs: [] as AnyPayload[] };
    const orders = Array.from(byId.values());
    const orderIds = new Set(orders.map((order) => String(order["id"])));

    const notifsRes = await supabase.from("notifications").select("id, payload").limit(5000);
    if (notifsRes.error) throw new Error(notifsRes.error.message);
    const notifs = (notifsRes.data ?? [])
      .map((row) => (row as Row).payload)
      .filter((payload) => orderIds.has(String(payload?.["orderId"] ?? "")));
    return { orders, notifs };
  });
