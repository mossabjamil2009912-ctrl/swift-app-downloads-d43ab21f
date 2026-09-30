// النسخة الإنجليزية من كتالوج الموديل (Model Datasheet — English) بهوية أكتس.
// نفس بيانات المصنّع الواردة في products-data.ts، مترجمة عبر datasheet-en-dictionary.ts فقط.
import type { Product } from "./products-data";
import actesLogo from "@/assets/actes-logo.png.asset.json";
import {
  translateGroupTitle,
  translateSpecLabel,
  translateSpecValue,
  translateProductName,
} from "./datasheet-en-dictionary";

const esc = (s: unknown) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const abs = (u: string) => {
  if (!u) return "";
  if (/^(https?:|data:)/.test(u)) return u;
  return typeof window === "undefined" ? u : new URL(u, window.location.origin).href;
};

const modelCode = (product: Product) =>
  translateSpecValue(product.model.replace(/\s*\([^)]*\)\s*/g, " ").trim());

const categoryLabelEn = (product: Product) =>
  product.category === "panels"
    ? "Solar Panels"
    : product.category === "batteries"
      ? "Batteries"
      : product.category === "storage"
        ? "Energy Storage Systems"
        : "Inverters";

export function datasheetFileNameEn(product: Product): string {
  const model = modelCode(product).replace(/[^A-Za-z0-9.\-]+/g, "-").replace(/(^-|-$)/g, "");
  return `ACTES-Datasheet-EN-${model}.pdf`;
}

function specTablesEn(product: Product): string {
  return product.specs
    .filter((g) => g.rows.length > 0)
    .map(
      (g) => `
      <table class="dt">
        <thead><tr><th colspan="2">${esc(translateGroupTitle(g.title))}</th></tr></thead>
        <tbody>${g.rows
          .map(
            ([k, v]) =>
              `<tr><th class="k">${esc(translateSpecLabel(k))}</th><td class="v">${esc(translateSpecValue(v))}</td></tr>`,
          )
          .join("")}</tbody>
      </table>`,
    )
    .join("");
}

export function buildDatasheetHtmlEn(product: Product, autoPrint = false): string {
  const logo = abs(actesLogo.url);
  const photo = abs(product.image);
  const today = new Date().toLocaleDateString("en-GB");
  const nameEn = translateProductName(product.name);
  const powerEn = translateSpecValue(product.power);

  return `<!doctype html><html lang="en" dir="ltr"><head><meta charset="utf-8"/>
<title>${esc(datasheetFileNameEn(product).replace(/\.pdf$/, ""))}</title>
<link rel="stylesheet" href="${abs("/fonts/fonts.css")}"/>
<style>
  @page{size:A4;margin:10mm}
  *{box-sizing:border-box}
  body{margin:0;background:#fff;color:#14203a;font-family:'Cairo','Segoe UI',Tahoma,sans-serif;font-size:9pt;line-height:1.55}
  .sheet{width:190mm;margin:0 auto;page-break-after:always}
  .sheet:last-child{page-break-after:auto}

  .hd{display:flex;align-items:center;justify-content:space-between;gap:6mm;border-bottom:2.4pt solid #d81f26;padding-bottom:2mm}
  .hd img{height:16mm;object-fit:contain}
  .hd .r{text-align:right}
  .hd .brand{font-size:15pt;font-weight:800;letter-spacing:.5px;color:#14203a}
  .hd .model{font-size:10pt;font-weight:700;color:#d81f26}
  .bar{background:#14203a;color:#fff;padding:1.5mm 4mm;font-size:10.5pt;font-weight:800;display:flex;justify-content:space-between;align-items:center}
  .bar .pw{background:#d81f26;padding:.6mm 3mm;border-radius:2mm;font-size:11pt}

  .top{display:flex;gap:5mm;margin-top:4mm;align-items:stretch}
  .photo{width:62mm;border:.6pt solid #cfd6e4;border-radius:2mm;display:flex;align-items:center;justify-content:center;padding:2mm;background:#fbfcfe}
  .photo img{max-width:100%;max-height:62mm;object-fit:contain}
  .info{flex:1}
  .info h2{margin:0 0 2mm;font-size:12pt;font-weight:800;line-height:1.4}
  .kv{width:100%;border-collapse:collapse;font-size:8.4pt}
  .kv th{background:#eef2f8;border:.5pt solid #cfd6e4;padding:1.2mm 2mm;text-align:left;width:32mm;font-weight:700;white-space:nowrap}
  .kv td{border:.5pt solid #cfd6e4;padding:1.2mm 2mm;font-weight:700}

  .dt{width:100%;border-collapse:collapse;font-size:6.8pt;margin-bottom:1.1mm;page-break-inside:avoid}
  .dt thead th{background:#14203a;color:#fff;padding:1mm 2mm;text-align:left;font-size:7.9pt;font-weight:800}
  .dt tbody tr:nth-child(even){background:#f6f8fb}
  .dt .k{border:.5pt solid #cfd6e4;padding:.6mm 2mm;text-align:left;width:52mm;font-weight:700;background:transparent}
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
  <div class="bar"><span>Technical Datasheet</span><span class="pw">${esc(powerEn)}</span></div>

  <div class="top">
    <div class="photo"><img src="${photo}" alt="${esc(nameEn)}"/></div>
    <div class="info">
      <h2>${esc(nameEn)}</h2>
      <table class="kv">
        <tr><th>Model</th><td>${esc(modelCode(product))}</td></tr>
        <tr><th>Rated power</th><td>${esc(powerEn)}</td></tr>
        <tr><th>Brand</th><td>${esc(product.brand)}</td></tr>
        <tr><th>Category</th><td>${esc(categoryLabelEn(product))}</td></tr>
        ${product.certificates ? `<tr><th>Certificates</th><td style="font-weight:600">${esc(translateSpecValue(product.certificates))}</td></tr>` : ""}
      </table>
    </div>
  </div>

  <div style="margin-top:4mm">${specTablesEn(product)}</div>

  <p class="note">All values above apply to model ${esc(modelCode(product))} rated ${esc(powerEn)} only, as published in the manufacturer's official datasheet. This document is for technical and informational purposes only.</p>
  <div class="ft">
    <span><b>ACTES Energy Systems &amp; Solutions</b> — Technical Support &amp; Engineering Consultancy</span>
    <span>${esc(today)}</span>
  </div>
</div>

${autoPrint ? `<script>window.onload=function(){setTimeout(function(){window.print()},600)}<\\/script>` : ""}
</body></html>`;
}

function openWindowEn(product: Product, autoPrint: boolean): void {
  if (typeof window === "undefined") return;
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.open();
  w.document.write(buildDatasheetHtmlEn(product, autoPrint));
  w.document.close();
}

/** Opens the English datasheet for reading, without triggering print. */
export const openDatasheetEn = (product: Product) => openWindowEn(product, false);

/** Opens the English datasheet and starts saving it as PDF. */
export const downloadDatasheetEn = (product: Product) => openWindowEn(product, true);
