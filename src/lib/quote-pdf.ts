import { money, type View } from "./present";
import { CERTIFICATES, CERTIFICATES_TITLE } from "./warranty";

type Quote = NonNullable<View["quote"]>;

function esc(value: unknown) {
  return String(value ?? "").replace(/[&<>"]/g, (char) =>
    char === "&" ? "&amp;" : char === "<" ? "&lt;" : char === ">" ? "&gt;" : "&quot;",
  );
}

/** يبني صفحة عرض السعر ويفتح نافذة الطباعة لحفظها كملف PDF. */
export function downloadQuotePdf(quote: Quote) {
  if (typeof window === "undefined") return;
  const title = `عرض سعر ${quote.number || "ACTES"}`;
  const rows = quote.items
    .map((item, index) => {
      const details = (item.details || []).map((detail) => `<p class="d">${esc(detail)}</p>`).join("");
      return `<tr>
        <td class="c">${index + 1}</td>
        <td class="r"><p class="n">${esc(item.name)}</p>${details}</td>
        <td class="c">${esc(item.unit)}</td>
        <td class="c">${esc(item.qty)}</td>
        <td class="c">${esc(money(Number(item.price) || 0))}</td>
        <td class="c">${esc(money(Number(item.total) || 0))}</td>
      </tr>`;
    })
    .join("");

  const html = `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8" />
<title>${esc(title)}</title>
<style>
  *{box-sizing:border-box}
  body{font-family:Arial,Helvetica,sans-serif;color:#000;margin:16px}
  .head{display:flex;justify-content:space-between;align-items:center;gap:16px;border:2px solid #000;border-bottom:0;padding:10px 12px}
  .head p{margin:0}
  .t1{font-weight:900;font-size:14px}
  .t2{font-weight:700;font-size:11px}
  .meta{text-align:left;font-size:11px;font-weight:700;line-height:1.6}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th,td{border:1px solid #000;padding:6px}
  thead th{background:#e8202a;text-align:center;font-weight:700;font-size:13px}
  .c{text-align:center;font-weight:700}
  .r{text-align:right}
  .n{margin:0;font-weight:700;font-size:12px}
  .d{margin:0;font-size:10px}
  tfoot td{background:#bfbfbf;font-weight:900;font-size:13px;text-align:center}
  tfoot .sum{color:#c00000}
  .foot{display:flex;gap:10px;margin-top:10px;page-break-inside:avoid}
  .box{flex:1;border:1px solid #000;padding:8px}
  .box h3{margin:0 0 6px;font-size:12px}
  .w{display:flex;justify-content:space-between;gap:8px;font-size:10px;border-bottom:1px dotted #999;padding:3px 0}
  .w b{white-space:nowrap}
  .cert{display:inline-block;border:1px solid #000;border-radius:10px;padding:2px 7px;margin:3px 3px 0 0;font-size:10px;font-weight:700;direction:ltr}
  .note{margin:6px 0 0;font-size:9px}
  @page{size:A4;margin:12mm}
</style></head><body>
<div class="head">
  <div><p class="t1">أكتس لأنظمة الطاقة وحلولها</p><p class="t2">عرض سعر</p></div>
  <div class="meta"><p>رقم العرض: ${esc(quote.number || "—")}</p><p>العميل: ${esc(quote.customer || "—")}</p></div>
</div>
<table>
  <thead><tr><th>م</th><th>البند والمواصفات</th><th>الوحدة</th><th>الكمية</th><th>سعر الوحدة</th><th>الإجمالي</th></tr></thead>
  <tbody>${rows}</tbody>
  <tfoot><tr><td colspan="5">الإجمالي الكلي</td><td class="sum">${esc(money(Number(quote.total) || 0))}</td></tr></tfoot>
</table>
<div class="foot">
  <div class="box">
    <h3>${esc(CERTIFICATES_TITLE)}</h3>
    ${CERTIFICATES.map((name) => `<span class="cert">${esc(name)}</span>`).join("")}
    <p class="note">جميع المكونات الموردة من ACTES أصلية ومطابقة للمعايير الدولية أعلاه.</p>
  </div>
</div>

<script>window.onload=function(){window.focus();window.print();};</script>
</body></html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
}
