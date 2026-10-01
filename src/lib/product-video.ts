// فيديوهات تعريف المنتجات — ملفات فيديو حقيقية مصوّرة داخل معرض ACTES.
// لكل منتج فيديو خاص به، مع نقاط زمنية تُظهر المواصفة لحظة ذكرها في التعليق الصوتي.
// كل قيمة هنا مأخوذة حرفياً من الكتالوج/الداتاشيت الرسمي للمنتج — ممنوع إضافة أي قيمة غير موثقة.
// لإضافة فيديو منتج جديد: ارفع ملف mp4 إلى src/assets/showroom/<id>.mp4 وصورة البوستر <id>.jpg، ثم أضف مدخلاً هنا بنفس معرف المنتج.

import lipowerVideo from "@/assets/showroom/lipower-bz6248smh.mp4.asset.json";
import lipowerPoster from "@/assets/showroom/lipower-bz6248smh.jpg";
import suntechVideo from "@/assets/showroom/suntech-stp595s-c72-nsh.mp4.asset.json";
import suntechPoster from "@/assets/showroom/suntech-stp595s-c72-nsh.jpg";
import pylontechVideo from "@/assets/showroom/pylontech-rv12314.mp4.asset.json";
import pylontechPoster from "@/assets/showroom/pylontech-rv12314.jpg";
import deyeVideo from "@/assets/showroom/deye-sun-3-6k-sg04lp1.mp4.asset.json";
import deyePoster from "@/assets/showroom/deye-sun-3-6k-sg04lp1.jpg";
import hithiumVideo from "@/assets/showroom/hithium-heroee-maxpower-16.mp4.asset.json";
import hithiumPoster from "@/assets/showroom/hithium-heroee-maxpower-16.jpg";
import suntech720Video from "@/assets/showroom/suntech-stp720s-d66-nsh.mp4.asset.json";
import suntech720Poster from "@/assets/showroom/suntech-stp720s-d66-nsh.jpg";
import deye12kVideo from "@/assets/showroom/deye-sun-7-6-12k-sg02lp1.mp4.asset.json";
import deye12kPoster from "@/assets/showroom/deye-sun-7-6-12k-sg02lp1.jpg";
import deye20kVideo from "@/assets/showroom/deye-sun-14-20k-sg05lp3.mp4.asset.json";
import deye20kPoster from "@/assets/showroom/deye-sun-14-20k-sg05lp3.jpg";
import deye50kVideo from "@/assets/showroom/deye-sun-29-9-50k-sg01hp3.mp4.asset.json";
import deye50kPoster from "@/assets/showroom/deye-sun-29-9-50k-sg01hp3.jpg";
import deye80kVideo from "@/assets/showroom/deye-sun-60-80k-sg02hp3.mp4.asset.json";
import deye80kPoster from "@/assets/showroom/deye-sun-60-80k-sg02hp3.jpg";
import solis8kVideo from "@/assets/showroom/solis-s6-eh2p-5-8k.mp4.asset.json";
import solis8kPoster from "@/assets/showroom/solis-s6-eh2p-5-8k.jpg";
import solis20kVideo from "@/assets/showroom/solis-s6-eh3p-12-20k-h.mp4.asset.json";
import solis20kPoster from "@/assets/showroom/solis-s6-eh3p-12-20k-h.jpg";
import solis50kVideo from "@/assets/showroom/solis-s6-eh3p-29-9-50k-h.mp4.asset.json";
import solis50kPoster from "@/assets/showroom/solis-s6-eh3p-29-9-50k-h.jpg";
import solis125kVideo from "@/assets/showroom/solis-s6-eh3p-75-125k.mp4.asset.json";
import solis125kPoster from "@/assets/showroom/solis-s6-eh3p-75-125k.jpg";
import lipower2012Video from "@/assets/showroom/lipower-2012emh.mp4.asset.json";
import lipower2012Poster from "@/assets/showroom/lipower-2012emh.jpg";
import lipower4kVideo from "@/assets/showroom/lipower-bz4024smhgw.mp4.asset.json";
import lipower4kPoster from "@/assets/showroom/lipower-bz4024smhgw.jpg";
import pylon100Video from "@/assets/showroom/pylontech-rv12100ch.mp4.asset.json";
import pylon100Poster from "@/assets/showroom/pylontech-rv12100ch.jpg";
import pylon200Video from "@/assets/showroom/pylontech-rv12200.mp4.asset.json";
import pylon200Poster from "@/assets/showroom/pylontech-rv12200.jpg";
import fidusVideo from "@/assets/showroom/pylontech-fidus-battery-plus.mp4.asset.json";
import fidusPoster from "@/assets/showroom/pylontech-fidus-battery-plus.jpg";
import cubeM5aVideo from "@/assets/showroom/pylontech-powercube-m5a.mp4.asset.json";
import cubeM5aPoster from "@/assets/showroom/pylontech-powercube-m5a.jpg";
import cubeM1cVideo from "@/assets/showroom/pylontech-powercube-m1c.mp4.asset.json";
import cubeM1cPoster from "@/assets/showroom/pylontech-powercube-m1c.jpg";
import optimusA300Video from "@/assets/showroom/pylontech-optimus-a300-hy.mp4.asset.json";
import optimusA300Poster from "@/assets/showroom/pylontech-optimus-a300-hy.jpg";
import legend112cVideo from "@/assets/showroom/hithium-legend-112c.mp4.asset.json";
import legend112cPoster from "@/assets/showroom/hithium-legend-112c.jpg";
import optimusL260Video from "@/assets/showroom/pylontech-optimus-l260-hy.mp4.asset.json";
import optimusL260Poster from "@/assets/showroom/pylontech-optimus-l260-hy.jpg";

/** بطاقة مواصفة تظهر على الفيديو من الثانية `at` حتى `until`. */
export type VideoCue = { at: number; until: number; label: string; value: string };

export type ProductVideo = {
  src: string;
  poster: string;
  cues: VideoCue[];
};

export const PRODUCT_VIDEOS: Record<string, ProductVideo> = {
  "lipower-bz6248smh": {
    src: lipowerVideo.url,
    poster: lipowerPoster,
    cues: [
      { at: 0.5, until: 3.2, label: "القدرة المقننة", value: "6.2 kW" },
      { at: 3.2, until: 5.4, label: "نوع النظام", value: "Single Phase" },
      { at: 5.4, until: 7.4, label: "جهد البطارية", value: "48 Vdc" },
      { at: 7.4, until: 10, label: "أقصى كفاءة تحويل", value: "98%" },
    ],
  },
  "suntech-stp595s-c72-nsh": {
    src: suntechVideo.url,
    poster: suntechPoster,
    cues: [
      { at: 0.5, until: 3.4, label: "القدرة القصوى Pmax", value: "595 W" },
      { at: 3.4, until: 6.0, label: "نوع الخلية", value: "N-Type TOPCon ثنائي الوجه" },
      { at: 6.0, until: 8.0, label: "كفاءة اللوح", value: "23.0%" },
      { at: 8.0, until: 10, label: "عدد الخلايا", value: "144 خلية نصفية" },
    ],
  },
  "pylontech-rv12314": {
    src: pylontechVideo.url,
    poster: pylontechPoster,
    cues: [
      { at: 0.5, until: 3.0, label: "الجهد المقنن", value: "12.8 Vdc" },
      { at: 3.0, until: 5.6, label: "سعة الخلايا", value: "314 Ah" },
      { at: 5.6, until: 7.8, label: "سعة البطارية", value: "4019.2 Wh" },
      { at: 7.8, until: 10, label: "عمر الدورات", value: "10000 دورة" },
    ],
  },
  "deye-sun-3-6k-sg04lp1": {
    src: deyeVideo.url,
    poster: deyePoster,
    cues: [
      { at: 0.5, until: 3.2, label: "القدرة المقننة", value: "3 – 6 kW" },
      { at: 3.2, until: 5.4, label: "نوع النظام", value: "Single Phase Hybrid" },
      { at: 5.4, until: 7.4, label: "جهد البطارية", value: "48 Vdc" },
      { at: 7.4, until: 10, label: "أقصى كفاءة تحويل", value: "97.6%" },
    ],
  },
  "hithium-heroee-maxpower-16": {
    src: hithiumVideo.url,
    poster: hithiumPoster,
    cues: [
      { at: 0.5, until: 3.0, label: "الجهد المقنن", value: "51.2 V" },
      { at: 3.0, until: 5.6, label: "الطاقة", value: "16.08 kWh" },
      { at: 5.6, until: 7.8, label: "عمر الدورات", value: "11000 دورة" },
      { at: 7.8, until: 10, label: "التوسعة", value: "حتى 16 وحدة على التوازي" },
    ],
  },
  "suntech-stp720s-d66-nsh": {
    src: suntech720Video.url,
    poster: suntech720Poster,
    cues: [
      { at: 0.5, until: 3.4, label: "القدرة القصوى Pmax", value: "720 W" },
      { at: 3.4, until: 6.0, label: "نوع الخلية", value: "N-Type TOPCon ثنائي الوجه" },
      { at: 6.0, until: 8.0, label: "كفاءة اللوح", value: "23.2%" },
      { at: 8.0, until: 10, label: "عدد الخلايا", value: "132 خلية" },
    ],
  },
  "deye-sun-7-6-12k-sg02lp1": {
    src: deye12kVideo.url,
    poster: deye12kPoster,
    cues: [
      { at: 0.5, until: 3.2, label: "القدرة المقننة", value: "7.6 – 12 kW" },
      { at: 3.2, until: 5.4, label: "نوع النظام", value: "Single Phase Hybrid" },
      { at: 5.4, until: 7.4, label: "جهد البطارية", value: "40–60 V" },
      { at: 7.4, until: 10, label: "أقصى كفاءة", value: "97.6%" },
    ],
  },
  "deye-sun-14-20k-sg05lp3": {
    src: deye20kVideo.url,
    poster: deye20kPoster,
    cues: [
      { at: 0.5, until: 3.2, label: "القدرة المقننة", value: "14 – 20 kW" },
      { at: 3.2, until: 5.4, label: "نوع النظام", value: "Three Phase Hybrid — 3L+N+PE" },
      { at: 5.4, until: 7.4, label: "أقصى جهد PV", value: "800 V" },
      { at: 7.4, until: 10, label: "أقصى كفاءة", value: "97.6%" },
    ],
  },
  "deye-sun-29-9-50k-sg01hp3": {
    src: deye50kVideo.url,
    poster: deye50kPoster,
    cues: [
      { at: 0.5, until: 3.2, label: "القدرة المقننة", value: "29.9 – 50 kW" },
      { at: 3.2, until: 5.4, label: "نوع النظام", value: "Three Phase — 3L/N/PE" },
      { at: 5.4, until: 7.4, label: "جهد البطارية", value: "160–800 V" },
      { at: 7.4, until: 10, label: "أقصى كفاءة", value: "97.60%" },
    ],
  },
  "deye-sun-60-80k-sg02hp3": {
    src: deye80kVideo.url,
    poster: deye80kPoster,
    cues: [
      { at: 0.5, until: 3.2, label: "القدرة المقننة", value: "60 – 80 kW" },
      { at: 3.2, until: 5.4, label: "نوع النظام", value: "Three Phase Hybrid — 3L+N+PE" },
      { at: 5.4, until: 7.4, label: "جهد البطارية", value: "160–1000 V" },
      { at: 7.4, until: 10, label: "أقصى كفاءة", value: "97.60%" },
    ],
  },
  "solis-s6-eh2p-5-8k": {
    src: solis8kVideo.url,
    poster: solis8kPoster,
    cues: [
      { at: 0.5, until: 3.2, label: "القدرة المقننة", value: "5 – 8 kW" },
      { at: 3.2, until: 5.4, label: "نوع النظام", value: "Split Phase — L+N+PE/2L+PE" },
      { at: 5.4, until: 7.4, label: "جهد البطارية", value: "40–60 V" },
      { at: 7.4, until: 10, label: "أقصى كفاءة", value: "96.0%" },
    ],
  },
  "solis-s6-eh3p-12-20k-h": {
    src: solis20kVideo.url,
    poster: solis20kPoster,
    cues: [
      { at: 0.5, until: 3.2, label: "القدرة المقننة", value: "12 – 20 kW" },
      { at: 3.2, until: 5.4, label: "نوع النظام", value: "Three Phase — 3/N/PE، 230/400V" },
      { at: 5.4, until: 7.4, label: "جهد البطارية", value: "120–800 V" },
      { at: 7.4, until: 10, label: "أقصى كفاءة", value: "97.7%" },
    ],
  },
  "solis-s6-eh3p-29-9-50k-h": {
    src: solis50kVideo.url,
    poster: solis50kPoster,
    cues: [
      { at: 0.5, until: 3.2, label: "القدرة المقننة", value: "29.9 – 50 kW" },
      { at: 3.2, until: 5.4, label: "نوع النظام", value: "Three Phase — 3/N/PE، 230/400V" },
      { at: 5.4, until: 7.4, label: "جهد البطارية", value: "150–800 V" },
      { at: 7.4, until: 10, label: "أقصى كفاءة", value: "97.8%" },
    ],
  },
  "solis-s6-eh3p-75-125k": {
    src: solis125kVideo.url,
    poster: solis125kPoster,
    cues: [
      { at: 0.5, until: 3.2, label: "القدرة المقننة", value: "75 – 125 kW" },
      { at: 3.2, until: 5.4, label: "نوع النظام", value: "Three Phase — 3/N/PE، 230/400V" },
      { at: 5.4, until: 7.4, label: "جهد البطارية", value: "300–950 V" },
      { at: 7.4, until: 10, label: "أقصى كفاءة", value: "97.5%" },
    ],
  },
  "lipower-2012emh": {
    src: lipower2012Video.url,
    poster: lipower2012Poster,
    cues: [
      { at: 0.5, until: 3.2, label: "القدرة المقننة", value: "1600 W" },
      { at: 3.2, until: 5.4, label: "نوع النظام", value: "Single Phase Hybrid" },
      { at: 5.4, until: 7.4, label: "أقصى قدرة PV", value: "2000 W" },
      { at: 7.4, until: 10, label: "نوع الشحن الشمسي", value: "MPPT — 30–500 Vdc" },
    ],
  },
  "lipower-bz4024smhgw": {
    src: lipower4kVideo.url,
    poster: lipower4kPoster,
    cues: [
      { at: 0.5, until: 3.2, label: "القدرة المقننة (بطارية)", value: "4000 W" },
      { at: 3.2, until: 5.4, label: "نوع النظام", value: "Single Phase Hybrid" },
      { at: 5.4, until: 7.4, label: "أقصى قدرة PV", value: "6500 W" },
      { at: 7.4, until: 10, label: "نوع الشحن الشمسي", value: "MPPT — 60–500 Vdc" },
    ],
  },
  "pylontech-rv12100ch": {
    src: pylon100Video.url,
    poster: pylon100Poster,
    cues: [
      { at: 0.5, until: 3.2, label: "السعة", value: "100 Ah" },
      { at: 3.2, until: 5.4, label: "الطاقة", value: "1280 Wh" },
      { at: 5.4, until: 7.4, label: "الجهد", value: "12.8 VDC" },
      { at: 7.4, until: 10, label: "نوع البطارية", value: "LiFePO4" },
    ],
  },
  "pylontech-rv12200": {
    src: pylon200Video.url,
    poster: pylon200Poster,
    cues: [
      { at: 0.5, until: 3.2, label: "السعة", value: "200 Ah" },
      { at: 3.2, until: 5.4, label: "الجهد", value: "12.8 VDC" },
      { at: 5.4, until: 7.4, label: "نوع البطارية", value: "LiFePO4" },
      { at: 7.4, until: 10, label: "دورة الحياة", value: ">4000" },
    ],
  },
  "pylontech-fidus-battery-plus": {
    src: fidusVideo.url,
    poster: fidusPoster,
    cues: [
      { at: 0.5, until: 3.2, label: "السعة الاسمية", value: "16076 Wh" },
      { at: 3.2, until: 5.4, label: "الجهد", value: "51.2 Vdc" },
      { at: 5.4, until: 7.4, label: "عمق التفريغ", value: "100%" },
      { at: 7.4, until: 10, label: "دورة الحياة", value: "8000 (25 °C)" },
    ],
  },
  "pylontech-optimus-a300-hy": {
    src: optimusA300Video.url,
    poster: optimusA300Poster,
    cues: [
      { at: 0.4, until: 2.4, label: "السعة الاسمية", value: "313 kWh" },
      { at: 2.4, until: 4.0, label: "الإنفرتر الهجين المدمج", value: "50 kW" },
      { at: 4.0, until: 5.2, label: "عمر الدورات", value: "أكثر من 7000 دورة" },
      { at: 5.2, until: 7.0, label: "الأبعاد الحقيقية", value: "1500 × 1300 × 2200 mm — 3.5 طن" },
    ],
  },
  "hithium-heroee-legend-112c": {
    src: legend112cVideo.url,
    poster: legend112cPoster,
    cues: [
      { at: 0.4, until: 2.2, label: "الطاقة الاسمية", value: "112.5 kWh" },
      { at: 2.2, until: 3.8, label: "الجهد الاسمي", value: "358.4 V" },
      { at: 3.8, until: 5.0, label: "عمر الدورات", value: "11000 دورة" },
      { at: 5.0, until: 6.5, label: "الأبعاد الحقيقية", value: "900 × 1000 × 2280 mm — 1400 kg" },
    ],
  },
  "pylontech-optimus-l260-hy": {
    src: optimusL260Video.url,
    poster: optimusL260Poster,
    cues: [
      { at: 0.4, until: 2.2, label: "السعة الاسمية", value: "261 kWh" },
      { at: 2.2, until: 3.8, label: "الإنفرتر الهجين المدمج", value: "125 kW" },
      { at: 3.8, until: 5.0, label: "نوع التبريد", value: "تبريد سائل" },
      { at: 5.0, until: 6.5, label: "الأبعاد الحقيقية", value: "1400 × 2180 × 1300 mm — أقل من 3 طن" },
    ],
  },
  "pylontech-powercube-m5a": {
    src: cubeM5aVideo.url,
    poster: cubeM5aPoster,
    cues: [
      { at: 0.5, until: 3.2, label: "سعة الوحدة", value: "15.68 kWh" },
      { at: 3.2, until: 5.4, label: "جهد تشغيل النظام", value: "0~1500 Vdc" },
      { at: 5.4, until: 7.4, label: "عدد الوحدات", value: "1~21" },
      { at: 7.4, until: 10, label: "كفاءة الدورة الكاملة (1C)", value: "96%" },
    ],
  },
  "pylontech-powercube-m1c": {
    src: cubeM1cVideo.url,
    poster: cubeM1cPoster,
    cues: [
      { at: 0.5, until: 3.2, label: "سعة الوحدة", value: "4.74 kWh" },
      { at: 3.2, until: 5.4, label: "جهد تشغيل النظام", value: "0~1000 Vdc" },
      { at: 5.4, until: 7.4, label: "عدد الوحدات", value: "1~23" },
      { at: 7.4, until: 10, label: "دورة الحياة", value: "7000" },
    ],
  },
};

export function getProductVideo(productId: string): ProductVideo | null {
  return PRODUCT_VIDEOS[productId] ?? null;
}

/** ينطق الوحدات والرموز الهندسية بالعربية حتى يقرأها التعليق الصوتي سليمة. */
function spokenValue(raw: string) {
  return raw
    .replace(/(\d)\s*~\s*(\d)/g, "$1 إلى $2")
    .replace(/(\d)\s*[–-]\s*(\d)/g, "$1 إلى $2")
    .replace(/>\s*/g, "أكثر من ")
    .replace(/([\d.,]+)\s*\+/g, "أكثر من $1")
    .replace(/\bkWh\b/gi, "كيلو واط ساعة")
    .replace(/\bWh\b/gi, "واط ساعة")
    .replace(/\bkW\b/g, "كيلو واط")
    .replace(/\bW\b/g, "واط")
    .replace(/\bAh\b/gi, "أمبير ساعة")
    .replace(/\bVdc\b/gi, "فولت تيار مستمر")
    .replace(/\bV\b/g, "فولت")
    .replace(/°\s*C/g, "درجة مئوية")
    .replace(/%/g, " بالمئة")
    .replace(/\bSingle Phase Hybrid\b/gi, "هجين أحادي الطور")
    .replace(/\bSingle Phase\b/gi, "أحادي الطور")
    .replace(/\bThree Phase\b/gi, "ثلاثي الأطوار")
    .replace(/\bHybrid\b/gi, "هجين")
    .replace(/\bLiFePO4\b/gi, "ليثيوم فوسفات الحديد")
    .replace(/\bN-Type TOPCon\b/gi, "خلايا توبكون من النوع إن")
    .replace(/\bPmax\b/gi, "")
    .replace(/زجاج\s*[-–]?\s*زجاج/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** أسماء العلامات كما تُنطق بالعربية في التعليق الصوتي. */
function spokenName(raw: string) {
  return spokenValue(
    raw
      .replace(/\bSuntech\b/gi, "سن تك")
      .replace(/\bDeye\b/gi, "داي")
      .replace(/\bSolis\b/gi, "سوليس")
      .replace(/\bLi-?Power\b/gi, "لي باور")
      .replace(/\bPylontech\b/gi, "بايلونتك")
      .replace(/\bHiTHIUM\b/gi, "هاي ثيوم")
      .replace(/\bHeroEE\b/gi, "هيرو إي إي")
      .replace(/\bMaxPower\b/gi, "ماكس باور")
      .replace(/\bNeoPower\b/gi, "نيو باور")
      .replace(/\bPowerCube\b/gi, "باور كيوب")
      .replace(/\bFidus Battery Plus\b/gi, "فيدوس باتري بلس")
      .replace(/\bSplit Phase\b/gi, "طور مجزّأ")
      .replace(/[()]/g, " ")
      .replace(/\s*\/\s*/g, " ")
  );
}

/**
 * صيغة الموديل المناسبة للنطق: نُبسّط الرموز الطويلة والمتعددة إلى وصف سلسلة مفهوم،
 * ونحتفظ بالموديلات القصيرة فقط. القيمة null تعني: لا يُنطق الموديل إطلاقاً.
 * النصوص المكتوبة في الكتالوج والبطاقات تبقى بالرموز الرسمية الكاملة دون تغيير.
 */
const SPOKEN_MODELS: Array<{ match: RegExp; spoken: string | null }> = [
  { match: /^STP595S/i, spoken: "سلسلة إس تي بي 595" },
  { match: /^STP720S/i, spoken: "سلسلة إس تي بي 720" },
  { match: /SG04LP1/i, spoken: "سلسلة إس جي 04" },
  { match: /SG02LP1/i, spoken: "سلسلة إس جي 02" },
  { match: /SG05LP3/i, spoken: "سلسلة إس جي 05 ثلاثية الطور" },
  { match: /SG01HP3/i, spoken: "سلسلة إس جي 01 عالية الجهد" },
  { match: /SG02HP3/i, spoken: "سلسلة إس جي 02 عالية الجهد" },
  { match: /^S6-EH2P/i, spoken: "سلسلة إس 6 إي إتش 2 بي" },
  { match: /^S6-EH3P/i, spoken: "سلسلة إس 6 إي إتش 3 بي" },
  { match: /^2012EMH/i, spoken: "موديل 2012" },
  { match: /^BZ4024/i, spoken: "موديل بي زد 4024" },
  { match: /^BZ6248/i, spoken: "موديل بي زد 6248" },
  { match: /^RV12100/i, spoken: "موديل آر في 12100" },
  { match: /^RV12200/i, spoken: "موديل آر في 12200" },
  { match: /^NeoPower/i, spoken: "موديل نيو باور 4 الجيل الثاني" },
  { match: /^FB-L-16/i, spoken: "سلسلة إف بي إل 16" },
  { match: /^PowerCube-M5A/i, spoken: "سلسلة باور كيوب إم 5 إيه" },
  { match: /^PowerCube-M1C/i, spoken: "سلسلة باور كيوب إم 1 سي" },
  { match: /^HeroEE MaxPower/i, spoken: null },
  { match: /^A300-HY/i, spoken: "أوبتيموس إيه 300 هايبرد" },
  { match: /LEGEND\s*112C/i, spoken: "ليجند 112 سي" },
  { match: /^L260-HY/i, spoken: "أوبتيموس إل 260 هايبرد" },
];

/** الموديل بصيغة منطوقة سلسة، أو null إذا كان من الأفضل عدم نطقه. */
function spokenModel(model: string) {
  const hit = SPOKEN_MODELS.find((m) => m.match.test(model.trim()));
  if (hit) return hit.spoken;
  // موديل غير معروف: ننطقه فقط إذا كان قصيراً وبلا رموز مزدحمة.
  const clean = model.trim();
  if (clean.length <= 12 && !/[/()+–]/.test(clean)) return `موديل ${clean}`;
  return null;
}

/** كلمة نوع المنتج كما تُنطق. */
const KIND_WORD: Record<string, string> = {
  panels: "لوح شمسي",
  inverters: "إنفرتر",
  batteries: "بطارية ليثيوم",
  storage: "نظام تخزين طاقة",
};

/** هل تدل المواصفة على القدرة/السعة؟ نحذفها من النطق لأنها ذُكرت مرة واحدة في المقدمة. */
function isPowerCue(label: string) {
  return /قدرة|سعة|الطاقة|Pmax/i.test(label);
}

/**
 * التعليق المصاحب للفيديو — مختصر جداً: جملة واحدة تجمع النوع والعلامة والموديل
 * والقدرة (مرة واحدة فقط)، ثم أهم مواصفتين فقط كما تظهر على الشاشة.
 * الفائدة العملية ولمن يناسب المنتج تُنطق بعد نهاية الفيديو.
 */
export function videoIntroNarration(
  p: { brand: string; model: string; power: string; category: string },
  video: ProductVideo,
) {
  const kind = KIND_WORD[p.category] ?? "منتج";
  const brand = spokenName(p.brand);
  const model = spokenModel(p.model);
  const power = spokenValue(p.power);
  const powerWord = p.category === "batteries" || p.category === "storage" ? "بسعة" : "بقدرة";
  const head = `${kind} ${brand}${model ? ` ${model}` : ""}، ${powerWord} ${power}`;
  const specs = video.cues
    .filter((c) => !isPowerCue(c.label))
    .slice(0, 2)
    .map((c) => `${c.label.replace(/\bPmax\b/gi, "").trim()} ${spokenValue(c.value)}`)
    .join("، ");
  return specs ? `${head}، ${specs}.` : `${head}.`;
}

/**
 * التعليق بعد نهاية الفيديو — مكمّل لا مكرِّر: جملة أو جملتان عن الفائدة العملية
 * وأين يُركّب ولمن يناسب، بلا أي رقم أو قدرة سبق ذكرها في الفيديو.
 */
export function afterVideoNarration(p: {
  uses?: string[];
  suitableFor?: string;
  features?: string[];
}) {
  const clean = (s: string) =>
    s.replace(/[\d٠-٩]+[^،.]*/g, "").replace(/\s{2,}/g, " ").replace(/^[،\s]+|[،\s]+$/g, "").trim();
  const uses = (p.uses ?? []).map(clean).filter((u) => u.length > 2).slice(0, 3).join("، ");
  const suitable = clean(p.suitableFor ?? "");
  const feature = (p.features ?? []).map(clean).find((f) => f.length > 6) ?? "";
  const first = uses ? `حل مناسب لـ ${uses}.` : suitable ? `${suitable}.` : "";
  const second = feature ? `${feature}.` : uses && suitable ? `${suitable}.` : "";
  return [first, second].filter(Boolean).join(" ").replace(/\.\./g, ".");
}


/** نص التعليق الصوتي العربي لفيديو المنتج: الاسم ثم أهم المواصفات كما في الكتالوج. */
export function videoNarration(title: string, video: ProductVideo) {
  const [rawName, rawModel] = title.split("—").map((p) => p.trim());
  const name = spokenName(rawName ?? "");
  const model = rawModel ? spokenModel(rawModel) : null;
  const head = model ? `${name}، ${model}.` : `${name}.`;
  const specs = video.cues
    .map((c) => `${c.label.replace(/\bPmax\b/gi, "").trim()} ${spokenValue(c.value)}`)
    .join("، ");
  return `${head} ${specs}.`;
}

