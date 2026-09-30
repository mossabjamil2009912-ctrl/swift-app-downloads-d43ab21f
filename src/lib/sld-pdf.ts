import type { SldModel } from "./sld-engine";

/**
 * يصدّر المخطط الأحادي كلوحة هندسية رسمية A4 عرضية:
 * إطار الرسم + كتلة بيانات اللوحة (Title Block) بشعار أكتس + جدول الكابلات
 * وحصر الأصناف والملاحظات. يعتمد على نفس الرسم الظاهر في الشاشة.
 */
const LOGO = "/__l5e/assets-v1/7f7c6118-a1fd-4583-a98e-896c28b86668/actes-logo-sld.png";

const esc = (s: unknown) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** يقرأ الرسم المتجهي المعروض حالياً في الشاشة. */
function currentSvg(): string {
  if (typeof document === "undefined") return "";
  const el = document.querySelector('svg[aria-label="Single Line Diagram"]');
  if (!el) return "";
  const clone = el.cloneNode(true) as SVGElement;
  clone.removeAttribute("style");
  clone.setAttribute("width", "100%");
  clone.setAttribute("height", "auto");
  return clone.outerHTML;
}

export function downloadSldSheet(m: SldModel, number?: string): void {
  const drawing = currentSvg();
  const ref = number || m.title.ref || "—";
  const t = m.title;

  const titleBlock = (page: string) => `
  <div class="tb">
    <div class="tb-logo"><img src="${LOGO}" alt="ACTES"/><span>ACTES ENERGY SYSTEMS &amp; SOLUTIONS</span></div>
    <table class="tb-grid">
      <tr><th>PROJECT</th><td colspan="3">${esc(t.project)}</td></tr>
      <tr><th>CLIENT</th><td>${esc(t.customer || "—")}</td><th>LOCATION</th><td>${esc(t.city || "—")}</td></tr>
      <tr><th>SYSTEM</th><td>${esc(t.system)}</td><th>SUPPLY</th><td>${esc(t.phase)}</td></tr>
      <tr><th>DRAWING</th><td>SINGLE LINE DIAGRAM</td><th>DRAWING No.</th><td>${esc(ref)}</td></tr>
      <tr><th>DESIGNED BY</th><td>${esc(t.designer)}</td><th>DATE</th><td>${esc(t.date)}</td></tr>
      <tr><th>REV</th><td>01</td><th>SHEET</th><td>${esc(page)}</td></tr>
    </table>
  </div>`;

  const cables = m.cables.length
    ? `<table class="dt">
        <thead><tr><th>TAG</th><th>ROUTE</th><th>CABLE / CONDUCTOR</th></tr></thead>
        <tbody>${m.cables
          .map((c) => `<tr><td class="c b">${esc(c.tag)}</td><td>${esc(c.route)}</td><td>${esc(c.spec)}</td></tr>`)
          .join("")}</tbody>
       </table>`
    : "";

  const bom = m.bom.length
    ? `<table class="dt">
        <thead><tr><th style="width:8mm">#</th><th>SYSTEM ITEM — أصناف المنظومة</th><th style="width:26mm">QTY</th></tr></thead>
        <tbody>${m.bom
          .map((r, i) => `<tr><td class="c">${i + 1}</td><td dir="rtl">${esc(r.name)}</td><td class="c b">${esc(r.qty)} ${esc(r.unit)}</td></tr>`)
          .join("")}</tbody>
       </table>`
    : "";

  const notes = m.notes.length ? `<ul class="notes">${m.notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>` : "";

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"/>
<title>ACTES — Single Line Diagram ${esc(ref)}</title>
<style>
  @page{size:A4 landscape;margin:8mm}
  *{box-sizing:border-box}
  body{margin:0;font-family:'Segoe UI',Tahoma,sans-serif;color:#111;background:#fff;font-size:9pt}
  .sheet{position:relative;width:281mm;min-height:194mm;border:1.2pt solid #111;padding:4mm;margin:0 auto;page-break-after:always;display:flex;flex-direction:column}
  .sheet:last-child{page-break-after:auto}
  .hd{display:flex;align-items:center;justify-content:space-between;border-bottom:.8pt solid #111;padding-bottom:2mm}
  .hd h1{margin:0;font-size:12pt;letter-spacing:.5px}
  .hd .r{font-size:8pt;text-align:right;line-height:1.5}
  .draw{flex:1;padding:3mm 0;display:flex;align-items:flex-start}
  .draw svg{width:100%;height:auto}
  .legend{display:flex;gap:6mm;font-size:7.5pt;border-top:.5pt solid #111;padding-top:1.5mm}
  .legend span{display:flex;align-items:center;gap:1.5mm}
  .sw{width:9mm;height:0;border-top:2pt solid #000}
  .tb{margin-top:2mm;border:.8pt solid #111;display:flex}
  .tb-logo{width:52mm;border-right:.8pt solid #111;padding:2mm;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1mm}
  .tb-logo img{width:38mm}
  .tb-logo span{font-size:6.2pt;font-weight:700;text-align:center;letter-spacing:.3px}
  .tb-grid{flex:1;border-collapse:collapse;font-size:7.4pt}
  .tb-grid th{background:#eef2f7;border:.5pt solid #111;padding:.9mm 1.5mm;text-align:left;width:22mm;white-space:nowrap}
  .tb-grid td{border:.5pt solid #111;padding:.9mm 1.5mm;font-weight:700}
  .cols{display:flex;gap:5mm;align-items:flex-start}
  .cols>div{flex:1}
  h2{font-size:9.5pt;margin:0 0 1.5mm;border-bottom:.5pt solid #111;padding-bottom:.8mm}
  .dt{width:100%;border-collapse:collapse;font-size:7.6pt}
  .dt th{background:#eef2f7;border:.5pt solid #111;padding:1mm;text-align:left}
  .dt td{border:.5pt solid #111;padding:.9mm 1mm}
  .dt .c{text-align:center}
  .dt .b{font-weight:700}
  .notes{margin:2mm 0 0;padding-inline-start:5mm;font-size:7.6pt;line-height:1.6}
</style></head><body>

<div class="sheet">
  <div class="hd">
    <h1>SINGLE LINE DIAGRAM — ${esc(t.system)}</h1>
    <div class="r"><b>${esc(t.project)}</b><br/>${esc(t.customer || "")} ${t.city ? "— " + esc(t.city) : ""}<br/>Drawing No. ${esc(ref)}</div>
  </div>
  <div class="draw">${drawing || '<p style="font-size:9pt">Diagram unavailable.</p>'}</div>
  <div class="legend">
    <span><i class="sw" style="border-color:#b4231f"></i> DC circuit</span>
    <span><i class="sw" style="border-color:#0f3f9e"></i> AC circuit</span>
    <span><i class="sw" style="border-color:#1a8a2a;border-top-style:dashed"></i> Earth / bonding</span>
    <span>Symbols to IEC 60617 — drawn to the client's supplied system items only.</span>
  </div>
  ${titleBlock("1 / 2")}
</div>

<div class="sheet">
  <div class="hd">
    <h1>CABLE SCHEDULE &amp; SYSTEM ITEMS</h1>
    <div class="r"><b>${esc(t.project)}</b><br/>Drawing No. ${esc(ref)}</div>
  </div>
  <div class="draw" style="display:block">
    <div class="cols">
      <div><h2>Cable schedule</h2>${cables}</div>
      <div><h2>System items</h2>${bom}</div>
    </div>
    <h2 style="margin-top:4mm">Engineering notes</h2>
    ${notes}
  </div>
  ${titleBlock("2 / 2")}
</div>

<script>window.onload=function(){setTimeout(function(){window.print()},350)}<\/script>
</body></html>`;

  const w = window.open("", "_blank");
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
}
