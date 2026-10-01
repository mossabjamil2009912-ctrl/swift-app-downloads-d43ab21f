/**
 * محرك نتائج دراسة PVsyst.
 * يحوّل معاملات الدراسة القادمة من محرك البوت (study_params) إلى نتائج محاكاة
 * شهرية وسنوية فعلية بنفس منهجية تقرير PVsyst:
 *   GlobHor → GlobInc → GlobEff → EArray → E_Grid
 *
 * قاعدة البيانات المناخية: بيانات Meteonorm الفعلية لمحطة صنعاء المأخوذة من
 * تقرير PVsyst V8.1.2 (الإشعاع الأفقي، الإشعاع المنتشر، الإشعاع على مستوى
 * الألواح، ومتوسط الحرارة الشهرية)، ومتوسطات مناخية مكافئة لبقية المناطق.
 *
 * سلسلة الفواقد مطابقة لمخطط الفواقد في التقرير:
 *   التظليل ‎-0.56%‎ | الغبار ‎-0.14%‎ | معامل السقوط IAM ‎-3.00%‎ | انعكاس الأرض ‎-0.25%‎
 *   الحرارة (متغيرة شهرياً) | جودة الوحدة ‎+0.75%‎ | LID ‎-2.00%‎ | عدم التطابق ‎-2.00%‎
 *   أسلاك DC ‎-0.06%‎ | الإنفرتر وفواقد النظام وتوقف التشغيل ‎-4.90%‎
 *
 * لا تُحسب أي قيمة إذا لم تتوفر مدخلاتها — تُترك فارغة ليخفيها العرض.
 */

import { tiltAdjustmentFactors, azimuthLabel } from "./pvsyst-geometry";

export const MONTH_NAMES_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

type Climate = {
  /** الإشعاع الشهري على مستوى الألواح GlobInc — kWh/m² */
  globInc: number[];
  /** متوسط درجة الحرارة المحيطة شهرياً °C */
  temp: number[];
  /** الإشعاع الأفقي الشهري GlobHor — kWh/m² (اختياري) */
  ghi?: number[];
  /** الإشعاع المنتشر الأفقي DiffHor — kWh/m² (اختياري) */
  dhi?: number[];
};

/** يبني مصفوفة شهرية من معدل يومي kWh/m²/day. */
const monthly = (daily: number[]) => daily.map((d, i) => Math.round(d * DAYS_IN_MONTH[i]! * 10) / 10);

const CLIMATES: Record<string, Climate> = {
  // المرتفعات الجبلية — بيانات Meteonorm الفعلية لمحطة صنعاء (تقرير PVsyst V8.1.2)
  highland: {
    globInc: [179.5, 178.6, 209.2, 199.9, 224.5, 206.9, 186.0, 189.6, 202.1, 212.1, 176.8, 173.3],
    ghi: [181.6, 180.3, 210.5, 200.7, 224.6, 206.7, 186.0, 190.1, 203.1, 213.8, 178.8, 175.4],
    dhi: [38.70, 40.90, 51.53, 63.11, 63.69, 75.21, 84.51, 72.46, 60.00, 43.61, 41.04, 40.87],
    temp: [15.03, 17.13, 18.53, 19.93, 22.03, 23.63, 23.23, 22.43, 21.73, 18.03, 15.93, 14.43],
  },
  // الهضاب الصحراوية الداخلية (مأرب، الجوف، شبوة، داخل حضرموت، البيضاء)
  desert: {
    globInc: monthly([6.11, 6.58, 6.82, 6.74, 6.63, 6.57, 6.38, 6.41, 6.46, 6.52, 6.22, 6.02]),
    temp: [20.2, 22.0, 25.3, 28.4, 31.6, 33.8, 33.2, 32.5, 31.0, 27.8, 23.9, 20.9],
  },
  // ساحل البحر الأحمر (الحديدة، ميدي، حرض)
  redsea: {
    globInc: monthly([5.61, 5.98, 6.12, 6.03, 5.88, 5.76, 5.42, 5.51, 5.79, 6.01, 5.72, 5.52]),
    temp: [25.3, 25.9, 27.6, 29.8, 32.1, 34.0, 34.6, 34.2, 33.1, 30.4, 28.0, 26.1],
  },
  // ساحل خليج عدن والبحر العربي (عدن، لحج، أبين، المكلا، المهرة)
  aden: {
    globInc: monthly([5.79, 6.18, 6.31, 6.22, 6.02, 5.72, 5.48, 5.59, 5.91, 6.12, 5.92, 5.72]),
    temp: [25.6, 26.1, 27.9, 30.0, 32.0, 33.4, 32.6, 32.1, 31.6, 29.8, 27.7, 26.3],
  },
  // سقطرى (تأثير موسمي صيفي واضح)
  island: {
    globInc: monthly([5.52, 5.98, 6.18, 6.08, 5.78, 5.02, 4.61, 4.82, 5.52, 5.98, 5.78, 5.51]),
    temp: [24.1, 24.4, 25.8, 27.6, 29.4, 30.2, 29.1, 28.6, 28.8, 27.6, 26.2, 24.8],
  },
};

type Site = { climate: keyof typeof CLIMATES; tiltDeg: number; lat: number; lon?: number; alt?: number };

const SITES: { keys: string[]; site: Site }[] = [
  { keys: ["صنعاء"], site: { climate: "highland", tiltDeg: 15, lat: 15.3539, lon: 44.2059, alt: 2258 } },
  { keys: ["ذمار"], site: { climate: "highland", tiltDeg: 15, lat: 14.55 } },
  { keys: ["عمران"], site: { climate: "highland", tiltDeg: 16, lat: 15.66 } },
  { keys: ["صعدة"], site: { climate: "highland", tiltDeg: 17, lat: 16.94 } },
  { keys: ["إب", "اب"], site: { climate: "highland", tiltDeg: 14, lat: 13.97 } },
  { keys: ["المحويت"], site: { climate: "highland", tiltDeg: 15, lat: 15.47 } },
  { keys: ["تعز"], site: { climate: "highland", tiltDeg: 14, lat: 13.58 } },
  { keys: ["ريمة"], site: { climate: "highland", tiltDeg: 15, lat: 14.63 } },
  { keys: ["حجة"], site: { climate: "highland", tiltDeg: 16, lat: 15.7 } },
  { keys: ["الضالع"], site: { climate: "highland", tiltDeg: 14, lat: 13.7 } },
  { keys: ["مأرب", "مارب"], site: { climate: "desert", tiltDeg: 15, lat: 15.47 } },
  { keys: ["الجوف"], site: { climate: "desert", tiltDeg: 17, lat: 16.6 } },
  { keys: ["شبوة"], site: { climate: "desert", tiltDeg: 15, lat: 14.5 } },
  { keys: ["البيضاء"], site: { climate: "desert", tiltDeg: 14, lat: 13.98 } },
  { keys: ["الحديدة"], site: { climate: "redsea", tiltDeg: 15, lat: 14.8 } },
  { keys: ["عدن"], site: { climate: "aden", tiltDeg: 13, lat: 12.8 } },
  { keys: ["لحج"], site: { climate: "aden", tiltDeg: 13, lat: 13.05 } },
  { keys: ["أبين", "ابين"], site: { climate: "aden", tiltDeg: 14, lat: 13.6 } },
  { keys: ["حضرموت", "المكلا", "سيئون", "تريم"], site: { climate: "aden", tiltDeg: 15, lat: 14.53 } },
  { keys: ["المهرة", "الغيضة"], site: { climate: "aden", tiltDeg: 16, lat: 16.2 } },
  { keys: ["سقطرى", "سقطري", "حديبو"], site: { climate: "island", tiltDeg: 13, lat: 12.5 } },
];

function findSite(city: string): Site | null {
  const key = String(city || "").trim();
  if (!key) return null;
  for (const entry of SITES) {
    for (const name of entry.keys) {
      if (key.includes(name)) return entry.site;
    }
  }
  return null;
}

/** معاملات الفواقد الثابتة، بنفس قيم مخطط الفواقد في تقرير PVsyst. */
export const LOSS_FACTORS = {
  shading: -0.0056,
  soiling: -0.0014,
  iam: -0.03,
  groundReflection: -0.0025,
  moduleQuality: 0.0075,
  lid: -0.02,
  mismatch: -0.02,
  dcWiring: -0.0006,
  /** الإنفرتر + فواقد النظام + توقف التشغيل (2% من الزمن) */
  inverterSystem: -0.049,
  /** فاقد دورة الشحن والتفريغ للمنظومات ذات التخزين */
  storageHybrid: -0.015,
  storageOffGrid: -0.06,
};

/** معامل تحويل GlobInc إلى GlobEff (تظليل + غبار + IAM + انعكاس الأرض). */
const GLOB_EFF_FACTOR =
  (1 + LOSS_FACTORS.shading) * (1 + LOSS_FACTORS.soiling) * (1 + LOSS_FACTORS.iam) * (1 + LOSS_FACTORS.groundReflection);

/** معامل الفواقد الثابتة داخل المصفوفة (جودة + LID + عدم تطابق + أسلاك DC). */
const ARRAY_FIXED_FACTOR =
  (1 + LOSS_FACTORS.moduleQuality) *
  (1 + LOSS_FACTORS.lid) *
  (1 + LOSS_FACTORS.mismatch) *
  (1 + LOSS_FACTORS.dcWiring);

/** كسب الوجه الخلفي للألواح ثنائية الوجه (bifacial) كما في تقرير PVsyst. */
const BIFACIAL_GAIN = 0.0224;

/** معامل قدرة الألواح مع الحرارة ‎-0.34%/°C‎ فوق ٢٥ درجة. */
const TEMP_COEFF = 0.0034;

export type MonthRow = {
  month: string;
  /** الإشعاع الأفقي GlobHor — kWh/m² (null إذا لم تتوفر البيانات) */
  ghi: number | null;
  /** الإشعاع المنتشر DiffHor — kWh/m² */
  dhi: number | null;
  /** متوسط الحرارة المحيطة °C */
  temp: number;
  /** الإشعاع على مستوى الألواح GlobInc — kWh/m² */
  irradiation: number;
  /** الإشعاع الفعّال بعد التظليل والغبار وIAM — kWh/m² */
  globEff: number;
  /** طاقة مخرج المصفوفة EArray — kWh */
  eArray: number;
  /** الطاقة المفيدة المُنتَجة E_Grid — kWh */
  energy: number;
  /** معامل الأداء الشهري PR */
  pr: number;
};

export type PvsystStudyResult = {
  reference: string;
  customer: string;
  city: string;
  /** ملخص النظام — الحقول غير المتوفرة تكون null */
  system: {
    kwp: number | null;
    panelQty: number | null;
    panelWp: number | null;
    panelModel: string | null;
    invModel: string | null;
    invQty: number | null;
    invTotalKw: number | null;
    batteryModel: string | null;
    batteryKwh: number | null;
    sysMode: string | null;
    phase: string | null;
    tilt: number | null;
    azimuth: string | null;
    /** نسبة قدرة الألواح إلى قدرة الإنفرترات Pnom ratio */
    pnomRatio: number | null;
    strings: number | null;
    perString: number | null;
    latitude: number | null;
    longitude: number | null;
    altitude: number | null;
  };
  months: MonthRow[];
  annualEnergy: number | null;
  monthlyAverage: number | null;
  annualPr: number | null;
  specificYield: number | null;
  losses: number | null;
  /** تفصيل الفواقد السنوية kWh لعرضها في التقرير */
  lossBreakdown: { label: string; percent: number; energy: number | null }[];
  /** إجمالي الإشعاع السنوي على مستوى الألواح kWh/m² */
  annualIrradiation: number | null;
  /** الطاقة الاسمية للمصفوفة عند STC — kWh */
  nominalEnergy: number | null;
  /** نسبة تغطية استهلاك العميل % */
  coverage: number | null;
  /** الاستهلاك السنوي المدخل من العميل kWh */
  annualConsumption: number | null;
  /** أعلى وأدنى شهر إنتاجاً */
  bestMonth: string | null;
  worstMonth: string | null;
};

function num(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function text(value: unknown): string | null {
  const s = String(value ?? "").trim();
  return s ? s : null;
}

const MODE_LABEL: Record<string, string> = {
  on: "متصل بالشبكة (On-Grid)",
  off: "مستقل (Off-Grid)",
  hyb: "هجين (Hybrid)",
};

/** خيارات اختيارية لتعديل هندسة التركيب (زاوية الميلان والاتجاه). */
export type OrientationOverride = { tilt?: number | null; azimuth?: number | null };

/** يبني نتائج الدراسة من معاملات الدراسة (study_params) القادمة من البوت. */
export function buildPvsystStudy(
  sp: Record<string, unknown> | null,
  fallback: { city?: string; customer?: string; reference?: string; monthlyConsumption?: unknown },
  orientation?: OrientationOverride,
): PvsystStudyResult | null {
  if (!sp) return null;
  const sys = (sp['system'] || {}) as Record<string, unknown>;

  const city = text(sp['city']) || text(fallback.city) || "";
  const kwp = num(sys['kwp']);
  const panelQty = num(sys['panel_qty']);
  const panelWp = num(sys['panel_wp']);
  const invTotalKw = num(sys['inv_total_kw']);
  const sysModeKey = text(sys['sys_mode']) || text(sp['sys_mode']) || "";
  const site = findSite(city);
  // كسب الوجه الخلفي يُحسب فقط إذا كانت الألواح ثنائية الوجه فعلاً
  const panelModel = text(sys['panel_model']) || "";
  const bifacialFactor = /bifacial|ثنائي|nsh|n-?type/i.test(panelModel) ? 1 + BIFACIAL_GAIN : 1;

  const months: MonthRow[] = [];
  let annualEnergy = 0;
  let annualIrr = 0;
  let annualEff = 0;
  let annualArray = 0;

  // فاقد التخزين يُطبّق فقط على المنظومات التي تحتوي بطاريات
  const storageLoss =
    sysModeKey === "off"
      ? LOSS_FACTORS.storageOffGrid
      : num(sys['battery_kwh'])
        ? LOSS_FACTORS.storageHybrid
        : 0;
  const systemFactor = (1 + LOSS_FACTORS.inverterSystem) * (1 + storageLoss);

  if (site && kwp) {
    const climate = CLIMATES[site.climate]!;
    for (let m = 0; m < 12; m += 1) {
      const days = DAYS_IN_MONTH[m]!;
      const irradiation = climate.globInc[m]!;
      const daily = irradiation / days;
      const globEff = irradiation * GLOB_EFF_FACTOR;
      // حرارة الخلية الفعّالة مرجّحة بشدة الإشعاع، بنفس منهجية معامل Uc في التقرير
      const cellTemp = climate.temp[m]! + 20 * (daily / 6.4);
      const tempFactor = 1 - Math.max(0, cellTemp - 25) * TEMP_COEFF;
      const eArray = kwp * globEff * ARRAY_FIXED_FACTOR * tempFactor * bifacialFactor;
      const energy = eArray * systemFactor;
      annualEnergy += energy;
      annualIrr += irradiation;
      annualEff += globEff;
      annualArray += eArray;
      months.push({
        month: MONTH_NAMES_AR[m]!,
        ghi: climate.ghi ? climate.ghi[m]! : null,
        dhi: climate.dhi ? climate.dhi[m]! : null,
        temp: climate.temp[m]!,
        irradiation: Math.round(irradiation * 10) / 10,
        globEff: Math.round(globEff * 10) / 10,
        eArray: Math.round(eArray),
        energy: Math.round(energy),
        pr: Math.round((energy / (kwp * irradiation)) * 1000) / 1000,
      });
    }
  }

  const hasSim = months.length === 12;
  const monthlyConsumption = num(fallback.monthlyConsumption) || num(sp['monthly_consumption']);
  const annualConsumption = monthlyConsumption ? monthlyConsumption * 12 : null;
  const nominalEnergy = hasSim && kwp ? kwp * annualIrr : null;

  // تفصيل الفواقد السنوية بنفس ترتيب مخطط الفواقد في التقرير
  const lossBreakdown: PvsystStudyResult["lossBreakdown"] = [];
  if (hasSim && kwp) {
    const base = kwp * annualIrr;
    const add = (label: string, percent: number, of: number) =>
      lossBreakdown.push({ label, percent, energy: Math.round(Math.abs(of * percent)) });
    add("فاقد التظليل القريب", LOSS_FACTORS.shading, base);
    add("فاقد الغبار والأتربة", LOSS_FACTORS.soiling, base);
    add("فاقد زاوية السقوط IAM", LOSS_FACTORS.iam, base);
    add("انعكاس الأرض على الوجه الأمامي", LOSS_FACTORS.groundReflection, base);
    const arrayBase = kwp * annualEff;
    add("فاقد الحرارة", annualArray / (arrayBase * ARRAY_FIXED_FACTOR) - 1, arrayBase);
    if (bifacialFactor > 1) add("كسب الوجه الخلفي (ثنائي الوجه)", BIFACIAL_GAIN, arrayBase);
    add("جودة الوحدات", LOSS_FACTORS.moduleQuality, arrayBase);
    add("التدهور الضوئي LID", LOSS_FACTORS.lid, arrayBase);
    add("عدم تطابق الوحدات", LOSS_FACTORS.mismatch, arrayBase);
    add("أسلاك التيار المستمر DC", LOSS_FACTORS.dcWiring, arrayBase);
    add("الإنفرتر وفواقد النظام", LOSS_FACTORS.inverterSystem, annualArray);
    if (storageLoss) add("دورة الشحن والتفريغ للبطاريات", storageLoss, annualArray);
  }

  const sorted = hasSim ? [...months].sort((a, b) => b.energy - a.energy) : [];

  return {
    reference: text(sp['quote_number']) || text(fallback.reference) || "",
    customer: text(sp['customer_name']) || text(fallback.customer) || "",
    city,
    system: {
      kwp,
      panelQty,
      panelWp,
      panelModel: panelModel || null,
      invModel: text(sys['inv_model']),
      invQty: num(sys['inv_qty']),
      invTotalKw,
      batteryModel: text(sys['battery_model']),
      batteryKwh: num(sys['battery_kwh']),
      sysMode: MODE_LABEL[sysModeKey] || null,
      phase: sys['phase3'] === true ? "ثلاثي الطور (3 Phase)" : sys['phase3'] === false ? "أحادي الطور (1 Phase)" : null,
      tilt: site ? site.tiltDeg : null,
      azimuth: site ? "الجنوب (0°)" : null,
      pnomRatio: kwp && invTotalKw ? Math.round((kwp / invTotalKw) * 100) / 100 : null,
      strings: num(sys['strings']),
      perString: num(sys['per_string']),
      latitude: site?.lat ?? null,
      longitude: site?.lon ?? null,
      altitude: site?.alt ?? null,
    },
    months,
    annualEnergy: hasSim ? Math.round(annualEnergy) : null,
    monthlyAverage: hasSim ? Math.round(annualEnergy / 12) : null,
    annualPr: hasSim && kwp && annualIrr ? Math.round((annualEnergy / (kwp * annualIrr)) * 1000) / 1000 : null,
    specificYield: hasSim && kwp ? Math.round(annualEnergy / kwp) : null,
    losses: hasSim && nominalEnergy ? Math.round(nominalEnergy - annualEnergy) : null,
    lossBreakdown,
    annualIrradiation: hasSim ? Math.round(annualIrr * 10) / 10 : null,
    nominalEnergy: nominalEnergy ? Math.round(nominalEnergy) : null,
    coverage: hasSim && annualConsumption ? Math.round((annualEnergy / annualConsumption) * 100) : null,
    annualConsumption,
    bestMonth: sorted.length ? sorted[0]!.month : null,
    worstMonth: sorted.length ? sorted[sorted.length - 1]!.month : null,
  };
}
