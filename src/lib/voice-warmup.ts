// تخزين تدريجي للأصوات: نحضّر أصوات الشاشات دفعة بعد دفعة في الخلفية،
// ونحفظ مكان التوقف حتى تكتمل كل الأصوات عبر الجلسات، فينطلق الصوت فوراً بلا تأخير.
import { currentLang, type Lang } from "@/lib/i18n";
import { MANY_OPTIONS, SCRIPTS, WELCOME } from "@/lib/voice-scripts";
import { composeScreenSpeech, isVoiceOn, isVoicePlatform, prepareSpeech } from "@/lib/voice-guide";

const BATCH = 6;
const GAP = 2200;
const FIRST_DELAY = 1200;

// شاشات المسار الأساسي: تُحضَّر أصواتها أولاً لأن العميل يمرّ بها في أول ثوانٍ من الاستخدام.
const PRIORITY = [
  "welcome_services",
  "quote_menu",
  "energy_menu",
  "menu_sys3",
  "main_menu",
  "item_menu",
  "res_bill",
  "res_browse_inv",
  "res_browse",
  "res_value",
  "res_quote_ask",
  "res_quote_ask_browse",
  "com_method",
  "com_value",
  "com_phase_ask",
  "agr_bill",
  "ind_activity",
  "buy_ask",
  "plan_pick",
  "pay_method",
];

function progressKey(lang: Lang) {
  return `actes-voice-warm-v2-${lang}`;
}

function readProgress(lang: Lang) {
  try {
    return Number(localStorage.getItem(progressKey(lang)) || "0") || 0;
  } catch {
    return 0;
  }
}

function saveProgress(lang: Lang, idx: number) {
  try { localStorage.setItem(progressKey(lang), String(idx)); } catch { /* تجاهل */ }
}

/** كل النصوص المنطوقة الثابتة لهذه اللغة، بنفس صياغتها على الشاشة، وشاشات المسار الأساسي أولاً. */
function allTexts(lang: Lang): string[] {
  const out: string[] = [WELCOME[lang], composeScreenSpeech([WELCOME[lang]], lang)];
  const keys = [
    ...PRIORITY.filter((k) => SCRIPTS[k]),
    ...Object.keys(SCRIPTS).filter((k) => !PRIORITY.includes(k)),
  ];
  for (const key of keys) {
    const script = SCRIPTS[key];
    const text = script?.[lang];
    if (!script || !text) continue;
    out.push(composeScreenSpeech([text], lang));
    if (!script.input) out.push(composeScreenSpeech([text, MANY_OPTIONS[lang]], lang));
  }
  return [...new Set(out.filter((t) => t && t.trim()))];
}

let timer: ReturnType<typeof setTimeout> | null = null;
let running = false;

function schedule(delay: number) {
  if (timer !== null) clearTimeout(timer);
  timer = setTimeout(tick, delay);
}

function tick() {
  timer = null;
  if (!isVoiceOn()) { schedule(GAP * 4); return; }
  const lang = currentLang();
  const list = allTexts(lang);
  let idx = readProgress(lang);
  if (idx >= list.length) { schedule(GAP * 4); return; }
  // التحضير يمرّ في طابور واحد داخل النطق، فلا يُثقل الشاشة ولا الشبكة.
  for (let i = 0; i < BATCH && idx < list.length; i++, idx++) {
    const text = list[idx];
    if (text) prepareSpeech(text, true);
  }

  saveProgress(lang, idx);
  schedule(GAP);
}

/** يبدأ التخزين التدريجي للأصوات في الخلفية بعد استقرار التطبيق. */
export function startVoiceWarmup() {
  if (running || typeof window === "undefined" || !isVoicePlatform()) return;
  running = true;
  // كل دفعة تقرأ اللغة الحالية، فتتابع لغة المستخدم فور تغييرها.
  schedule(FIRST_DELAY);
}

