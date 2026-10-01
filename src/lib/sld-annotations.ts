import type { SldCable, SldModel } from "@/lib/sld-engine";

/**
 * حسابات هندسية مشتقة تُعرض على المخطط نفسه (هبوط الجهد، سعة الكسر)
 * وبطاقات فحص المكوّنات. كل القيم محسوبة من نموذج المخطط فقط.
 */

const RHO = 0.0175; // Ω·mm²/m للنحاس عند 20°م

/** أطوال تصميمية نمطية لكل مسار (م) عند غياب مسح موقعي فعلي. */
export const DEFAULT_ROUTE_LENGTH: Record<string, number> = { W1: 45, W2: 20, W3: 5, W4: 12, W5: 18, W6: 22, PE: 25, C1: 3, C2: 20 };
const ROUTE_LENGTH = DEFAULT_ROUTE_LENGTH;

/** أطوال فعلية يدخلها المهندس يدوياً لكل مسار (اختيارية). */
export type CableLengths = Record<string, number>;

/** الطول الافتراضي لمسار ما قبل أي تعديل يدوي. */
export function defaultLengthOf(tag: string): number {
  return DEFAULT_ROUTE_LENGTH[tag] ?? 15;
}

export type CableCalc = {
  tag: string;
  route: string;
  spec: string;
  kind: SldCable["kind"];
  area: number | null;
  current: number | null;
  volts: number | null;
  length: number;
  /** الطول معدَّل يدوياً من المهندس بدل الطول التصميمي النمطي. */
  custom: boolean;
  dropPct: number | null;
  kA: number | null;
};

/** أول مقطع (mm²) مذكور في وصف الكابل. */
function areaOf(spec: string): number | null {
  const m = /([\d.]+)\s*mm²/.exec(spec);
  return m ? Number(m[1]) : null;
}

/** التيار المذكور بين قوسين في وصف الكابل. */
function currentOf(spec: string): number | null {
  const m = /\(([\d.]+)\s*A\)/.exec(spec);
  return m ? Number(m[1]) : null;
}

/** سعة كسر القاطع المناسبة للمسار. */
function breakingKa(kind: SldCable["kind"], phase3: boolean, amps: number | null): number | null {
  if (kind === "earth" || kind === "comm") return null;
  if (kind === "dc") return 10;
  if (phase3 || (amps || 0) > 63) return 15;
  return 6;
}

/** هبوط الجهد ونسبته لكل كابل في المنظومة. */
export function cableCalcs(m: SldModel): CableCalc[] {
  const phase3 = Boolean(m.inverter?.phase3 || m.acBox?.phase3);
  const acVolts = phase3 ? 400 : 230;

  return m.cables.map((c) => {
    const area = areaOf(c.spec);
    let current = currentOf(c.spec);
    let volts: number | null = null;

    if (c.kind === "dc") {
      if (/BAT/i.test(c.tag) || /Battery/i.test(c.route)) {
        volts = m.battery?.vdc ?? 48;
        current = current ?? m.battery?.current ?? null;
      } else {
        volts = m.pv?.strVmp ? Math.round(m.pv.strVmp) : 600;
        current = current ?? m.pv?.imp ?? null;
      }
    } else if (c.kind === "ac") {
      volts = acVolts;
      if (!current && m.inverter) current = Math.round((m.inverter.totalKw * 1000) / (phase3 ? 400 * 1.732 : 230));
    }

    const length = ROUTE_LENGTH[c.tag] ?? 15;
    let dropPct: number | null = null;
    if (area && current && volts) {
      const factor = c.kind === "ac" && phase3 ? 1.732 : 2;
      const drop = (factor * RHO * length * current) / area;
      dropPct = +((drop / volts) * 100).toFixed(2);
    }

    return {
      tag: c.tag,
      route: c.route,
      spec: c.spec,
      kind: c.kind,
      area,
      current: current ?? null,
      volts,
      length,
      dropPct,
      kA: breakingKa(c.kind, phase3, current ?? null),
    };
  });
}

export type InspectItem = { id: string; title: string; subtitle: string; rows: [string, string][] };

/** بطاقات فحص المكوّنات الهندسية القابلة للنقر على المخطط. */
export function inspectorItems(m: SldModel): Record<string, InspectItem> {
  const out: Record<string, InspectItem> = {};
  const calcs = cableCalcs(m);
  const byTag = (t: string) => calcs.find((c) => c.tag === t);
  const phase3 = Boolean(m.inverter?.phase3 || m.acBox?.phase3);

  if (m.pv) {
    const w1 = byTag("W1");
    out["pv"] = {
      id: "pv",
      title: "حقل الألواح الشمسية",
      subtitle: m.pv.model,
      rows: [
        ["إجمالي القدرة", `${m.pv.kwp.toFixed(2)} kWp`],
        ["عدد الألواح", `${m.pv.qty} × ${m.pv.wp} Wp`],
        ["السلاسل", `${m.pv.strings} سلسلة × ${m.pv.perString} لوح`],
        ...(m.pv.strVoc ? ([["جهد السلسلة المفتوح Voc", `${Math.round(m.pv.strVoc)} V`]] as [string, string][]) : []),
        ...(m.pv.strVmp ? ([["جهد التشغيل Vmp", `${Math.round(m.pv.strVmp)} V`]] as [string, string][]) : []),
        ...(m.pv.isc ? ([["تيار القصر Isc/سلسلة", `${m.pv.isc} A`]] as [string, string][]) : []),
        ["كابل السلاسل", w1 ? w1.spec : "PV1-F 1×6 mm² — 1500 V DC"],
        ...(w1?.dropPct !== null && w1 ? ([["هبوط الجهد المتوقع", `${w1.dropPct}% على ${w1.length} م`]] as [string, string][]) : []),
      ],
    };
  }

  if (m.dcBox) {
    out["dc"] = {
      id: "dc",
      title: "لوحة حماية التيار المستمر",
      subtitle: m.dcBox.name,
      rows: [
        ["عدد المسارات", `${m.dcBox.ways} Way`],
        ["فيوز السلسلة", `gPV ${m.dcBox.fuseA} A / 1000 V DC`],
        ["مفتاح العزل", "DC Isolator — قطع تحت الحمل"],
        ["مانع الصواعق", m.dcBox.hasSpd ? "DC SPD Type 2" : "غير مضمّن"],
        ["سعة الكسر", "10 kA"],
      ],
    };
  }

  if (m.inverter) {
    const inRange = m.pv?.strVoc && /(\d+)\s*[-–]\s*(\d+)/.exec(m.inverter.mpptRange || "");
    const rng = m.inverter.mpptRange ? /(\d+)\s*[-–]\s*(\d+)/.exec(m.inverter.mpptRange) : null;
    const ok = Boolean(inRange && rng && m.pv?.strVoc && m.pv.strVoc <= Number(rng[2]) && m.pv.strVoc >= Number(rng[1]));
    out["inv"] = {
      id: "inv",
      title: "الإنفرتر",
      subtitle: m.inverter.model,
      rows: [
        ["القدرة", `${m.inverter.qty} × ${m.inverter.kw} kW = ${m.inverter.totalKw} kW`],
        ["نوع التغذية", phase3 ? "ثلاثي الطور 400 V — L1/L2/L3/N/PE" : "أحادي الطور 230 V — L/N/PE"],
        ...(m.inverter.mppt ? ([["مداخل MPPT", `${m.inverter.mppt}`]] as [string, string][]) : []),
        ...(m.inverter.mpptRange ? ([["نطاق جهد MPPT", m.inverter.mpptRange]] as [string, string][]) : []),
        ...(m.pv?.strVoc && m.inverter.mpptRange
          ? ([["مطابقة السلسلة", `Voc ${Math.round(m.pv.strVoc)} V — ${ok ? "مطابق للنطاق" : "يلزم مراجعة عدد الألواح"}`]] as [string, string][])
          : []),
        ...(m.inverter.vbat ? ([["منفذ البطارية", `${m.inverter.vbat} V DC`]] as [string, string][]) : []),
        ...(m.bms
          ? ([
              ["منفذ الشبكة GRID", "الشبكة + الأحمال غير الحرجة — فصل تلقائي عند الانقطاع"],
              ["منفذ الطوارئ EPS", "الأحمال الحرجة — تغذية مستمرة من البطارية"],
              ["منفذ الاتصالات", `BMS ${m.bms.protocol}`],
            ] as [string, string][])
          : []),
        ...(m.meter ? ([["منفذ العداد", "RS485 — Smart Meter / CT"]] as [string, string][]) : []),
        ["التأريض", "شاسيه الإنفرتر على ناقل PE الرئيسي"],
      ],
    };
  }

  if (m.battery) {
    const w3 = byTag("W3");
    out["bat"] = {
      id: "bat",
      title: "بنك البطاريات",
      subtitle: m.battery.model,
      rows: [
        ["السعة", `${m.battery.qty} × ${m.battery.kwh} kWh = ${m.battery.totalKwh} kWh`],
        ...(m.battery.vdc ? ([["الجهد الاسمي", `${m.battery.vdc} V DC`]] as [string, string][]) : []),
        ...(m.battery.current ? ([["أقصى تيار", `≈ ${m.battery.current} A`]] as [string, string][]) : []),
        ...(m.battery.breakerA ? ([["قاطع البطارية", `DC ${m.battery.breakerA} A 2P — 10 kA`]] as [string, string][]) : []),
        ...(w3 ? ([["كابل البطارية", w3.spec]] as [string, string][]) : []),
        ...(w3?.dropPct !== null && w3 ? ([["هبوط الجهد المتوقع", `${w3.dropPct}% على ${w3.length} م`]] as [string, string][]) : []),
      ],
    };
  }

  if (m.acBox) {
    const w4 = byTag("W4");
    out["ac"] = {
      id: "ac",
      title: "لوحة حماية التيار المتردد",
      subtitle: m.acBox.name,
      rows: [
        ["القاطع الرئيسي", `${m.acBox.breakerA} A ${m.acBox.phase3 ? "4P" : "2P"}`],
        ["الموصلات", m.acBox.phase3 ? "L1 / L2 / L3 / N / PE" : "L / N / PE"],
        ["مانع الصواعق", "AC SPD Type 2"],
        ["سعة الكسر", `${m.acBox.phase3 || m.acBox.breakerA > 63 ? 15 : 6} kA`],
        ...(w4 ? ([["كابل الخروج", w4.spec]] as [string, string][]) : []),
        ...(w4?.dropPct !== null && w4 ? ([["هبوط الجهد المتوقع", `${w4.dropPct}%`]] as [string, string][]) : []),
      ],
    };
  }

  if (m.ats) {
    out["ats"] = {
      id: "ats",
      title: "مفتاح التحويل الأوتوماتيكي",
      subtitle: m.ats.name,
      rows: [
        ["الوظيفة", "تحويل بين الشبكة والمولد"],
        ...(m.ats.kva ? ([["المولد", `${m.ats.kva} kVA`]] as [string, string][]) : []),
        ["القطبية", phase3 ? "4 أقطاب" : "2 قطب"],
      ],
    };
  }

  if (m.meter) {
    const c2 = byTag("C2");
    out["meter"] = {
      id: "meter",
      title: "العداد الذكي ومحولات التيار",
      subtitle: m.meter.name,
      rows: [
        ["الوظيفة", "قياس الاستهلاك ومنع التصدير للشبكة"],
        ["محولات التيار", m.meter.ct],
        ["موقع التركيب", "نقطة الربط بالشبكة — قبل لوحة الدخول"],
        ["الاتصال بالإنفرتر", "RS485 — Modbus"],
        ...(c2 ? ([["كابل الاتصال", c2.spec]] as [string, string][]) : []),
      ],
    };
  }

  if (m.bms) {
    const c1 = byTag("C1");
    out["bms"] = {
      id: "bms",
      title: "خط اتصالات نظام إدارة البطارية",
      subtitle: m.bms.name,
      rows: [
        ["البروتوكول", m.bms.protocol],
        ["الوظيفة", "التحكم بالشحن والتفريغ ومراقبة الحرارة والخلايا"],
        ...(c1 ? ([["الكابل", c1.spec]] as [string, string][]) : []),
        ["ملاحظة إلزامية", "بطاريات الليثيوم لا تعمل بدون هذا الخط"],
      ],
    };
  }

  if (m.bms) {
    const w6 = byTag("W6");
    out["backup"] = {
      id: "backup",
      title: "الأحمال الحرجة (مخرج الطوارئ EPS)",
      subtitle: m.title.phase,
      rows: [
        ["المصدر", "مخرج الطوارئ من الإنفرتر — بطارية + ألواح"],
        ["زمن التحويل", "أقل من 10 ميلي ثانية"],
        ...(w6 ? ([["كابل التغذية", w6.spec]] as [string, string][]) : []),
        ...(w6?.dropPct !== null && w6 ? ([["هبوط الجهد المتوقع", `${w6.dropPct}%`]] as [string, string][]) : []),
      ],
    };
  }

  out["loads"] = {
    id: "loads",
    title: m.battery ? "أحمال الموقع والطوارئ" : "أحمال الموقع",
    subtitle: m.title.phase,
    rows: [
      ["نوع التغذية", m.title.phase],
      ["مصدر التغذية", m.battery ? "الشبكة + الألواح + البطارية" : "الشبكة + الألواح"],
      ["التأريض", "TN-S — ناقل PE مشترك"],
    ],
  };

  if (m.grid) {
    out["grid"] = {
      id: "grid",
      title: "شبكة الكهرباء العامة",
      subtitle: m.title.phase,
      rows: [
        ["نقطة الربط", "لوحة الدخول الرئيسية"],
        ["الجهد", phase3 ? "400 V / 50 Hz" : "230 V / 50 Hz"],
      ],
    };
  }

  out["earth"] = {
    id: "earth",
    title: "شبكة التأريض",
    subtitle: m.earth?.name || "ناقل التأريض الرئيسي",
    rows: [
      ["الناقل الرئيسي", "نحاس 1×16 mm²"],
      ["ربط الهياكل", "نحاس 1×6 mm² لكل صف ألواح"],
      ["المقاومة المطلوبة", "أقل من 5 أوم"],
      ["الأجهزة المرتبطة", "الألواح + اللوحات + الإنفرتر + البطاريات"],
    ],
  };

  return out;
}
