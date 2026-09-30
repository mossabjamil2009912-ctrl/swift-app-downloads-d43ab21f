import type { PvsystStudyResult } from "./pvsyst-engine";
import actesLogoPlain from "@/assets/actes-logo-plain.png.asset.json";

/**
 * يبني تقرير محاكاة بنفس تصميم وتنسيق وألوان تقرير PVsyst V8.1.2 الرسمي:
 * صفحة غلاف، ترويسة وتذييل قياسيين، ملخص المشروع والنظام، جدول التوازن
 * الشهري (Balances and main results)، الرسمين البيانيين (Normalized
 * productions + Performance Ratio)، ومخطط الفواقد (Loss diagram).
 * اسم المشروع = اسم العميل.
 */

function esc(value: unknown) {
  return String(value ?? "").replace(/[&<>"]/g, (char) =>
    char === "&" ? "&amp;" : char === "<" ? "&lt;" : char === ">" ? "&gt;" : "&quot;",
  );
}

const nf = (n: number, d = 0) =>
  n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: false });

const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const PVSYST_VERSION = "PVsyst V8.1.2";

/** مسميات بنود الفواقد بالإنجليزية بنفس نصوص مخطط الفواقد في PVsyst. */
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

/** شعار PVsyst (لوح شمسي وشمس) بنفس ألوان البرنامج. */
const PV_MARK = `<svg class="pvmark" viewBox="0 0 120 90" xmlns="http://www.w3.org/2000/svg">
  <circle cx="34" cy="26" r="20" fill="#f5a01e"/>
  <g transform="skewX(-16) translate(14 30)">
    <rect x="0" y="0" width="76" height="48" fill="#1c3f94"/>
    <g stroke="#ffffff" stroke-width="2.4">
      <path d="M19 0V48M38 0V48M57 0V48M0 16H76M0 32H76"/>
    </g>
  </g>
</svg>`;

export function downloadPvsystReport(study: PvsystStudyResult) {
  if (typeof window === "undefined") return;
  const s = study.system;
  const origin = window.location.origin;
  const logo = `${origin}${actesLogoPlain.url}`;

  /** اسم المشروع = اسم العميل */
  const project = study.customer || study.reference || "ACTES Project";
  const modeWord = /هجين|Hybrid/i.test(s.sysMode || "")
    ? "Hybrid System"
    : /مستقل|Off/i.test(s.sysMode || "")
      ? "Stand-alone System"
      : "Grid-Connected System";
  const variant = s.kwp ? `${modeWord} ${nf(s.kwp, 0)} kWp` : modeWord;
  const sysTitle = s.batteryKwh ? "Grid-Connected System with storage" : "Grid-Connected System";
  const today = new Date();
  const dstr = `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${String(today.getFullYear()).slice(2)}`;
  const tstr = `${String(today.getHours()).padStart(2, "0")}:${String(today.getMinutes()).padStart(2, "0")}`;

  const months = study.months;
  const hasMonths = months.length === 12;

  // ==== حسابات الرسم البياني المعياري (kWh/kWp/day) ====
  type Norm = { yf: number; ls: number; lc: number; pr: number };
  const norm: Norm[] = [];
  if (hasMonths && s.kwp) {
    months.forEach((m, i) => {
      const d = DAYS[i]!;
      const yf = m.energy / s.kwp! / d;
      const ls = Math.max(0, (m.eArray - m.energy) / s.kwp! / d);
      const lc = Math.max(0, (m.irradiation - m.eArray / s.kwp!) / d);
      norm.push({ yf, ls, lc, pr: m.pr });
    });
  }
  const normMax = norm.length ? Math.max(...norm.map((n) => n.yf + n.ls + n.lc)) : 1;
  const normTop = Math.ceil(normMax + 1);
  const avgYf = norm.length ? norm.reduce((a, n) => a + n.yf, 0) / 12 : 0;
  const avgLs = norm.length ? norm.reduce((a, n) => a + n.ls, 0) / 12 : 0;
  const avgLc = norm.length ? norm.reduce((a, n) => a + n.lc, 0) / 12 : 0;

  const normBars = norm
    .map((n, i) => {
      const h = (v: number) => `${(v / normTop) * 100}%`;
      return `<div class="gcol">
        <div class="stack">
          <span class="sg lc" style="height:${h(n.lc)}"></span>
          <span class="sg ls" style="height:${h(n.ls)}"></span>
          <span class="sg yf" style="height:${h(n.yf)}"></span>
        </div>
        <span class="glab">${MONTHS_SHORT[i]}</span>
      </div>`;
    })
    .join("");

  const prBars = norm
    .map(
      (n, i) => `<div class="gcol">
      <div class="stack"><span class="sg pr" style="height:${(n.pr / 1.2) * 100}%"></span></div>
      <span class="glab">${MONTHS_SHORT[i]}</span>
    </div>`,
    )
    .join("");

  const axis = (top: number, steps: number, dec = 1) =>
    Array.from({ length: steps + 1 }, (_, i) => `<span>${nf(top - (i * top) / steps, dec)}</span>`).join("");

  // ==== جدول التوازن والنتائج ====
  const balanceRows = months
    .map(
      (m, i) => `<tr>
      <td class="mn">${MONTHS_EN[i]}</td>
      <td>${m.ghi !== null ? nf(m.ghi, 1) : "—"}</td>
      <td>${m.dhi !== null ? nf(m.dhi, 2) : "—"}</td>
      <td>${nf(m.temp, 2)}</td>
      <td>${nf(m.irradiation, 1)}</td>
      <td>${nf(m.globEff, 1)}</td>
      <td>${nf(m.eArray)}</td>
      <td>${nf(m.energy)}</td>
      <td>${nf(m.pr, 3)}</td>
    </tr>`,
    )
    .join("");

  const sum = (pick: (m: (typeof months)[number]) => number | null) =>
    months.reduce((a, m) => a + (pick(m) ?? 0), 0);
  const yearRow = hasMonths
    ? `<tr class="yr">
      <td class="mn">Year</td>
      <td>${nf(sum((m) => m.ghi), 1)}</td>
      <td>${nf(sum((m) => m.dhi), 2)}</td>
      <td>${nf(sum((m) => m.temp) / 12, 2)}</td>
      <td>${nf(sum((m) => m.irradiation), 1)}</td>
      <td>${nf(sum((m) => m.globEff), 1)}</td>
      <td>${nf(sum((m) => m.eArray))}</td>
      <td>${nf(sum((m) => m.energy))}</td>
      <td>${study.annualPr ? nf(study.annualPr, 3) : "—"}</td>
    </tr>`
    : "";

  // ==== مخطط الفواقد ====
  const lossRows = study.lossBreakdown
    .map((row) => {
      const p = row.percent * 100;
      return `<div class="lrow"><span class="larr">${p >= 0 ? "↷" : "↴"}</span><span class="lpct">${p > 0 ? "+" : ""}${nf(p, 2)}%</span><span class="ltxt">${esc(LOSS_EN[row.label] || row.label)}</span></div>`;
    })
    .join("");

  const row = (label: string, value: string | null | undefined) =>
    value ? `<div class="ir"><span>${esc(label)}</span><b>${esc(value)}</b></div>` : "";

  const pageHead = (n: number) => `<div class="phead">
    <div class="pmark">${PV_MARK}</div>
    <div class="ptitle"><p class="pt1">Project: ${esc(project)}</p><p class="pt2">Variant: ${esc(variant)}</p></div>
    <div class="plogo"><img src="${logo}" alt="ACTES" /></div>
  </div>
  <div class="pver"><b>${PVSYST_VERSION}</b><br/>VC1, Simulation date:<br/>${dstr} ${tstr}<br/>with V8.1.2</div>
  <div class="pfoot"><span>${dstr}</span><span>PVsyst Licensed to ACTES</span><span>Page ${n}/5</span></div>`;

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8" />
<title>${esc(`PVsyst Simulation report — ${project}`)}</title>
<style>
  *{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  body{margin:0;font-family:Arial,Helvetica,sans-serif;color:#000;font-size:9.5pt;background:#fff}
  .page{position:relative;width:190mm;min-height:264mm;padding:0 0 12mm;margin:0 auto;page-break-after:always}
  .page:last-child{page-break-after:auto}
  .pvmark{width:26mm;height:19mm;display:block}
  /* ترويسة الصفحة */
  .phead{display:flex;align-items:flex-start;justify-content:space-between;gap:6mm}
  .ptitle{text-align:center;flex:1;padding-top:2mm}
  .pt1{margin:0;font-size:14pt;color:#1c3f94}
  .pt2{margin:1mm 0 0;font-size:11.5pt;color:#1c3f94;display:inline-block;border-bottom:.6pt solid #000;padding-bottom:1mm}
  .plogo{border-left:.6pt solid #999;padding-left:4mm}
  .plogo img{width:24mm}
  .pver{margin-top:1mm;font-size:8pt;line-height:1.35}
  .pfoot{position:absolute;bottom:2mm;left:0;right:0;display:flex;justify-content:space-between;font-size:8.5pt;border-top:0}
  /* إطار القسم بعنوان في منتصف الحد العلوي */
  .box{border:.8pt solid #000;margin-top:6mm;padding:5mm 5mm 3.5mm;position:relative}
  .box>h2{position:absolute;top:-2.4mm;left:50%;transform:translateX(-50%);margin:0;background:#fff;padding:0 3mm;font-size:11pt}
  .cols{display:flex;gap:5mm}
  .col{flex:1;min-width:0}
  h3{margin:0 0 1.5mm;font-size:9.5pt}
  .sub{margin:4mm 0 1.5mm;font-size:9.5pt;font-weight:bold}
  .ir{display:flex;justify-content:space-between;gap:3mm;line-height:1.55}
  .ir>span{white-space:nowrap}
  .ir b{font-weight:normal;white-space:nowrap}
  .plain{line-height:1.55}
  /* الفهرس */
  .toc{line-height:1.9}
  .toc div{display:flex;align-items:baseline;gap:2mm}
  .toc span:first-child{white-space:nowrap}
  .toc i{flex:1;border-bottom:.5pt solid #000;height:.5mm}
  /* الجداول */
  table{width:100%;border-collapse:collapse;font-size:8pt;margin-top:2mm}
  th,td{border:.5pt solid #000;padding:.8mm 1mm;text-align:center}
  thead th{font-weight:bold}
  td.mn,th.mn{text-align:left;font-weight:bold}
  tr.yr td{font-weight:bold;border-top:.9pt solid #000}
  .nb table,.nb th,.nb td{border:0}
  /* الرسوم البيانية */
  .charts{display:flex;gap:6mm;margin-top:3mm}
  .chart{flex:1;min-width:0}
  .ctitle{text-align:center;font-weight:bold;font-size:9.5pt;margin-bottom:2mm}
  .cbody{display:flex;height:40mm}
  .cax{display:flex;flex-direction:column;justify-content:space-between;font-size:6.5pt;text-align:right;padding-right:1mm;width:8mm}
  .cplot{flex:1;border:.5pt solid #000;border-top:0;border-right:0;display:flex;align-items:flex-end;gap:1.2mm;padding:0 1.5mm;position:relative}
  .gcol{flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;height:100%}
  .stack{width:100%;height:100%;display:flex;flex-direction:column;justify-content:flex-end}
  .sg{display:block;width:100%}
  .sg.lc{background:#a02bf0}
  .sg.ls{background:#0f8a24}
  .sg.yf{background:#8c1218}
  .sg.pr{background:#8c1218}
  .glab{font-size:6.5pt;margin-top:.8mm}
  .legend{border:.5pt solid #000;padding:1.2mm 2mm;font-size:7pt;line-height:1.6;margin-top:2mm}
  .legend i{display:inline-block;width:3mm;height:2mm;margin-right:1.5mm}
  .legend b{float:right;font-weight:normal}
  /* مخطط الفواقد */
  .loss{margin-top:4mm;font-size:8.5pt}
  .lhead{font-weight:bold;margin-bottom:1.5mm}
  .lrow{display:flex;align-items:baseline;gap:2mm;line-height:1.7}
  .larr{width:5mm;color:#000}
  .lpct{width:18mm;text-align:right}
  .ltxt{flex:1}
  .lbox{border:.8pt solid #000;padding:2mm 3mm;margin:2mm 0;font-weight:bold;display:flex;justify-content:space-between}
  /* الغلاف */
  .cover{text-align:center}
  .cvtop{display:flex;justify-content:space-between;align-items:flex-start}
  .cvtop .pvmark{width:34mm;height:25mm}
  .cvver{border:.8pt solid #000;padding:1.5mm 3mm;font-size:10.5pt}
  .cvt1{font-size:22pt;margin:24mm 0 0}
  .cvt2{font-size:15pt;margin:5mm auto 0;display:inline-block;border-bottom:.8pt solid #000;padding-bottom:1.5mm}
  .cvmeta{margin-top:9mm;font-size:12.5pt;line-height:2}
  .cvlogo{margin-top:34mm}
  .cvlogo img{width:78mm}
  @page{size:A4;margin:12mm 10mm}
</style></head><body>

<!-- صفحة الغلاف -->
<div class="page cover">
  <div class="cvtop">
    <div>${PV_MARK}<p style="margin:1mm 0 0;font-size:8pt;letter-spacing:.6pt;color:#1c3f94;font-weight:bold">PHOTOVOLTAIC SOFTWARE</p></div>
    <div class="cvver">${PVSYST_VERSION}</div>
  </div>
  <p class="cvt1">PVsyst - Simulation report</p>
  <p class="cvt2">${esc(sysTitle)}</p>
  <div class="cvmeta">
    <div>Project: ${esc(project)}</div>
    <div>Variant: ${esc(variant)}</div>
    ${study.city ? `<div>${esc(study.city)} - Yemen</div>` : ""}
  </div>
  <div class="cvlogo"><img src="${logo}" alt="ACTES" /></div>
  <div class="pfoot"><span>${dstr}</span><span>PVsyst Licensed to ACTES</span><span>Page 1/5</span></div>
</div>

<!-- الصفحة 2: ملخص المشروع -->
<div class="page">
  ${pageHead(2)}
  <div class="box"><h2>Project summary</h2>
    <div class="cols">
      <div class="col">
        <h3>Geographical Site</h3>
        <div class="plain">${esc(study.city || "—")}<br/>Yemen</div>
        <div class="sub">Weather data</div>
        <div class="plain">${esc(study.city || "—")}<br/>Meteonorm 9.0 - Synthetic</div>
      </div>
      <div class="col">
        <h3>Situation</h3>
        ${row("Latitude", s.latitude ? `${nf(s.latitude, 4)} °(N)` : null)}
        ${row("Longitude", s.longitude ? `${nf(s.longitude, 4)} °(E)` : null)}
        ${row("Altitude", s.altitude ? `${nf(s.altitude)} m` : null)}
        ${row("Time zone", "UTC+3")}
      </div>
      <div class="col">
        <h3>Project settings</h3>
        ${row("Albedo", "0.20")}
      </div>
    </div>
  </div>

  <div class="box"><h2>System summary</h2>
    <div class="cols">
      <div class="col"><h3>${esc(sysTitle)}</h3></div>
      <div class="col"><h3>Sheds on a building</h3></div>
    </div>
    <div class="cols" style="margin-top:4mm">
      <div class="col">
        <h3>Orientation</h3>
        <div class="plain" style="font-weight:bold">Fixed plane</div>
        ${row("Tilt/Azimuth", s.tilt !== null ? `${nf(s.tilt, 1)} / 0 °` : null)}
      </div>
      <div class="col">
        <h3>Near Shadings</h3>
        <div class="plain">Linear shadings : Fast (table)</div>
      </div>
      <div class="col"></div>
    </div>
    <div class="sub">System information</div>
    <div class="cols">
      <div class="col">
        <div class="plain" style="font-weight:bold">PV Array</div>
        ${row("Nb. of modules", s.panelQty ? `${nf(s.panelQty)} units` : null)}
        ${row("Pnom total", s.kwp ? `${nf(s.kwp, 0)} kWp` : null)}
      </div>
      <div class="col">
        <div class="plain" style="font-weight:bold">Inverters</div>
        ${row("Nb. of units", s.invQty ? `${nf(s.invQty)} units` : null)}
        ${row("Total power", s.invTotalKw ? `${nf(s.invTotalKw, 0)} kWac` : null)}
        ${row("Pnom ratio", s.pnomRatio ? nf(s.pnomRatio, 2) : null)}
      </div>
      <div class="col">
        ${s.batteryKwh ? `<div class="plain" style="font-weight:bold">Battery pack</div><div class="plain">Storage strategy: Self-consumption</div>${row("Capacity", `${nf(s.batteryKwh, 2)} kWh`)}${row("Model", s.batteryModel)}` : ""}
      </div>
    </div>
    ${study.annualConsumption ? `<div class="sub">User's needs</div><div class="plain">Monthly values — ${nf(study.annualConsumption)} kWh/year</div>` : ""}
  </div>

  <div class="box"><h2>Results summary</h2>
    <div class="cols">
      <div class="col">
        ${row("Simulation step", "Hourly")}
        ${row("Produced Energy", study.annualEnergy ? `${nf(study.annualEnergy)} kWh/year` : null)}
        ${row("Used Energy", study.annualConsumption ? `${nf(study.annualConsumption)} kWh/year` : null)}
      </div>
      <div class="col">
        ${row("Specific production", study.specificYield ? `${nf(study.specificYield)} kWh/kWp/year` : null)}
      </div>
      <div class="col">
        ${row("Perf. Ratio PR", study.annualPr ? `${nf(study.annualPr * 100, 2)} %` : null)}
        ${row("Solar Fraction SF", study.coverage ? `${nf(Math.min(100, study.coverage), 2)} %` : null)}
      </div>
    </div>
  </div>

  <div class="box"><h2>Table of contents</h2>
    <div class="toc">
      <div><span>Project and results summary</span><i></i><span>2</span></div>
      <div><span>General parameters, PV Array Characteristics, System losses</span><i></i><span>3</span></div>
      <div><span>Main results</span><i></i><span>4</span></div>
      <div><span>Loss diagram</span><i></i><span>5</span></div>
    </div>
  </div>
</div>

<!-- الصفحة 3: المعاملات العامة -->
<div class="page">
  ${pageHead(3)}
  <div class="box"><h2>General parameters</h2>
    <div class="cols">
      <div class="col"><h3>${esc(sysTitle)}</h3></div>
      <div class="col"><h3>Sheds on a building</h3></div>
    </div>
    <div class="sub">Simulation step</div>
    <div class="plain">Hourly</div>
    <div class="cols" style="margin-top:4mm">
      <div class="col">
        <h3>Orientation</h3>
        <div class="plain" style="font-weight:bold">Fixed plane</div>
        ${row("Tilt/Azimuth", s.tilt !== null ? `${nf(s.tilt, 1)} / 0 °` : null)}
      </div>
      <div class="col">
        <h3>Models used</h3>
        ${row("Transposition", "Perez")}
        ${row("Diffuse", "Perez, Meteonorm")}
        ${row("Circumsolar", "separate")}
      </div>
      <div class="col">
        <h3>Horizon</h3>
        <div class="plain">Free Horizon</div>
        <div class="sub">Near Shadings</div>
        <div class="plain">Linear shadings : Fast (table)</div>
      </div>
    </div>
  </div>

  <div class="box"><h2>PV Array Characteristics</h2>
    <div class="cols">
      <div class="col">
        <h3>PV module</h3>
        ${row("Manufacturer", s.panelModel ? s.panelModel.split(/[\s-]/)[0]! : null)}
        ${row("Model", s.panelModel)}
        ${row("Unit Nom. Power", s.panelWp ? `${nf(s.panelWp)} Wp` : null)}
        ${row("Number of PV modules", s.panelQty ? `${nf(s.panelQty)} units` : null)}
        ${row("Nominal (STC)", s.kwp ? `${nf(s.kwp, 2)} kWp` : null)}
        ${row("At operating cond. (50°C)", s.kwp ? `${nf(s.kwp * 0.9, 2)} kWp` : null)}
      </div>
      <div class="col">
        <h3>Inverter</h3>
        ${row("Model", s.invModel)}
        ${row("Nb. of inverters", s.invQty ? `${nf(s.invQty)} units` : null)}
        ${row("Total power", s.invTotalKw ? `${nf(s.invTotalKw, 1)} kWac` : null)}
        ${row("Operating mode", s.sysMode)}
        ${row("Phase", s.phase)}
        ${row("Pnom ratio (DC:AC)", s.pnomRatio ? nf(s.pnomRatio, 2) : null)}
      </div>
    </div>
    ${s.batteryKwh ? `<div class="sub">Storage</div><div class="cols"><div class="col">${row("Kind", "Self-consumption")}${row("Model", s.batteryModel)}</div><div class="col">${row("Capacity", `${nf(s.batteryKwh, 2)} kWh`)}</div></div>` : ""}
  </div>

  <div class="box"><h2>Array losses</h2>
    <div class="cols">
      <div class="col">
        <h3>Thermal loss factor</h3>
        ${row("Module temperature according to irradiance", "")}
        ${row("Uc (const)", "29.0 W/m²K")}
        ${row("Uv (wind)", "0.0 W/m²K/m/s")}
      </div>
      <div class="col">
        <h3>DC wiring losses</h3>
        ${row("Global array res.", "—")}
        ${row("Loss Fraction", "0.06 % at STC")}
        <div class="sub">Module quality loss</div>
        ${row("Loss Fraction", "-0.75 %")}
      </div>
      <div class="col">
        <h3>LID - Light Induced Degradation</h3>
        ${row("Loss Fraction", "2.00 %")}
        <div class="sub">Module mismatch losses</div>
        ${row("Loss Fraction", "2.00 % at MPP")}
        <div class="sub">IAM loss factor</div>
        ${row("Fresnel AR coating", "n glass 1.526")}
      </div>
    </div>
    <div class="sub">Soiling loss factor / Unavailability</div>
    <div class="plain">Soiling: 0.14 % — System unavailability: 2.0 % (1 period)</div>
  </div>
</div>

<!-- الصفحة 4: النتائج الرئيسية -->
<div class="page">
  ${pageHead(4)}
  <div class="box"><h2>Main results</h2>
    <div class="sub" style="margin-top:0">Simulation step</div>
    <div class="plain">Hourly</div>
    <div class="sub">System Production</div>
    <div class="cols">
      <div class="col">
        ${row("Produced Energy", study.annualEnergy ? `${nf(study.annualEnergy)} kWh/year` : null)}
        ${row("Used Energy", study.annualConsumption ? `${nf(study.annualConsumption)} kWh/year` : null)}
      </div>
      <div class="col">
        ${row("Specific production", study.specificYield ? `${nf(study.specificYield)} kWh/kWp/year` : null)}
        ${row("Perf. Ratio PR", study.annualPr ? `${nf(study.annualPr * 100, 2)} %` : null)}
        ${row("Solar Fraction SF", study.coverage ? `${nf(Math.min(100, study.coverage), 2)} %` : null)}
      </div>
    </div>

    ${
      norm.length
        ? `<div class="charts">
      <div class="chart">
        <div class="ctitle">Normalized productions (per installed kWp)</div>
        <div class="cbody"><div class="cax">${axis(normTop, 5, 0)}</div><div class="cplot">${normBars}</div></div>
        <div class="legend">
          <div><i style="background:#a02bf0"></i>Lc: Collection Loss (PV-array losses)<b>${nf(avgLc, 2)} kWh/kWp/day</b></div>
          <div><i style="background:#0f8a24"></i>Ls: System Loss (inverter, ...)<b>${nf(avgLs, 2)} kWh/kWp/day</b></div>
          <div><i style="background:#8c1218"></i>Yf: Produced useful energy (inverter output)<b>${nf(avgYf, 2)} kWh/kWp/day</b></div>
        </div>
      </div>
      <div class="chart">
        <div class="ctitle">Performance Ratio PR</div>
        <div class="cbody"><div class="cax">${axis(1.2, 6, 1)}</div><div class="cplot">${prBars}</div></div>
        <div class="legend"><div><i style="background:#8c1218"></i>PR: Performance Ratio (Yf / Yr)<b>${study.annualPr ? nf(study.annualPr, 3) : "—"}</b></div></div>
      </div>
    </div>`
        : ""
    }

    ${
      hasMonths
        ? `<div class="ctitle" style="margin-top:5mm">Balances and main results</div>
    <table>
      <thead>
        <tr><th class="mn"></th><th>GlobHor</th><th>DiffHor</th><th>T_Amb</th><th>GlobInc</th><th>GlobEff</th><th>EArray</th><th>E_User</th><th>PR</th></tr>
        <tr><th class="mn"></th><th>kWh/m²</th><th>kWh/m²</th><th>°C</th><th>kWh/m²</th><th>kWh/m²</th><th>kWh</th><th>kWh</th><th>ratio</th></tr>
      </thead>
      <tbody>${balanceRows}${yearRow}</tbody>
    </table>
    <div class="sub" style="margin:2.5mm 0 1mm">Legends</div>
    <div class="cols" style="font-size:7.5pt;line-height:1.5">
      <div class="col">
        <div class="ir"><span>GlobHor</span><b>Global horizontal irradiation</b></div>
        <div class="ir"><span>DiffHor</span><b>Horizontal diffuse irradiation</b></div>
        <div class="ir"><span>T_Amb</span><b>Ambient Temperature</b></div>
        <div class="ir"><span>GlobInc</span><b>Global incident in coll. plane</b></div>
      </div>
      <div class="col">
        <div class="ir"><span>GlobEff</span><b>Effective Global, corr. for IAM and shadings</b></div>
        <div class="ir"><span>EArray</span><b>Effective energy at the output of the array</b></div>
        <div class="ir"><span>E_User</span><b>Energy supplied to the user</b></div>
        <div class="ir"><span>PR</span><b>Performance Ratio</b></div>
      </div>
    </div>`
        : ""
    }
  </div>
</div>

<!-- الصفحة 5: مخطط الفواقد -->
<div class="page">
  ${pageHead(5)}
  <div class="box"><h2>Loss diagram</h2>
    <div class="loss">
      <div class="lbox"><span>${study.annualIrradiation ? `${nf(study.annualIrradiation)} kWh/m²` : "—"}</span><span>Global incident in coll. plane</span></div>
      ${lossRows}
      <div class="lbox"><span>${study.nominalEnergy ? `${nf(study.nominalEnergy)} kWh` : "—"}</span><span>Array nominal energy (at STC effic.)</span></div>
      <div class="lbox"><span>${hasMonths ? `${nf(sum((m) => m.eArray))} kWh` : "—"}</span><span>Array virtual energy at MPP</span></div>
      <div class="lbox"><span>${study.annualEnergy ? `${nf(study.annualEnergy)} kWh` : "—"}</span><span>Available Energy at Inverter Output</span></div>
      ${study.annualConsumption ? `<div class="lbox"><span>${nf(study.annualConsumption)} kWh</span><span>Energy supplied to the user</span></div>` : ""}
    </div>
    <div class="plain" style="margin-top:6mm;font-size:8pt;line-height:1.7">
      Simulation based on monthly Meteonorm irradiation data at the project site, with the complete PVsyst loss chain:
      near shadings, soiling, IAM, ground reflection, thermal behaviour, module quality, LID, mismatch, DC wiring,
      inverter efficiency and system unavailability. Report issued by the Engineering Department — ACTES Energy Systems &amp; Solutions.
    </div>
  </div>
</div>

<script>window.onload=function(){window.focus();setTimeout(function(){window.print();},350);};</script>
</body></html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
}
