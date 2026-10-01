import type { SldModel } from "@/lib/sld-engine";

/**
 * توزيع سلاسل الألواح على مداخل تتبع نقطة القدرة العظمى (MPPT) في الإنفرتر.
 * التوزيع هندسي متوازن: الفارق بين أي مدخلين لا يتجاوز سلسلة واحدة،
 * والمداخل الفارغة لا تُرسم إطلاقاً (لا يُرسم إلا ما هو موجود فعلاً).
 */
export type MpptInput = {
  /** رقم المدخل في الإنفرتر (1-based). */
  index: number;
  /** أرقام السلاسل الموصولة بهذا المدخل. */
  strings: number[];
  /** تيار التشغيل التقريبي للمدخل (A) = مجموع Imp للسلاسل. */
  imp: number | null;
  /** تيار القصر المصمم عليه الفيوز (A) = Isc × 1.25 × عدد السلاسل. */
  isc: number | null;
  /** جهد الدخل (V) = Vmp للسلسلة (السلاسل على التوازي فالجهد ثابت). */
  vmp: number | null;
};

/** يوزّع عدد السلاسل على عدد المداخل المتاحة توزيعاً متوازناً. */
export function distributeStrings(strings: number, inputs: number): number[][] {
  const n = Math.max(1, Math.floor(strings) || 1);
  const k = Math.max(1, Math.floor(inputs) || 1);
  const used = Math.min(k, n);
  const base = Math.floor(n / used);
  const extra = n % used;
  const out: number[][] = [];
  let next = 1;
  for (let i = 0; i < used; i++) {
    const count = base + (i < extra ? 1 : 0);
    const group: number[] = [];
    for (let j = 0; j < count; j++) group.push(next++);
    out.push(group);
  }
  return out;
}

/** خريطة مداخل الـ MPPT الفعلية لمنظومة العميل. */
export function mpptMap(m: SldModel): MpptInput[] {
  const pv = m.pv;
  const inv = m.inverter;
  if (!pv) return [];
  const inputs = Math.max(1, inv?.mppt || 1);
  const groups = distributeStrings(pv.strings || 1, inputs);
  return groups.map((strings, i) => ({
    index: i + 1,
    strings,
    imp: pv.imp ? +(pv.imp * strings.length).toFixed(1) : null,
    isc: pv.isc ? Math.ceil(pv.isc * 1.25 * strings.length) : null,
    vmp: pv.strVmp ? Math.round(pv.strVmp) : null,
  }));
}

/** وصف نصي مختصر للتوزيع — يُستخدم في الملاحظات والتصدير. */
export function mpptSummary(map: MpptInput[]): string {
  if (!map.length) return "";
  return map.map((g) => `MPPT ${g.index} = ${g.strings.length} string${g.strings.length > 1 ? "s" : ""}`).join(" | ");
}
