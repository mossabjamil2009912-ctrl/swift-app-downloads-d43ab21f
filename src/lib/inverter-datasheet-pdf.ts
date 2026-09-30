// كتالوج (Datasheet) مستقل لكل قدرة إنفرتر — يُولَّد داخل التطبيق بدقة طباعة عالية.
// المصدر الوحيد للبيانات: بيانات الموديل المنبثق في products-data.ts (المستخرجة من كتالوج المصنّع).
// ممنوع عرض نطاقات قدرة أو أعمدة بقية موديلات السلسلة، وممنوع أي تسعير أو طلب شراء.
import type { Product } from "./products-data";
import actesLogo from "@/assets/actes-logo.png.asset.json";

const esc = (s: unknown) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** يحوّل أي مسار أصل إلى رابط مطلق حتى يظهر داخل نافذة الطباعة. */
const abs = (u: string) => {
  if (!u) return "";
  if (/^(https?:|data:)/.test(u)) return u;
  return typeof window === "undefined" ? u : new URL(u, window.location.origin).href;
};

/** هل هذا الصنف يستحق كتالوجاً خاصاً بقدرته وحدها؟
 *  يشمل الألواح الشمسية والبطاريات (مواصفات كل موديل مستقلة)،
 *  والموديلات المنبثقة (Deye/Solis) والإنفرترات ذات القدرة المفردة (Li-Power). */
export function hasModelDatasheet(product: Product): boolean {
  if (product.category === "panels" || product.category === "batteries" || product.category === "storage") return true;
  if (product.category !== "inverters") return false;
  if (product.baseId) return true;
  // قدرة مفردة بلا نطاق مثل «6.2 kW»
  return !/[–—-]|إلى/.test(product.power);
}

/** رمز الموديل وحده بلا ذكر بقية موديلات السلسلة بين قوسين. */
const modelCode = (product: Product) => product.model.replace(/\s*\([^)]*\)\s*/g, " ").trim();

/** اسم تصنيف المنتج كما يظهر في بطاقة الكتالوج. */
const categoryLabel = (product: Product) =>
  product.category === "panels"
    ? "الألواح الشمسية"
    : product.category === "batteries"
      ? "البطاريات"
      : product.category === "storage"
        ? "أنظمة التخزين"
        : "الإنفرترات";

/** اسم الملف المقترح عند الحفظ كـ PDF. */
export function datasheetFileName(product: Product): string {
  const model = modelCode(product).replace(/[^A-Za-z0-9.\-]+/g, "-").replace(/(^-|-$)/g, "");
  return `ACTES-Datasheet-${model}.pdf`;
}

/** يبني صفحات جدول المواصفات: أول مجموعة هي المواصفات الخاصة بهذه القدرة. */
function specTables(product: Product): string {
  return product.specs
    .filter((g) => g.rows.length > 0)
    .map(
      (g) => `
      <table class="dt">
        <thead><tr><th colspan="2">${esc(g.title)}</th></tr></thead>
        <tbody>${g.rows
          .map(
            ([k, v]) =>
              `<tr><th class="k">${esc(k)}</th><td class="v" dir="auto">${esc(v)}</td></tr>`,
          )
          .join("")}</tbody>
      </table>`,
    )
    .join("");
}

/**
 * يفتح كتالوج الموديل كصفحة طباعة A4 جاهزة للحفظ كـ PDF.
 * التنسيق: ترويسة بشعار أكتس واسم المصنّع، بطاقة الصنف بالقدرة الصريحة، جدول المواصفات، تذييل رسمي.
 */
export function buildDatasheetHtml(product: Product, autoPrint = false): string {
  const logo = abs(actesLogo.url);
  const photo = abs(product.image);
  const today = new Date().toLocaleDateString("en-GB");

  const features = product.features
    .slice(0, 6)
    .map((f) => `<li>${esc(f)}</li>`)
    .join("");
  const uses = product.uses
    .slice(0, 6)
    .map((u) => `<li>${esc(u)}</li>`)
    .join("");

  const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/>
<title>${esc(datasheetFileName(product).replace(/\.pdf$/, ""))}</title>
<link rel="stylesheet" href="${abs("/fonts/fonts.css")}"/>
<style>
  @page{size:A4;margin:10mm}
  *{box-sizing:border-box}
  body{margin:0;background:#fff;color:#14203a;font-family:'Cairo','Segoe UI',Tahoma,sans-serif;font-size:9pt;line-height:1.55}
  .sheet{width:190mm;margin:0 auto;page-break-after:always}
  .sheet:last-child{page-break-after:auto}

  .hd{display:flex;align-items:center;justify-content:space-between;gap:6mm;border-bottom:2.4pt solid #d81f26;padding-bottom:2mm}
  .hd img{height:16mm;object-fit:contain}
  .hd .r{text-align:left}
  .hd .brand{font-size:15pt;font-weight:800;letter-spacing:.5px;color:#14203a}
  .hd .model{font-size:10pt;font-weight:700;color:#d81f26;direction:ltr}
  .bar{background:#14203a;color:#fff;padding:1.5mm 4mm;margin-top:0;font-size:10.5pt;font-weight:800;display:flex;justify-content:space-between;align-items:center}
  .bar .pw{background:#d81f26;padding:.6mm 3mm;border-radius:2mm;direction:ltr;font-size:11pt}

  .top{display:flex;gap:5mm;margin-top:4mm;align-items:stretch}
  .photo{width:62mm;border:.6pt solid #cfd6e4;border-radius:2mm;display:flex;align-items:center;justify-content:center;padding:2mm;background:#fbfcfe}
  .photo img{max-width:100%;max-height:62mm;object-fit:contain}
  .info{flex:1}
  .info h2{margin:0 0 2mm;font-size:12pt;font-weight:800;line-height:1.4}
  .kv{width:100%;border-collapse:collapse;font-size:8.4pt}
  .kv th{background:#eef2f8;border:.5pt solid #cfd6e4;padding:1.2mm 2mm;text-align:right;width:28mm;font-weight:700;white-space:nowrap}
  .kv td{border:.5pt solid #cfd6e4;padding:1.2mm 2mm;font-weight:700}
  .about{margin-top:2.5mm;font-size:8.2pt;line-height:1.7;text-align:justify;color:#3a4560}

  h3{font-size:10pt;margin:5mm 0 2mm;color:#14203a;border-right:3pt solid #d81f26;padding-right:2.5mm}
  .cols{display:flex;gap:6mm}
  .cols>div{flex:1}
  ul{margin:0;padding-inline-start:5mm;font-size:8.2pt;line-height:1.7}

  .dt{width:100%;border-collapse:collapse;font-size:6.8pt;margin-bottom:1.1mm;page-break-inside:avoid}
  .dt thead th{background:#14203a;color:#fff;padding:1mm 2mm;text-align:right;font-size:7.9pt;font-weight:800}
  .dt tbody tr:nth-child(even){background:#f6f8fb}
  .dt .k{border:.5pt solid #cfd6e4;padding:.6mm 2mm;text-align:right;width:52mm;font-weight:700;background:transparent}
  .dt .v{border:.5pt solid #cfd6e4;padding:.6mm 2mm;font-weight:600}
  .dt tr{page-break-inside:avoid}

  .ft{margin-top:2mm;page-break-inside:avoid;border-top:1pt solid #14203a;padding-top:2mm;display:flex;justify-content:space-between;font-size:7.4pt;color:#5a6580}
  .ft b{color:#14203a}
  .note{margin-top:1.5mm;page-break-inside:avoid;font-size:7.2pt;color:#7a8398}
</style></head><body>

<div class="sheet">
  <div class="hd">
    <img src="${logo}" alt="ACTES"/>
    <div class="r">
      <div class="brand">${esc(product.brand)}</div>
      <div class="model">${esc(modelCode(product))}</div>
    </div>
  </div>
  <div class="bar"><span>الكتالوج الفني — Technical Datasheet</span><span class="pw">${esc(product.power)}</span></div>

  <div class="top">
    <div class="photo"><img src="${photo}" alt="${esc(product.name)}"/></div>
    <div class="info">
      <h2>${esc(product.name)}</h2>
      <table class="kv">
        <tr><th>الموديل</th><td dir="ltr">${esc(modelCode(product))}</td></tr>
        <tr><th>القدرة الاسمية</th><td dir="ltr">${esc(product.power)}</td></tr>
        <tr><th>العلامة التجارية</th><td>${esc(product.brand)}</td></tr>
        <tr><th>الفئة</th><td>${esc(categoryLabel(product))}</td></tr>
        ${product.certificates ? `<tr><th>الشهادات</th><td style="font-weight:600">${esc(product.certificates)}</td></tr>` : ""}
      </table>
      <p class="about">${esc(product.about)}</p>
    </div>
  </div>

  ${features || uses ? `<div class="cols">
    ${features ? `<div><h3>أهم المميزات</h3><ul>${features}</ul></div>` : ""}
    ${uses ? `<div><h3>الاستخدامات</h3><ul>${uses}</ul></div>` : ""}
  </div>` : ""}

  ${product.suitableFor ? `<h3>لمن يناسب</h3><p style="font-size:8.2pt;line-height:1.7;margin:0">${esc(product.suitableFor)}</p>` : ""}

  <div class="ft">
    <span><b>شركة أكتس لأنظمة الطاقة وحلولها</b> — ACTES Energy Systems &amp; Solutions</span>
    <span>${esc(today)} — صفحة 1</span>
  </div>
</div>

<div class="sheet">
  <div class="hd">
    <img src="${logo}" alt="ACTES"/>
    <div class="r">
      <div class="brand">المواصفات الفنية</div>
      <div class="model">${esc(modelCode(product))} — ${esc(product.power)}</div>
    </div>
  </div>
  <div class="bar"><span>Technical Specifications</span><span class="pw">${esc(product.power)}</span></div>
  <div style="margin-top:3mm">${specTables(product)}</div>
  <p class="note">جميع القيم الواردة أعلاه تخص موديل ${esc(modelCode(product))} بقدرة ${esc(product.power)} حصراً، ومصدرها الكتالوج الرسمي للشركة المصنّعة. هذا المستند للأغراض الفنية والمعلوماتية فقط.</p>
  <div class="ft">
    <span><b>شركة أكتس لأنظمة الطاقة وحلولها</b> — الدعم الفني والاستشارات الهندسية</span>
    <span>${esc(today)} — صفحة 2</span>
  </div>
</div>

${autoPrint ? `<script>window.onload=function(){setTimeout(function(){window.print()},600)}<\\/script>` : ""}
</body></html>`;
  return html;
}

function openDatasheetWindow(product: Product, autoPrint: boolean): void {
  if (typeof window === "undefined") return;
  const html = buildDatasheetHtml(product, autoPrint);
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
}

/** يفتح كتالوج الموديل للقراءة داخل نافذة جديدة بدون أي أمر طباعة. */
export function openInverterDatasheet(product: Product): void {
  openDatasheetWindow(product, false);
}

/** يفتح كتالوج الموديل ويبدأ حفظه كملف PDF مباشرة. */
export function downloadInverterDatasheet(product: Product): void {
  openDatasheetWindow(product, true);
}
