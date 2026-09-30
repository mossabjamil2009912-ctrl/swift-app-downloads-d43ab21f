import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** تحويل الرقم إلى صيغة دولية بدون + (اليمن 967 افتراضياً). */
export function normalizeWa(raw: string | undefined | null): string {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("967")) return digits;
  if (digits.length === 9) return `967${digits}`;
  return digits;
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const payloadSchema = z.object({
  text: z.string().min(1).max(3000),
  to: z.string().optional(),
  clientName: z.string().max(120).optional(),
  clientPhone: z.string().max(40).optional(),
  orderId: z.string().max(80).optional(),
  quoteNumber: z.string().max(80).optional(),
  transferRef: z.string().max(120).optional(),
  method: z.string().max(40).optional(),
  total: z.number().optional(),
  system: z.string().max(1500).optional(),
  buttons: z.array(z.object({ id: z.string().max(200), title: z.string().max(40) })).max(3).optional(),
});

/**
 * إشعار الإدارة بطلب جديد.
 * الإشعارات تُسجَّل داخل التطبيق فقط (لوحة الإدارة) — لا توجد أي خدمة مراسلة خارجية.
 */
export const notifyAdminWhatsapp = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => payloadSchema.parse(data))
  .handler(async ({ data }) => {
    const lines = [
      data.text,
      data.clientName ? `العميل: ${data.clientName}` : "",
      data.quoteNumber ? `رقم الفاتورة: ${data.quoteNumber}` : "",
    ]
      .filter(Boolean)
      .join(" | ");
    console.log(`[actes] إشعار إدارة: ${lines.slice(0, 500)}`);
    return { ok: true as const };
  });

const decisionSchema = z.object({
  action: z.enum(["confirm", "cancel"]),
  orderId: z.string().max(80),
  quoteNumber: z.string().max(80).optional(),
  clientName: z.string().max(120).optional(),
  clientPhone: z.string().max(40).optional(),
  transferRef: z.string().max(120).optional(),
  total: z.number().optional(),
});

export const CONFIRM_TEXT = "تم تأكيد فاتورتك، وسيتواصل بك مسؤول المبيعات خلال لحظات.";
export const REJECT_TEXT =
  "عذراً، رقم الحوالة أو رقم مرجع العملية غير صحيح. يرجى إعادة إدخال رقم الحوالة أو رقم مرجع العملية.";

export function buildDecisionMessages(input: {
  action: "confirm" | "cancel";
  orderId: string;
  quoteNumber?: string | undefined;
  clientName?: string | undefined;
  clientPhone?: string | undefined;
  transferRef?: string | undefined;
  total?: number | undefined;
}) {
  const ref = input.quoteNumber || input.orderId;
  const confirm = input.action === "confirm";
  const clientText = [
    confirm ? "✅ <b>تأكيد الفاتورة — ACTES</b>" : "❌ <b>إلغاء الفاتورة — ACTES</b>",
    `🧾 رقم الفاتورة: ${escapeHtml(ref)}`,
    input.transferRef ? `💳 رقم الحوالة: ${escapeHtml(input.transferRef)}` : "",
    "",
    confirm ? CONFIRM_TEXT : REJECT_TEXT,
  ]
    .filter(Boolean)
    .join("\n");

  const adminText = [
    confirm ? "✅ <b>تم تأكيد فاتورة</b>" : "❌ <b>تم إلغاء فاتورة</b>",
    `🧾 رقم الفاتورة: ${escapeHtml(ref)}`,
    input.clientName ? `👤 العميل: ${escapeHtml(input.clientName)}` : "",
    input.clientPhone ? `📞 رقم العميل: ${normalizeWa(input.clientPhone)}` : "",
    input.transferRef ? `💳 رقم الحوالة: ${escapeHtml(input.transferRef)}` : "",
    typeof input.total === "number" && input.total > 0 ? `💰 الإجمالي: ${input.total}$` : "",
    "",
    confirm ? "تم إشعار العميل داخل التطبيق." : "طُلب من العميل إعادة إدخال رقم الحوالة.",
  ]
    .filter(Boolean)
    .join("\n");

  return { clientText, adminText };
}

/** قرار الفاتورة (تأكيد/إلغاء) — يُسجَّل داخل التطبيق فقط. */
export const notifyInvoiceDecision = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => decisionSchema.parse(data))
  .handler(async ({ data }) => {
    const messages = buildDecisionMessages(data);
    console.log(`[actes] قرار فاتورة: ${messages.adminText.slice(0, 300)}`);
    return { ok: true, admin: true, client: false, error: null };
  });
