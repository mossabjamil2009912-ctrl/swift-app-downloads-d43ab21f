/**
 * رسومات متجهة واقعية لمجسمات معدات المنظومة الشمسية (إنفرتر، بطاريات، لوحات،
 * مفتاح تحويل، شبكة، أحمال) تُستخدم في وضع «العرض الواقعي» من المخطط الكهربائي.
 * كل الرسوم بالألوان الدلالية نفسها (CSS vars) فتعمل على نمط الورق والنمط الأزرق.
 */

const C = {
  dc: "var(--sld-dc)",
  ac: "var(--sld-ac)",
  earth: "var(--sld-earth)",
  ink: "var(--sld-ink)",
  frame: "var(--sld-frame)",
  soft: "var(--sld-soft)",
  fill: "var(--sld-fill)",
  band: "var(--sld-band)",
};

const F = "'Segoe UI', 'Tahoma', sans-serif";

export type EquipKind =
  | "inverter"
  | "battery-rack"
  | "battery-wall"
  | "board-dc"
  | "board-ac"
  | "ats"
  | "grid"
  | "loads";

type Box = { x: number; y: number; w: number; h: number; accent: string };

/** زعانف تبريد جانبية كما في شاسيه الإنفرترات المعدنية. */
function Fins({ x, y, h, n, w = 8 }: { x: number; y: number; h: number; n: number; w?: number }) {
  const gap = h / n;
  return (
    <g>
      {Array.from({ length: n }).map((_, i) => (
        <line
          key={i}
          x1={x}
          y1={y + gap * (i + 0.5)}
          x2={x + w}
          y2={y + gap * (i + 0.5)}
          stroke={C.soft}
          strokeWidth={1.1}
          opacity={0.75}
        />
      ))}
    </g>
  );
}

/** فتحات دخول الكابلات أسفل الجهاز. */
function Glands({ x, y, n, gap = 14 }: { x: number; y: number; n: number; gap?: number }) {
  return (
    <g>
      {Array.from({ length: n }).map((_, i) => (
        <g key={i}>
          <rect x={x + i * gap} y={y} width={7} height={5} rx={1.4} fill={C.band} stroke={C.frame} strokeWidth={0.8} />
          <line x1={x + i * gap + 3.5} y1={y + 5} x2={x + i * gap + 3.5} y2={y + 9} stroke={C.soft} strokeWidth={1} />
        </g>
      ))}
    </g>
  );
}

/** شاسيه الإنفرتر: زعانف تبريد، شاشة، مؤشرات LED، مفتاح عزل DC، مداخل كابلات. */
function Inverter({ x, y, w, h, accent }: Box) {
  const bx = x + 10;
  const bw = w - 20;
  return (
    <g>
      <rect x={bx} y={y + 3} width={bw} height={h - 16} rx={5} fill={C.band} stroke={C.frame} strokeWidth={1.3} />
      <Fins x={x + 1} y={y + 8} h={h - 28} n={7} />
      <Fins x={x + w - 9} y={y + 8} h={h - 28} n={7} />
      {/* شاشة العرض */}
      <rect x={bx + 8} y={y + 9} width={bw * 0.42} height={h * 0.3} rx={2.4} fill={C.fill} stroke={accent} strokeWidth={1.2} />
      <line x1={bx + 13} y1={y + 15} x2={bx + 8 + bw * 0.42 - 6} y2={y + 15} stroke={C.soft} strokeWidth={1} />
      <line x1={bx + 13} y1={y + 20} x2={bx + 8 + bw * 0.3} y2={y + 20} stroke={C.soft} strokeWidth={1} />
      {/* مؤشرات الحالة */}
      {[0, 1, 2].map((i) => (
        <circle
          key={i}
          cx={bx + bw - 14}
          cy={y + 12 + i * 9}
          r={2.6}
          fill={i === 0 ? C.earth : i === 1 ? accent : C.dc}
          stroke={C.frame}
          strokeWidth={0.6}
        />
      ))}
      <text x={bx + bw - 22} y={y + 14} textAnchor="end" fontFamily={F} fontSize={5.4} fill={C.soft}>RUN</text>
      <text x={bx + bw - 22} y={y + 23} textAnchor="end" fontFamily={F} fontSize={5.4} fill={C.soft}>GRID</text>
      <text x={bx + bw - 22} y={y + 32} textAnchor="end" fontFamily={F} fontSize={5.4} fill={C.soft}>ALARM</text>
      {/* مفتاح العزل الدوار المدمج */}
      <circle cx={bx + 14} cy={y + h - 24} r={6.4} fill={C.fill} stroke={C.dc} strokeWidth={1.3} />
      <line x1={bx + 14} y1={y + h - 24} x2={bx + 18.5} y2={y + h - 28.5} stroke={C.dc} strokeWidth={1.6} />
      <text x={bx + 24} y={y + h - 22} fontFamily={F} fontSize={5.6} fontWeight={700} fill={C.dc}>DC SW</text>
      <Glands x={bx + 10} y={y + h - 13} n={Math.max(3, Math.floor(bw / 26))} />
    </g>
  );
}

/** خزانة بطاريات برجية عالية الجهد: وحدات متراصة تعلوها وحدة تحكم BMS. */
function BatteryRack({ x, y, w, h, accent }: Box) {
  const bx = x + 14;
  const bw = w - 28;
  const mods = 4;
  const top = y + 4;
  const bmsH = 14;
  const avail = h - 20 - bmsH;
  const mh = avail / mods;
  return (
    <g>
      <rect x={bx - 4} y={top - 2} width={bw + 8} height={h - 12} rx={3} fill={C.band} stroke={C.frame} strokeWidth={1.3} />
      <rect x={bx} y={top} width={bw} height={bmsH} rx={1.6} fill={C.fill} stroke={accent} strokeWidth={1.2} />
      <text x={bx + 5} y={top + 9.6} fontFamily={F} fontSize={6.4} fontWeight={700} fill={accent}>BMS CTRL</text>
      <circle cx={bx + bw - 8} cy={top + 7} r={2.2} fill={C.earth} />
      {Array.from({ length: mods }).map((_, i) => {
        const my = top + bmsH + 2 + i * mh;
        return (
          <g key={i}>
            <rect x={bx} y={my} width={bw} height={mh - 2.5} rx={1.6} fill={C.fill} stroke={C.frame} strokeWidth={1} />
            <line x1={bx + 6} y1={my + (mh - 2.5) / 2} x2={bx + 20} y2={my + (mh - 2.5) / 2} stroke={C.soft} strokeWidth={2.2} strokeLinecap="round" />
            <text x={bx + bw - 5} y={my + (mh - 2.5) / 2 + 2.4} textAnchor="end" fontFamily={F} fontSize={5.6} fill={C.soft}>
              {`MODULE ${i + 1}`}
            </text>
          </g>
        );
      })}
      <rect x={bx - 4} y={y + h - 10} width={bw + 8} height={4} fill={C.soft} opacity={0.5} />
    </g>
  );
}

/** بطارية جدارية: شاسيه أنيق مع شريط نسبة الشحن وقاطع مدمج. */
function BatteryWall({ x, y, w, h, accent }: Box) {
  const bx = x + 10;
  const bw = w - 20;
  const bh = h - 16;
  return (
    <g>
      <rect x={bx} y={y + 4} width={bw} height={bh} rx={7} fill={C.band} stroke={C.frame} strokeWidth={1.3} />
      <rect x={bx + 8} y={y + 11} width={bw - 16} height={9} rx={4.5} fill={C.fill} stroke={C.frame} strokeWidth={0.9} />
      {Array.from({ length: 5 }).map((_, i) => (
        <rect
          key={i}
          x={bx + 11 + i * ((bw - 22) / 5)}
          y={y + 13.4}
          width={(bw - 26) / 5}
          height={4.2}
          rx={1.2}
          fill={i < 4 ? C.earth : "transparent"}
          opacity={0.9}
        />
      ))}
      <text x={bx + 8} y={y + 30} fontFamily={F} fontSize={5.8} fill={C.soft}>SOC</text>
      <rect x={bx + bw - 30} y={y + 24} width={22} height={12} rx={2} fill={C.fill} stroke={accent} strokeWidth={1.1} />
      <line x1={bx + bw - 24} y1={y + 34} x2={bx + bw - 14} y2={y + 26} stroke={accent} strokeWidth={1.4} />
      <Glands x={bx + 12} y={y + bh - 1} n={2} />
    </g>
  );
}

/** لوحة توزيع IP65 بنافذة شفافة تُظهر سكة DIN والقواطع. */
function Board({ x, y, w, h, accent, dc }: Box & { dc: boolean }) {
  const bx = x + 8;
  const bw = w - 16;
  const bh = h - 14;
  const rails = Math.max(2, Math.min(3, Math.floor(bh / 26)));
  const perRail = Math.max(3, Math.floor(bw / 16));
  return (
    <g>
      <rect x={bx} y={y + 4} width={bw} height={bh} rx={4} fill={C.band} stroke={C.frame} strokeWidth={1.3} />
      <rect x={bx + 5} y={y + 9} width={bw - 10} height={bh - 16} rx={2.4} fill={C.fill} stroke={accent} strokeWidth={1.1} opacity={0.95} />
      {Array.from({ length: rails }).map((_, r) => {
        const ry = y + 15 + r * ((bh - 22) / rails);
        return (
          <g key={r}>
            <line x1={bx + 8} y1={ry + 9} x2={bx + bw - 8} y2={ry + 9} stroke={C.soft} strokeWidth={1.4} />
            {Array.from({ length: perRail }).map((_, i) => (
              <g key={i}>
                <rect x={bx + 9 + i * 13} y={ry} width={9} height={14} rx={1.2} fill={C.band} stroke={C.frame} strokeWidth={0.8} />
                <line x1={bx + 13.5 + i * 13} y1={ry + 3} x2={bx + 13.5 + i * 13} y2={ry + 7} stroke={dc ? C.dc : accent} strokeWidth={1.6} />
              </g>
            ))}
          </g>
        );
      })}
      <circle cx={bx + bw - 6} cy={y + 4 + bh / 2} r={1.6} fill={C.soft} />
      <Glands x={bx + 10} y={y + 4 + bh - 2} n={Math.max(2, Math.floor(bw / 30))} />
    </g>
  );
}

/** خزانة مفتاح التحويل التلقائي بين الشبكة والمولد. */
function Ats({ x, y, w, h, accent }: Box) {
  const bx = x + 10;
  const bw = w - 20;
  const bh = h - 16;
  return (
    <g>
      <rect x={bx} y={y + 4} width={bw} height={bh} rx={4} fill={C.band} stroke={C.frame} strokeWidth={1.3} />
      <circle cx={bx + 16} cy={y + 16} r={3} fill={C.earth} />
      <text x={bx + 23} y={y + 18.4} fontFamily={F} fontSize={5.8} fill={C.soft}>GRID</text>
      <circle cx={bx + 16} cy={y + 28} r={3} fill={C.soft} />
      <text x={bx + 23} y={y + 30.4} fontFamily={F} fontSize={5.8} fill={C.soft}>GEN</text>
      <rect x={bx + bw - 34} y={y + 12} width={26} height={20} rx={2} fill={C.fill} stroke={accent} strokeWidth={1.1} />
      <line x1={bx + bw - 28} y1={y + 29} x2={bx + bw - 14} y2={y + 16} stroke={accent} strokeWidth={1.6} />
      <Glands x={bx + 12} y={y + 4 + bh - 2} n={3} />
    </g>
  );
}

/** برج نقل الشبكة العامة. */
function Grid({ x, y, w, h, accent }: Box) {
  const cx = x + w / 2;
  const top = y + 4;
  const base = y + h - 10;
  const halfTop = 7;
  const halfBase = 17;
  return (
    <g stroke={accent} strokeWidth={1.4} fill="none">
      <line x1={cx - halfTop} y1={top} x2={cx - halfBase} y2={base} />
      <line x1={cx + halfTop} y1={top} x2={cx + halfBase} y2={base} />
      <line x1={cx - 13} y1={top + 10} x2={cx + 13} y2={top + 10} />
      <line x1={cx - 16} y1={top + 20} x2={cx + 16} y2={top + 20} />
      <line x1={cx - 11} y1={top + 10} x2={cx + 11} y2={top + 20} />
      <line x1={cx + 11} y1={top + 10} x2={cx - 11} y2={top + 20} />
      <line x1={cx - 20} y1={top + 4} x2={cx + 20} y2={top + 4} />
      <circle cx={cx - 18} cy={top + 4} r={2} fill={accent} />
      <circle cx={cx + 18} cy={top + 4} r={2} fill={accent} />
    </g>
  );
}

/** مبنى الأحمال / نقطة الاستهلاك. */
function Loads({ x, y, w, h, accent }: Box) {
  const bx = x + w / 2 - 26;
  const top = y + 8;
  const bh = h - 20;
  return (
    <g>
      <rect x={bx} y={top} width={52} height={bh} fill={C.band} stroke={accent} strokeWidth={1.3} />
      <path d={`M ${bx - 6} ${top} L ${bx + 26} ${top - 10} L ${bx + 58} ${top} Z`} fill={C.fill} stroke={accent} strokeWidth={1.3} />
      {[0, 1].map((r) =>
        [0, 1, 2].map((c) => (
          <rect key={`${r}-${c}`} x={bx + 7 + c * 15} y={top + 7 + r * (bh / 2.4)} width={9} height={8} fill={C.fill} stroke={C.soft} strokeWidth={0.8} />
        )),
      )}
    </g>
  );
}

/** لوح شمسي واقعي بخلايا نصف مقطوعة وقضبان تجميع وإطار ألومنيوم. */
export function PvRealSymbol({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const cols = 4;
  const rows = 3;
  const cw = (w - 4) / cols;
  const ch = (h - 4) / rows;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={1.6} fill={C.band} stroke={C.frame} strokeWidth={1.3} />
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => (
          <g key={`${r}-${c}`}>
            <rect
              x={x + 2 + c * cw}
              y={y + 2 + r * ch}
              width={cw - 1}
              height={ch - 1}
              fill={C.fill}
              stroke={C.soft}
              strokeWidth={0.5}
              opacity={0.9}
            />
            <line
              x1={x + 2 + c * cw + cw / 2}
              y1={y + 2 + r * ch}
              x2={x + 2 + c * cw + cw / 2}
              y2={y + 1 + (r + 1) * ch}
              stroke={C.soft}
              strokeWidth={0.4}
            />
          </g>
        )),
      )}
      <line x1={x + 1} y1={y + h / 2} x2={x + w - 1} y2={y + h / 2} stroke={C.frame} strokeWidth={0.7} />
    </g>
  );
}

/** يرسم مجسم المعدة الواقعي داخل مساحة الصندوق. */
export function EquipArt({
  kind, x, y, w, h, accent,
}: { kind: EquipKind; x: number; y: number; w: number; h: number; accent: string }) {
  const box = { x, y, w, h, accent };
  switch (kind) {
    case "inverter":
      return <Inverter {...box} />;
    case "battery-rack":
      return <BatteryRack {...box} />;
    case "battery-wall":
      return <BatteryWall {...box} />;
    case "board-dc":
      return <Board {...box} dc />;
    case "board-ac":
      return <Board {...box} dc={false} />;
    case "ats":
      return <Ats {...box} />;
    case "grid":
      return <Grid {...box} />;
    case "loads":
      return <Loads {...box} />;
    default:
      return null;
  }
}
