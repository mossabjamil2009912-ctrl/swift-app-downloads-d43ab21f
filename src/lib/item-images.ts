// صور حقيقية لأصناف «طلب صنف محدد» — مصدر كل صورة هو صور الكتالوج الرسمية المستخدمة في «تعرف على منتجاتنا».
// لا تُضاف صورة إلا لصنف يطابق موديلاً موثقاً في الكتالوج؛ لا صور للقوائم/الفئات ولا صور تقريبية.
import p3 from "@/assets/products/p3.webp";
import p8 from "@/assets/products/p8.webp";
import p9 from "@/assets/products/p9.webp";
import p11 from "@/assets/products/p11.webp";
import p12 from "@/assets/products/p12.webp";
import p13 from "@/assets/products/p13.webp";
import p15 from "@/assets/products/p15.webp";
import p16 from "@/assets/products/p16.webp";
import p18 from "@/assets/products/p18.webp";
import p19 from "@/assets/products/p19.webp";
import p2 from "@/assets/products/p2.webp";
import lithium12v314ah from "@/assets/products/lithium-12v-314ah.png.asset.json";
import fidus16 from "@/assets/products/pylontech-fidus-battery-plus.png";

/** صورة كل صنف، بحسب اسمه كما يظهر في القائمة (بدون كود الموديل بين قوسين). */
const ITEM_IMAGES: Record<string, string> = {
  "لوح سنتك N-Type 595 وات": p8,
  "لوح سنتك N-Type 720 وات": p9,

  "إنفرتر 1.6 كيلو سنجل فاز": p15,
  "إنفرتر 6.2 كيلو سنجل فاز": p16,
  "إنفرتر 8 كيلو سنجل فاز": p13,
  "إنفرتر 12 كيلو سنجل فاز": p13,
  "إنفرتر 12 كيلو ثري فاز": p18,
  "إنفرتر 16 كيلو ثري فاز": p11,
  "إنفرتر 20 كيلو ثري فاز": p11,
  "إنفرتر دايا هايبرد 50 كيلو ثري فاز": p12,
  "إنفرتر سوليز هايبرد 50 كيلو ثري فاز": p19,

  "بطارية ليثيوم 1.28 كيلو": p2,
  "بطارية ليثيوم 2.56 كيلو": p3,
  "بطارية ليثيوم 4 كيلو": lithium12v314ah.url,
  "بطارية ليثيوم 16 كيلو": fidus16,
};


const TASHKEEL = /[\u064B-\u0652]/g;

function normalize(text: string): string {
  return text
    .replace(TASHKEEL, "")
    .replace(/\s*\([^)]*\)\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** صورة الصنف إن وُجدت صورة حقيقية معتمدة له، وإلا undefined (لا صور للقوائم/الفئات). */
export function itemImage(title: string): string | undefined {
  return ITEM_IMAGES[normalize(title)];
}

