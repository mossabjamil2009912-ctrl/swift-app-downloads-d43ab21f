/**
 * محرك المخطط الأحادي الرسمي (Single Line Diagram — SLD).
 *
 * القاعدة الأساسية: لا يُرسم أي مكوّن إلا إذا كان موجوداً فعلاً ضمن أصناف
 * منظومة العميل (`quote_items` القادمة من عرض السعر / الدراسة).
 * الاستثناء الوحيد هو الكابلات: يُختار لها المقاس الهندسي المناسب للتيار
 * والجهد تلقائياً لربط الأصناف الموجودة فقط.
 */

export type SldSourceItem = { key?: string; name?: string; qty?: number; unit?: string };

export type SldParams = {
  panel?: { model?: string; wp?: number; voc?: number; vmp?: number; imp?: number; isc?: number };
  inv?: { model?: string; kwac?: number; vmin?: number; vmax?: number; vbat?: number; vbatRange?: string };
  bat?: { model?: string; kwh?: number };
  nStr?: number;
  perStr?: number;
  nPan?: number;
  nInv?: number;
  nBat?: number;
  kWp?: number;
  phase3?: boolean;
  mppt?: number;
  mpptPerInv?: number;
  strPerMppt?: number;
  strVoc?: number;
  strVmp?: number;
  peak?: number;
  daily?: number;
  sysLabel?: string;
  sysMode?: string;
  city_en?: string;
  quote_items?: SldSourceItem[];
  ref?: string;
  quote_number?: string;
  customer_name?: string;
  project?: string;
  designer?: string;
  date?: string;
  gen?: { kva?: number; ats?: number } | null;
};

export type SldCable = { tag: string; spec: string; route: string; kind: "dc" | "ac" | "earth" | "comm" };

export type SldModel = {
  title: {
    project: string;
    customer: string;
    city: string;
    ref: string;
    date: string;
    designer: string;
    system: string;
    phase: string;
  };
  pv: {
    model: string;
    wp: number;
    qty: number;
    strings: number;
    perString: number;
    kwp: number;
    strVoc: number | null;
    strVmp: number | null;
    isc: number | null;
    imp: number | null;
  } | null;
  dcBox: { name: string; ways: number; fuseA: number; hasSpd: boolean } | null;
  inverter: {
    model: string;
    kw: number;
    qty: number;
    totalKw: number;
    phase3: boolean;
    mppt: number | null;
    vbat: number | null;
    mpptRange: string;
  } | null;
  battery: {
    model: string;
    kwh: number;
    qty: number;
    totalKwh: number;
    vdc: number | null;
    current: number | null;
    breakerA: number | null;
  } | null;
  batBox: { name: string; rating: string } | null;
  acBox: { name: string; breakerA: number; phase3: boolean } | null;
  ats: { name: string; kva: number | null } | null;
  /** عداد ذكي / محولات تيار عند نقطة الربط بالشبكة (للتحكم بالتصدير). */
  meter: { name: string; ct: string } | null;
  /** خط اتصالات نظام إدارة البطارية مع الإنفرتر. */
  bms: { name: string; protocol: string } | null;
  grid: boolean;
  earth: { name: string } | null;
  cables: SldCable[];
  bom: { name: string; qty: number; unit: string }[];
  notes: string[];
};

const STD_BREAKERS = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800];

/** أقرب مقاس قاطع قياسي فوق التيار المحسوب. */
function breaker(amps: number): number {
  for (const a of STD_BREAKERS) if (a >= amps) return a;
  return STD_BREAKERS[STD_BREAKERS.length - 1]!;
}

/** مقاس موصل النحاس المناسب لتيار التشغيل (mm²) وفق الجداول الهندسية. */
function conductor(amps: number): string {
  const table: [number, string][] = [
    [24, "4"], [32, "6"], [44, "10"], [59, "16"], [77, "25"], [96, "35"],
    [119, "50"], [151, "70"], [182, "95"], [210, "120"], [240, "150"],
    [273, "185"], [320, "240"], [367, "300"],
  ];
  for (const [limit, size] of table) if (amps <= limit) return size;
  const sets = Math.ceil(amps / 320);
  return `${sets}×240`;
}

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/** يبحث عن صنف بمفتاحه أو باسمه داخل أصناف منظومة العميل. */
function findItem(items: SldSourceItem[], test: (key: string, name: string) => boolean): SldSourceItem | null {
  for (const it of items) {
    if (test(String(it.key || ""), String(it.name || ""))) return it;
  }
  return null;
}

/** يبني نموذج المخطط من معاملات المنظومة، معتمداً على الأصناف الموجودة فقط. */
export function buildSld(raw: Record<string, unknown> | null): SldModel | null {
  if (!raw) return null;
  const p = raw as SldParams;

  const items: SldSourceItem[] = Array.isArray(p.quote_items) ? p.quote_items : [];
  const hasItems = items.length > 0;

  const nPan = num(p.nPan);
  const nStr = Math.max(1, num(p.nStr) || 1);
  const perStr = num(p.perStr) || (nPan ? Math.round(nPan / nStr) : 0);
  const wp = num(p.panel?.wp);
  const kwp = num(p.kWp) || (nPan && wp ? (nPan * wp) / 1000 : 0);
  const phase3 = Boolean(p.phase3);
  const invKw = num(p.inv?.kwac);
  const nInv = num(p.nInv) || (invKw ? 1 : 0);
  const nBat = num(p.nBat);
  const batKwh = num(p.bat?.kwh);
  const sysMode = String(p.sysMode || "");

  // ── الأصناف الموجودة فعلاً (فحص المفتاح أو الاسم أو المعاملات المباشرة) ───
  const panelItem = hasItems
    ? findItem(items, (k, n) => k.startsWith("panel:") || /لوح|ألواح|panel|module|suntech/i.test(n)) || (nPan ? { qty: nPan } : null)
    : nPan ? { qty: nPan } : null;
  const invItem = hasItems
    ? findItem(items, (k, n) => k.startsWith("inverter:") || /انفرتر|إنفرتر|inverter|deye|solis|هايبرد|باور/i.test(n)) || (invKw ? { qty: nInv } : null)
    : invKw ? { qty: nInv } : null;
  const batItem = hasItems
    ? findItem(items, (k, n) => k.startsWith("battery:") || k.startsWith("ess:") || /بطارية|بطاريه|battery|pylontech|hthium|uf5000/i.test(n)) || (nBat ? { qty: nBat } : null)
    : nBat ? { qty: nBat } : null;
  const dcItem = hasItems
    ? findItem(items, (k, n) => k.startsWith("dc:") || /حماية dc|قواطع dc|dc combiner/i.test(n)) || (nStr ? { key: `dc:${nStr}`, name: `لوحة حماية DC ${nStr} خط` } : null)
    : nStr ? { key: `dc:${nStr}`, name: `لوحة حماية DC ${nStr} خط` } : null;
  const acItem = hasItems
    ? findItem(items, (k, n) => (k.startsWith("ac:") && !k.startsWith("ac:3-175")) || /حماية ac|قواطع ac|توزيع ac/i.test(n)) || { key: phase3 ? "ac:3" : "ac:1", name: `لوحة حماية AC ${phase3 ? "ثري فاز" : "سنجل فاز"}` }
    : { key: phase3 ? "ac:3" : "ac:1", name: `لوحة حماية AC ${phase3 ? "ثري فاز" : "سنجل فاز"}` };
  const batBoxItem = findItem(items, (k, n) => k.startsWith("bat:box") || /صندوق بطاريات|لوحة حماية بطارية|قاطع بطارية/i.test(n));
  const atsItem = findItem(items, (k, n) => k.startsWith("ac:3-175") || /\bats\b|changeover|قلاب/i.test(n));
  const earthItem = findItem(items, (k, n) => k.startsWith("earth:") || /تأريض|earth/i.test(n));
  const bmsItem = findItem(items, (k, n) => k.startsWith("bms:") || /bms|وحدة تحكم/i.test(n));

  const pv = panelItem
    ? {
        model: String(p.panel?.model || "PV Module"),
        wp,
        qty: num(panelItem.qty) || nPan,
        strings: nStr,
        perString: perStr,
        kwp,
        strVoc: num(p.strVoc) || null,
        strVmp: num(p.strVmp) || null,
        isc: num(p.panel?.isc) || null,
        imp: num(p.panel?.imp) || null,
      }
    : null;

  const inverter = invItem
    ? {
        model: String(p.inv?.model || "PV Inverter"),
        kw: invKw,
        qty: num(invItem.qty) || nInv || 1,
        totalKw: invKw * (num(invItem.qty) || nInv || 1),
        phase3,
        mppt: num(p.mppt) || null,
        vbat: num(p.inv?.vbat) || null,
        mpptRange: p.inv?.vmin && p.inv?.vmax ? `${num(p.inv.vmin)}–${num(p.inv.vmax)} V` : "",
      }
    : null;

  // تيار البطاريات وقاطع الحماية
  const batQty = num(batItem?.qty) || nBat;
  const vdc = num(p.inv?.vbat) || null;
  const totalKwh = batKwh && batQty ? Math.round(batKwh * batQty * 100) / 100 : 0;
  const batCurrent = inverter && vdc ? Math.round((inverter.totalKw * 1000) / vdc) : null;
  const battery = batItem && batQty
    ? {
        model: String(p.bat?.model || "Lithium Battery"),
        kwh: batKwh,
        qty: batQty,
        totalKwh,
        vdc,
        current: batCurrent,
        breakerA: batCurrent ? breaker(batCurrent * 1.25) : null,
      }
    : null;

  // تيار جانب التيار المتردد وقاطع اللوحة
  const acCurrent = inverter ? (phase3 ? (inverter.totalKw * 1000) / (400 * Math.sqrt(3)) : (inverter.totalKw * 1000) / 230) : 0;
  const acBreaker = acCurrent ? breaker(acCurrent * 1.25) : 0;

  const dcWays = Number(String(dcItem?.key || "").match(/dc:(\d+)/)?.[1] || nStr) || nStr;
  const stringIsc = pv?.isc ? Math.round(pv.isc * 1.56) : 0;

  const model: SldModel = {
    title: {
      project: String(p.project || "ACTES SOLAR PV SYSTEM"),
      customer: String(p.customer_name || ""),
      city: String(p.city_en || ""),
      ref: String(p.quote_number || p.ref || ""),
      date: String(p.date || new Date().toISOString().slice(0, 10)),
      designer: String(p.designer || "ACTES ENGINEERING"),
      system: `${kwp ? kwp.toFixed(2) + " kWp " : ""}${p.sysLabel || (sysMode === "off" ? "Off-Grid" : sysMode === "hyb" ? "Hybrid" : "On-Grid")} System`,
      phase: phase3 ? "Three Phase 400/230 V — 50 Hz" : "Single Phase 230 V — 50 Hz",
    },
    pv,
    dcBox: dcItem
      ? {
          name: String(dcItem.name || `DC Protection Board ${dcWays} Way`),
          ways: dcWays,
          fuseA: stringIsc ? breaker(stringIsc) : 15,
          hasSpd: true,
        }
      : null,
    inverter,
    battery,
    batBox: batBoxItem ? { name: String(batBoxItem.name || "Battery Protection Box"), rating: "MCCB 2P 250 A" } : null,
    acBox: acItem && inverter ? { name: String(acItem.name || "AC Protection Board"), breakerA: acBreaker, phase3 } : null,
    ats: atsItem || p.gen ? { name: String(atsItem?.name || "ATS / Generator Changeover"), kva: num(p.gen?.kva) || null } : null,
    meter: sysMode !== "off" && inverter ? { name: "Smart Meter / CT", ct: phase3 ? "3 × CT 200/5 A" : "1 × CT 200/5 A" } : null,
    bms: battery && inverter ? { name: String(bmsItem?.name || "Battery BMS"), protocol: "CAN 2.0B / RS485" } : null,
    grid: sysMode !== "off",
    earth: earthItem ? { name: String(earthItem.name || "Earthing Pit") } : null,
    cables: [],
    bom: items.map((it) => ({ name: String(it.name || ""), qty: num(it.qty), unit: String(it.unit || "") })).filter((r) => r.name),
    notes: [],
  };

  // ── الكابلات: المقاس المناسب لكل مسار موجود فقط ─────────────────────────
  const cables: SldCable[] = [];
  if (pv && model.dcBox) {
    cables.push({
      tag: "W1",
      spec: `PV1-F 1×6 mm² — 1500 V DC${stringIsc ? ` (${stringIsc} A)` : ""}`,
      route: `PV Strings → ${model.dcBox.ways} Way DC Board`,
      kind: "dc",
    });
  }
  if (model.dcBox && inverter) {
    cables.push({
      tag: "W2",
      spec: `PV1-F 1×6 mm² — 1500 V DC`,
      route: "DC Board → Inverter MPPT Inputs",
      kind: "dc",
    });
  } else if (pv && inverter) {
    cables.push({ tag: "W1", spec: "PV1-F 1×6 mm² — 1500 V DC", route: "PV Strings → Inverter MPPT Inputs", kind: "dc" });
  }
  if (battery && inverter) {
    const size = battery.current ? conductor(battery.current) : "50";
    cables.push({
      tag: "W3",
      spec: `2 × (1×${size} mm²) Cu single core flexible DC${battery.current ? ` (${battery.current} A)` : ""}`,
      route: model.batBox ? "Battery Bank → Battery Box → Inverter BAT Port" : "Battery Bank → Inverter BAT Port",
      kind: "dc",
    });
  }
  if (inverter && model.acBox) {
    const size = conductor(acCurrent);
    cables.push({
      tag: "W4",
      spec: `Cu XLPE ${phase3 ? `4×${size}` : `2×${size}`} mm² + E — 0.6/1 kV (${Math.round(acCurrent)} A)`,
      route: "Inverter AC Output → AC Protection Board",
      kind: "ac",
    });
  }
  if (model.acBox) {
    const size = conductor(acCurrent);
    cables.push({
      tag: "W5",
      spec: `Cu XLPE ${phase3 ? `4×${size}` : `2×${size}`} mm² + E — 0.6/1 kV`,
      route: model.ats ? "AC Board → ATS → Loads Distribution" : "AC Board → Loads Distribution",
      kind: "ac",
    });
  }
  if (battery && inverter) {
    const size = conductor(acCurrent);
    cables.push({
      tag: "W6",
      spec: `Cu XLPE ${phase3 ? `4×${size}` : `2×${size}`} mm² + E — 0.6/1 kV (${Math.round(acCurrent)} A)`,
      route: "Inverter EPS / Backup Port → Critical Loads Panel",
      kind: "ac",
    });
  }
  if (model.earth) {
    cables.push({ tag: "PE", spec: "Cu Earth 1×16 mm² (frames 1×6 mm²)", route: "Array frames + Inverter + Boards → Earthing Pit", kind: "earth" });
  }
  if (model.bms) {
    cables.push({
      tag: "C1",
      spec: "Shielded twisted pair Cat6 / 2×0.5 mm² — CAN 2.0B / RS485",
      route: "Battery BMS → Inverter Comm Port",
      kind: "comm",
    });
  }
  if (model.meter) {
    cables.push({
      tag: "C2",
      spec: "Shielded twisted pair 2×0.75 mm² — RS485 (Modbus)",
      route: "Smart Meter / CT at Grid Point → Inverter Meter Port",
      kind: "comm",
    });
  }
  model.cables = cables;

  // ── ملاحظات هندسية تُبنى من المكوّنات الموجودة فقط ──────────────────────
  const notes: string[] = [];
  if (pv) notes.push(`${pv.qty} × ${pv.wp} Wp modules — ${pv.strings} string(s) × ${pv.perString} modules${pv.strVoc ? `, Voc/string ≈ ${Math.round(pv.strVoc)} V` : ""}.`);
  if (inverter) notes.push(`${inverter.qty} × ${inverter.kw} kW ${phase3 ? "three phase" : "single phase"} inverter${inverter.mpptRange ? `, MPPT window ${inverter.mpptRange}` : ""}.`);
  if (battery) notes.push(`Battery bank ${battery.qty} × ${battery.kwh} kWh = ${battery.totalKwh} kWh${battery.vdc ? ` @ ${battery.vdc} V DC` : ""}.`);
  if (bmsItem) notes.push(`High voltage battery control unit included: ${bmsItem.name}.`);
  if (model.bms) notes.push("Battery BMS communication cable (CAN 2.0B / RS485, shielded) to be connected to the inverter comm port — mandatory for lithium batteries.");
  if (model.meter) notes.push(`Smart meter / ${model.meter.ct} installed at the utility connection point and wired to the inverter for export control and load monitoring.`);
  if (model.bms) notes.push("Inverter EPS / backup output feeds the critical loads panel only; grid port supplies non-critical loads (anti-islanding on grid failure).");
  if (model.acBox) notes.push(`AC main breaker ${model.acBox.breakerA} A ${phase3 ? "4P" : "2P"} with surge protection device.`);
  if (model.acBox) notes.push(`RCD Type B 30 mA ${phase3 ? "4P" : "2P"} required on the inverter AC side per IEC 60364-7-712 (DC residual current immunity).`);
  if (model.dcBox) notes.push("Lockable DC load break isolator installed beside the inverter DC input for safe maintenance; DC board rated IP65 UV resistant, AC board IP54.");
  if (!model.grid) notes.push("Stand-alone system — no utility grid connection.");
  if (model.earth) notes.push("All metallic frames, boards and inverter bodies bonded to the earthing pit.");
  if (pv && inverter?.mppt) {
    const inputs = Math.max(1, inverter.mppt);
    const used = Math.min(inputs, pv.strings);
    const base = Math.floor(pv.strings / used);
    const extra = pv.strings % used;
    const map = Array.from({ length: used }, (_, i) => `MPPT ${i + 1} = ${base + (i < extra ? 1 : 0)} string(s)`).join(", ");
    notes.push(`String to MPPT allocation: ${map} — balanced across the inverter independent trackers.`);
  }
  notes.push("Main Earth Bar (MEB) Cu 25×3 mm collects all PE conductors; array frames, structure, boards, inverter and battery rack bonded to it per IEC 60364-7-712.");
  notes.push("Surge protection: SPD Type I+II on the DC side at the combiner and on the AC side at the main board, with short earthing leads (< 0.5 m) to the MEB.");
  model.notes = notes;

  if (!pv && !inverter) return null;
  return model;
}
