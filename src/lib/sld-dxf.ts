import type { SldModel } from "@/lib/sld-engine";
import type { CableCalc } from "@/lib/sld-annotations";
import { mpptMap } from "@/lib/sld-mppt";

/**
 * مُصدِّر المخطط الأحادي إلى ملف AutoCAD المتجهي (DXF — صيغة R12 النصية).
 * يُولَّد بالكامل داخل المتصفح بدون أي مكتبة خارجية أو اتصال بالإنترنت،
 * وموزَّع على طبقات هندسية معيارية ليتمكن المهندس من دمجه في مخططات المشروع.
 */

/** ألوان AutoCAD القياسية (ACI) لكل طبقة. */
const LAYERS: [string, number][] = [
  ["SLD-POWER-DC", 1], // أحمر
  ["SLD-POWER-AC", 5], // أزرق
  ["SLD-EARTHING", 3], // أخضر
  ["SLD-COMM", 6], // بنفسجي
  ["SLD-SYMBOLS", 7], // أبيض/أسود
  ["SLD-ANNOTATIONS", 8], // رمادي
  ["SLD-TITLEBLOCK", 7],
];

type Buf = string[];

const g = (b: Buf, code: number, value: string | number) => {
  b.push(String(code), String(value));
};

const n3 = (v: number) => (Math.round(v * 1000) / 1000).toFixed(3);

function line(b: Buf, layer: string, x1: number, y1: number, x2: number, y2: number) {
  g(b, 0, "LINE");
  g(b, 8, layer);
  g(b, 10, n3(x1));
  g(b, 20, n3(y1));
  g(b, 30, "0.0");
  g(b, 11, n3(x2));
  g(b, 21, n3(y2));
  g(b, 31, "0.0");
}

function rect(b: Buf, layer: string, x: number, y: number, w: number, h: number) {
  line(b, layer, x, y, x + w, y);
  line(b, layer, x + w, y, x + w, y + h);
  line(b, layer, x + w, y + h, x, y + h);
  line(b, layer, x, y + h, x, y);
}

/** نص أحادي السطر — يُنقّى من المحارف غير اللاتينية التي لا تدعمها خطوط DXF البسيطة. */
function text(b: Buf, layer: string, x: number, y: number, h: number, value: string, align: "l" | "c" = "l") {
  const clean = String(value).replace(/[^\x20-\x7E]/g, "").trim();
  if (!clean) return;
  g(b, 0, "TEXT");
  g(b, 8, layer);
  g(b, 10, n3(x));
  g(b, 20, n3(y));
  g(b, 30, "0.0");
  g(b, 40, n3(h));
  g(b, 1, clean);
  if (align === "c") {
    g(b, 72, 1);
    g(b, 11, n3(x));
    g(b, 21, n3(y));
    g(b, 31, "0.0");
  }
}

function circle(b: Buf, layer: string, x: number, y: number, r: number) {
  g(b, 0, "CIRCLE");
  g(b, 8, layer);
  g(b, 10, n3(x));
  g(b, 20, n3(y));
  g(b, 30, "0.0");
  g(b, 40, n3(r));
}

/** صندوق مكوّن بعنوان وأسطر مواصفات. */
function block(b: Buf, layer: string, x: number, y: number, w: number, h: number, title: string, lines: string[]) {
  rect(b, "SLD-SYMBOLS", x, y, w, h);
  line(b, "SLD-SYMBOLS", x, y + h - 7, x + w, y + h - 7);
  text(b, layer, x + w / 2, y + h - 5.4, 3.2, title, "c");
  lines.filter(Boolean).forEach((l, i) => text(b, "SLD-ANNOTATIONS", x + 2.5, y + h - 13 - i * 5, 2.6, l));
}

/** يبني محتوى ملف الـ DXF كاملاً من نموذج المخطط. */
export function buildSldDxf(m: SldModel, number?: string, calcs?: CableCalc[]): string {
  const b: Buf = [];

  // ── الترويسة والطبقات ────────────────────────────────────────────────
  g(b, 0, "SECTION");
  g(b, 2, "HEADER");
  g(b, 9, "$ACADVER");
  g(b, 1, "AC1009");
  g(b, 9, "$INSUNITS");
  g(b, 70, 4); // مليمتر
  g(b, 9, "$EXTMIN");
  g(b, 10, "0.0");
  g(b, 20, "0.0");
  g(b, 9, "$EXTMAX");
  g(b, 10, "420.0");
  g(b, 20, "297.0");
  g(b, 0, "ENDSEC");

  g(b, 0, "SECTION");
  g(b, 2, "TABLES");
  g(b, 0, "TABLE");
  g(b, 2, "LAYER");
  g(b, 70, LAYERS.length);
  for (const [name, color] of LAYERS) {
    g(b, 0, "LAYER");
    g(b, 2, name);
    g(b, 70, 0);
    g(b, 62, color);
    g(b, 6, "CONTINUOUS");
  }
  g(b, 0, "ENDTAB");
  g(b, 0, "ENDSEC");

  g(b, 0, "SECTION");
  g(b, 2, "ENTITIES");

  // ── إطار اللوحة A3 أفقي (420×297 مم) ─────────────────────────────────
  const PW = 420;
  const PH = 297;
  rect(b, "SLD-TITLEBLOCK", 10, 10, PW - 20, PH - 20);
  rect(b, "SLD-TITLEBLOCK", 12, 12, PW - 24, PH - 24);

  // كتلة بيانات اللوحة أسفل اليمين
  const tbW = 150;
  const tbH = 46;
  const tbX = PW - 12 - tbW;
  const tbY = 12;
  rect(b, "SLD-TITLEBLOCK", tbX, tbY, tbW, tbH);
  const t = m.title;
  const rows: [string, string][] = [
    ["PROJECT", t.project],
    ["CLIENT", t.customer || "-"],
    ["LOCATION", t.city || "-"],
    ["SYSTEM", t.system],
    ["SUPPLY", t.phase],
    ["DRAWING No.", number || t.ref || "-"],
    ["DATE / BY", `${t.date}  ${t.designer}`],
  ];
  rows.forEach(([k, v], i) => {
    const y = tbY + tbH - 6 - i * 5.6;
    text(b, "SLD-TITLEBLOCK", tbX + 2.5, y, 2.4, `${k}:`);
    text(b, "SLD-TITLEBLOCK", tbX + 34, y, 2.4, v);
  });
  text(b, "SLD-TITLEBLOCK", tbX + 2.5, tbY + tbH + 4, 4.2, "ACTES ENERGY SYSTEMS & SOLUTIONS");
  text(b, "SLD-TITLEBLOCK", tbX + 2.5, tbY + tbH + 10, 3, "SINGLE LINE DIAGRAM - REV 01");

  // ── مسار الطاقة الرئيسي ───────────────────────────────────────────────
  const busY = 225; // مستوى الخط الرئيسي
  const pv = m.pv;
  const inv = m.inverter;
  const bat = m.battery;
  const ac = m.acBox;

  const xPv = 18;
  const wPv = 62;
  const xDc = 95;
  const wDc = 46;
  const xInv = 160;
  const wInv = 58;
  const xAc = 240;
  const wAc = 50;
  const xAts = 306;
  const wAts = 42;
  const xOut = 364;
  const wOut = 44;

  if (pv) {
    block(b, "SLD-POWER-DC", xPv, busY - 18, wPv, 36, "PV ARRAY", [
      `${pv.qty} x ${pv.wp} Wp = ${pv.kwp.toFixed(2)} kWp`,
      `${pv.strings} string(s) x ${pv.perString} modules`,
      pv.strVoc ? `Voc/string ${Math.round(pv.strVoc)} V` : "",
    ]);
    text(b, "SLD-ANNOTATIONS", xPv, busY - 23, 2.6, pv.model);
  }

  if (m.dcBox) {
    block(b, "SLD-POWER-DC", xDc, busY - 18, wDc, 36, "DC BOARD", [
      `${m.dcBox.ways} Way IP65`,
      `Fuse gPV ${m.dcBox.fuseA} A`,
      "DC Isolator",
      m.dcBox.hasSpd ? "SPD T1+T2 DC" : "",
    ]);
    if (pv) {
      line(b, "SLD-POWER-DC", xPv + wPv, busY, xDc, busY);
      text(b, "SLD-POWER-DC", (xPv + wPv + xDc) / 2, busY + 2, 2.6, "W1", "c");
    }
  }

  if (inv) {
    block(b, "SLD-POWER-AC", xInv, busY - 22, wInv, 44, inv.phase3 ? "INVERTER 3PH" : "INVERTER 1PH", [
      `${inv.qty} x ${inv.kw} kW = ${inv.totalKw} kW`,
      inv.mppt ? `MPPT inputs: ${inv.mppt}` : "",
      inv.mpptRange ? `MPPT: ${inv.mpptRange}` : "",
      inv.vbat ? `BAT: ${inv.vbat} V DC` : "",
    ]);
    text(b, "SLD-ANNOTATIONS", xInv, busY - 27, 2.6, inv.model);

    // توزيع السلاسل على مداخل الـ MPPT
    const map = mpptMap(m);
    const from = m.dcBox ? xDc + wDc : pv ? xPv + wPv : xInv - 20;
    map.forEach((grp, i) => {
      const y = busY + 10 - (i * 20) / Math.max(1, map.length - 1 || 1);
      const yy = map.length === 1 ? busY : y;
      line(b, "SLD-POWER-DC", from, yy, xInv, yy);
      text(
        b,
        "SLD-POWER-DC",
        from + 2,
        yy + 1.6,
        2.4,
        `MPPT ${grp.index} - ${grp.strings.length} str${grp.isc ? ` / ${grp.isc} A` : ""}`,
      );
    });
    if (!map.length && m.dcBox) line(b, "SLD-POWER-DC", from, busY, xInv, busY);
  }

  if (bat && inv) {
    const bx = xInv - 8;
    const by = busY - 76;
    block(b, "SLD-POWER-DC", bx, by, 58, 30, "BATTERY BANK", [
      `${bat.qty} x ${bat.kwh} kWh = ${bat.totalKwh} kWh`,
      bat.vdc ? `${bat.vdc} V DC` : "",
      bat.breakerA ? `DC breaker ${bat.breakerA} A 2P` : "",
    ]);
    line(b, "SLD-POWER-DC", bx + 29, by + 30, bx + 29, busY - 22);
    text(b, "SLD-POWER-DC", bx + 31, by + 36, 2.6, "W3 - BAT");
  }

  if (ac && inv) {
    block(b, "SLD-POWER-AC", xAc, busY - 22, wAc, 44, "AC BOARD", [
      `Main ${ac.breakerA} A ${ac.phase3 ? "4P" : "2P"}`,
      ac.phase3 ? "L1/L2/L3/N/PE" : "L/N/PE",
      `RCD Type B 30 mA`,
      "SPD T1+T2 AC",
    ]);
    line(b, "SLD-POWER-AC", xInv + wInv, busY, xAc, busY);
    text(b, "SLD-POWER-AC", (xInv + wInv + xAc) / 2, busY + 2, 2.6, "W4", "c");
  }

  if (m.ats && ac) {
    block(b, "SLD-POWER-AC", xAts, busY - 18, wAts, 36, "ATS", [
      "Grid / Generator",
      m.ats.kva ? `Gen ${m.ats.kva} kVA` : "MCCB 4P",
    ]);
    line(b, "SLD-POWER-AC", xAc + wAc, busY, xAts, busY);
  }

  const lastX = m.ats && ac ? xAts + wAts : ac ? xAc + wAc : inv ? xInv + wInv : xAc;
  if (m.grid) {
    block(b, "SLD-POWER-AC", xOut, busY + 10, wOut, 24, "UTILITY GRID", [m.title.phase]);
    line(b, "SLD-POWER-AC", lastX, busY, xOut - 8, busY);
    line(b, "SLD-POWER-AC", xOut - 8, busY, xOut - 8, busY + 22);
    line(b, "SLD-POWER-AC", xOut - 8, busY + 22, xOut, busY + 22);
    text(b, "SLD-POWER-AC", lastX + 4, busY + 2, 2.6, "W5");
    if (m.meter) {
      circle(b, "SLD-SYMBOLS", lastX + 18, busY, 4);
      text(b, "SLD-ANNOTATIONS", lastX + 18, busY - 1, 2.2, "kWh", "c");
      text(b, "SLD-ANNOTATIONS", lastX + 10, busY - 8, 2.2, m.meter.ct);
    }
  }
  const backup = Boolean(bat && inv);
  block(b, "SLD-POWER-AC", xOut, busY - 34, wOut, 24, backup ? "CRITICAL LOADS" : "SITE LOADS", [m.title.phase]);
  if (backup && inv) {
    line(b, "SLD-POWER-AC", xInv + wInv, busY - 14, xInv + wInv + 6, busY - 14);
    line(b, "SLD-POWER-AC", xInv + wInv + 6, busY - 14, xInv + wInv + 6, busY - 22);
    line(b, "SLD-POWER-AC", xInv + wInv + 6, busY - 22, xOut, busY - 22);
    text(b, "SLD-POWER-AC", xInv + wInv + 10, busY - 20, 2.6, "W6 - EPS BACKUP");
  } else {
    line(b, "SLD-POWER-AC", lastX, busY, xOut - 8, busY);
    line(b, "SLD-POWER-AC", xOut - 8, busY, xOut - 8, busY - 22);
    line(b, "SLD-POWER-AC", xOut - 8, busY - 22, xOut, busY - 22);
  }

  // ── شبكة التأريض ومانعات الصواعق ──────────────────────────────────────
  const peY = busY - 92;
  line(b, "SLD-EARTHING", xPv, peY, xOut + wOut, peY);
  text(b, "SLD-EARTHING", xPv, peY + 3, 2.8, "PE - MAIN EARTH BAR (MEB) Cu 25x3 mm / 1x16 mm2");
  const bonds = [xPv + 20, m.dcBox ? xDc + wDc / 2 : null, inv ? xInv + wInv / 2 : null, ac ? xAc + wAc / 2 : null, xOut + 10]
    .filter((v): v is number => v !== null);
  bonds.forEach((x) => line(b, "SLD-EARTHING", x, peY, x, peY + 14));
  // وتد التأريض
  const ex = xOut + wOut - 14;
  line(b, "SLD-EARTHING", ex, peY, ex, peY - 6);
  line(b, "SLD-EARTHING", ex - 7, peY - 6, ex + 7, peY - 6);
  line(b, "SLD-EARTHING", ex - 4.5, peY - 9, ex + 4.5, peY - 9);
  line(b, "SLD-EARTHING", ex - 2, peY - 12, ex + 2, peY - 12);
  text(b, "SLD-EARTHING", ex, peY - 17, 2.4, "EARTH ELECTRODE < 5 OHM", "c");

  // ── جدول الكابلات ────────────────────────────────────────────────────
  if (calcs && calcs.length) {
    const tx = 18;
    let ty = 108;
    text(b, "SLD-ANNOTATIONS", tx, ty, 3.2, "CABLE SCHEDULE");
    ty -= 6;
    text(b, "SLD-ANNOTATIONS", tx, ty, 2.4, "TAG   ROUTE / CABLE                                             L(m)   V-DROP");
    calcs.slice(0, 12).forEach((c) => {
      ty -= 5;
      const route = `${c.route} - ${c.spec}`.slice(0, 62).padEnd(62, " ");
      const len = `${c.length}`.padStart(5, " ");
      const dv = c.dropPct !== null ? `${c.dropPct}%` : "-";
      text(b, "SLD-ANNOTATIONS", tx, ty, 2.4, `${c.tag.padEnd(5, " ")} ${route} ${len}   ${dv}`);
    });
  }

  g(b, 0, "ENDSEC");
  g(b, 0, "EOF");
  return b.join("\r\n");
}

/** ينشئ ملف DXF ويحمّله مباشرة في جهاز المهندس. */
export function downloadSldDxf(m: SldModel, number?: string, calcs?: CableCalc[]): void {
  const dxf = buildSldDxf(m, number, calcs);
  const blob = new Blob([dxf], { type: "application/dxf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ACTES-SLD-${number || m.title.ref || "diagram"}.dxf`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
