/**
 * الدراسة الاقتصادية والبيئية للمنظومة الشمسية (Financial & Carbon KPIs).
 *
 * تُبنى على ناتج محاكاة PVsyst (الإنتاج السنوي) وتكلفة المنظومة المأخوذة من
 * بنود عرض السعر، وتحسب:
 *   - الوفر المالي السنوي مقابل بديل الطاقة (شبكة / مولد ديزل)
 *   - فترة استرداد رأس المال Payback Period
 *   - صافي الوفر التراكمي خلال العمر التشغيلي (25 سنة)
 *   - تكلفة إنتاج الطاقة المستوية LCOE
 *   - خفض انبعاثات ثاني أكسيد الكربون، الديزل الموفّر، ومكافئ الأشجار
 *
 * كل القيم الافتراضية قابلة للتعديل من واجهة الدراسة.
 */

/** سعر صرف الريال اليمني مقابل الدولار المعتمد في محرك التسعير. */
export const FX_YER = 530;

/** سعر الكيلوواط ساعة بالريال اليمني المعتمد في محرك التسعير. */
export const KWH_PRICE_YER = 250;

/** سعر الكيلوواط ساعة بالدولار (بديل الطاقة الحالي). */
export const DEFAULT_TARIFF_USD = Math.round((KWH_PRICE_YER / FX_YER) * 1000) / 1000;

export type EconomicsInput = {
  /** الإنتاج السنوي من المحاكاة kWh */
  annualEnergy: number;
  /** قدرة الألواح kWp */
  kwp: number | null;
  /** تكلفة المنظومة (رأس المال) بالدولار */
  capex: number;
  /** سعر الكيلوواط ساعة البديل بالدولار */
  tariff: number;
  /** سعر لتر الديزل بالدولار */
  dieselPrice: number;
};

export type EconomicsResult = {
  capex: number;
  tariff: number;
  dieselPrice: number;
  /** الوفر المالي في السنة الأولى $ */
  annualSaving: number;
  /** الوفر الشهري المتوسط $ */
  monthlySaving: number;
  /** فترة الاسترداد بالسنوات */
  paybackYears: number | null;
  /** صافي الوفر التراكمي خلال العمر التشغيلي بعد خصم رأس المال والصيانة $ */
  lifetimeNet: number;
  /** إجمالي الطاقة المنتجة خلال العمر التشغيلي kWh */
  lifetimeEnergy: number;
  /** تكلفة إنتاج الكيلوواط ساعة المستوية $/kWh */
  lcoe: number | null;
  /** العائد على الاستثمار % خلال العمر التشغيلي */
  roi: number | null;
  /** خفض الانبعاثات السنوي طن CO2 */
  co2PerYear: number;
  /** خفض الانبعاثات خلال العمر التشغيلي طن CO2 */
  co2Lifetime: number;
  /** الديزل الموفّر سنوياً باللتر */
  dieselLitersPerYear: number;
  /** تكلفة الديزل المكافئة سنوياً $ */
  dieselCostPerYear: number;
  /** مكافئ عدد الأشجار المزروعة سنوياً */
  treesEquivalent: number;
};

/** العمر التشغيلي المعتمد للمنظومة بالسنوات. */
export const LIFETIME_YEARS = 25;
/** معدل تدهور أداء الألواح السنوي. */
export const DEGRADATION = 0.005;
/** تكلفة التشغيل والصيانة السنوية كنسبة من رأس المال. */
export const OM_RATE = 0.01;
/** معدل الخصم المستخدم في حساب LCOE. */
export const DISCOUNT_RATE = 0.06;
/** معدل تصاعد تعرفة الطاقة السنوي. */
export const TARIFF_ESCALATION = 0.02;
/** استهلاك مولد الديزل لكل كيلوواط ساعة (لتر). */
export const DIESEL_L_PER_KWH = 0.33;
/** معامل انبعاث مولدات الديزل kg CO2 لكل كيلوواط ساعة. */
export const CO2_KG_PER_KWH = 0.75;
/** امتصاص الشجرة الواحدة من ثاني أكسيد الكربون kg سنوياً. */
export const CO2_KG_PER_TREE = 21;

/** يستخرج تكلفة المنظومة من بنود عرض السعر المرفقة بالدراسة. */
export function capexFromQuoteItems(items: unknown): number | null {
  if (!Array.isArray(items) || !items.length) return null;
  let total = 0;
  for (const raw of items) {
    const it = raw as Record<string, unknown>;
    const line = Number(it?.['total']);
    if (Number.isFinite(line) && line > 0) {
      total += line;
      continue;
    }
    const qty = Number(it?.['qty']);
    const price = Number(it?.['price']);
    if (Number.isFinite(qty) && Number.isFinite(price)) total += qty * price;
  }
  return total > 0 ? Math.round(total * 100) / 100 : null;
}

export function buildEconomics(input: EconomicsInput): EconomicsResult | null {
  const { annualEnergy, kwp, capex, tariff, dieselPrice } = input;
  if (!Number.isFinite(annualEnergy) || annualEnergy <= 0) return null;

  const annualSaving = annualEnergy * tariff;
  const omCost = capex * OM_RATE;

  // تدفق نقدي تراكمي مع تدهور الإنتاج وتصاعد التعرفة وتكلفة الصيانة
  let cumulative = -capex;
  let lifetimeEnergy = 0;
  let discountedEnergy = 0;
  let discountedCost = capex;
  let payback: number | null = null;

  for (let year = 1; year <= LIFETIME_YEARS; year += 1) {
    const energy = annualEnergy * Math.pow(1 - DEGRADATION, year - 1);
    const rate = tariff * Math.pow(1 + TARIFF_ESCALATION, year - 1);
    const net = energy * rate - omCost;
    const prev = cumulative;
    cumulative += net;
    lifetimeEnergy += energy;
    const df = Math.pow(1 + DISCOUNT_RATE, year);
    discountedEnergy += energy / df;
    discountedCost += omCost / df;
    if (payback === null && prev < 0 && cumulative >= 0 && net > 0) {
      payback = year - 1 + Math.abs(prev) / net;
    }
  }

  const co2PerYear = (annualEnergy * CO2_KG_PER_KWH) / 1000;
  const dieselLiters = annualEnergy * DIESEL_L_PER_KWH;

  return {
    capex,
    tariff,
    dieselPrice,
    annualSaving: Math.round(annualSaving),
    monthlySaving: Math.round(annualSaving / 12),
    paybackYears: payback !== null ? Math.round(payback * 10) / 10 : null,
    lifetimeNet: Math.round(cumulative),
    lifetimeEnergy: Math.round(lifetimeEnergy),
    lcoe: discountedEnergy > 0 ? Math.round((discountedCost / discountedEnergy) * 1000) / 1000 : null,
    roi: capex > 0 ? Math.round((cumulative / capex) * 100) : null,
    co2PerYear: Math.round(co2PerYear * 10) / 10,
    co2Lifetime: Math.round(((lifetimeEnergy * CO2_KG_PER_KWH) / 1000) * 10) / 10,
    dieselLitersPerYear: Math.round(dieselLiters),
    dieselCostPerYear: Math.round(dieselLiters * dieselPrice),
    treesEquivalent: Math.round((co2PerYear * 1000) / CO2_KG_PER_TREE),
  };
}

/** معدل الإنتاج النوعي لكل كيلوواط مركّب — مؤشر مساعد. */
export function specificCost(capex: number, kwp: number | null): number | null {
  if (!kwp || kwp <= 0 || capex <= 0) return null;
  return Math.round((capex / kwp) * 10) / 10;
}

/** سطر واحد من جدول التدفق النقدي السنوي. */
export type CashFlowRow = {
  year: number;
  /** إنتاج الطاقة المتوقع في هذه السنة kWh */
  energy: number;
  /** تعرفة الطاقة البديلة في هذه السنة $/kWh */
  tariff: number;
  /** إجمالي الوفر السنوي $ */
  saving: number;
  /** تكلفة التشغيل والصيانة $ */
  om: number;
  /** صافي التدفق السنوي $ */
  net: number;
  /** الرصيد التراكمي $ */
  cumulative: number;
  /** التكلفة التراكمية للبديل التقليدي (ديزل/شبكة) $ */
  baselineCumulative: number;
  /** التكلفة التراكمية لمنظومة الطاقة الشمسية (رأس المال + الصيانة) $ */
  solarCumulative: number;
};

/** جدول التدفق النقدي التفصيلي خلال العمر التشغيلي. */
export function cashFlowSchedule(
  input: EconomicsInput,
  escalation: number = TARIFF_ESCALATION,
): CashFlowRow[] {
  const { annualEnergy, capex, tariff } = input;
  if (!Number.isFinite(annualEnergy) || annualEnergy <= 0) return [];
  const om = capex * OM_RATE;
  const rows: CashFlowRow[] = [];
  let cumulative = -capex;
  let baseline = 0;
  let solar = capex;
  for (let year = 1; year <= LIFETIME_YEARS; year += 1) {
    const energy = annualEnergy * Math.pow(1 - DEGRADATION, year - 1);
    const rate = tariff * Math.pow(1 + escalation, year - 1);
    const saving = energy * rate;
    const net = saving - om;
    cumulative += net;
    baseline += saving;
    solar += om;
    rows.push({
      year,
      energy: Math.round(energy),
      tariff: Math.round(rate * 1000) / 1000,
      saving: Math.round(saving),
      om: Math.round(om),
      net: Math.round(net),
      cumulative: Math.round(cumulative),
      baselineCumulative: Math.round(baseline),
      solarCumulative: Math.round(solar),
    });
  }
  return rows;
}

export type Scenario = {
  key: string;
  label: string;
  note: string;
  tariff: number;
  escalation: number;
  result: EconomicsResult | null;
};

/** ثلاثة سيناريوهات لتحليل الحساسية: متحفظ / أساسي / مرتفع. */
export function scenarioAnalysis(input: EconomicsInput): Scenario[] {
  const defs = [
    { key: "low", label: "متحفظ", note: "تعرفة أقل 15% وبدون تصاعد", factor: 0.85, escalation: 0 },
    { key: "base", label: "أساسي", note: "التعرفة المعتمدة وتصاعد 2%", factor: 1, escalation: TARIFF_ESCALATION },
    { key: "high", label: "مرتفع", note: "تعرفة أعلى 15% وتصاعد 4%", factor: 1.15, escalation: 0.04 },
  ];
  return defs.map((d) => {
    const tariff = Math.round(input.tariff * d.factor * 1000) / 1000;
    const rows = cashFlowSchedule({ ...input, tariff }, d.escalation);
    const base = buildEconomics({ ...input, tariff });
    const last = rows.length ? rows[rows.length - 1]! : null;
    let payback: number | null = null;
    let prev = -input.capex;
    for (const r of rows) {
      if (payback === null && prev < 0 && r.cumulative >= 0 && r.net > 0) {
        payback = Math.round((r.year - 1 + Math.abs(prev) / r.net) * 10) / 10;
      }
      prev = r.cumulative;
    }
    const result = base
      ? { ...base, paybackYears: payback, lifetimeNet: last ? last.cumulative : base.lifetimeNet }
      : null;
    return { key: d.key, label: d.label, note: d.note, tariff, escalation: d.escalation, result };
  });
}

/** مكافئات بيئية ملموسة للعميل. */
export function environmentalEquivalents(co2Tons: number) {
  return {
    /** براميل نفط خام موفّرة (0.43 طن CO2 لكل برميل) */
    oilBarrels: Math.round(co2Tons / 0.43),
    /** كيلومترات قيادة سيارة بنزين تم تفادي عوادمها (0.17 كجم/كم) */
    carKm: Math.round((co2Tons * 1000) / 0.17),
    /** أشجار حضرية مكافئة */
    trees: Math.round((co2Tons * 1000) / CO2_KG_PER_TREE),
  };
}
