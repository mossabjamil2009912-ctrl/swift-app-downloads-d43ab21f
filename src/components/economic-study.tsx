import { useMemo, useState } from "react";
import { ArrowLeft, BadgeDollarSign, Download, Leaf, LineChart, Network, RotateCcw, ShoppingCart } from "lucide-react";
import { buildPvsystStudy } from "@/lib/pvsyst-engine";
import {
  buildEconomics,
  capexFromQuoteItems,
  cashFlowSchedule,
  DEFAULT_TARIFF_USD,
  environmentalEquivalents,
  FX_YER,
  LIFETIME_YEARS,
  scenarioAnalysis,
  specificCost,
  TARIFF_ESCALATION,
} from "@/lib/pvsyst-economics";
import { downloadEconomicReport } from "@/lib/economic-pdf";
import type { View } from "@/lib/present";

const nf = (n: number, d = 0) => n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

/** ألوان الدراسة الاقتصادية — زمردي مالي مع أزرق التقارير. */
const C = { blue: "#1c3f94", green: "#15803d", red: "#c0392b", grid: "#b9c0cf", amber: "#f5a01e" };

const MONTHS_AR = ["ينا", "فبر", "مار", "أبر", "ماي", "يون", "يول", "أغس", "سبت", "أكت", "نوف", "ديس"];

type Props = {
  study: NonNullable<View["study"]>;
  actions?: { onBuy: () => void; onBackToQuote: () => void; onStudy?: (() => void) | undefined; onSld?: (() => void) | undefined };
};

/** شاشة دراسة الجدوى الاقتصادية والبيئية المستقلة. */
export default function EconomicStudy({ study, actions }: Props) {
  const [capexInput, setCapexInput] = useState<number | null>(null);
  const [tariff, setTariff] = useState(DEFAULT_TARIFF_USD);
  const [dieselPrice, setDieselPrice] = useState(1.1);
  const [escalation, setEscalation] = useState(TARIFF_ESCALATION * 100);
  const [tableOpen, setTableOpen] = useState(false);

  const fallback = useMemo(
    () => ({
      city: study.city,
      customer: study.customer,
      reference: study.number,
      monthlyConsumption: study.monthlyConsumption,
    }),
    [study],
  );

  const result = useMemo(() => buildPvsystStudy(study.params, fallback), [study.params, fallback]);
  const quoteCapex = useMemo(
    () => capexFromQuoteItems((study.params as Record<string, unknown> | null)?.["quote_items"]),
    [study.params],
  );
  const capex = capexInput ?? quoteCapex ?? 0;

  const input = useMemo(
    () => ({
      annualEnergy: result?.annualEnergy ?? 0,
      kwp: result?.system.kwp ?? null,
      capex,
      tariff,
      dieselPrice,
    }),
    [result, capex, tariff, dieselPrice],
  );

  const eco = useMemo(() => buildEconomics(input), [input]);
  const rows = useMemo(() => cashFlowSchedule(input, escalation / 100), [input, escalation]);
  const scenarios = useMemo(() => scenarioAnalysis(input), [input]);
  const equiv = useMemo(() => environmentalEquivalents(eco?.co2PerYear ?? 0), [eco]);

  if (!result || !eco) return null;
  const s = result.system;
  const months = result.months;

  const reset = () => {
    setCapexInput(null);
    setTariff(DEFAULT_TARIFF_USD);
    setDieselPrice(1.1);
    setEscalation(TARIFF_ESCALATION * 100);
  };

  // ==== منحنى التدفق النقدي التراكمي ====
  const W = 720;
  const H = 240;
  const PAD = { t: 14, r: 14, b: 26, l: 56 };
  const cumVals = rows.map((r) => r.cumulative).concat([-capex]);
  const cMax = Math.max(...cumVals, 1);
  const cMin = Math.min(...cumVals, 0);
  const cx = (i: number) => PAD.l + ((W - PAD.l - PAD.r) * i) / Math.max(1, rows.length);
  const cy = (v: number) => PAD.t + (H - PAD.t - PAD.b) * (1 - (v - cMin) / Math.max(1, cMax - cMin));
  const cashPath = [`M ${cx(0)} ${cy(-capex)}`, ...rows.map((r, i) => `L ${cx(i + 1)} ${cy(r.cumulative)}`)].join(" ");
  const zeroY = cy(0);
  const paybackX = eco.paybackYears ? cx(eco.paybackYears) : null;

  // ==== مقارنة التكلفة المتراكمة ====
  const compMax = Math.max(...rows.map((r) => Math.max(r.baselineCumulative, r.solarCumulative)), 1);
  const py = (v: number) => PAD.t + (H - PAD.t - PAD.b) * (1 - v / compMax);
  const basePath = rows.map((r, i) => `${i ? "L" : "M"} ${cx(i + 1)} ${py(r.baselineCumulative)}`).join(" ");
  const solarPath = [`M ${cx(0)} ${py(capex)}`, ...rows.map((r, i) => `L ${cx(i + 1)} ${py(r.solarCumulative)}`)].join(" ");

  // ==== الوفر الشهري ====
  const monthSavings = months.map((m) => m.energy * tariff);
  const msMax = Math.max(...monthSavings, 1);

  const card = (t: string, v: string, sub?: string, color = C.blue) => (
    <div key={t} className="bg-card px-2.5 py-2">
      <p className="text-[9.5px] text-muted-foreground">{t}</p>
      <p className="mt-0.5 text-[14px] font-black" style={{ color }}>{v}</p>
      {sub && <p className="text-[9px] text-muted-foreground" dir="ltr">{sub}</p>}
    </div>
  );

  return (
    <section className="flex flex-col" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md px-3 py-2 text-white" style={{ background: C.green }}>
        <span className="inline-flex items-center gap-2 text-[13px] font-black">
          <BadgeDollarSign className="size-4" />
          دراسة الجدوى الاقتصادية والوفر البيئي
        </span>
        <span className="text-[10.5px] font-bold opacity-90">مرجع {study.number} — {study.customer || "عميل"} / {study.city || "—"}</span>
      </div>

      {/* ==== مدخلات تفاعلية ==== */}
      <div className="mt-3 rounded-md border p-2.5" style={{ borderColor: C.grid }}>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[11px] font-black" style={{ color: C.blue }}>مدخلات الدراسة</p>
          <button type="button" onClick={reset} className="inline-flex items-center gap-1 rounded-full border border-black/10 px-2 py-[3px] text-[10px] font-bold">
            <RotateCcw className="size-3" /> استعادة القيم التلقائية
          </button>
        </div>
        <div className="grid gap-2 sm:grid-cols-4">
          <label className="block">
            <span className="text-[10px] text-muted-foreground">تكلفة المنظومة ($)</span>
            <input type="number" min={0} step={50} value={capex || ""} placeholder="من عرض السعر"
              onChange={(e) => setCapexInput(Number(e.target.value) || 0)}
              className="mt-0.5 w-full rounded-md border border-black/10 bg-background px-2 py-1 text-[12px] font-bold tabular-nums" />
          </label>
          <label className="block">
            <span className="text-[10px] text-muted-foreground">سعر الكيلوواط ساعة ($)</span>
            <input type="number" min={0} step={0.01} value={tariff}
              onChange={(e) => setTariff(Math.max(0, Number(e.target.value)))}
              className="mt-0.5 w-full rounded-md border border-black/10 bg-background px-2 py-1 text-[12px] font-bold tabular-nums" />
            <span className="text-[9px] text-muted-foreground">≈ {nf(tariff * FX_YER)} ريال</span>
          </label>
          <label className="block">
            <span className="text-[10px] text-muted-foreground">سعر لتر الديزل ($)</span>
            <input type="number" min={0} step={0.05} value={dieselPrice}
              onChange={(e) => setDieselPrice(Math.max(0, Number(e.target.value)))}
              className="mt-0.5 w-full rounded-md border border-black/10 bg-background px-2 py-1 text-[12px] font-bold tabular-nums" />
          </label>
          <label className="block">
            <span className="text-[10px] text-muted-foreground">تصاعد أسعار الطاقة سنوياً (%)</span>
            <input type="number" min={0} max={15} step={0.5} value={escalation}
              onChange={(e) => setEscalation(Math.max(0, Number(e.target.value)))}
              className="mt-0.5 w-full rounded-md border border-black/10 bg-background px-2 py-1 text-[12px] font-bold tabular-nums" />
          </label>
        </div>
        {!capex && (
          <p className="mt-2 rounded-md px-2 py-1.5 text-[10.5px]" style={{ background: "#fdf3e3", color: "#8a5a10" }}>
            أدخل تكلفة المنظومة لعرض فترة الاسترداد وتكلفة إنتاج الكيلوواط ساعة.
          </p>
        )}
      </div>

      {/* ==== المؤشرات المالية ==== */}
      <h4 className="mt-4 rounded-t-md px-2 py-1 text-[11px] font-black text-white" style={{ background: C.blue }}>
        المؤشرات المالية الرئيسية
      </h4>
      <div className="grid grid-cols-2 gap-px border lg:grid-cols-4" style={{ borderColor: C.grid, background: C.grid }}>
        {card("الوفر السنوي", `${nf(eco.annualSaving)} $`, "في السنة الأولى")}
        {card("الوفر الشهري", `${nf(eco.monthlySaving)} $`, "متوسط شهري")}
        {card("فترة الاسترداد", eco.paybackYears ? `${nf(eco.paybackYears, 1)} سنة` : "—", "Payback Period", C.green)}
        {card(`صافي الوفر خلال ${LIFETIME_YEARS} سنة`, capex ? `${nf(eco.lifetimeNet)} $` : "—", "بعد التكلفة والصيانة", C.green)}
        {card("تكلفة إنتاج الكيلوواط", eco.lcoe ? `${nf(eco.lcoe, 3)} $/kWh` : "—", "LCOE")}
        {card("العائد على الاستثمار", eco.roi !== null && capex ? `${nf(eco.roi)} %` : "—", "ROI", C.green)}
        {card("تكلفة الكيلوواط المركّب", specificCost(capex, s.kwp) ? `${nf(specificCost(capex, s.kwp)!)} $/kWp` : "—", "Specific cost")}
        {card("إنتاج العمر التشغيلي", `${nf(eco.lifetimeEnergy)} kWh`, `${LIFETIME_YEARS} سنة`)}
      </div>

      {/* ==== منحنى التدفق النقدي ==== */}
      <h4 className="mt-4 rounded-t-md px-2 py-1 text-[11px] font-black text-white" style={{ background: C.blue }}>
        منحنى التدفق النقدي التراكمي ونقطة كسر التعادل
      </h4>
      <div className="border-x border-b p-2" style={{ borderColor: C.grid }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="منحنى التدفق النقدي التراكمي">
          <rect x={PAD.l} y={PAD.t} width={W - PAD.l - PAD.r} height={H - PAD.t - PAD.b} fill="#fff" stroke={C.grid} />
          <rect x={PAD.l} y={PAD.t} width={W - PAD.l - PAD.r} height={Math.max(0, zeroY - PAD.t)} fill="#ecfdf3" />
          {[0, 0.25, 0.5, 0.75, 1].map((f) => {
            const v = cMin + (cMax - cMin) * f;
            const y = cy(v);
            return (
              <g key={f}>
                <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke={C.grid} strokeDasharray="3 3" />
                <text x={PAD.l - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#666">{nf(Math.round(v))}</text>
              </g>
            );
          })}
          <line x1={PAD.l} y1={zeroY} x2={W - PAD.r} y2={zeroY} stroke="#444" strokeWidth="1.2" />
          <path d={cashPath} fill="none" stroke={C.green} strokeWidth="2.4" />
          {paybackX !== null && (
            <g>
              <line x1={paybackX} y1={PAD.t} x2={paybackX} y2={H - PAD.b} stroke={C.red} strokeDasharray="4 3" />
              <circle cx={paybackX} cy={zeroY} r="4" fill={C.red} />
              <text x={paybackX + 5} y={PAD.t + 12} fontSize="9.5" fill={C.red} fontWeight="bold">
                Breakeven {nf(eco.paybackYears!, 1)}y
              </text>
            </g>
          )}
          {rows.filter((_, i) => i % 5 === 4 || i === 0).map((r, _i) => (
            <text key={r.year} x={cx(r.year)} y={H - 10} textAnchor="middle" fontSize="9" fill="#666">{r.year}</text>
          ))}
          <text x={PAD.l} y={H - 10} textAnchor="middle" fontSize="9" fill="#666">0</text>
        </svg>
        <p className="text-center text-[9.5px] text-muted-foreground">
          الرصيد يبدأ سالباً بقيمة رأس المال ({nf(capex)} $) ويتحول إلى أرباح صافية بعد نقطة التعادل.
        </p>
      </div>

      {/* ==== مقارنة التكلفة المتراكمة ==== */}
      <h4 className="mt-4 rounded-t-md px-2 py-1 text-[11px] font-black text-white" style={{ background: C.blue }}>
        مقارنة التكلفة المتراكمة: الديزل والشبكة مقابل منظومة ACTES
      </h4>
      <div className="border-x border-b p-2" style={{ borderColor: C.grid }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="مقارنة التكلفة المتراكمة">
          <rect x={PAD.l} y={PAD.t} width={W - PAD.l - PAD.r} height={H - PAD.t - PAD.b} fill="#fff" stroke={C.grid} />
          {[0, 0.25, 0.5, 0.75, 1].map((f) => {
            const y = py(compMax * f);
            return (
              <g key={f}>
                <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke={C.grid} strokeDasharray="3 3" />
                <text x={PAD.l - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#666">{nf(Math.round(compMax * f))}</text>
              </g>
            );
          })}
          <path d={basePath} fill="none" stroke={C.red} strokeWidth="2.4" />
          <path d={solarPath} fill="none" stroke={C.green} strokeWidth="2.4" />
          {rows.filter((r) => r.year % 5 === 0).map((r) => (
            <text key={r.year} x={cx(r.year)} y={H - 10} textAnchor="middle" fontSize="9" fill="#666">{r.year}</text>
          ))}
        </svg>
        <div className="flex justify-center gap-4 text-[9.5px] font-bold">
          <span style={{ color: C.red }}>■ تكلفة الديزل والشبكة</span>
          <span style={{ color: C.green }}>■ تكلفة منظومة ACTES</span>
        </div>
      </div>

      {/* ==== الوفر الشهري ==== */}
      {months.length === 12 && (
        <>
          <h4 className="mt-4 rounded-t-md px-2 py-1 text-[11px] font-black text-white" style={{ background: C.blue }}>
            الوفر المالي الشهري المتوقع
          </h4>
          <div className="border-x border-b p-2" style={{ borderColor: C.grid }}>
            <svg viewBox="0 0 720 190" className="w-full" role="img" aria-label="الوفر المالي الشهري">
              <rect x="46" y="10" width="660" height="140" fill="#fff" stroke={C.grid} />
              {monthSavings.map((v, i) => {
                const h = (v / msMax) * 134;
                const x = 52 + i * 54;
                return (
                  <g key={i}>
                    <rect x={x} y={150 - h} width="38" height={h} fill={C.green} opacity="0.85" />
                    <text x={x + 19} y={146 - h} textAnchor="middle" fontSize="8.5" fill="#333">{nf(v)}</text>
                    <text x={x + 19} y={166} textAnchor="middle" fontSize="9" fill="#666">{MONTHS_AR[i]}</text>
                  </g>
                );
              })}
              <text x="40" y="18" textAnchor="end" fontSize="9" fill="#666">{nf(msMax)}</text>
              <text x="40" y="152" textAnchor="end" fontSize="9" fill="#666">0</text>
              <text x="376" y="184" textAnchor="middle" fontSize="9" fill="#666">USD / month</text>
            </svg>
          </div>
        </>
      )}

      {/* ==== تحليل الحساسية ==== */}
      <h4 className="mt-4 rounded-t-md px-2 py-1 text-[11px] font-black text-white" style={{ background: C.blue }}>
        تحليل الحساسية — ثلاثة سيناريوهات
      </h4>
      <div className="overflow-x-auto border-x border-b" style={{ borderColor: C.grid }}>
        <table className="w-full min-w-[520px] border-collapse text-[10.5px]">
          <thead>
            <tr style={{ background: "#dfe4ee" }}>
              {["السيناريو", "الفرضية", "التعرفة $/kWh", "الوفر السنوي $", "الاسترداد", `صافي ${LIFETIME_YEARS} سنة $`].map((h) => (
                <th key={h} className="border px-2 py-1 font-black" style={{ borderColor: C.grid }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {scenarios.map((sc) => (
              <tr key={sc.key} className={sc.key === "base" ? "font-black" : ""} style={sc.key === "base" ? { background: "#eef3ff" } : undefined}>
                <td className="border px-2 py-1" style={{ borderColor: C.grid }}>{sc.label}</td>
                <td className="border px-2 py-1 text-muted-foreground" style={{ borderColor: C.grid }}>{sc.note}</td>
                <td className="border px-2 py-1 tabular-nums" style={{ borderColor: C.grid }}>{nf(sc.tariff, 3)}</td>
                <td className="border px-2 py-1 tabular-nums" style={{ borderColor: C.grid }}>{sc.result ? nf(sc.result.annualSaving) : "—"}</td>
                <td className="border px-2 py-1 tabular-nums" style={{ borderColor: C.grid }}>{sc.result?.paybackYears ? `${nf(sc.result.paybackYears, 1)} سنة` : "—"}</td>
                <td className="border px-2 py-1 tabular-nums" style={{ borderColor: C.grid }}>{sc.result && capex ? nf(sc.result.lifetimeNet) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ==== جدول التدفق النقدي ==== */}
      <h4 className="mt-4 flex items-center justify-between rounded-t-md px-2 py-1 text-[11px] font-black text-white" style={{ background: C.blue }}>
        <span>جدول التدفق النقدي لـ {LIFETIME_YEARS} سنة</span>
        <button type="button" onClick={() => setTableOpen((v) => !v)} className="rounded-full bg-white/20 px-2 py-[2px] text-[10px] font-bold">
          {tableOpen ? "إخفاء" : "عرض"}
        </button>
      </h4>
      {tableOpen && (
        <div className="max-h-80 overflow-auto border-x border-b" style={{ borderColor: C.grid }}>
          <table className="w-full min-w-[620px] border-collapse text-[10.5px]">
            <thead className="sticky top-0">
              <tr style={{ background: "#dfe4ee" }}>
                {["السنة", "الإنتاج kWh", "التعرفة $/kWh", "الوفر $", "الصيانة $", "الصافي $", "التراكمي $"].map((h) => (
                  <th key={h} className="border px-2 py-1 font-black" style={{ borderColor: C.grid }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.year}>
                  <td className="border px-2 py-[3px] text-center tabular-nums" style={{ borderColor: C.grid }}>{r.year}</td>
                  <td className="border px-2 py-[3px] text-center tabular-nums" style={{ borderColor: C.grid }}>{nf(r.energy)}</td>
                  <td className="border px-2 py-[3px] text-center tabular-nums" style={{ borderColor: C.grid }}>{nf(r.tariff, 3)}</td>
                  <td className="border px-2 py-[3px] text-center tabular-nums" style={{ borderColor: C.grid }}>{nf(r.saving)}</td>
                  <td className="border px-2 py-[3px] text-center tabular-nums" style={{ borderColor: C.grid }}>{nf(r.om)}</td>
                  <td className="border px-2 py-[3px] text-center tabular-nums" style={{ borderColor: C.grid }}>{nf(r.net)}</td>
                  <td className="border px-2 py-[3px] text-center font-bold tabular-nums" style={{ borderColor: C.grid, color: r.cumulative >= 0 ? C.green : C.red }}>
                    {nf(r.cumulative)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ==== الأثر البيئي ==== */}
      <h4 className="mt-4 inline-flex items-center gap-1.5 rounded-t-md px-2 py-1 text-[11px] font-black text-white" style={{ background: C.green }}>
        <Leaf className="size-3.5" /> الأثر البيئي والمكافئات
      </h4>
      <div className="grid grid-cols-2 gap-px border lg:grid-cols-4" style={{ borderColor: C.grid, background: C.grid }}>
        {card("خفض الانبعاثات سنوياً", `${nf(eco.co2PerYear, 1)} طن CO₂`, undefined, C.green)}
        {card(`خفض الانبعاثات خلال ${LIFETIME_YEARS} سنة`, `${nf(eco.co2Lifetime, 1)} طن CO₂`, undefined, C.green)}
        {card("الديزل الموفّر سنوياً", `${nf(eco.dieselLitersPerYear)} لتر`, `${nf(eco.dieselCostPerYear)} $/سنة`, C.green)}
        {card("مكافئ الأشجار", `${nf(equiv.trees)} شجرة/سنة`, undefined, C.green)}
        {card("براميل نفط موفّرة", `${nf(equiv.oilBarrels)} برميل/سنة`, undefined, C.amber)}
        {card("كيلومترات عوادم متفاداة", `${nf(equiv.carKm)} كم/سنة`, undefined, C.amber)}
        {card("الإنتاج السنوي", `${nf(result.annualEnergy ?? 0)} kWh`, "من محاكاة PVsyst")}
        {card("قدرة المنظومة", s.kwp ? `${nf(s.kwp, 2)} kWp` : "—", "DC")}
      </div>

      <p className="mt-2 text-[9.5px] leading-relaxed text-muted-foreground">
        الفرضيات: عمر تشغيلي {LIFETIME_YEARS} سنة، تدهور أداء 0.5% سنوياً، صيانة 1% من قيمة المنظومة سنوياً، تصاعد تعرفة
        الطاقة {nf(escalation, 1)}% سنوياً، معدل خصم 6%، استهلاك مولد الديزل 0.33 لتر لكل كيلوواط ساعة، ومعامل انبعاث 0.75
        كجم ثاني أكسيد الكربون لكل كيلوواط ساعة. الأرقام تقديرية لأغراض الدراسة.
      </p>

      <button
        type="button"
        onClick={() => downloadEconomicReport(result, eco, rows, scenarios, equiv, escalation / 100)}
        className="mt-4 inline-flex items-center justify-center gap-1.5 self-start rounded-full border border-black/10 bg-white px-4 py-1.5 text-xs font-bold text-foreground shadow-sm transition hover:bg-black/5"
      >
        <Download className="size-3.5" />
        تحميل تقرير الجدوى الاقتصادية
      </button>

      {actions && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <button type="button" onClick={actions.onBuy}
            className="flex items-center justify-center gap-2 rounded-full bg-energy px-4 py-3 text-sm font-black text-energy-foreground shadow-sm ring-1 ring-black/5 transition hover:opacity-90">
            <ShoppingCart className="size-4" /> متابعة الشراء
          </button>
          <button type="button" onClick={actions.onBackToQuote}
            className="flex items-center justify-center gap-2 rounded-full bg-brand px-4 py-3 text-sm font-black text-brand-foreground shadow-sm ring-1 ring-black/5 transition hover:opacity-90">
            <ArrowLeft className="size-4" /> العودة لعرض السعر
          </button>
          {actions.onStudy && (
            <button type="button" onClick={actions.onStudy}
              className="flex items-center justify-center gap-2 rounded-full bg-skyline px-4 py-3 text-sm font-black text-skyline-foreground shadow-sm ring-1 ring-black/5 transition hover:opacity-90">
              <LineChart className="size-4" /> دراسة PVsyst
            </button>
          )}
          {actions.onSld && (
            <button type="button" onClick={actions.onSld}
              className="flex items-center justify-center gap-2 rounded-full bg-field px-4 py-3 text-sm font-black text-field-foreground shadow-sm ring-1 ring-black/5 transition hover:opacity-90">
              <Network className="size-4" /> مخطط SLD
            </button>
          )}
        </div>
      )}
    </section>
  );
}
