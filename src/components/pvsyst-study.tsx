import { useMemo, useState } from "react";
import {
  ArrowLeft,
  BadgeDollarSign,
  Boxes,
  CloudSun,
  Compass,
  Download,
  Droplets,
  Gauge,
  Languages,
  Network,
  Plug,
  RotateCcw,
  Share2,
  ShoppingCart,
  Sun,
  Sparkles,
  Table2,
  Thermometer,
  Zap,
} from "lucide-react";
import { buildPvsystStudy } from "@/lib/pvsyst-engine";
import { AZIMUTH_OPTIONS } from "@/lib/pvsyst-geometry";
import { buildEconomics, capexFromQuoteItems, DEFAULT_TARIFF_USD } from "@/lib/pvsyst-economics";
import { downloadPvsystReport } from "@/lib/pvsyst-pdf";
import type { View } from "@/lib/present";
import actesLogoPlain from "@/assets/actes-logo-plain.png.asset.json";

const nf = (n: number, d = 0) => n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** مسميات بنود الفواقد بنصوص PVsyst الرسمية. */
const LOSS_EN: Record<string, string> = {
  "فاقد التظليل القريب": "Near Shadings: irradiance loss",
  "فاقد الغبار والأتربة": "Soiling loss factor",
  "فاقد زاوية السقوط IAM": "IAM factor on global",
  "انعكاس الأرض على الوجه الأمامي": "Ground reflection on front side",
  "فاقد الحرارة": "PV loss due to temperature",
  "كسب الوجه الخلفي (ثنائي الوجه)": "Global irradiance on rear side (bifacial)",
  "جودة الوحدات": "Module quality loss",
  "التدهور الضوئي LID": "LID - Light induced degradation",
  "عدم تطابق الوحدات": "Module array mismatch loss",
  "أسلاك التيار المستمر DC": "Ohmic wiring loss",
  "الإنفرتر وفواقد النظام": "Inverter loss and system unavailability",
  "دورة الشحن والتفريغ للبطاريات": "Battery storage global loss",
};

/** أيقونة معبّرة لكل بند من بنود الفواقد. */
const LOSS_ICON: Record<string, typeof Sun> = {
  "فاقد التظليل القريب": CloudSun,
  "فاقد الغبار والأتربة": Droplets,
  "فاقد زاوية السقوط IAM": Sun,
  "انعكاس الأرض على الوجه الأمامي": Sparkles,
  "فاقد الحرارة": Thermometer,
  "كسب الوجه الخلفي (ثنائي الوجه)": Sparkles,
  "جودة الوحدات": Boxes,
  "التدهور الضوئي LID": Sun,
  "عدم تطابق الوحدات": Boxes,
  "أسلاك التيار المستمر DC": Zap,
  "الإنفرتر وفواقد النظام": Plug,
  "دورة الشحن والتفريغ للبطاريات": Gauge,
};

/** الشرح العربي لرموز جدول التوازن الشهري. */
const COL_AR: Record<string, string> = {
  GlobHor: "الإشعاع الأفقي",
  DiffHor: "الإشعاع المنتشر",
  T_Amb: "حرارة الجو",
  GlobInc: "الإشعاع على الألواح",
  GlobEff: "الإشعاع الفعّال",
  EArray: "إنتاج الألواح",
  E_Grid: "الإنتاج الصافي",
  PR: "معامل الأداء",
};

/** ألوان تقرير PVsyst الرسمية */
const C = { blue: "#1c3f94", sun: "#f5a01e", violet: "#7b3fa0", red: "#c0392b", grid: "#b9c0cf", head: "#dfe4ee" };

type Props = {
  study: NonNullable<View["study"]>;
  actions?: { onBuy: () => void; onBackToQuote: () => void; onSld: () => void; onEco?: () => void };
};

/** شاشة دراسة PVsyst — بنفس تصميم ومحتوى تقرير PVsyst V8.1.2 الرسمي. */
export default function PvsystStudy({ study, actions }: Props) {
  // ==== تعديل اختياري لزاويتي الميلان والاتجاه ====
  const [geoOpen, setGeoOpen] = useState(false);
  const [tilt, setTilt] = useState<number | null>(null);
  const [azimuth, setAzimuth] = useState(0);

  // ==== خيارات العرض ====
  const [arTerms, setArTerms] = useState(false);
  const [hover, setHover] = useState<{ chart: "norm" | "pr" | "cons"; i: number } | null>(null);

  // ==== قيم الدراسة الاقتصادية المرفقة بالتقرير (التفاصيل في شاشة مستقلة) ====
  const tariff = DEFAULT_TARIFF_USD;
  const dieselPrice = 1.1;

  const fallback = useMemo(
    () => ({
      city: study.city,
      customer: study.customer,
      reference: study.number,
      monthlyConsumption: study.monthlyConsumption,
    }),
    [study],
  );

  const result = useMemo(
    () => buildPvsystStudy(study.params, fallback, { tilt, azimuth }),
    [study.params, fallback, tilt, azimuth],
  );
  /** النتيجة بالزوايا الافتراضية للموقع — للمقارنة */
  const baseResult = useMemo(() => buildPvsystStudy(study.params, fallback), [study.params, fallback]);

  const quoteCapex = useMemo(
    () => capexFromQuoteItems((study.params as Record<string, unknown> | null)?.['quote_items']),
    [study.params],
  );
  const capex = quoteCapex ?? 0;

  const eco = useMemo(() => {
    if (!result?.annualEnergy) return null;
    return buildEconomics({
      annualEnergy: result.annualEnergy,
      kwp: result.system.kwp,
      capex,
      tariff,
      dieselPrice,
    });
  }, [result, capex, tariff, dieselPrice]);

  if (!result) return null;
  const s = result.system;
  const months = result.months;
  const hasMonths = months.length === 12;
  const baseAnnual = baseResult?.annualEnergy ?? null;
  const deltaPct =
    baseAnnual && result.annualEnergy && s.orientationCustom
      ? ((result.annualEnergy - baseAnnual) / baseAnnual) * 100
      : null;

  const project = result.customer || result.reference || "ACTES Project";
  const sysTitle = s.batteryKwh ? "Grid-Connected System with storage" : "Grid-Connected System";
  const today = new Date();
  const dstr = `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${String(today.getFullYear()).slice(2)}`;

  // ==== الإنتاج المعياري kWh/kWp/day ====
  const norm = hasMonths && s.kwp
    ? months.map((m, i) => {
        const d = DAYS[i]!;
        const kwp = s.kwp!;
        return {
          yf: m.energy / kwp / d,
          ls: Math.max(0, (m.eArray - m.energy) / kwp / d),
          lc: Math.max(0, (m.irradiation - m.eArray / kwp) / d),
          pr: m.pr,
        };
      })
    : [];
  const normTop = norm.length ? Math.ceil(Math.max(...norm.map((n) => n.yf + n.ls + n.lc)) + 1) : 1;
  const avg = (pick: (n: (typeof norm)[number]) => number) =>
    norm.length ? norm.reduce((a, n) => a + pick(n), 0) / norm.length : 0;

  const totals = hasMonths
    ? months.reduce(
        (a, m) => ({
          ghi: a.ghi + (m.ghi ?? 0),
          dhi: a.dhi + (m.dhi ?? 0),
          inc: a.inc + m.irradiation,
          eff: a.eff + m.globEff,
          arr: a.arr + m.eArray,
          grid: a.grid + m.energy,
        }),
        { ghi: 0, dhi: 0, inc: 0, eff: 0, arr: 0, grid: 0 },
      )
    : null;

  // ==== بيانات محطة الأرصاد ====
  const psh = hasMonths ? months.reduce((a, m, i) => a + m.irradiation / DAYS[i]!, 0) / 12 : null;
  const tMin = hasMonths ? Math.min(...months.map((m) => m.temp)) : null;
  const tMax = hasMonths ? Math.max(...months.map((m) => m.temp)) : null;
  const bestMonth = hasMonths ? months.reduce((a, m) => (m.energy > a.energy ? m : a), months[0]!) : null;
  const bestIdx = bestMonth ? months.indexOf(bestMonth) : -1;

  // ==== الإنتاج مقابل الاستهلاك ====
  const monthlyCons = result.annualConsumption ? result.annualConsumption / 12 : null;
  const consTop = hasMonths && monthlyCons
    ? Math.max(monthlyCons, ...months.map((m) => m.energy)) * 1.1
    : 0;

  const gridMax = hasMonths ? Math.max(...months.map((m) => m.energy)) : 0;
  const gridMin = hasMonths ? Math.min(...months.map((m) => m.energy)) : 0;
  /** تدرّج لوني خفيف لخلايا الإنتاج الصافي. */
  const heat = (v: number) => {
    if (!gridMax || gridMax === gridMin) return undefined;
    const t = (v - gridMin) / (gridMax - gridMin);
    return { background: `rgba(245,160,30,${0.08 + t * 0.4})` };
  };

  /** تصدير جدول المحاكاة الشهري إلى ملف CSV يفتح في Excel. */
  const exportCsv = () => {
    if (!hasMonths) return;
    const head = ["Month", "GlobHor_kWh_m2", "DiffHor_kWh_m2", "T_Amb_C", "GlobInc_kWh_m2", "GlobEff_kWh_m2", "EArray_kWh", "E_Grid_kWh", "PR"];
    const lines = [head.join(",")];
    months.forEach((m, i) => {
      lines.push(
        [
          MONTHS_SHORT[i],
          m.ghi ?? "",
          m.dhi ?? "",
          m.temp.toFixed(2),
          m.irradiation.toFixed(1),
          m.globEff.toFixed(1),
          Math.round(m.eArray),
          Math.round(m.energy),
          m.pr.toFixed(3),
        ].join(","),
      );
    });
    if (totals) {
      lines.push(
        [
          "Year",
          totals.ghi ? totals.ghi.toFixed(1) : "",
          totals.dhi ? totals.dhi.toFixed(1) : "",
          (months.reduce((a, m) => a + m.temp, 0) / 12).toFixed(2),
          totals.inc.toFixed(1),
          totals.eff.toFixed(1),
          Math.round(totals.arr),
          Math.round(totals.grid),
          result.annualPr ? result.annualPr.toFixed(3) : "",
        ].join(","),
      );
    }
    const blob = new Blob(["\ufeff" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ACTES-PVsyst-${result.reference || "study"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const specs: { label: string; value: string }[] = [];
  const spec = (label: string, value: string | null | undefined) => {
    if (value) specs.push({ label, value });
  };
  spec("PV Array nominal power", s.kwp ? `${nf(s.kwp, 2)} kWp` : null);
  spec("Number of PV modules", s.panelQty ? `${nf(s.panelQty)} units` : null);
  spec("Unit nominal power", s.panelWp ? `${nf(s.panelWp)} Wp` : null);
  spec("PV module", s.panelModel);
  spec("Inverter", s.invModel);
  spec("Number of inverters", s.invQty ? `${nf(s.invQty)}` : null);
  spec("Total inverter power", s.invTotalKw ? `${nf(s.invTotalKw, 1)} kWac` : null);
  spec("Pnom ratio (DC:AC)", s.pnomRatio ? `${nf(s.pnomRatio, 2)}` : null);
  spec("Battery storage", s.batteryModel && s.batteryKwh ? `${s.batteryModel} — ${nf(s.batteryKwh, 2)} kWh` : null);
  spec("System type", s.sysMode);
  spec("Grid connection", s.phase);
  spec("Geographical site", result.city || null);
  spec(
    "Coordinates",
    s.latitude && s.longitude ? `${nf(s.latitude, 4)}°N , ${nf(s.longitude, 4)}°E` : s.latitude ? `${nf(s.latitude, 2)}°N` : null,
  );
  spec("Altitude", s.altitude ? `${nf(s.altitude)} m` : null);
  spec("Tilt / Azimuth", s.tilt ? `${s.tilt}° / ${s.azimuth ?? "0°"}` : null);

  const kpis: { label: string; sub: string; value: string }[] = [];
  const kpi = (label: string, sub: string, value: string | null) => {
    if (value) kpis.push({ label, sub, value });
  };
  kpi("Produced Energy", "الإنتاج السنوي", result.annualEnergy ? `${nf(result.annualEnergy)} kWh/year` : null);
  kpi("Specific production", "الإنتاج النوعي", result.specificYield ? `${nf(result.specificYield)} kWh/kWp/year` : null);
  kpi("Performance Ratio PR", "معامل الأداء", result.annualPr ? `${nf(result.annualPr * 100, 1)} %` : null);
  kpi("Global incident irradiation", "الإشعاع السنوي", result.annualIrradiation ? `${nf(result.annualIrradiation)} kWh/m²` : null);
  kpi("System losses", "إجمالي الفواقد", result.losses ? `${nf(result.losses)} kWh` : null);
  kpi("Solar fraction", "تغطية الاستهلاك", result.coverage ? `${nf(result.coverage)} %` : null);

  if (!specs.length && !hasMonths) return null;

  const th = "border px-1.5 py-1 text-[9px] font-black leading-tight";
  const td = "border px-1.5 py-[3px] text-center text-[9.5px] tabular-nums";
  const colHead = (code: string, unit: string) => (
    <th className={th} style={{ borderColor: C.grid }}>
      {arTerms ? COL_AR[code] ?? code : code}
      <br />
      <span className="font-normal">{unit}</span>
    </th>
  );

  const liveTilt = s.tilt ?? s.baseTilt ?? 15;

  return (
    <section className={actions ? "" : "mt-3 rounded-lg border border-border bg-card p-3"}>
      {/* ترويسة تقرير PVsyst الرسمية */}
      <div className="overflow-hidden rounded-md border" style={{ borderColor: C.grid }}>
        <div className="flex items-center gap-3 px-3 py-2" dir="ltr" style={{ background: C.head }}>
          <svg viewBox="0 0 120 90" className="h-8 w-11 shrink-0">
            <circle cx="34" cy="26" r="20" fill={C.sun} />
            <g transform="skewX(-16) translate(14 30)">
              <rect x="0" y="0" width="76" height="48" fill={C.blue} />
              <g stroke="#fff" strokeWidth="2.4">
                <path d="M19 0V48M38 0V48M57 0V48M0 16H76M0 32H76" />
              </g>
            </g>
          </svg>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black" style={{ color: C.blue }}>
              PVsyst V8.1.2 — Simulation report
            </p>
            <p className="truncate text-[10px] font-bold text-neutral-700">
              {sysTitle} — Project: {project}
              {s.kwp ? ` — Variant: ${nf(s.kwp, 0)} kWp` : ""}
            </p>
          </div>
          <img src={actesLogoPlain.url} alt="ACTES" className="h-9 w-auto shrink-0 object-contain" />
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 border-t px-3 py-1.5 text-[9.5px] text-neutral-600" dir="ltr" style={{ borderColor: C.grid }}>
          <span>Date: {dstr}</span>
          {result.reference && <span>Ref: {result.reference}</span>}
          {result.city && <span>Site: {result.city}</span>}
        </div>
        {/* شريط الإجراءات السريع */}
        <div className="flex flex-wrap items-center gap-1.5 border-t bg-card px-3 py-2" style={{ borderColor: C.grid }}>
          <button
            type="button"
            onClick={() => downloadPvsystReport(result, eco)}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold text-white shadow-sm transition hover:opacity-90"
            style={{ background: C.blue }}
          >
            <Download className="size-3.5" />
            تحميل تقرير PDF
          </button>
          {hasMonths && (
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] font-bold text-foreground shadow-sm transition hover:bg-black/5"
            >
              <Table2 className="size-3.5" />
              تصدير Excel / CSV
            </button>
          )}
          {hasMonths && (
            <button
              type="button"
              onClick={() => setArTerms((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] font-bold text-foreground shadow-sm transition hover:bg-black/5"
            >
              <Languages className="size-3.5" />
              {arTerms ? "الرموز الهندسية" : "التسميات العربية"}
            </button>
          )}
          {actions?.onEco && (
            <button
              type="button"
              onClick={actions.onEco}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white shadow-sm transition hover:opacity-90"
            >
              <BadgeDollarSign className="size-3.5" />
              الجدوى الاقتصادية
            </button>
          )}
        </div>
      </div>

      {/* بطاقة محطة الأرصاد المناخية */}
      {hasMonths && (
        <div className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-md border sm:grid-cols-4" style={{ borderColor: C.grid, background: C.grid }}>
          <div className="bg-card px-2.5 py-2">
            <p className="flex items-center gap-1 text-[9px] text-muted-foreground">
              <CloudSun className="size-3" /> محطة الرصد
            </p>
            <p className="mt-0.5 text-[11px] font-black" style={{ color: C.blue }}>
              Meteonorm 8.1
            </p>
            <p className="text-[9px] text-muted-foreground">{result.city || "—"}</p>
          </div>
          <div className="bg-card px-2.5 py-2">
            <p className="flex items-center gap-1 text-[9px] text-muted-foreground">
              <Sun className="size-3" /> ساعات الذروة الشمسية
            </p>
            <p className="mt-0.5 text-[11px] font-black" style={{ color: C.sun }}>
              {psh ? `${nf(psh, 2)} h/day` : "—"}
            </p>
            <p className="text-[9px] text-muted-foreground">PSH على سطح الألواح</p>
          </div>
          <div className="bg-card px-2.5 py-2">
            <p className="flex items-center gap-1 text-[9px] text-muted-foreground">
              <Thermometer className="size-3" /> مدى الحرارة
            </p>
            <p className="mt-0.5 text-[11px] font-black" style={{ color: C.red }}>
              {tMin !== null && tMax !== null ? `${nf(tMin, 1)}° — ${nf(tMax, 1)}°` : "—"}
            </p>
            <p className="text-[9px] text-muted-foreground">متوسط شهري أدنى / أعلى</p>
          </div>
          <div className="bg-card px-2.5 py-2">
            <p className="flex items-center gap-1 text-[9px] text-muted-foreground">
              <Zap className="size-3" /> أعلى شهر إنتاجاً
            </p>
            <p className="mt-0.5 text-[11px] font-black" style={{ color: C.violet }}>
              {bestIdx >= 0 ? MONTHS_AR[bestIdx] : "—"}
            </p>
            <p className="text-[9px] text-muted-foreground">
              {bestMonth ? `${nf(bestMonth.energy)} kWh` : "—"}
            </p>
          </div>
        </div>
      )}

      {/* ملخص المشروع والنظام */}
      {specs.length > 0 && (
        <>
          <h4 className="mt-4 rounded-t-md px-2 py-1 text-[11px] font-black text-white" style={{ background: C.blue }} dir="ltr">
            Project and system summary
          </h4>
          <dl className="grid gap-px border-x border-b sm:grid-cols-2 lg:grid-cols-3" style={{ borderColor: C.grid, background: C.grid }}>
            {specs.map((row) => (
              <div key={row.label} className="bg-card px-2.5 py-1.5" dir="ltr">
                <dt className="text-[9.5px] text-muted-foreground">{row.label}</dt>
                <dd className="mt-0.5 text-[11px] font-bold break-words">{row.value}</dd>
              </div>
            ))}
          </dl>
        </>
      )}

      {/* المؤشرات الرئيسية */}
      {kpis.length > 0 && (
        <>
          <h4 className="mt-4 rounded-t-md px-2 py-1 text-[11px] font-black text-white" style={{ background: C.blue }} dir="ltr">
            Main simulation results
          </h4>
          <div className="grid grid-cols-2 gap-px border-x border-b lg:grid-cols-3" style={{ borderColor: C.grid, background: C.grid }}>
            {kpis.map((item) => (
              <div key={item.label} className="bg-card px-2.5 py-2" dir="ltr">
                <p className="text-[9px] text-muted-foreground">{item.label}</p>
                <p className="mt-0.5 text-[13px] font-black" style={{ color: C.blue }}>{item.value}</p>
                <p className="text-[9px] text-muted-foreground" dir="rtl">{item.sub}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* تعديل اختياري لزاوية الميلان والاتجاه */}
      {s.baseTilt !== null && hasMonths && (
        <div className="mt-3 rounded-md border" style={{ borderColor: C.grid }}>
          <div className="flex flex-wrap items-center gap-2 px-2.5 py-2">
            <button
              type="button"
              onClick={() => setGeoOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] font-bold text-foreground shadow-sm transition hover:bg-black/5"
            >
              <Compass className="size-3.5" />
              تعديل زاوية الميلان والاتجاه (اختياري)
            </button>
            <span className="text-[10px] text-muted-foreground">
              الحالي: {s.tilt}° / {s.azimuth}
            </span>
            {s.orientationCustom && (
              <button
                type="button"
                onClick={() => {
                  setTilt(null);
                  setAzimuth(0);
                }}
                className="inline-flex items-center gap-1 rounded-full border border-black/10 px-2.5 py-1 text-[10px] font-bold text-muted-foreground transition hover:bg-black/5"
              >
                <RotateCcw className="size-3" />
                استعادة الزوايا الافتراضية
              </button>
            )}
          </div>

          {geoOpen && (
            <div className="border-t px-2.5 py-3" style={{ borderColor: C.grid }}>
              {/* مجسم زاوية الميلان التفاعلي */}
              <div className="mb-3 overflow-hidden rounded-md border" style={{ borderColor: C.grid, background: "#f7f9fc" }}>
                <svg viewBox="0 0 300 120" className="h-28 w-full" style={{ direction: "ltr" }}>
                  <defs>
                    <linearGradient id="pvglass" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#2b4fb5" />
                      <stop offset="100%" stopColor="#13276a" />
                    </linearGradient>
                  </defs>
                  {/* الشمس */}
                  <circle cx="252" cy="26" r="13" fill={C.sun} />
                  <g stroke={C.sun} strokeWidth="2" strokeLinecap="round">
                    <path d="M252 4v7M252 41v7M230 26h7M267 26h7M236 10l5 5M263 37l5 5M268 10l-5 5M241 37l-5 5" />
                  </g>
                  {/* الأرض */}
                  <line x1="20" y1="96" x2="280" y2="96" stroke={C.grid} strokeWidth="2" />
                  <text x="22" y="110" fontSize="9" fill="#6b7280">North / شمال</text>
                  <text x="232" y="110" fontSize="9" fill="#6b7280">South / جنوب</text>
                  {/* قوس الزاوية */}
                  <path
                    d={`M 150 96 A 40 40 0 0 0 ${150 - 40 * Math.cos((liveTilt * Math.PI) / 180)} ${96 - 40 * Math.sin((liveTilt * Math.PI) / 180)}`}
                    fill="none"
                    stroke={C.sun}
                    strokeWidth="1.6"
                    strokeDasharray="3 2"
                  />
                  {/* اللوح المائل */}
                  <g transform={`rotate(${-liveTilt} 150 96)`}>
                    <rect x="62" y="86" width="88" height="10" rx="1.5" fill="url(#pvglass)" />
                    <g stroke="#ffffff" strokeWidth="0.7" opacity="0.5">
                      <path d="M84 86v10M106 86v10M128 86v10" />
                    </g>
                  </g>
                  {/* القائم الحامل */}
                  <path d="M150 96 L150 78" stroke="#8b94a6" strokeWidth="3" strokeLinecap="round" />
                  <text
                    x="112"
                    y="74"
                    fontSize="12"
                    fontWeight="700"
                    fill={C.blue}
                  >
                    {liveTilt}°
                  </text>
                </svg>
              </div>

              <label className="block text-[11px] font-bold">
                زاوية الميلان عن الأفقي: <span className="tabular-nums">{s.tilt}°</span>
                <span className="mr-2 font-normal text-muted-foreground">
                  (الموصى به للموقع {s.baseTilt}°)
                </span>
              </label>
              <input
                type="range"
                min={5}
                max={45}
                step={1}
                value={liveTilt}
                onChange={(e) => setTilt(Number(e.target.value))}
                className="mt-2 w-full accent-[#1c3f94]"
              />
              <div className="flex justify-between text-[9px] text-muted-foreground" dir="ltr">
                <span>5°</span>
                <span>25°</span>
                <span>45°</span>
              </div>

              <p className="mt-3 text-[11px] font-bold">زاوية الاتجاه (Azimuth)</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {AZIMUTH_OPTIONS.map((opt) => {
                  const on = (s.azimuthDeg ?? 0) === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAzimuth(opt.value)}
                      className={`rounded-full border px-3 py-1 text-[11px] font-bold transition ${
                        on ? "border-transparent text-white" : "border-black/10 text-foreground hover:bg-black/5"
                      }`}
                      style={on ? { background: C.blue } : undefined}
                    >
                      {opt.label}
                      {opt.value === 0 ? " (الأفضل)" : ""}
                    </button>
                  );
                })}
              </div>

              {deltaPct !== null && (
                <p
                  className="mt-3 rounded-md px-2.5 py-1.5 text-[11px] font-bold"
                  style={{
                    background: deltaPct >= 0 ? "#e8f4ea" : "#fdecea",
                    color: deltaPct >= 0 ? "#1d6f36" : C.red,
                  }}
                >
                  أثر التعديل على الإنتاج السنوي: {deltaPct >= 0 ? "+" : ""}
                  {nf(deltaPct, 1)}%
                  {baseAnnual ? ` — مقارنة بـ ${nf(baseAnnual)} kWh/سنة عند الزاوية الافتراضية` : ""}
                </p>
              )}
              <p className="mt-1.5 text-[9.5px] text-muted-foreground">
                تُعاد كل أرقام الإشعاع والإنتاج ومعامل الأداء ومخطط الفواقد فور تغيير أي زاوية.
              </p>
            </div>
          )}
        </div>
      )}

      {/* جدول التوازن الشهري الكامل */}
      {hasMonths && totals && (
        <>
          <h4 className="mt-4 rounded-t-md px-2 py-1 text-[11px] font-black text-white" style={{ background: C.blue }} dir="ltr">
            Balances and main results
          </h4>
          <div className="-mx-1 overflow-x-auto px-1" data-quote-scroll dir="ltr">
            <table className="w-full min-w-[620px] border-collapse" style={{ borderColor: C.grid }}>
              <thead>
                <tr style={{ background: C.head }}>
                  <th className={`${th} sticky left-0 z-10`} style={{ borderColor: C.grid, background: C.head }}></th>
                  {colHead("GlobHor", "kWh/m²")}
                  {colHead("DiffHor", "kWh/m²")}
                  {colHead("T_Amb", "°C")}
                  {colHead("GlobInc", "kWh/m²")}
                  {colHead("GlobEff", "kWh/m²")}
                  {colHead("EArray", "kWh")}
                  {colHead("E_Grid", "kWh")}
                  {colHead("PR", "ratio")}
                </tr>
              </thead>
              <tbody>
                {months.map((m, i) => (
                  <tr key={m.month} className="odd:bg-muted/30">
                    <td
                      className={`${td} sticky left-0 z-10 font-black`}
                      style={{ borderColor: C.grid, background: i % 2 ? "#fff" : "#f4f5f8" }}
                    >
                      {arTerms ? MONTHS_AR[i] : MONTHS_SHORT[i]}
                    </td>
                    <td className={td} style={{ borderColor: C.grid }}>{m.ghi !== null ? nf(m.ghi, 1) : "—"}</td>
                    <td className={td} style={{ borderColor: C.grid }}>{m.dhi !== null ? nf(m.dhi, 1) : "—"}</td>
                    <td className={td} style={{ borderColor: C.grid }}>{nf(m.temp, 2)}</td>
                    <td className={td} style={{ borderColor: C.grid }}>{nf(m.irradiation, 1)}</td>
                    <td className={td} style={{ borderColor: C.grid }}>{nf(m.globEff, 1)}</td>
                    <td className={td} style={{ borderColor: C.grid }}>{nf(m.eArray)}</td>
                    <td className={`${td} font-bold`} style={{ borderColor: C.grid, ...heat(m.energy) }}>{nf(m.energy)}</td>
                    <td className={td} style={{ borderColor: C.grid }}>{nf(m.pr, 3)}</td>
                  </tr>
                ))}
                <tr style={{ background: C.head }}>
                  <td className={`${td} sticky left-0 z-10 font-black`} style={{ borderColor: C.grid, background: C.head }}>
                    {arTerms ? "السنة" : "Year"}
                  </td>
                  <td className={`${td} font-black`} style={{ borderColor: C.grid }}>{totals.ghi ? nf(totals.ghi, 1) : "—"}</td>
                  <td className={`${td} font-black`} style={{ borderColor: C.grid }}>{totals.dhi ? nf(totals.dhi, 1) : "—"}</td>
                  <td className={`${td} font-black`} style={{ borderColor: C.grid }}>
                    {nf(months.reduce((a, m) => a + m.temp, 0) / 12, 2)}
                  </td>
                  <td className={`${td} font-black`} style={{ borderColor: C.grid }}>{nf(totals.inc, 1)}</td>
                  <td className={`${td} font-black`} style={{ borderColor: C.grid }}>{nf(totals.eff, 1)}</td>
                  <td className={`${td} font-black`} style={{ borderColor: C.grid }}>{nf(totals.arr)}</td>
                  <td className={`${td} font-black`} style={{ borderColor: C.grid }}>{nf(totals.grid)}</td>
                  <td className={`${td} font-black`} style={{ borderColor: C.grid }}>
                    {result.annualPr ? nf(result.annualPr, 3) : "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-1 text-[9px] text-muted-foreground" dir="ltr">
            GlobHor: Global horizontal irradiation — DiffHor: Diffuse horizontal — GlobInc: Global incident in coll. plane —
            GlobEff: Effective global, corr. for IAM and shadings — EArray: Effective energy at the array output — E_Grid:
            Energy injected into grid — PR: Performance Ratio
          </p>
        </>
      )}

      {/* الرسمان البيانيان القياسيان */}
      {norm.length === 12 && (
        <div className="mt-4 grid gap-3 lg:grid-cols-2" dir="ltr">
          <figure className="relative rounded-md border p-2" style={{ borderColor: C.grid }}>
            <figcaption className="text-center text-[10px] font-black" style={{ color: C.blue }}>
              Normalized productions (per installed kWp): Nominal power {s.kwp ? `${nf(s.kwp, 2)} kWp` : ""}
            </figcaption>
            <div className="mt-2 flex gap-1">
              <div className="flex h-36 flex-col justify-between text-[8px] text-muted-foreground">
                {Array.from({ length: 6 }, (_, i) => (
                  <span key={i}>{nf(normTop - (i * normTop) / 5, 1)}</span>
                ))}
              </div>
              <div className="flex h-36 flex-1 items-end gap-[3px] border-b border-l" style={{ borderColor: C.grid }}>
                {norm.map((n, i) => (
                  <div
                    key={i}
                    className="flex h-full flex-1 cursor-pointer flex-col justify-end"
                    onMouseEnter={() => setHover({ chart: "norm", i })}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => setHover({ chart: "norm", i })}
                    style={hover?.chart === "norm" && hover.i === i ? { outline: `1px solid ${C.blue}` } : undefined}
                  >
                    <span style={{ height: `${(n.lc / normTop) * 100}%`, background: C.violet }} />
                    <span style={{ height: `${(n.ls / normTop) * 100}%`, background: C.red }} />
                    <span style={{ height: `${(n.yf / normTop) * 100}%`, background: C.sun }} />
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-1 flex gap-[3px] pl-6 text-center text-[8px] text-muted-foreground">
              {MONTHS_SHORT.map((m) => (
                <span key={m} className="flex-1">{m}</span>
              ))}
            </div>
            {hover?.chart === "norm" && months[hover.i] && (
              <div
                className="pointer-events-none absolute right-2 top-7 rounded-md border bg-white/95 px-2 py-1.5 text-[9px] shadow-lg"
                style={{ borderColor: C.grid }}
                dir="rtl"
              >
                <p className="font-black" style={{ color: C.blue }}>{MONTHS_AR[hover.i]}</p>
                <p>إنتاج الألواح: {nf(months[hover.i]!.eArray)} kWh</p>
                <p>فواقد النظام: {nf(months[hover.i]!.eArray - months[hover.i]!.energy)} kWh</p>
                <p className="font-bold">الإنتاج الصافي: {nf(months[hover.i]!.energy)} kWh</p>
                <p>Yf: {nf(norm[hover.i]!.yf, 2)} kWh/kWp/day</p>
              </div>
            )}
            <ul className="mt-2 space-y-0.5 text-[8.5px]">
              <li className="flex items-center gap-1">
                <i className="inline-block size-2" style={{ background: C.violet }} /> Lc : Collection Loss (PV-array losses){" "}
                {nf(avg((n) => n.lc), 2)} kWh/kWp/day
              </li>
              <li className="flex items-center gap-1">
                <i className="inline-block size-2" style={{ background: C.red }} /> Ls : System Loss (inverter, ...){" "}
                {nf(avg((n) => n.ls), 2)} kWh/kWp/day
              </li>
              <li className="flex items-center gap-1">
                <i className="inline-block size-2" style={{ background: C.sun }} /> Yf : Produced useful energy (inverter output){" "}
                {nf(avg((n) => n.yf), 2)} kWh/kWp/day
              </li>
            </ul>
          </figure>

          <figure className="relative rounded-md border p-2" style={{ borderColor: C.grid }}>
            <figcaption className="text-center text-[10px] font-black" style={{ color: C.blue }}>
              Performance Ratio PR
            </figcaption>
            <div className="mt-2 flex gap-1">
              <div className="flex h-36 flex-col justify-between text-[8px] text-muted-foreground">
                {Array.from({ length: 7 }, (_, i) => (
                  <span key={i}>{nf(1.2 - i * 0.2, 1)}</span>
                ))}
              </div>
              <div className="flex h-36 flex-1 items-end gap-[3px] border-b border-l" style={{ borderColor: C.grid }}>
                {norm.map((n, i) => (
                  <div
                    key={i}
                    className="flex h-full flex-1 cursor-pointer flex-col justify-end"
                    onMouseEnter={() => setHover({ chart: "pr", i })}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => setHover({ chart: "pr", i })}
                    style={hover?.chart === "pr" && hover.i === i ? { outline: `1px solid ${C.blue}` } : undefined}
                  >
                    <span style={{ height: `${(n.pr / 1.2) * 100}%`, background: C.blue }} />
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-1 flex gap-[3px] pl-6 text-center text-[8px] text-muted-foreground">
              {MONTHS_SHORT.map((m) => (
                <span key={m} className="flex-1">{m}</span>
              ))}
            </div>
            {hover?.chart === "pr" && months[hover.i] && (
              <div
                className="pointer-events-none absolute right-2 top-7 rounded-md border bg-white/95 px-2 py-1.5 text-[9px] shadow-lg"
                style={{ borderColor: C.grid }}
                dir="rtl"
              >
                <p className="font-black" style={{ color: C.blue }}>{MONTHS_AR[hover.i]}</p>
                <p className="font-bold">معامل الأداء: {nf(months[hover.i]!.pr * 100, 1)}%</p>
                <p>حرارة الجو: {nf(months[hover.i]!.temp, 1)}°C</p>
              </div>
            )}
            <p className="mt-2 flex items-center gap-1 text-[8.5px]">
              <i className="inline-block size-2" style={{ background: C.blue }} /> PR : Performance Ratio (Yf / Yr) ={" "}
              {result.annualPr ? nf(result.annualPr, 3) : "—"}
            </p>
          </figure>
        </div>
      )}

      {/* الإنتاج الشمسي مقابل استهلاك العميل */}
      {hasMonths && monthlyCons && consTop > 0 && (
        <figure className="relative mt-3 rounded-md border p-2" style={{ borderColor: C.grid }} dir="ltr">
          <figcaption className="text-center text-[10px] font-black" style={{ color: C.blue }}>
            Solar production vs. customer consumption (kWh / month)
          </figcaption>
          <div className="mt-2 flex gap-1">
            <div className="flex h-36 flex-col justify-between text-[8px] text-muted-foreground">
              {Array.from({ length: 5 }, (_, i) => (
                <span key={i}>{nf(consTop - (i * consTop) / 4)}</span>
              ))}
            </div>
            <div className="relative flex h-36 flex-1 items-end gap-[3px] border-b border-l" style={{ borderColor: C.grid }}>
              {months.map((m, i) => (
                <div
                  key={m.month}
                  className="flex h-full flex-1 cursor-pointer flex-col justify-end"
                  onMouseEnter={() => setHover({ chart: "cons", i })}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => setHover({ chart: "cons", i })}
                >
                  <span
                    style={{
                      height: `${(m.energy / consTop) * 100}%`,
                      background: m.energy >= monthlyCons ? C.sun : C.violet,
                    }}
                  />
                </div>
              ))}
              {/* خط الاستهلاك الشهري */}
              <span
                className="pointer-events-none absolute left-0 right-0 border-t-2 border-dashed"
                style={{ bottom: `${(monthlyCons / consTop) * 100}%`, borderColor: C.red }}
              />
            </div>
          </div>
          <div className="mt-1 flex gap-[3px] pl-8 text-center text-[8px] text-muted-foreground">
            {MONTHS_SHORT.map((m) => (
              <span key={m} className="flex-1">{m}</span>
            ))}
          </div>
          {hover?.chart === "cons" && months[hover.i] && (
            <div
              className="pointer-events-none absolute right-2 top-7 rounded-md border bg-white/95 px-2 py-1.5 text-[9px] shadow-lg"
              style={{ borderColor: C.grid }}
              dir="rtl"
            >
              <p className="font-black" style={{ color: C.blue }}>{MONTHS_AR[hover.i]}</p>
              <p>الإنتاج: {nf(months[hover.i]!.energy)} kWh</p>
              <p>الاستهلاك: {nf(monthlyCons)} kWh</p>
              <p className="font-bold" style={{ color: months[hover.i]!.energy >= monthlyCons ? "#1d6f36" : C.red }}>
                {months[hover.i]!.energy >= monthlyCons
                  ? `فائض ${nf(months[hover.i]!.energy - monthlyCons)} kWh`
                  : `عجز ${nf(monthlyCons - months[hover.i]!.energy)} kWh`}
              </p>
            </div>
          )}
          <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[8.5px]">
            <li className="flex items-center gap-1">
              <i className="inline-block size-2" style={{ background: C.sun }} /> أشهر الفائض
            </li>
            <li className="flex items-center gap-1">
              <i className="inline-block size-2" style={{ background: C.violet }} /> أشهر العجز
            </li>
            <li className="flex items-center gap-1">
              <i className="inline-block h-0 w-3 border-t-2 border-dashed" style={{ borderColor: C.red }} /> متوسط الاستهلاك الشهري{" "}
              {nf(monthlyCons)} kWh
            </li>
          </ul>
        </figure>
      )}

      {/* مخطط شلال الفواقد */}
      {result.lossBreakdown.length > 0 && (
        <>
          <h4 className="mt-4 rounded-t-md px-2 py-1 text-[11px] font-black text-white" style={{ background: C.blue }} dir="ltr">
            Loss diagram over the whole year
          </h4>
          <div className="border-x border-b p-2" style={{ borderColor: C.grid }} dir="ltr">
            {result.annualIrradiation && (
              <div className="mb-1.5 rounded px-2 py-1 text-[10px] font-black text-white" style={{ background: C.sun }}>
                {nf(result.annualIrradiation)} kWh/m² — Global horizontal irradiation on collector plane
              </div>
            )}
            <ul className="space-y-[3px]">
              {result.lossBreakdown.map((row) => {
                const gain = row.percent > 0;
                const width = Math.min(100, Math.max(6, Math.abs(row.percent) * 100 * 8));
                const Icon = LOSS_ICON[row.label] ?? Sun;
                return (
                  <li key={row.label} className="flex items-center gap-2">
                    <span
                      className="flex size-5 shrink-0 items-center justify-center rounded"
                      style={{ background: gain ? "#e8eefb" : "#fbeae8", color: gain ? C.blue : C.red }}
                    >
                      <Icon className="size-3" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[9.5px] font-semibold">
                        {arTerms ? row.label : LOSS_EN[row.label] ?? row.label}
                      </span>
                      <span className="mt-[2px] block h-[7px] overflow-hidden rounded-sm bg-black/5">
                        <span
                          className="block h-full rounded-sm transition-all"
                          style={{
                            width: `${width}%`,
                            background: gain
                              ? `linear-gradient(90deg, ${C.blue}, #4f7adb)`
                              : `linear-gradient(90deg, ${C.red}, #e8775f)`,
                          }}
                        />
                      </span>
                      {row.energy ? (
                        <span className="text-[8px] text-muted-foreground">
                          {gain ? "+" : "−"}
                          {nf(row.energy)} kWh
                        </span>
                      ) : null}
                    </span>
                    <span className="w-14 shrink-0 text-right text-[10px] font-black tabular-nums" style={{ color: gain ? C.blue : C.red }}>
                      {gain ? "+" : ""}{nf(row.percent * 100, 2)}%
                    </span>
                  </li>
                );
              })}
            </ul>
            {result.annualEnergy && (
              <div className="mt-2 rounded px-2 py-1 text-[10px] font-black text-white" style={{ background: C.blue }}>
                {nf(result.annualEnergy)} kWh — Energy injected into grid
              </div>
            )}
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">
            مخطط الفواقد السنوي: من الإشعاع الساقط على الألواح وحتى الطاقة النهائية المُنتجة.
          </p>
        </>
      )}

      {result.annualConsumption && (
        <p className="mt-3 text-[11px] text-muted-foreground">
          الاستهلاك السنوي المُدخل: {nf(result.annualConsumption)} kWh
          {result.coverage ? ` — تغطية الطاقة الشمسية: ${nf(result.coverage)}%` : ""}
        </p>
      )}

      {/* بطاقة الانتقال إلى الجدوى الاقتصادية */}
      {actions?.onEco && (
        <button
          type="button"
          onClick={actions.onEco}
          className="mt-3 flex w-full items-center gap-3 rounded-xl bg-emerald-600 px-4 py-3 text-right text-white shadow-sm ring-1 ring-black/5 transition hover:opacity-90"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/20">
            <BadgeDollarSign className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-black">عرض الجدوى الاقتصادية والوفر المالي</span>
            <span className="block text-[11px] text-white/85">
              الاسترداد، العائد على الاستثمار، والوفر البيئي
            </span>
          </span>
          <ArrowLeft className="size-4 shrink-0" />
        </button>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => downloadPvsystReport(result, eco)}
          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-black/10 bg-white px-4 py-1.5 text-xs font-bold text-foreground shadow-sm transition hover:bg-black/5"
        >
          <Download className="size-3.5" />
          تحميل التقرير الكامل
        </button>
        {hasMonths && (
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-black/10 bg-white px-4 py-1.5 text-xs font-bold text-foreground shadow-sm transition hover:bg-black/5"
          >
            <Share2 className="size-3.5" />
            تصدير بيانات المحاكاة
          </button>
        )}
      </div>

      {actions && (
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={actions.onBuy}
            className="flex items-center justify-center gap-2 rounded-full bg-energy px-4 py-3 text-sm font-black text-energy-foreground shadow-sm ring-1 ring-black/5 transition hover:opacity-90"
          >
            <ShoppingCart className="size-4" />
            متابعة الشراء
          </button>
          <button
            type="button"
            onClick={actions.onBackToQuote}
            className="flex items-center justify-center gap-2 rounded-full bg-brand px-4 py-3 text-sm font-black text-brand-foreground shadow-sm ring-1 ring-black/5 transition hover:opacity-90"
          >
            <ArrowLeft className="size-4" />
            العودة لعرض السعر
          </button>
          <button
            type="button"
            onClick={actions.onSld}
            className="flex items-center justify-center gap-2 rounded-full bg-field px-4 py-3 text-sm font-black text-field-foreground shadow-sm ring-1 ring-black/5 transition hover:opacity-90"
          >
            <Network className="size-4" />
            مخطط SLD
          </button>
        </div>
      )}
    </section>
  );
}
