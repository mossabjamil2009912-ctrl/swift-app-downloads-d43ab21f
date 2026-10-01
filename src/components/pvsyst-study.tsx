import { useMemo, useState } from "react";
import { ArrowLeft, Compass, Download, Leaf, Network, RotateCcw, ShoppingCart, Wallet } from "lucide-react";
import { buildPvsystStudy } from "@/lib/pvsyst-engine";
import { AZIMUTH_OPTIONS } from "@/lib/pvsyst-geometry";
import {
  buildEconomics,
  capexFromQuoteItems,
  DEFAULT_TARIFF_USD,
  LIFETIME_YEARS,
  specificCost,
} from "@/lib/pvsyst-economics";
import { downloadPvsystReport } from "@/lib/pvsyst-pdf";
import type { View } from "@/lib/present";
import actesLogoPlain from "@/assets/actes-logo-plain.png.asset.json";

const nf = (n: number, d = 0) => n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
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

/** ألوان تقرير PVsyst الرسمية */
const C = { blue: "#1c3f94", sun: "#f5a01e", violet: "#7b3fa0", red: "#c0392b", grid: "#b9c0cf", head: "#dfe4ee" };

type Props = {
  study: NonNullable<View["study"]>;
  actions?: { onBuy: () => void; onBackToQuote: () => void; onSld: () => void };
};

/** شاشة دراسة PVsyst — بنفس تصميم ومحتوى تقرير PVsyst V8.1.2 الرسمي. */
export default function PvsystStudy({ study, actions }: Props) {
  const result = useMemo(
    () =>
      buildPvsystStudy(study.params, {
        city: study.city,
        customer: study.customer,
        reference: study.number,
        monthlyConsumption: study.monthlyConsumption,
      }),
    [study],
  );

  if (!result) return null;
  const s = result.system;
  const months = result.months;
  const hasMonths = months.length === 12;

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
      </div>

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
                  <th className={th} style={{ borderColor: C.grid }}></th>
                  <th className={th} style={{ borderColor: C.grid }}>GlobHor<br /><span className="font-normal">kWh/m²</span></th>
                  <th className={th} style={{ borderColor: C.grid }}>DiffHor<br /><span className="font-normal">kWh/m²</span></th>
                  <th className={th} style={{ borderColor: C.grid }}>T_Amb<br /><span className="font-normal">°C</span></th>
                  <th className={th} style={{ borderColor: C.grid }}>GlobInc<br /><span className="font-normal">kWh/m²</span></th>
                  <th className={th} style={{ borderColor: C.grid }}>GlobEff<br /><span className="font-normal">kWh/m²</span></th>
                  <th className={th} style={{ borderColor: C.grid }}>EArray<br /><span className="font-normal">kWh</span></th>
                  <th className={th} style={{ borderColor: C.grid }}>E_Grid<br /><span className="font-normal">kWh</span></th>
                  <th className={th} style={{ borderColor: C.grid }}>PR<br /><span className="font-normal">ratio</span></th>
                </tr>
              </thead>
              <tbody>
                {months.map((m, i) => (
                  <tr key={m.month} className="odd:bg-muted/30">
                    <td className={`${td} font-black`} style={{ borderColor: C.grid }}>{MONTHS_SHORT[i]}</td>
                    <td className={td} style={{ borderColor: C.grid }}>{m.ghi !== null ? nf(m.ghi, 1) : "—"}</td>
                    <td className={td} style={{ borderColor: C.grid }}>{m.dhi !== null ? nf(m.dhi, 1) : "—"}</td>
                    <td className={td} style={{ borderColor: C.grid }}>{nf(m.temp, 2)}</td>
                    <td className={td} style={{ borderColor: C.grid }}>{nf(m.irradiation, 1)}</td>
                    <td className={td} style={{ borderColor: C.grid }}>{nf(m.globEff, 1)}</td>
                    <td className={td} style={{ borderColor: C.grid }}>{nf(m.eArray)}</td>
                    <td className={`${td} font-bold`} style={{ borderColor: C.grid }}>{nf(m.energy)}</td>
                    <td className={td} style={{ borderColor: C.grid }}>{nf(m.pr, 3)}</td>
                  </tr>
                ))}
                <tr style={{ background: C.head }}>
                  <td className={`${td} font-black`} style={{ borderColor: C.grid }}>Year</td>
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
          <figure className="rounded-md border p-2" style={{ borderColor: C.grid }}>
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
                  <div key={i} className="flex h-full flex-1 flex-col justify-end">
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

          <figure className="rounded-md border p-2" style={{ borderColor: C.grid }}>
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
                  <div key={i} className="flex h-full flex-1 flex-col justify-end">
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
            <p className="mt-2 flex items-center gap-1 text-[8.5px]">
              <i className="inline-block size-2" style={{ background: C.blue }} /> PR : Performance Ratio (Yf / Yr) ={" "}
              {result.annualPr ? nf(result.annualPr, 3) : "—"}
            </p>
          </figure>
        </div>
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
                return (
                  <li key={row.label} className="flex items-center gap-2">
                    <span className="w-8 shrink-0 text-center text-[10px]" style={{ color: gain ? C.blue : C.red }}>
                      {gain ? "▲" : "▼"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[9.5px] font-semibold">{LOSS_EN[row.label] ?? row.label}</span>
                      <span className="mt-[2px] block h-[6px] rounded-sm" style={{ width: `${width}%`, background: gain ? C.blue : C.red }} />
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

      <button
        type="button"
        onClick={() => downloadPvsystReport(result)}
        className="mt-4 inline-flex items-center justify-center gap-1.5 self-start rounded-full border border-black/10 bg-white px-4 py-1.5 text-xs font-bold text-foreground shadow-sm transition hover:bg-black/5"
      >
        <Download className="size-3.5" />
        تحميل التقرير الكامل
      </button>

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
