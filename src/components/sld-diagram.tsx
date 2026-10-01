import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Boxes, Download, Expand, FileDown, ImageDown, LineChart, Minus, Move, Network, Palette, Plus, Ruler, RotateCcw, Shrink, ShoppingCart, Waves, X } from "lucide-react";
import { buildSld, type SldModel } from "@/lib/sld-engine";
import { cableCalcs, defaultLengthOf, inspectorItems, type CableCalc, type CableLengths } from "@/lib/sld-annotations";
import { downloadSldSheet } from "@/lib/sld-pdf";
import { downloadSldDxf } from "@/lib/sld-dxf";
import { mpptMap } from "@/lib/sld-mppt";
import { EquipArt, PvRealSymbol, type EquipKind } from "@/components/sld-equipment";
import logoAsset from "@/assets/actes-logo-sld.png.asset.json";


/**
 * ألوان الرسم الكهربائي القياسية (IEC): ليست ألوان واجهة بل دلالات هندسية
 * ثابتة على الورق وعلى الشاشة (DC / AC / Earth / Comm).
 */
const C = {
  dc: "var(--sld-dc)",
  dcN: "var(--sld-dcn)",
  ac: "var(--sld-ac)",
  earth: "var(--sld-earth)",
  comm: "var(--sld-comm)",
  ink: "var(--sld-ink)",
  frame: "var(--sld-frame)",
  soft: "var(--sld-soft)",
  fill: "var(--sld-fill)",
  band: "var(--sld-band)",
  brand: "var(--sld-brand)",
};

/** لوحان لونيان: الورقي القياسي للطباعة، والهندسي الأزرق للشاشة. */
const THEMES = {
  paper: {
    "--sld-dc": "#b4231f",
    "--sld-dcn": "#1b1b1b",
    "--sld-ac": "#0f3f9e",
    "--sld-earth": "#1a8a2a",
    "--sld-comm": "#7a3bbf",
    "--sld-ink": "#111111",
    "--sld-frame": "#111111",
    "--sld-soft": "#6b7280",
    "--sld-fill": "#ffffff",
    "--sld-band": "#eef2f7",
    "--sld-brand": "#e2231a",
  },
  blueprint: {
    "--sld-dc": "#ff9a93",
    "--sld-dcn": "#dbe7ff",
    "--sld-ac": "#8ec0ff",
    "--sld-earth": "#7ce58e",
    "--sld-comm": "#d0a6ff",
    "--sld-ink": "#eaf2ff",
    "--sld-frame": "#9fc4ff",
    "--sld-soft": "#a7bfdd",
    "--sld-fill": "#0b2545",
    "--sld-band": "#14355f",
    "--sld-brand": "#ff8078",
  },
} as const;

export type SldTheme = keyof typeof THEMES;

const F = "'Segoe UI', 'Tahoma', sans-serif";

type SldActions = { onBackToQuote: () => void; onBuy: () => void; onStudy?: (() => void) | undefined };
type Props = { params: Record<string, unknown> | null; number?: string | undefined; actions?: SldActions | undefined };

/** نقطة توصيل عقدية ممتلئة كما في مخططات CAD. */
function Node({ x, y, color }: { x: number; y: number; color: string }) {
  return <circle cx={x} cy={y} r={3} fill={color} />;
}

/** علامة قطبية التيار المستمر (+ / −). */
function Polarity({ x, y, sign }: { x: number; y: number; sign: "+" | "−" }) {
  return (
    <text x={x} y={y} textAnchor="middle" fontFamily={F} fontSize={11} fontWeight={700} fill={sign === "+" ? C.dc : C.dcN}>
      {sign}
    </text>
  );
}

/** علامة عدد موصلات التيار المتردد على الخط (IEC). */
function PhaseMark({ x, y, phase3 }: { x: number; y: number; phase3: boolean }) {
  const n = phase3 ? 4 : 2;
  return (
    <g>
      {Array.from({ length: n }).map((_, i) => (
        <line key={i} x1={x + i * 4 - 6} y1={y + 5} x2={x + i * 4 - 1} y2={y - 5} stroke={C.ac} strokeWidth={1.2} />
      ))}
      <text x={x + 2} y={y - 9} textAnchor="middle" fontFamily={F} fontSize={7} fill={C.ac}>
        {phase3 ? "L1 L2 L3 N" : "L N"}
      </text>
    </g>
  );
}



/** رمز لوح شمسي قياسي، أو لوح واقعي بخلايا نصف مقطوعة في وضع العرض الواقعي. */
function PvSymbol({ x, y, w, h, real }: { x: number; y: number; w: number; h: number; real?: boolean | undefined }) {
  if (real) return <PvRealSymbol x={x} y={y} w={w} h={h} />;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={C.fill} stroke={C.ink} strokeWidth={1.4} />
      <line x1={x} y1={y} x2={x + w} y2={y + h} stroke={C.ink} strokeWidth={1} />
      <line x1={x + w / 2} y1={y} x2={x + w / 2} y2={y + h} stroke={C.ink} strokeWidth={0.8} />
      <line x1={x} y1={y + h / 2} x2={x + w} y2={y + h / 2} stroke={C.ink} strokeWidth={0.8} />
    </g>
  );
}

/** رمز قاطع دائرة (Circuit Breaker). */
function BreakerSymbol({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <line x1={x} y1={y - 12} x2={x} y2={y - 5} stroke={C.ink} strokeWidth={1.4} />
      <line x1={x} y1={y - 5} x2={x + 9} y2={y + 8} stroke={C.ink} strokeWidth={1.6} />
      <line x1={x} y1={y + 6} x2={x} y2={y + 13} stroke={C.ink} strokeWidth={1.4} />
      <path d={`M ${x - 5} ${y + 6} l 10 0`} stroke={C.ink} strokeWidth={1.4} fill="none" />
    </g>
  );
}

/** رمز فيوز (Fuse). */
function FuseSymbol({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x - 4} y={y - 9} width={8} height={18} fill={C.fill} stroke={C.ink} strokeWidth={1.3} />
      <line x1={x} y1={y - 9} x2={x} y2={y + 9} stroke={C.ink} strokeWidth={1.1} />
    </g>
  );
}

/** رمز مانع صواعق (SPD). */
function SpdSymbol({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x - 6} y={y - 9} width={12} height={18} fill={C.fill} stroke={C.ink} strokeWidth={1.3} />
      <path d={`M ${x - 3} ${y - 5} l 5 5 l -5 5`} stroke={C.ink} strokeWidth={1.3} fill="none" />
      <line x1={x} y1={y + 9} x2={x} y2={y + 15} stroke={C.earth} strokeWidth={1.3} />
    </g>
  );
}

/** رمز بطارية (خلايا متعددة). */
function BatterySymbol({ x, y }: { x: number; y: number }) {
  return (
    <g>
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <line x1={x + i * 12} y1={y - 11} x2={x + i * 12} y2={y + 11} stroke={C.ink} strokeWidth={2} />
          <line x1={x + i * 12 + 6} y1={y - 6} x2={x + i * 12 + 6} y2={y + 6} stroke={C.ink} strokeWidth={1.2} />
        </g>
      ))}
    </g>
  );
}

/** رمز تأريض قياسي. */
function EarthSymbol({ x, y }: { x: number; y: number }) {
  return (
    <g stroke={C.earth} strokeWidth={1.8}>
      <line x1={x - 13} y1={y} x2={x + 13} y2={y} />
      <line x1={x - 8} y1={y + 5} x2={x + 8} y2={y + 5} />
      <line x1={x - 4} y1={y + 10} x2={x + 4} y2={y + 10} />
    </g>
  );
}

/** رمز عداد ذكي / محول تيار (IEC) عند نقطة الربط بالشبكة. */
function MeterSymbol({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={11} fill={C.fill} stroke={C.ac} strokeWidth={1.5} />
      <text x={x} y={y + 3.4} textAnchor="middle" fontFamily={F} fontSize={7.4} fontWeight={700} fill={C.ac}>
        kWh
      </text>
      <path d={`M ${x - 16} ${y + 15} a 16 12 0 0 1 32 0`} fill="none" stroke={C.ac} strokeWidth={1.1} />
    </g>
  );
}

/** صندوق مكوّن هندسي بعنوان وأسطر مواصفات، قابل للنقر لإظهار بطاقة فحصه. */
function Block({
  x, y, w, h, title, lines, accent, id, pick, active, art, real,
}: {
  x: number; y: number; w: number; h: number; title: string; lines: string[]; accent: string;
  id?: string | undefined; pick?: ((id: string) => void) | undefined; active?: boolean | undefined;
  /** نوع المجسم الواقعي المقابل لهذا المكوّن. */
  art?: EquipKind | undefined;
  /** تشغيل العرض الواقعي بدل الصندوق القياسي. */
  real?: boolean | undefined;
}) {
  const clickable = Boolean(id && pick);
  const showArt = Boolean(real && art);
  return (
    <g
      style={clickable ? { cursor: "pointer" } : undefined}
      onClick={clickable ? () => pick!(id!) : undefined}
    >
      <rect x={x} y={y} width={w} height={h} fill={C.fill} stroke={active ? accent : C.frame} strokeWidth={active ? 2.8 : 1.6} />
      {showArt && <EquipArt kind={art!} x={x} y={y + 16} w={w} h={h - 16} accent={accent} />}
      <rect x={x} y={y} width={w} height={16} fill={C.band} stroke={C.frame} strokeWidth={1.2} />
      <rect x={x} y={y} width={3} height={h} fill={accent} />
      <text x={x + w / 2} y={y + 12} textAnchor="middle" fontFamily={F} fontSize={9.5} fontWeight={700} fill={C.ink}>
        {title}
      </text>
      {showArt && lines.length > 0 && (
        <rect x={x + 3} y={y + 19} width={w - 6} height={lines.length * 12 + 4} fill={C.fill} opacity={0.82} />
      )}
      {lines.map((l, i) => (
        <text key={i} x={x + 6} y={y + 30 + i * 12} fontFamily={F} fontSize={8.6} fill={C.ink}>
          {l}
        </text>
      ))}
      {clickable && (
        <text x={x + w - 6} y={y + h - 6} textAnchor="end" fontFamily={F} fontSize={7} fill={C.soft}>
          ⓘ
        </text>
      )}
    </g>
  );
}




/** نص تسمية كابل على المسار. */
function WireTag({ x, y, text: label, color }: { x: number; y: number; text: string; color: string }) {
  return (
    <text x={x} y={y} textAnchor="middle" fontFamily={F} fontSize={8} fontWeight={700} fill={color}>
      {label}
    </text>
  );
}

/** رمز مفتاح عزل ميكانيكي (DC Rotary Isolator) للفصل اليدوي أثناء الصيانة. */
function IsolatorSymbol({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g>
      <line x1={x} y1={y - 13} x2={x} y2={y - 6} stroke={color} strokeWidth={1.4} />
      <line x1={x} y1={y - 6} x2={x + 10} y2={y + 7} stroke={color} strokeWidth={1.6} />
      <line x1={x} y1={y + 7} x2={x} y2={y + 14} stroke={color} strokeWidth={1.4} />
      <circle cx={x} cy={y - 6} r={1.8} fill={color} />
      <circle cx={x} cy={y + 7} r={1.8} fill={color} />
      <text x={x + 13} y={y + 2} fontFamily={F} fontSize={6.6} fontWeight={700} fill={color}>ISO</text>
    </g>
  );
}

/** رمز قاطع تسريب أرضي من النوع B (RCD Type B) الإلزامي للإنفرترات. */
function RcdSymbol({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g>
      <rect x={x - 9} y={y - 10} width={18} height={20} fill={C.fill} stroke={color} strokeWidth={1.3} />
      <circle cx={x} cy={y - 2} r={4.6} fill="none" stroke={color} strokeWidth={1.2} />
      <line x1={x - 6} y1={y + 6} x2={x + 6} y2={y + 6} stroke={color} strokeWidth={1.2} />
      <text x={x} y={y + 18} textAnchor="middle" fontFamily={F} fontSize={6.4} fontWeight={700} fill={color}>RCD-B</text>
    </g>
  );
}

export type SldFlow = "none" | "day" | "night" | "outage";

/** يرسم المخطط الأحادي الكامل داخل عنصر SVG واحد. */
export function SldSvg({
  m, fit = false, theme = "paper", pick, active, calcs, flow = "none", anim = true, real = false,
}: {
  m: SldModel;
  fit?: boolean;
  theme?: SldTheme;
  pick?: ((id: string) => void) | undefined;
  active?: string | null | undefined;
  calcs?: CableCalc[] | undefined;
  flow?: SldFlow;
  /** تشغيل محاكاة تدفق الطاقة المتحركة على المسارات العاملة. */
  anim?: boolean;
  /** عرض المعدات بمجسماتها الواقعية بدل الرموز القياسية. */
  real?: boolean;
}) {
  const W = 1240;
  const drawnStrings = Math.min(m.pv?.strings || 1, 4);
  const pvTop = 52;
  const rowH = 44;
  const pvH = drawnStrings * rowH;
  const busY = pvTop + pvH / 2;

  const pv = m.pv;
  const dc = m.dcBox;
  const inv = m.inverter;
  const bat = m.battery;
  const ac = m.acBox;

  // تعدد الإنفرترات: يُرسم كل إنفرتر كوحدة مستقلة بمداخل MPPT خاصة به.
  const invCount = Math.max(1, Math.floor(inv?.qty || 1));
  const drawnInv = Math.min(invCount, 4);
  const multiInv = drawnInv > 1;
  const invUnitH = multiInv ? 84 : 92;
  const invGap = 22;
  const stackH = drawnInv * invUnitH + (drawnInv - 1) * invGap;

  const invY = busY - stackH / 2;
  const invH = stackH;

  const batY = Math.max(busY + 150, invY + stackH + 86);
  const bottom = Math.max(busY + 120, batY + 70, invY + stackH + 40);
  const earthY = bottom + 64;
  const H = earthY + 64;
  const mppt = mpptMap(m);
  const mpptByInv = mpptMapByInverter(m);
  /** البطاريات عالية الجهد تُرسم خزانة برجية، والمنخفضة وحدة جدارية. */
  const batArt: EquipKind = (m.battery?.vdc || 0) >= 96 ? "battery-rack" : "battery-wall";


  const xPv = 24;
  const wPv = 180;
  const xDc = 250;
  const wDc = 132;
  const xInv = 430;
  const wInv = 168;
  const xAc = 650;
  const wAc = 140;
  const xAts = 840;
  const wAts = 128;
  const xOut = 1016;
  const wOut = 200;

  const phase3 = Boolean(inv?.phase3 || ac?.phase3);

  const drop = (tag: string) => {
    const c = calcs?.find((x) => x.tag === tag);
    return c && c.dropPct !== null ? ` — ${c.dropPct}%` : "";
  };

  // سيناريوهات تدفق الطاقة: تُبرز المسار العامل وتُخفت المسار المعزول.
  const opPv = flow === "night" ? 0.2 : 1;
  const opGrid = flow === "outage" ? 0.16 : flow === "day" ? 0.5 : 1;
  const opBat = flow === "day" ? 0.85 : 1;
  const opEps = flow === "outage" || flow === "night" ? 1 : 0.9;
  const wEps = flow === "outage" || flow === "night" ? 3.6 : 2;
  const flowNote =
    flow === "day"
      ? "MODE: DAY — PV → LOADS + BATTERY CHARGE"
      : flow === "night"
        ? "MODE: NIGHT — BATTERY → CRITICAL LOADS"
        : flow === "outage"
          ? "MODE: GRID OUTAGE — ANTI-ISLANDING OPEN, EPS FEEDS CRITICAL LOADS"
          : "";

  // نقطة مخرج الألواح / مدخل الإنفرتر بحسب وجود لوحة الـ DC
  const dcOutX = dc ? xDc + wDc : xPv + wPv;
  const dcY = busY;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      {...(fit ? { height: "100%", preserveAspectRatio: "xMidYMid meet" } : {})}
      role="img"
      aria-label="Single Line Diagram"
      style={{ ...THEMES[theme], background: C.fill, ...(fit ? { display: "block" } : {}) } as React.CSSProperties}
    >
      <defs>
        <marker id="sld-arrow" markerWidth={8} markerHeight={8} refX={7} refY={4} orient="auto">
          <path d="M0,0 L8,4 L0,8 z" fill={C.ac} />
        </marker>
        <style>{`
          @keyframes sldFlowDash { to { stroke-dashoffset: -24; } }
          .sldFlow, .sldFlowR {
            fill: none;
            stroke-width: 4;
            stroke-linecap: round;
            stroke-dasharray: 13 11;
            opacity: 0.95;
            animation: sldFlowDash 0.85s linear infinite;
          }
          .sldFlowR { animation-direction: reverse; }
          @media (prefers-reduced-motion: reduce) { .sldFlow, .sldFlowR { animation: none; } }
        `}</style>
      </defs>

      {flowNote && (
        <g>
          <rect x={W - 470} y={8} width={462} height={20} fill={C.band} stroke={C.frame} strokeWidth={1} />
          <text x={W - 239} y={22} textAnchor="middle" fontFamily={F} fontSize={9} fontWeight={700} fill={C.ink}>
            {flowNote}
          </text>
        </g>
      )}


      {/* ── جانب التيار المستمر: سلاسل الألواح ───────────────────────────── */}
      {pv && (
        <g
          opacity={opPv}
          style={pick ? { cursor: "pointer" } : undefined}
          onClick={pick ? () => pick("pv") : undefined}
        >
          <text x={xPv} y={pvTop - 14} fontFamily={F} fontSize={10} fontWeight={700} fill={C.dc}>
            DC SIDE — PV ARRAY {pv.kwp ? `${pv.kwp.toFixed(2)} kWp` : ""}
          </text>
          {active === "pv" && (
            <rect x={xPv - 8} y={pvTop - 8} width={wPv + 14} height={pvH + 40} fill="none" stroke={C.dc} strokeWidth={2.4} strokeDasharray="6 4" />
          )}
          {Array.from({ length: drawnStrings }).map((_, i) => {
            const y = pvTop + i * rowH + 8;
            return (
              <g key={i}>
                {[0, 1, 2].map((k) => (
                  <PvSymbol key={k} x={xPv + k * 30} y={y} w={26} h={22} real={real} />
                ))}
                <text x={xPv + 92} y={y + 6} fontFamily={F} fontSize={8.4} fill={C.ink}>
                  {`String ${i + 1} — ${pv.perString} × ${pv.wp} Wp`}
                </text>
                <line x1={xPv + 90} y1={y + 11} x2={dc ? xDc : xInv} y2={y + 11} stroke={C.dc} strokeWidth={1.5} />
                <Polarity x={xPv + 100} y={y + 8} sign="+" />
                <Polarity x={xPv + 114} y={y + 8} sign="−" />
                <Node x={dc ? xDc : xInv} y={y + 11} color={C.dc} />
                {pv.strings > drawnStrings && i === drawnStrings - 1 && (
                  <text x={xPv} y={y + 34} fontFamily={F} fontSize={8.4} fontStyle="italic" fill={C.soft}>
                    {`typical — total ${pv.strings} strings × ${pv.perString} modules (${pv.qty} modules)`}
                  </text>
                )}
              </g>
            );
          })}
          <text x={xPv} y={pvTop + pvH + 24} fontFamily={F} fontSize={8.4} fill={C.soft}>
            {`${pv.model}${pv.strVoc ? ` — Voc/string ${Math.round(pv.strVoc)} V` : ""}${pv.strVmp ? ` / Vmp ${Math.round(pv.strVmp)} V` : ""}`}
          </text>
        </g>
      )}


      {/* ── لوحة حماية الـ DC (فقط إذا كانت ضمن الأصناف) ──────────────────── */}
      {dc && (
        <>
          <Block
            x={xDc}
            y={pvTop}
            w={wDc}
            h={Math.max(pvH + 8, 74)}
            title="DC PROTECTION BOARD"
            lines={[`${dc.ways} Way — IP65 UV`, `Fuse gPV ${dc.fuseA} A / 1000 V DC`, "DC Isolator (load break)", "Icu 10 kA", dc.hasSpd ? "DC SPD Type 2" : ""].filter(Boolean)}
            accent={C.dc}
            id="dc"
            pick={pick}
            active={active === "dc"}
            art="board-dc" real={real}
          />
          {Array.from({ length: drawnStrings }).map((_, i) => (
            <FuseSymbol key={i} x={xDc + wDc - 20} y={pvTop + i * rowH + 19} />
          ))}
          <SpdSymbol x={xDc + 22} y={pvTop + Math.max(pvH + 8, 74) + 12} />
          <IsolatorSymbol x={xDc + wDc + 22} y={dcY - 34} color={C.dc} />
          {/* توزيع السلاسل على مداخل الـ MPPT: كل مدخل بخطه وتياره وفيوزه */}
          {!multiInv && mppt.map((grp, i) => {
            const n = mppt.length;
            const y = n === 1 ? dcY : dcY - 14 + (i * 28) / (n - 1);
            return (
              <g key={grp.index}>
                <line x1={xDc + wDc} y1={y} x2={xInv} y2={y} stroke={C.dc} strokeWidth={2} />
                <Node x={xDc + wDc} y={y} color={C.dc} />
                <Node x={xInv} y={y} color={C.dc} />
                <text x={xInv - 8} y={y - 4} textAnchor="end" fontFamily={F} fontSize={7} fontWeight={700} fill={C.dc}>
                  {`MPPT ${grp.index} — ${grp.strings.length} STR (S${grp.strings.join(", S")})`}
                </text>
                <text x={xInv - 8} y={y + 9} textAnchor="end" fontFamily={F} fontSize={6.4} fill={C.soft}>
                  {`${grp.imp ? `Imp ${grp.imp} A` : ""}${grp.imp && grp.vmp ? " / " : ""}${grp.vmp ? `Vmp ${grp.vmp} V` : ""}`}
                </text>
              </g>
            );
          })}

        </>
      )}
      {!dc && pv && inv && <line x1={xPv + wPv} y1={dcY} x2={xInv} y2={dcY} stroke={C.dc} strokeWidth={2} />}
      {m.cables[0] && (
        <WireTag
          x={(dcOutX + xInv) / 2}
          y={dcY - 6}
          text={`${m.cables.find((c) => /MPPT/.test(c.route))?.tag || "W1"}${drop("W2") || drop("W1")}`}
          color={C.dc}
        />
      )}
      {pv && inv && (
        <>
          <Polarity x={(dcOutX + xInv) / 2 - 12} y={dcY + 14} sign="+" />
          <Polarity x={(dcOutX + xInv) / 2 + 12} y={dcY + 14} sign="−" />
        </>
      )}


      {/* ── الإنفرتر ─────────────────────────────────────────────────────── */}
      {inv && (
        <>
          <Block
            x={xInv}
            y={invY}
            w={wInv}
            h={invH}
            title={inv.phase3 ? "PV INVERTER — 3PH" : "PV INVERTER — 1PH"}
            lines={[
              `${inv.qty} × ${inv.kw} kW = ${inv.totalKw} kW`,
              inv.mppt ? `MPPT inputs: ${inv.mppt}` : "",
              inv.mpptRange ? `MPPT: ${inv.mpptRange}` : "",
              inv.vbat ? `BAT port: ${inv.vbat} V DC` : "",
            ].filter(Boolean)}
            accent={C.ac}
            id="inv"
            pick={pick}
            active={active === "inv"}
            art="inverter" real={real}
          />

          <text x={xInv + wInv / 2} y={invY + invH + 12} textAnchor="middle" fontFamily={F} fontSize={8.2} fill={C.soft}>
            {inv.model}
          </text>
          <text x={xInv - 6} y={dcY + 32} textAnchor="end" fontFamily={F} fontSize={7.6} fill={C.dc}>DC IN</text>
          <text x={xInv + wInv + 6} y={dcY - 18} fontFamily={F} fontSize={7.6} fill={C.ac}>GRID OUT</text>
          {bat && (
            <text x={xInv + wInv + 6} y={dcY + 40} fontFamily={F} fontSize={7.6} fill={C.ac}>EPS / BACKUP</text>
          )}
          {pv?.strVoc && inv.mpptRange && (
            <text x={xInv + wInv / 2} y={invY - 8} textAnchor="middle" fontFamily={F} fontSize={7.6} fill={C.soft}>
              {`STRING CHECK: Voc ${Math.round(pv.strVoc)} V within ${inv.mpptRange}`}
            </text>
          )}

        </>
      )}

      {/* ── بنك البطاريات (فقط إذا كانت ضمن الأصناف) ──────────────────────── */}
      {bat && inv && (() => {
        const riser = xInv + wInv / 2;
        const boxX = xInv - 128;
        const bankX = xInv - 336;
        const bankW = 184;
        return (
          <g opacity={opBat}>
            <Block
              x={bankX}
              y={batY - 30}
              w={bankW}
              h={66}
              title="BATTERY BANK"
              lines={[
                `${bat.qty} × ${bat.kwh} kWh = ${bat.totalKwh} kWh`,
                bat.vdc ? `Nominal ${bat.vdc} V DC` : "",
                bat.current ? `Max current ≈ ${bat.current} A` : "",
              ].filter(Boolean)}
              accent={C.dc}
              id="bat"
              pick={pick}
              active={active === "bat"}
              art={batArt} real={real}
            />
            <BatterySymbol x={bankX + bankW + 14} y={batY} />
            <text x={bankX} y={batY + 50} fontFamily={F} fontSize={8} fill={C.soft}>{bat.model}</text>
            <line x1={bankX + bankW} y1={batY} x2={m.batBox ? boxX : riser} y2={batY} stroke={C.dc} strokeWidth={2} />
            <Polarity x={bankX + bankW + 24} y={batY - 14} sign="+" />
            <Polarity x={bankX + bankW + 24} y={batY + 26} sign="−" />
            {m.batBox ? (
              <>
                <Block x={boxX} y={batY - 28} w={108} h={62} title="BATTERY BOX" lines={[m.batBox.rating, "Icu 10 kA"]} accent={C.dc} id="bat" pick={pick} active={active === "bat"} art="board-dc" real={real} />
                <BreakerSymbol x={boxX + 78} y={batY + 6} />
                <line x1={boxX + 108} y1={batY} x2={riser} y2={batY} stroke={C.dc} strokeWidth={2} />
              </>
            ) : (
              bat.breakerA && (
                <>
                  <BreakerSymbol x={boxX + 40} y={batY + 4} />
                  <text x={boxX + 50} y={batY + 26} fontFamily={F} fontSize={7.8} fill={C.ink}>{`DC ${bat.breakerA} A 2P — 10 kA`}</text>
                </>
              )
            )}
            <line x1={riser} y1={batY} x2={riser} y2={invY + invH} stroke={C.dc} strokeWidth={2} />
            <Node x={riser} y={batY} color={C.dc} />
            <Node x={riser} y={invY + invH} color={C.dc} />
            <WireTag x={riser + 26} y={batY - 8} text={`${m.cables.find((c) => /BAT/.test(c.route))?.tag || "W3"}${drop("W3")}`} color={C.dc} />
            <text x={riser + 6} y={invY + invH + 26} fontFamily={F} fontSize={7.6} fill={C.dc}>BAT</text>
          </g>
        );
      })()}

      {/* ── لوحة حماية الـ AC ─────────────────────────────────────────────── */}
      {ac && inv && (
        <>
          <line x1={xInv + wInv} y1={dcY} x2={xAc} y2={dcY} stroke={C.ac} strokeWidth={2} />
          <WireTag x={(xInv + wInv + xAc) / 2} y={dcY - 6} text={`W4${drop("W4")}`} color={C.ac} />
          <PhaseMark x={(xInv + wInv + xAc) / 2} y={dcY} phase3={phase3} />
          <Node x={xAc} y={dcY} color={C.ac} />
          <Block
            x={xAc}
            y={invY - 6}
            w={wAc}
            h={invH + 12}
            title="AC PROTECTION BOARD"
            lines={[
              `Main ${ac.breakerA} A ${ac.phase3 ? "4P" : "2P"} — IP54`,
              ac.phase3 ? "L1 / L2 / L3 / N / PE" : "L / N / PE",
              `Icu ${ac.phase3 || ac.breakerA > 63 ? 15 : 6} kA`,
              `RCD Type B 30 mA ${ac.phase3 ? "4P" : "2P"}`,
              "AC SPD Type 2",
            ]}
            accent={C.ac}
            id="ac"
            pick={pick}
            active={active === "ac"}
            art="board-ac" real={real}
          />

          <BreakerSymbol x={xAc + wAc - 24} y={dcY} />
          <SpdSymbol x={xAc + 22} y={dcY + 26} />
          <RcdSymbol x={xAc + wAc - 24} y={dcY - 34} color={C.ac} />
        </>
      )}

      {/* ── مفتاح التحويل / المولد (فقط إذا كان ضمن الأصناف) ───────────────── */}
      {m.ats && ac && (
        <>
          <line x1={xAc + wAc} y1={dcY} x2={xAts} y2={dcY} stroke={C.ac} strokeWidth={2} />
          <Node x={xAts} y={dcY} color={C.ac} />
          <Block
            x={xAts}
            y={invY}
            w={wAts}
            h={invH}
            title="ATS CHANGEOVER"
            lines={["Grid / Generator", m.ats.kva ? `Generator ${m.ats.kva} kVA` : "MCCB 4P 175 A", phase3 ? "4 Pole" : "2 Pole"]}
            accent={C.ac}
            id="ats"
            pick={pick}
            active={active === "ats"}
            art="ats" real={real}
          />
        </>
      )}

      {/* ── الشبكة والأحمال ──────────────────────────────────────────────── */}
      {(() => {
        const from = m.ats && ac ? xAts + wAts : ac ? xAc + wAc : inv ? xInv + wInv : xAc;
        const backup = Boolean(bat && inv);
        const loadY = backup ? dcY + 86 : m.grid ? dcY + 34 : dcY;
        const mx = xOut - 62;
        return (
          <>
            {m.grid && (
              <g opacity={opGrid}>
                <Block
                  x={xOut}
                  y={dcY - 76}
                  w={wOut}
                  h={52}
                  title="UTILITY GRID"
                  lines={[m.title.phase]}
                  accent={C.ac}
                  id="grid"
                  pick={pick}
                  active={active === "grid"}
                  art="grid" real={real}
                />
                <line x1={from} y1={dcY} x2={xOut - 26} y2={dcY} stroke={C.ac} strokeWidth={2} />
                <line x1={xOut - 26} y1={dcY} x2={xOut - 26} y2={dcY - 50} stroke={C.ac} strokeWidth={2} />
                <line x1={xOut - 26} y1={dcY - 50} x2={xOut} y2={dcY - 50} stroke={C.ac} strokeWidth={2} markerEnd="url(#sld-arrow)" />
                <Node x={xOut - 26} y={dcY} color={C.ac} />
                <PhaseMark x={(from + xOut) / 2 - 30} y={dcY} phase3={phase3} />
                <WireTag x={(from + xOut) / 2 - 56} y={dcY - 6} text={`W5${drop("W5")}`} color={C.ac} />
                {m.meter && (
                  <g style={pick ? { cursor: "pointer" } : undefined} onClick={pick ? () => pick("meter") : undefined}>
                    <MeterSymbol x={mx} y={dcY} />
                    <text x={mx} y={dcY - 18} textAnchor="middle" fontFamily={F} fontSize={7.4} fontWeight={700} fill={C.ac}>
                      SMART METER
                    </text>
                    <text x={mx} y={dcY + 32} textAnchor="middle" fontFamily={F} fontSize={7} fill={C.soft}>
                      {m.meter.ct}
                    </text>
                  </g>
                )}
                {flow === "outage" && (
                  <text x={(from + xOut) / 2 - 56} y={dcY + 16} textAnchor="middle" fontFamily={F} fontSize={7.6} fontWeight={700} fill={C.dc}>
                    GRID OPEN — ANTI-ISLANDING
                  </text>
                )}
              </g>
            )}
            <Block
              x={xOut}
              y={loadY - 26}
              w={wOut}
              h={56}
              title={backup ? "CRITICAL / BACKUP LOADS" : "SITE LOADS"}
              lines={[m.title.phase]}
              accent={C.ac}
              id={backup ? "backup" : "loads"}
              pick={pick}
              active={active === (backup ? "backup" : "loads")}
              art="loads" real={real}
            />
            {backup ? (
              <g opacity={opEps}>
                <line x1={xInv + wInv} y1={dcY + 30} x2={xInv + wInv + 18} y2={dcY + 30} stroke={C.ac} strokeWidth={wEps} />
                <line x1={xInv + wInv + 18} y1={dcY + 30} x2={xInv + wInv + 18} y2={loadY} stroke={C.ac} strokeWidth={wEps} />
                <line x1={xInv + wInv + 18} y1={loadY} x2={xOut} y2={loadY} stroke={C.ac} strokeWidth={wEps} markerEnd="url(#sld-arrow)" />
                <Node x={xInv + wInv} y={dcY + 30} color={C.ac} />
                <PhaseMark x={(xInv + wInv + xOut) / 2 + 40} y={loadY} phase3={phase3} />
                <WireTag x={(xInv + wInv + xOut) / 2 - 40} y={loadY - 6} text={`W6 — EPS BACKUP${drop("W6")}`} color={C.ac} />
              </g>
            ) : (
              <>
                <line x1={from} y1={dcY} x2={xOut - 26} y2={dcY} stroke={C.ac} strokeWidth={2} />
                <line x1={xOut - 26} y1={dcY} x2={xOut - 26} y2={loadY} stroke={C.ac} strokeWidth={2} />
                <line x1={xOut - 26} y1={loadY} x2={xOut} y2={loadY} stroke={C.ac} strokeWidth={2} markerEnd="url(#sld-arrow)" />
                <Node x={xOut - 26} y={dcY} color={C.ac} />
                <PhaseMark x={(from + xOut) / 2 + 26} y={dcY} phase3={phase3} />
                <WireTag x={(from + xOut) / 2} y={dcY - 6} text={`W5${drop("W5")}`} color={C.ac} />
              </>
            )}
          </>
        );
      })()}

      {/* ── خطوط الاتصالات (BMS / العداد الذكي) ───────────────────────────── */}
      {(m.bms || m.meter) && inv && (() => {
        const commY = earthY - 32;
        const riser = xInv + wInv - 28;
        return (
          <g>
            <line x1={riser} y1={dcY + 46} x2={riser} y2={commY} stroke={C.comm} strokeWidth={1.6} strokeDasharray="6 4" />
            <Node x={riser} y={dcY + 46} color={C.comm} />
            <text x={riser + 6} y={dcY + 60} fontFamily={F} fontSize={7.4} fill={C.comm}>COMM</text>
            {m.bms && bat && (() => {
              const bx = xInv - 336 + 92;
              return (
                <g style={pick ? { cursor: "pointer" } : undefined} onClick={pick ? () => pick("bms") : undefined}>
                  <line x1={bx} y1={batY + 36} x2={bx} y2={commY} stroke={C.comm} strokeWidth={1.6} strokeDasharray="6 4" />
                  <line x1={bx} y1={commY} x2={riser} y2={commY} stroke={C.comm} strokeWidth={1.6} strokeDasharray="6 4" />
                  <Node x={bx} y={commY} color={C.comm} />
                  <WireTag x={(bx + riser) / 2} y={commY - 6} text="C1 — BMS CAN / RS485 (shielded)" color={C.comm} />
                </g>
              );
            })()}
            {m.meter && m.grid && (
              <g style={pick ? { cursor: "pointer" } : undefined} onClick={pick ? () => pick("meter") : undefined}>
                <line x1={xOut - 62} y1={dcY + 12} x2={xOut - 62} y2={commY + 16} stroke={C.comm} strokeWidth={1.6} strokeDasharray="6 4" />
                <line x1={xOut - 62} y1={commY + 16} x2={riser} y2={commY + 16} stroke={C.comm} strokeWidth={1.6} strokeDasharray="6 4" />
                <Node x={riser} y={commY + 16} color={C.comm} />
                <WireTag x={(xOut - 62 + riser) / 2} y={commY + 11} text="C2 — METER RS485 (Modbus)" color={C.comm} />
              </g>
            )}
          </g>
        );
      })()}

      {/* ── محاكاة تدفق الطاقة المتحرك على المسارات العاملة ───────────────── */}
      {anim && flow !== "none" && (() => {
        const riser = xInv + wInv / 2;
        const backup = Boolean(bat && inv);
        const loadY = backup ? dcY + 86 : m.grid ? dcY + 34 : dcY;
        const pvOn = flow === "day" && Boolean(pv && inv);
        const gridOn = Boolean(m.grid && ac && flow !== "outage");
        const batOn = Boolean(bat && inv);
        const charging = flow === "day";
        return (
          <g pointerEvents="none">
            {pvOn && (
              <>
                <path d={`M ${xPv + 90} ${busY} L ${dc ? xDc : xInv} ${busY}`} className="sldFlow" stroke={C.dc} />
                <path d={`M ${dcOutX} ${dcY} L ${xInv} ${dcY}`} className="sldFlow" stroke={C.dc} />
              </>
            )}
            {batOn && (
              <path
                d={`M ${riser} ${batY} L ${riser} ${invY + invH}`}
                className={charging ? "sldFlowR" : "sldFlow"}
                stroke={C.dc}
              />
            )}
            {gridOn && (
              <path d={`M ${xInv + wInv} ${dcY} L ${xOut - 26} ${dcY}`} className="sldFlow" stroke={C.ac} />
            )}
            {backup && (
              <path
                d={`M ${xInv + wInv} ${dcY + 30} L ${xInv + wInv + 18} ${dcY + 30} L ${xInv + wInv + 18} ${loadY} L ${xOut} ${loadY}`}
                className="sldFlow"
                stroke={C.ac}
              />
            )}
            {!backup && ac && flow !== "outage" && (
              <path d={`M ${xInv + wInv} ${dcY} L ${xOut - 26} ${dcY} L ${xOut - 26} ${loadY} L ${xOut} ${loadY}`} className="sldFlow" stroke={C.ac} />
            )}
          </g>
        );
      })()}

      {/* ── شبكة التأريض الشاملة ومانعات الصواعق (IEC 60364-7-712) ───────── */}
      {(() => {
        const bonds: { x: number; label: string }[] = [
          { x: xPv + 60, label: "ARRAY FRAMES 6 mm²" },
          ...(dc ? [{ x: xDc + wDc / 2, label: "DC BOARD + SPD" }] : []),
          ...(bat ? [{ x: xInv - 244, label: "BATTERY RACK" }] : []),
          ...(inv ? [{ x: xInv + wInv / 2, label: "INVERTER CHASSIS" }] : []),
          ...(ac ? [{ x: xAc + wAc / 2, label: "AC BOARD + SPD" }] : []),
          ...(m.ats ? [{ x: xAts + wAts / 2, label: "ATS ENCLOSURE" }] : []),
          { x: xOut + 40, label: "LOADS PANEL PE" },
        ];
        const mebX = xInv + wInv / 2 - 86;
        const mebW = 172;
        return (
          <g style={pick ? { cursor: "pointer" } : undefined} onClick={pick ? () => pick("earth") : undefined}>
            <line
              x1={xPv}
              y1={earthY}
              x2={xOut + wOut}
              y2={earthY}
              stroke={C.earth}
              strokeWidth={active === "earth" ? 3.4 : 2.4}
            />
            {/* الترميز اللوني القياسي للتأريض: أخضر بخطوط صفراء متقطعة */}
            <line
              x1={xPv}
              y1={earthY}
              x2={xOut + wOut}
              y2={earthY}
              stroke="#f2c200"
              strokeWidth={active === "earth" ? 3.4 : 2.4}
              strokeDasharray="7 9"
            />
            {bonds.map((bnd) => (
              <g key={bnd.x}>
                <line x1={bnd.x} y1={earthY - 26} x2={bnd.x} y2={earthY} stroke={C.earth} strokeWidth={1.4} strokeDasharray="4 3" />
                <Node x={bnd.x} y={earthY} color={C.earth} />
                <text x={bnd.x} y={earthY + 13} textAnchor="middle" fontFamily={F} fontSize={6.6} fill={C.earth}>
                  {bnd.label}
                </text>
              </g>
            ))}

            {/* قضيب التأريض الرئيسي (Main Earth Bar) */}
            <rect x={mebX} y={earthY - 10} width={mebW} height={20} fill={C.fill} stroke={C.earth} strokeWidth={1.6} />
            <text x={mebX + mebW / 2} y={earthY + 4} textAnchor="middle" fontFamily={F} fontSize={7.6} fontWeight={700} fill={C.earth}>
              MAIN EARTH BAR (MEB) — Cu 25×3 mm
            </text>

            {/* مانعات الصواعق Type I+II على جانبي DC و AC */}
            {dc && (
              <g>
                <SpdSymbol x={xDc + wDc / 2 - 34} y={earthY - 44} />
                <line x1={xDc + wDc / 2 - 34} y1={earthY - 29} x2={xDc + wDc / 2 - 34} y2={earthY} stroke={C.earth} strokeWidth={1.4} />
                <Node x={xDc + wDc / 2 - 34} y={earthY} color={C.earth} />
                <text x={xDc + wDc / 2 - 34} y={earthY - 56} textAnchor="middle" fontFamily={F} fontSize={6.8} fontWeight={700} fill={C.earth}>
                  SPD TYPE I+II — DC
                </text>
              </g>
            )}
            {ac && (
              <g>
                <SpdSymbol x={xAc + wAc / 2 + 34} y={earthY - 44} />
                <line x1={xAc + wAc / 2 + 34} y1={earthY - 29} x2={xAc + wAc / 2 + 34} y2={earthY} stroke={C.earth} strokeWidth={1.4} />
                <Node x={xAc + wAc / 2 + 34} y={earthY} color={C.earth} />
                <text x={xAc + wAc / 2 + 34} y={earthY - 56} textAnchor="middle" fontFamily={F} fontSize={6.8} fontWeight={700} fill={C.earth}>
                  SPD TYPE I+II — AC
                </text>
              </g>
            )}

            {/* موصل هابط لمانعة الصواعق الخارجية (LPS) من هيكل الألواح */}
            {pv && (
              <g>
                <line x1={xPv + 18} y1={earthY - 40} x2={xPv + 18} y2={earthY} stroke={C.earth} strokeWidth={1.8} />
                <Node x={xPv + 18} y={earthY} color={C.earth} />
                <text x={xPv + 18} y={earthY - 46} textAnchor="middle" fontFamily={F} fontSize={6.8} fontWeight={700} fill={C.earth}>
                  LPS DOWN CONDUCTOR 50 mm²
                </text>
              </g>
            )}

            <EarthSymbol x={xOut + wOut - 40} y={earthY + 26} />
            <text x={xOut + wOut - 40} y={earthY + 52} textAnchor="middle" fontFamily={F} fontSize={8} fill={C.earth}>
              {m.earth ? "EARTHING PIT < 5 Ω" : "EARTH ELECTRODE < 5 Ω"}
            </text>
            <line x1={xOut + wOut - 40} y1={earthY} x2={xOut + wOut - 40} y2={earthY + 18} stroke={C.earth} strokeWidth={2} />
            <text x={xPv} y={earthY - 13} fontFamily={F} fontSize={8.4} fontWeight={700} fill={C.earth}>
              PE — MAIN EARTHING BUS 1×16 mm² (frames 1×6 mm²) — TN-S
            </text>
          </g>
        );
      })()}

    </svg>
  );
}

/** شاشة المخطط الأحادي الرسمي داخل التطبيق مع تكبير وتحريك وملء الشاشة. */
export default function SldDiagram({ params, number, actions }: Props) {
  const model = useMemo(() => buildSld(params), [params]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [full, setFull] = useState(false);
  /** محاكاة تدفق الطاقة المتحركة — قابلة للإيقاف. */
  const [anim, setAnim] = useState(true);
  const [real, setReal] = useState(false);
  const [theme, setTheme] = useState<SldTheme>("paper");
  const [picked, setPicked] = useState<string | null>(null);
  const [fitH, setFitH] = useState<number | null>(null);
  const [flow, setFlow] = useState<SldFlow>("none");
  const [saving, setSaving] = useState(false);
  /** أطوال الكابلات الفعلية التي يدخلها المهندس يدوياً — اختيارية بالكامل. */
  const [lengths, setLengths] = useState<CableLengths>({});
  const [lenOpen, setLenOpen] = useState(false);

  const [rot, setRot] = useState<{ on: boolean; w: number; h: number }>({ on: false, w: 0, h: 0 });
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const calcs: CableCalc[] = useMemo(() => (model ? cableCalcs(model, lengths) : []), [model, lengths]);
  const items = useMemo(() => (model ? inspectorItems(model, lengths) : {}), [model, lengths]);
  const mppt = useMemo(() => (model ? mpptMap(model) : []), [model]);


  /**
   * في ملء الشاشة على الهواتف الطولية يُدار الرسم العريض 90° ليملأ الشاشة كاملة
   * بدل ظهوره كشريط رقيق في الوسط.
   */
  useEffect(() => {
    const fitBox = () => {
      const box = boxRef.current;
      if (!box) return;
      const cw = box.clientWidth;
      const ch = box.clientHeight;
      if (!cw || !ch) return;
      const portrait = ch > cw * 1.15;
      const rotated = full && portrait;
      setRot(rotated ? { on: true, w: ch, h: cw } : { on: false, w: 0, h: 0 });
      // ملاءمة تلقائية: يضبط ارتفاع مساحة العرض على نسبة الرسم فيظهر كبيراً وكاملاً دون قطع.
      const svg = box.querySelector("svg");
      const vb = svg?.getAttribute("viewBox")?.split(/\s+/).map(Number);
      const vw = vb && vb.length === 4 ? (vb[2] as number) : 1240;
      const vh = vb && vb.length === 4 ? (vb[3] as number) : 520;
      if (!rotated && !full) {
        const ideal = Math.round((cw * vh) / vw) + 8;
        setFitH(Math.max(300, Math.min(Math.round(window.innerHeight * 0.72), ideal)));
      } else {
        setFitH(null);
      }
      setZoom(1);
      setPan({ x: 0, y: 0 });

    };
    const t = window.setTimeout(fitBox, 60);
    window.addEventListener("resize", fitBox);
    return () => { window.clearTimeout(t); window.removeEventListener("resize", fitBox); };
  }, [full, model]);


  if (!model) return null;

  const onDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    setPan({ x: d.px + (e.clientX - d.x), y: d.py + (e.clientY - d.y) });
  };
  const onUp = () => { drag.current = null; };

  /**
   * يحفظ المخطط صورة عالية الدقة (×3) جاهزة للطباعة والمشاركة الميدانية،
   * برسم نسخة من الـ SVG على لوحة نقطية مع خلفية النمط الحالي.
   */
  const saveImage = () => {
    const src = boxRef.current?.querySelector("svg");
    if (!src) return;
    setSaving(true);
    const bgColor = theme === "paper" ? "#ffffff" : "#0b2545";
    const clone = src.cloneNode(true) as SVGSVGElement;
    const vb = (clone.getAttribute("viewBox") || "0 0 1240 520").split(/\s+/).map(Number);
    const vw = vb[2] || 1240;
    const vh = vb[3] || 520;
    clone.setAttribute("width", String(vw));
    clone.setAttribute("height", String(vh));
    clone.removeAttribute("preserveAspectRatio");
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", "0");
    rect.setAttribute("y", "0");
    rect.setAttribute("width", String(vw));
    rect.setAttribute("height", String(vh));
    rect.setAttribute("fill", bgColor);
    clone.insertBefore(rect, clone.firstChild);
    const xml = new XMLSerializer().serializeToString(clone);
    const img = new Image();
    const scale = 3;
    const done = () => setSaving(false);
    img.onload = () => {
      const cv = document.createElement("canvas");
      cv.width = Math.round(vw * scale);
      cv.height = Math.round(vh * scale);
      const ctx = cv.getContext("2d");
      if (!ctx) return done();
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.drawImage(img, 0, 0, cv.width, cv.height);
      const a = document.createElement("a");
      a.href = cv.toDataURL("image/png");
      a.download = `ACTES-SLD-${number || model.title.ref || "diagram"}.png`;
      a.click();
      done();
    };
    img.onerror = done;
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
  };

  const FLOWS: { id: SldFlow; label: string }[] = [
    { id: "none", label: "المخطط الأساسي" },
    { id: "day", label: "وضع النهار" },
    { id: "night", label: "وضع الليل" },
    { id: "outage", label: "انقطاع الشبكة" },
  ];

  const flowBar = (
    <div className="flex flex-wrap items-center gap-1.5" dir="rtl">
      {FLOWS.map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => setFlow(f.id)}
          className={`rounded-full border px-3 py-1.5 text-[10.5px] font-black transition ${
            flow === f.id
              ? "border-brand bg-brand text-brand-foreground"
              : "border-border bg-card text-skyline hover:border-brand hover:text-brand"
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );

  const controls = (
    <div className="flex items-center gap-1.5">
      <button type="button" onClick={() => setZoom((z) => Math.min(8, +(z + 0.5).toFixed(2)))} aria-label="تكبير" className="grid size-9 place-items-center rounded-full border border-border bg-card text-skyline transition hover:border-brand hover:text-brand">
        <Plus className="size-4" />
      </button>
      <button type="button" onClick={() => setZoom((z) => Math.max(0.4, +(z - 0.5).toFixed(2)))} aria-label="تصغير" className="grid size-9 place-items-center rounded-full border border-border bg-card text-skyline transition hover:border-brand hover:text-brand">
        <Minus className="size-4" />
      </button>
      <button type="button" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} aria-label="إعادة الضبط" className="grid size-9 place-items-center rounded-full border border-border bg-card text-skyline transition hover:border-brand hover:text-brand">
        <RotateCcw className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => setTheme((t) => (t === "paper" ? "blueprint" : "paper"))}
        aria-label={theme === "paper" ? "نمط المخطط الأزرق" : "نمط الورق الأبيض"}
        className="grid size-9 place-items-center rounded-full border border-border bg-card text-skyline transition hover:border-brand hover:text-brand"
      >
        <Palette className="size-4" />
      </button>
      <button
        type="button"
        onClick={saveImage}
        disabled={saving}
        aria-label="حفظ المخطط صورة عالية الدقة"
        className="grid size-9 place-items-center rounded-full border border-border bg-card text-skyline transition hover:border-brand hover:text-brand disabled:opacity-50"
      >
        <ImageDown className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => downloadSldDxf(model, number, calcs)}
        aria-label="تصدير المخطط كملف أوتوكاد DXF"
        title="تصدير DXF لأوتوكاد"
        className="grid size-9 place-items-center rounded-full border border-border bg-card text-skyline transition hover:border-brand hover:text-brand"
      >
        <FileDown className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => setReal((v) => !v)}
        aria-label={real ? "عرض الرموز الهندسية القياسية" : "عرض مجسمات المعدات الواقعية"}
        title={real ? "الوضع القياسي IEC" : "العرض الواقعي للمعدات"}
        className={`grid size-9 place-items-center rounded-full border transition ${
          real ? "border-brand bg-brand text-brand-foreground" : "border-border bg-card text-skyline hover:border-brand hover:text-brand"
        }`}
      >
        <Boxes className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => setAnim((v) => !v)}
        aria-label={anim ? "إيقاف محاكاة تدفق الطاقة" : "تشغيل محاكاة تدفق الطاقة"}
        title={anim ? "إيقاف الحركة" : "تشغيل الحركة"}
        className={`grid size-9 place-items-center rounded-full border transition ${
          anim ? "border-brand bg-brand text-brand-foreground" : "border-border bg-card text-skyline hover:border-brand hover:text-brand"
        }`}
      >
        <Waves className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => { setFull((v) => !v); setPan({ x: 0, y: 0 }); }}
        aria-label={full ? "إنهاء ملء الشاشة" : "ملء الشاشة"}
        className="grid size-9 place-items-center rounded-full border border-border bg-card text-skyline transition hover:border-brand hover:text-brand"
      >
        {full ? <Shrink className="size-4" /> : <Expand className="size-4" />}
      </button>
    </div>
  );

  const inspected = picked ? items[picked] : undefined;

  const inspector = inspected && (
    <div className="absolute inset-x-2 bottom-2 z-10 max-h-[52%] overflow-y-auto rounded-lg border border-border bg-card/95 p-3 shadow-lg backdrop-blur" dir="rtl">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-black text-skyline">{inspected.title}</p>
          <p className="text-[10px] text-muted-foreground">{inspected.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => setPicked(null)}
          aria-label="إغلاق بطاقة المكوّن"
          className="grid size-7 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition hover:border-brand hover:text-brand"
        >
          <X className="size-3.5" />
        </button>
      </div>
      <div className="mt-2 grid gap-1 sm:grid-cols-2">
        {inspected.rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-2 rounded-md bg-muted/60 px-2.5 py-1">
            <span className="text-[10px] font-semibold text-muted-foreground">{label}</span>
            <span className="text-[10.5px] font-black" dir="ltr">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const canvas = (
    <div
      ref={boxRef}
      className={`relative overflow-hidden rounded-md border border-border touch-none ${full ? "h-[calc(100vh-6.5rem)]" : "min-h-[300px]"}`}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      style={{ cursor: "grab", background: theme === "paper" ? "#ffffff" : "#0b2545", ...(full || !fitH ? {} : { height: fitH }) }}

      dir="ltr"
    >
      <div
        className={rot.on ? "absolute" : "h-full w-full"}
        style={
          rot.on
            ? {
                width: rot.w,
                height: rot.h,
                left: "50%",
                top: "50%",
                transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) rotate(90deg) scale(${zoom})`,
                transformOrigin: "50% 50%",
              }
            : { transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "50% 50%" }
        }
      >
        <SldSvg m={model} fit theme={theme} pick={setPicked} active={picked} calcs={calcs} flow={flow} anim={anim} real={real} />
      </div>
      {inspector}
    </div>
  );


  if (full) {
    return (
      <div className="fixed inset-0 z-[70] flex flex-col gap-2 bg-background p-3">

        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate text-sm font-black">المخطط الكهربائي أحادي الخط (SLD)</h3>
          {controls}
        </div>
        {flowBar}
        {canvas}
      </div>
    );
  }

  return (
    <section className="mt-3 rounded-lg border border-border bg-card p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-md bg-secondary text-skyline">
            <Network className="size-4" />
          </span>
          <div>
            <h3 className="text-sm font-black">المخطط الكهربائي أحادي الخط (SLD)</h3>
            <p className="text-[10px] text-muted-foreground">
              {model.title.system}
              {number || model.title.ref ? ` — رقم المخطط: ${number || model.title.ref}` : ""}
            </p>
          </div>
        </div>
        {controls}
      </div>

      <div className="mt-3">{flowBar}</div>
      <div className="mt-2">{canvas}</div>
      <p className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground">
        <Move className="size-3" /> اسحب المخطط للتحريك، و + و − للتكبير، واضغط أي مكوّن لعرض مواصفاته، وزر الموجة لتشغيل/إيقاف حركة تدفق الطاقة، وزر الملف لتصدير DXF لأوتوكاد.
      </p>

      {mppt.length > 0 && (
        <div className="mt-3 rounded-md border border-border bg-muted/40 p-2.5" dir="rtl">
          <p className="text-[11px] font-black text-skyline">توزيع السلاسل على مداخل الـ MPPT</p>
          <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
            {mppt.map((grp) => (
              <div key={grp.index} className="flex items-center justify-between gap-2 rounded-md bg-card px-2.5 py-1.5">
                <span className="text-[10.5px] font-black text-skyline">{`مدخل MPPT ${grp.index}`}</span>
                <span className="text-[10px] font-bold text-muted-foreground" dir="ltr">
                  {`${grp.strings.length} string${grp.strings.length > 1 ? "s" : ""} (S${grp.strings.join(", S")})`}
                  {grp.imp ? ` — Imp ${grp.imp} A` : ""}
                  {grp.isc ? ` / fuse ≥ ${grp.isc} A` : ""}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-1.5 text-[9.5px] text-muted-foreground">
            التوزيع متوازن بين المداخل (فارق لا يتجاوز سلسلة واحدة) ويُراجع ميدانياً حسب اتجاه وميل كل صف ألواح.
          </p>
        </div>
      )}



      {/* كتلة بيانات اللوحة الرسمية */}
      <div className="mt-3 overflow-hidden rounded-md border border-border" dir="ltr">
        <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
          {[
            ["PROJECT", model.title.project],
            ["CLIENT", model.title.customer || "—"],
            ["LOCATION", model.title.city || "—"],
            ["SYSTEM", model.title.system],
            ["SUPPLY", model.title.phase],
            ["DRAWING No.", number || model.title.ref || "—"],
            ["DATE", model.title.date],
            ["DESIGNED BY", model.title.designer],
          ].map(([label, value]) => (
            <div key={label} className="bg-card px-2.5 py-1.5">
              <p className="text-[9px] font-bold text-muted-foreground">{label}</p>
              <p className="text-[10px] font-black break-words">{value}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/40 px-2.5 py-2">
          <img src={logoAsset.url} alt="ACTES" className="h-8 w-auto" />
          <p className="text-[9px] font-bold text-muted-foreground">ACTES ENERGY SYSTEMS &amp; SOLUTIONS — SINGLE LINE DIAGRAM — REV 01</p>
        </div>
      </div>

      {model.cables.length > 0 && (
        <>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2" dir="rtl">
            <h4 className="text-xs font-black text-skyline">جدول الكابلات والحسابات الكهربائية</h4>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setLenOpen((v) => !v)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10.5px] font-black transition ${
                  lenOpen ? "border-brand bg-brand text-brand-foreground" : "border-border bg-card text-skyline hover:border-brand hover:text-brand"
                }`}
              >
                <Ruler className="size-3.5" />
                {lenOpen ? "إنهاء تعديل الأطوال" : "تعديل أطوال الكابلات (اختياري)"}
              </button>
              {Object.keys(lengths).length > 0 && (
                <button
                  type="button"
                  onClick={() => setLengths({})}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[10.5px] font-black text-skyline transition hover:border-brand hover:text-brand"
                >
                  <RotateCcw className="size-3.5" /> استعادة الأطوال الافتراضية
                </button>
              )}
            </div>
          </div>
          <div className="mt-2 -mx-1 overflow-x-auto px-1" data-quote-scroll dir="ltr">
            <table className="w-full min-w-[620px] border-collapse text-[10.5px]">
              <thead>
                <tr className="bg-brand text-brand-foreground">
                  <th className="border border-border px-2 py-1.5 font-black">TAG</th>
                  <th className="border border-border px-2 py-1.5 font-black">ROUTE</th>
                  <th className="border border-border px-2 py-1.5 font-black">CABLE</th>
                  <th className="border border-border px-2 py-1.5 font-black">L (m)</th>
                  <th className="border border-border px-2 py-1.5 font-black">Vdrop</th>
                  <th className="border border-border px-2 py-1.5 font-black">Icu</th>
                </tr>
              </thead>
              <tbody>
                {calcs.map((c) => (
                  <tr key={c.tag + c.route} className="odd:bg-muted/40">
                    <td className="border border-border px-2 py-1 text-center font-black">{c.tag}</td>
                    <td className="border border-border px-2 py-1">{c.route}</td>
                    <td className="border border-border px-2 py-1">{c.spec}</td>
                    <td className="border border-border px-2 py-1 text-center">
                      {lenOpen ? (
                        <input
                          type="number"
                          min={1}
                          max={2000}
                          step={1}
                          inputMode="decimal"
                          aria-label={`الطول الفعلي للمسار ${c.tag}`}
                          value={lengths[c.tag] ?? ""}
                          placeholder={String(defaultLengthOf(c.tag))}
                          onChange={(e) => {
                            const v = e.target.value;
                            setLengths((prev) => {
                              const next = { ...prev };
                              const n = Number(v);
                              if (!v || !Number.isFinite(n) || n <= 0) delete next[c.tag];
                              else next[c.tag] = Math.min(2000, n);
                              return next;
                            });
                          }}
                          className="w-16 rounded-md border border-border bg-background px-1.5 py-1 text-center text-[10.5px] font-black outline-none focus:border-brand"
                        />
                      ) : (
                        <span className={c.custom ? "font-black text-skyline" : ""}>
                          {c.length}
                          {c.custom ? " *" : ""}
                        </span>
                      )}
                    </td>
                    <td className={`border border-border px-2 py-1 text-center font-black ${c.dropPct !== null && c.dropPct > 3 ? "text-brand" : "text-energy"}`}>
                      {c.dropPct !== null ? `${c.dropPct}%` : "—"}
                    </td>
                    <td className="border border-border px-2 py-1 text-center">{c.kA ? `${c.kA} kA` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-1 text-[9.5px] text-muted-foreground" dir="rtl">
            {Object.keys(lengths).length > 0
              ? "* أطوال مُدخلة من المسح الموقعي، وهبوط الجهد أُعيد حسابه عليها (نحاس 0.0175 Ω·mm²/م)؛ الحد المقبول 3%."
              : "هبوط الجهد محسوب على أطوال تصميمية نمطية (نحاس 0.0175 Ω·mm²/م) ويُراجع بعد المسح الموقعي؛ الحد المقبول 3%."}
          </p>
          {calcs.some((c) => c.dropPct !== null && c.dropPct > 3) && (
            <p className="mt-1 text-[9.5px] font-black text-brand" dir="rtl">
              تنبيه: مسار أو أكثر تجاوز هبوط الجهد المسموح 3% — يُنصح بزيادة مقطع الموصل أو تقصير المسار.
            </p>
          )}
        </>
      )}


      {model.bom.length > 0 && (
        <>
          <h4 className="mt-4 text-xs font-black text-skyline">أصناف المنظومة المرسومة</h4>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {model.bom.map((row) => (
              <div key={row.name} className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-3 py-1.5">
                <span className="text-[10px] font-semibold">{row.name}</span>
                <span className="shrink-0 text-[11px] font-black" dir="ltr">{row.qty} {row.unit}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {model.notes.length > 0 && (
        <ul className="mt-3 space-y-1" dir="ltr">
          {model.notes.map((n) => (
            <li key={n} className="text-[10px] text-muted-foreground">• {n}</li>
          ))}
        </ul>
      )}

      {actions ? (
        <div className="mt-5 grid gap-2 border-t border-border pt-4 sm:grid-cols-3">
          <button
            type="button"
            onClick={actions.onBackToQuote}
            className="flex items-center justify-center gap-2 rounded-full border border-border bg-card px-4 py-3 text-xs font-black text-navy transition hover:border-brand hover:text-brand"
          >
            <ArrowRight className="size-4" /> العودة إلى عرض السعر
          </button>
          <button
            type="button"
            onClick={actions.onBuy}
            className="flex items-center justify-center gap-2 rounded-full bg-energy px-4 py-3 text-xs font-black text-energy-foreground transition hover:opacity-90"
          >
            <ShoppingCart className="size-4" /> متابعة الشراء
          </button>
          {actions.onStudy && (
            <button
              type="button"
              onClick={actions.onStudy}
              className="flex items-center justify-center gap-2 rounded-full bg-skyline px-4 py-3 text-xs font-black text-skyline-foreground transition hover:opacity-90"
            >
              <LineChart className="size-4" /> الانتقال لدراسة PVsyst
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => downloadSldSheet(model, number, calcs)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-black text-brand-foreground shadow-md transition hover:opacity-90"
        >
          <Download className="size-4" />
          تحميل المخطط الرسمي
        </button>
      )}

    </section>
  );
}
