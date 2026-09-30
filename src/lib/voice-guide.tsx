import { currentLang, translateText, type Lang } from "@/lib/i18n";
import { prepareArabicSpeech } from "@/lib/ar-lexicon";
import { MANY_OPTIONS, OPTIONS_WORD, SCRIPTS, WELCOME } from "@/lib/voice-scripts";
import { buildPvsystStudy } from "@/lib/pvsyst-engine";


const VOICE_KEY = "actes-voice";
const cache = new Map<string, Promise<string | null>>();
let audio: HTMLAudioElement | null = null;
let token = 0;
let aiBlocked = false;
let playbackDone: Promise<void> = Promise.resolve();
let finishPlayback: (() => void) | null = null;

/** الصوت مخصص لنسخة ويندوز/سطح المكتب فقط؛ يُعطَّل تماماً على الأندرويد والهواتف. */
export function isVoicePlatform() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (/Android|iPhone|iPad|iPod|Mobile|wv\)/i.test(ua)) return false;
  return true;
}

export function isVoiceOn() {
  if (!isVoicePlatform()) return false;
  try {
    return localStorage.getItem(VOICE_KEY) !== "off" && localStorage.getItem("actes-click-sound") !== "off";
  } catch {
    return true;
  }
}
export function setVoiceOn(on: boolean) {
  try { localStorage.setItem(VOICE_KEY, on ? "on" : "off"); } catch { /* ignore */ }
  if (!on) stopSpeaking();
}

export const PHRASES = {
  welcome: "أَهْلًا وَسَهْلًا بِكُمْ فِي نِظَامِ أَكْتِسْ لِحُلُولِ الطَّاقَة. نَسْعَدُ بِخِدْمَتِكُمْ وَتَقْدِيمِ الحُلُولِ المُنَاسِبَةِ لِاحْتِيَاجَاتِكُمْ. يُمْكِنُكُمُ الآنَ طَلَبُ عَرْضِ سِعْر، أَوِ اسْتِعْرَاضُ حُلُولِ أَنْظِمَةِ الطَّاقَة، أَوِ التَّوَاصُلُ مَعَ الدَّعْمِ الفَنِّي.",
  home: "طَلَبُ عَرْضِ سِعْر، لِلْحُصُولِ عَلَى عَرْضٍ مُنَاسِبٍ لِمَشْرُوعِك. حُلُولُ أَنْظِمَةِ الطَّاقَة، لِاخْتِيَارِ الحَلِّ المُنَاسِبِ لِلْمَنْزِلِ أَوِ المُنْشَأَة. الدَّعْمُ الفَنِّي، لِمُسَاعَدَتِكَ فِي الاسْتِفْسَارَاتِ وَالمُشْكِلَاتِ الفَنِّيَّة.",
  quote: "طَلَبُ عَرْضِ سِعْر",
  energy: "حُلُولُ أَنْظِمَةِ الطَّاقَة",
  support: "الدَّعْمُ الفَنِّي. كَيْفَ يُمْكِنُنَا مُسَاعَدَتُك؟",
  payment: "اخْتَرْ طَرِيقَةَ الدَّفْع",
  confirmed: "تَمَّ تَأْكِيدُ طَلَبِكَ بِنَجَاح، سَنَتَوَاصَلُ مَعَكَ لِمُتَابَعَةِ التَّنْفِيذ",
  sendFailed: "تَعَذَّرَ إِرْسَالُ الطَّلَب. حَاوِلْ مَرَّةً أُخْرَى",
} as const;

/** مقدمات منطوقة مفهومة لكل خطوة، تُقال قبل الأسئلة والخيارات. */
export const STEP_INTROS: Record<string, string> = {
  quote_menu: "طَلَبُ عَرْضِ سِعْر. اخْتَرْ نَوْعَ النِّظَامِ المُنَاسِبِ لِمَشْرُوعِك",
  energy_menu: "حُلُولُ أَنْظِمَةِ الطَّاقَة. اخْتَرِ الحَلَّ الَّذِي يُنَاسِبُك",
  main_menu: "اخْتَرْ نَوْعَ المَشْرُوع",
  menu_sys3: "اخْتَرْ نَوْعَ المَنْظُومَة",
  menu_res_com: "اخْتَرْ بَيْنَ النِّظَامِ السَّكَنِيِّ وَالتِّجَارِيّ",
  menu_ind_agr: "اخْتَرْ بَيْنَ النِّظَامِ الصِّنَاعِيِّ وَالزِّرَاعِيّ",
  pv_loads: "أَدْخِلِ الحِمْلَ لِكُلِّ سَاعَةٍ مِنْ سَاعَاتِ اليَوْمِ بِالكِيلُووَات",
  pv_sysmode: "مَنْظُومَةً هَجِينَةً مَعَ بَطَّارِيَّات، أَوْ مُتَّصِلَةً بِالشَّبَكَة، أَوْ مُسْتَقِلَّةً بِالكَامِل",
  res_bill: "أَدْخِلْ مُتَوَسِّطَ فَاتُورَتِكَ الشَّهْرِيَّة، أَوْ تَصَفَّحِ المَنْظُومَاتِ الجَاهِزَة",
  res_value: "أَدْخِلْ قِيمَةَ الاسْتِهْلَاك",
  com_method: "كَيْفَ تُرِيدُ تَحْدِيدَ اسْتِهْلَاكِ المُنْشَأَة؟",
  com_value: "أَدْخِلْ قِيمَةَ الاسْتِهْلَاكِ الشَّهْرِيّ، أَوْ قِيمَةَ الفَاتُورَةِ المَعْهُودَةِ لِمُنْشَأَتِك",
  com_phase_ask: "حَدِّدْ نَوْعَ كَهْرَبَاءِ المُنْشَأَة: سِنْجِلْ فِيز، أَوْ ثْرِي فِيز",
  agr_bill: "اكْتُبْ تَكْلِفَةَ الدِّيزِلِ أَوِ الكَهْرَبَاءِ الشَّهْرِيَّةِ لِمَزْرَعَتِك",
  agr_pump_type: "حَدِّدْ طَبِيعَةَ الضَّخِّ أَوِ الرَّيِّ فِي مَزْرَعَتِك",
  agr_pump_power: "أَدْخِلْ قُدْرَةَ الغَاطِسِ أَوِ المَضَخَّةِ بِالحِصَان، أَوِ اخْتَرْ لَا أَعْرِف",
  agr_well_depth: "أَدْخِلْ عُمْقَ الضَّخِّ بِالمِتْر، فَهُوَ يُحَدِّدُ حَجْمَ المَنْظُومَة",
  agr_hours: "كَمْ سَاعَةً تَحْتَاجُ تَشْغِيلَ الضَّخِّ يَوْمِيّاً؟",
  agr_pumps: "كَمْ عَدَدُ المَضَخَّاتِ الَّتِي تُرِيدُ تَشْغِيلَهَا؟",
  agr_source: "حَدِّدْ مَصْدَرَ تَشْغِيلِ الضَّخِّ حَالِيّاً فِي مَزْرَعَتِك",
  agr_diesel: "أَدْخِلْ مُتَوَسِّطَ تَكْلِفَةِ التَّشْغِيلِ الشَّهْرِيَّة، لِتَقْدِيرِ الوَفْر",
  agr_result: "اكْتَمَلَ التَّصْمِيمُ الأَوَّلِيُّ لِمَنْظُومَةِ الضَّخّ. رَاجِعِ المُوَاصَفَاتِ أَمَامَك",
  ind_activity: "حَدِّدْ نَشَاطَ مَصْنَعِكَ الصِّنَاعِيّ، لِتَصْمِيمِ مَنْظُومَةٍ تُنَاسِبُ طَبِيعَةَ الإِنْتَاج",
  ind_shifts: "حَدِّدْ عَدَدَ وَرْدِيَّاتِ التَّشْغِيلِ اليَوْمِيَّة، لِحِسَابِ سِعَةِ البَطَّارِيَّاتِ اللَّازِمَةِ لِلْعَمَلِ اللَّيْلِيّ",
  ind_source: "حَدِّدْ مَصْدَرَ التَّغْذِيَةِ الحَالِيَّ لِمَصْنَعِك: مُوَلِّدَاتُ دِيزِل، شَبَكَةٌ عَامَّة، أَوْ نِظَامٌ مُشْتَرَك",
  ind_load_src: "اخْتَرْ كَيْفِيَّةَ تَقْدِيمِ بَيَانَاتِ الأَحْمَال: رَفْعُ جَدْوَلٍ هَنْدَسِيّ، أَوْ إِدْخَالُ القُدْرَةِ يَدَوِيّاً",
  ind_old_pv: "أَدْخِلْ قُدْرَةَ مَنْظُومَتِكَ القَائِمَةِ بِالكِيلُووَاط، أَوْ تَخَطَّ هَذِهِ الخُطْوَة",
  ind_diesel: "أَدْخِلِ اسْتِهْلَاكَ الدِّيزِلِ اليَوْمِيَّ بِاللِّتْر، لِحِسَابِ مِقْدَارِ الوَفْرِ المَالِيِّ لِمَصْنَعِك",
  ind_result: "اكْتَمَلَ التَّصْمِيمُ الأَوَّلِيُّ لِمَنْظُومَةِ المَصْنَع. رَاجِعِ البَيَانَات",
  res_browse_inv: "حَدِّدْ قُدْرَةَ الإِنْفِرْتَرِ المَطْلُوبَة",
  res_tie: "تَمَّ إِيجَادُ خِيَارَيْنِ لِاسْتِهْلَاكِك: مَنْظُومَةٌ بِتَكْلِفَةٍ اقْتِصَادِيَّة، أَوْ مَنْظُومَةٌ بِسِعَةِ تَخْزِينٍ أَعْلَى",
  com_visit_facility: "أَدْخِلِ اسْمَ المُنْشَأَةِ التِّجَارِيَّةِ لِتَوْثِيقِ طَلَبِ المُعَايَنَةِ المَيْدَانِيَّة",
  plan_pick: "اخْتَرْ بَيْنَ دِرَاسَةِ إِنْتَاجِيَّةِ الطَّاقَة، أَوْ طَلَبِ المُخَطَّطِ التَّنْفِيذِيِّ لِلْمَنْظُومَة",
  pay_method: "حَدِّدْ طَرِيقَةَ التَّحْوِيلِ المُنَاسِبَة: مَحَافِظُ إِلِكْتُرُونِيَّة، أَوْ شَبَكَاتُ صِرَافَةٍ مَحَلِّيَّة",
  pay_notice: "حَوِّلِ المَبْلَغَ لِلْحِسَابِ الظَّاهِرِ أَمَامَك، ثُمَّ اكْتُبْ رَقْمَ الحَوَالَةِ لِتَأْكِيدِ حَجْزِك",
};

// مؤقت الاستقرار: لا ينطلق الصوت إلا بعد ظهور الشاشة واستقرار المستخدم عليها.
let pendingTimer: ReturnType<typeof setTimeout> | null = null;
let pendingFrame: number | null = null;
let pendingKey = "";

function cancelPending() {
  if (pendingTimer !== null) { clearTimeout(pendingTimer); pendingTimer = null; }
  if (pendingFrame !== null && typeof cancelAnimationFrame === "function") { cancelAnimationFrame(pendingFrame); }
  pendingFrame = null;
  if (pendingKey) { if (lastScreen === pendingKey) lastScreen = ""; pendingKey = ""; }
}

export function stopSpeaking() {
  token++;
  cancelPending();
  if (audio) {
    audio.pause();
    try { audio.currentTime = 0; } catch { /* تجاهل */ }
  }
  finishPlayback?.();
  finishPlayback = null;
  playbackDone = Promise.resolve();
  // إيقاف نطق المتصفح الداخلي مؤجَّل: استدعاؤه فوراً يجمّد الواجهة على ويندوز.
  if (typeof window !== "undefined" && window.speechSynthesis?.speaking) {
    setTimeout(() => { try { window.speechSynthesis?.cancel(); } catch { /* تجاهل */ } }, 0);
  }
}



/** تُسقط كلمة «اختر» إذا جاءت آخر الجملة؛ التوجيه للقائمة يكفي دون أمر مباشر في النهاية. */
function stripTrailingPick(text: string): string {
  return text.replace(
    /[\s،,]*ا[\u064B-\u0652]*خ[\u064B-\u0652]*ت[\u064B-\u0652]*ر[\u064B-\u0652]*\s*[.。!؟?]*\s*$/u,
    "",
  );
}

function cleanSpeechText(raw: string) {
  return stripTrailingPick(raw
    .replace(/(?:مثال|Example|e\.g\.|示例|例子)\s*[:：]?[^\n.!؟]*/gi, " ")
    .replace(/[([]?\s*(?:قريب(?:اً|ا)?|Coming Soon|即将推出)\s*[)\]]?/gi, " ")
    .replace(/\s+([.،,!؟?:؛])/g, "$1")
    .replace(/([.،,!؟?:؛]){2,}/g, "$1")
    .replace(/[*_#>•]/g, " ")
    .replace(/\s+/g, " ")
    .trim());
}

/** اسم الشركة بحروف كبيرة يُتهجّى حرفاً حرفاً في النطق الأجنبي، فنكتبه ككلمة واحدة «Actes». */
function fixBrandSpeech(text: string) {
  return text.replace(/ACTES/g, "Actes");
}

function speechText(arabic: string, lang: Lang, localized = false) {
  const source = cleanSpeechText(arabic);
  if (localized) return fixBrandSpeech((lang === "ar" ? prepareArabicSpeech(source) : source).slice(0, 900));
  if (lang === "ar") return prepareArabicSpeech(source).slice(0, 900);
  return fixBrandSpeech(cleanSpeechText(translateText(source.replace(/[\u064B-\u0652]/g, ""), lang)).slice(0, 600));
}

const AUDIO_CACHE = "actes-tts-v6";
// التنظيف يخصّ متصفح العميل فقط؛ داخل الخادم السحابي لا تتوفر caches فنتجاهاه تماماً.
if (typeof window !== "undefined" && typeof caches !== "undefined") {
  void caches.delete("actes-tts-v1").catch(() => {});
  void caches.delete("actes-tts-v2").catch(() => {});
  void caches.delete("actes-tts-v3").catch(() => {});
  void caches.delete("actes-tts-v4").catch(() => {});
  void caches.delete("actes-tts-v5").catch(() => {});
}

/** مفتاح ثابت قصير للنص حتى يُخزَّن الصوت بين الجلسات ويُنطق فوراً في المرات التالية. */
function textHash(text: string) {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  return `${h}-${text.length}`;
}
function cacheUrl(text: string, lang: Lang) {
  return `/__tts-cache/${lang}/${textHash(text)}`;
}

/** مفتاح الملف الصوتي الجاهز المحفوظ داخل التطبيق؛ يستخدمه سكربت التوليد أيضاً. */
export function staticVoiceKey(arabic: string, lang: Lang, localized = true) {
  return `${lang}-${textHash(speechText(arabic, lang, localized))}`;
}

async function loadAudio(text: string, lang: Lang, background = false) {
  const req = cacheUrl(text, lang);




  let store: Cache | null = null;
  try {
    store = typeof caches !== "undefined" ? await caches.open(AUDIO_CACHE) : null;
    const hit = await store?.match(req);
    if (hit) return URL.createObjectURL(await hit.blob());
  } catch { /* تخزين غير متاح */ }

  // صوت الشاشة المعروضة يأخذ أولوية عالية في طابور الشبكة،
  // والتحضير في الخلفية يأخذ أولوية منخفضة حتى لا يزاحمه.
  const r = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, lang }),
    ...(background ? { priority: "low" } : { priority: "high" }),
  } as RequestInit);
  if (!r.ok) {
    if (r.status === 402 || r.status === 403) aiBlocked = true;
    throw new Error(String(r.status));
  }
  const blob = await r.blob();
  try { await store?.put(req, new Response(blob.slice(0, blob.size, blob.type))); } catch { /* تجاهل */ }
  return URL.createObjectURL(blob);
}

function fetchAudio(text: string, lang: Lang, background = false) {
  const key = `${lang}:${text}`;
  let p = cache.get(key);
  if (!p) {
    p = loadAudio(text, lang, background).catch(() => { cache.delete(key); return null; });
    cache.set(key, p);
  }
  return p;
}

// التحضير المسبق يمرّ في ثلاثة مسارات متوازية: أسرع بكثير من طابور واحد،
// ويبقى محدوداً حتى لا تُرفض الطلبات عند إرسالها كلها دفعة واحدة.
const LANES = 3;
const prefetchLanes: Promise<unknown>[] = Array.from({ length: LANES }, () => Promise.resolve());
let laneIndex = 0;

/** Prepares a phrase in the same female voice so a later click can play immediately. */
export function prepareSpeech(arabic: string, localized = false) {
  if (typeof window === "undefined" || !arabic.trim() || aiBlocked || !isVoiceOn()) return;
  const lang = currentLang();
  const text = speechText(arabic, lang, localized);
  if (!text) return;
  const key = `${lang}:${text}`;
  if (cache.has(key)) return;
  const lane = laneIndex % LANES;
  laneIndex++;
  prefetchLanes[lane] = (prefetchLanes[lane] ?? Promise.resolve())
    .then(() => fetchAudio(text, lang, true))
    .catch(() => null);
}

/** مشغّل واحد يُفتح مع أول لمسة، فيبدأ أي نطق لاحق بلا تأخير. */
function player() {
  if (!audio) {
    audio = new Audio();
    audio.preload = "auto";
  }
  return audio;
}

let unlocked = false;
/** يفكّ حظر تشغيل الصوت في المتصفح عند أول تفاعل من المستخدم. */
export function unlockVoice() {
  if (unlocked || typeof window === "undefined" || !isVoicePlatform()) return;
  unlocked = true;
  const el = player();
  if (el.src) return;
  el.muted = true;
  void el.play().then(() => { el.pause(); el.muted = false; }).catch(() => { el.muted = false; });
}

/** آخر نص منطوق، لإعادة سماعه بزر «إعادة السماع» في أي شاشة. */
let lastSpoken = "";
let lastSpokenLocalized = false;
// نص الشاشة المعروضة حالياً؛ زر «إعادة السماع» ينطقه هو، لا آخر صوت سمعه المستخدم.
let screenText = "";

export function hasSpeech() { return !!(screenText || lastSpoken); }

/** يسجّل نص الشاشة المعروضة حالياً حتى يعيده زر إعادة السماع مهما تأخر أو أُلغي نطقها. */
export function setScreenSpeech(text: string) { screenText = text || ""; }

/** يعيد نطق جملة الشاشة المعروضة حالياً من البداية. */
export async function replaySpeech(): Promise<boolean> {
  // ينطق نص الشاشة المعروضة حالياً فقط؛ لا يرتد أبداً إلى آخر صوت قديم.
  const text = screenText || WELCOME[currentLang()];
  if (!text) return false;
  return speak(text, true);
}

/** ينطق النص بالصوت النسائي الوحيد للتطبيق. لا يوجد أي صوت بديل من المتصفح. */
export async function speak(arabic: string, localized = false): Promise<boolean> {
  if (typeof window === "undefined" || !arabic.trim() || !isVoiceOn() || aiBlocked) return false;
  stopSpeaking();
  lastSpoken = arabic;
  lastSpokenLocalized = localized;
  const my = token;
  const lang = currentLang();
  const text = speechText(arabic, lang, localized);
  if (!text) return false;

  // نحجز دور النطق فوراً، قبل جلب الصوت، حتى لا تتداخل جملة تالية مع هذه الجملة.
  let release: () => void = () => {};
  const reserved = new Promise<void>((resolve) => { release = resolve; });
  playbackDone = reserved;
  finishPlayback = release;

  const url = await fetchAudio(text, lang);
  if (my !== token) return false;
  if (!url) { release(); return false; }
  const el = player();
  el.muted = false;
  el.src = url;
  try {
    await el.play();
    el.addEventListener("ended", () => release(), { once: true });
    el.addEventListener("error", () => release(), { once: true });
    return true;
  } catch {
    release();
    return false;
  }
}

/** Waits for the current phrase, but cancels itself if a user action starts newer speech. */
export async function speakAfterCurrent(arabic: string): Promise<boolean> {
  const expectedToken = token;
  await playbackDone;
  if (expectedToken !== token) return false;
  return speak(arabic);
}

let welcomeDone = false;
let lastScreen = "";

// الرجوع للخلف لا يعيد نطق الشاشة: نكتفي بتسجيل نصها ليعمل زر «إعادة السماع» عند طلب المستخدم.
let silentNext = false;

/** يمنع النطق التلقائي للشاشة القادمة (يُستدعى عند الضغط على أي زر رجوع). */
export function silenceNextScreen() {
  silentNext = true;
  stopSpeaking();
}

/** يسجّل نص الشاشة بلا نطق: زر «إعادة السماع» يبقى جاهزاً لنطقه فوراً. */
export function setScreenSpeechSilently(key: string, text: string) {
  if (!text) return;
  stopSpeaking();
  setScreenSpeech(text);
  lastScreen = key;
  // لا نصفّر silentNext هنا: الرجوع يظل صامتاً، والنص المسجّل يعمل فقط عبر زر «إعادة السماع».
}

/** ينطق رسالة الشاشة فور ظهورها؛ التنقل السريع يلغي النطق بصمت. */
export function speakScreen(key: string, text: string) {
  if (!text) return;
  // نسجّل نص الشاشة أولاً حتى يعمل زر «إعادة السماع» على الشاشة المعروضة دائماً.
  setScreenSpeech(text);
  if (silentNext) { silentNext = false; stopSpeaking(); lastScreen = key; return; }
  if (key === lastScreen) return;
  stopSpeaking();
  lastScreen = key;
  pendingKey = "";
  // نبدأ النطق بعد رسم الشاشة الجديدة مباشرة، حتى لا يؤخّر تجهيز الصوت ظهور الشاشة.
  const start = () => { void speak(text, true); };
  if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
    window.requestAnimationFrame(() => window.setTimeout(start, 0));
  } else start();
}

/**
 * نطق شاشة يكمل مباشرة بعد الجملة الجارية بدل أن يقطعها.
 * يُستعمل بعد فيديو المنتج: يواصل الشرح فور انتهاء تعليق الفيديو دون توقف.
 */
export function speakScreenAfterCurrent(key: string, text: string) {
  if (!text) return;
  setScreenSpeech(text);
  if (silentNext) { silentNext = false; stopSpeaking(); lastScreen = key; return; }
  if (key === lastScreen) return;
  lastScreen = key;
  const expected = token;
  void (async () => {
    await playbackDone;
    // إذا بدأ المستخدم نطقاً جديداً في الأثناء، نتخلى عن هذا الدور بهدوء.
    if (expected !== token) return;
    lastScreen = "";
    speakScreen(key, text);
  })();
}

export function prepareWelcome() { prepareSpeech(WELCOME[currentLang()], true); }
/** Speaks the welcome phrase once; retries allowed until playback actually starts. */
export async function speakWelcome() {
  if (welcomeDone) return;
  welcomeDone = true;
  lastScreen = "home";
  setScreenSpeech(WELCOME[currentLang()]);
  const ok = await speak(WELCOME[currentLang()], true);
  if (!ok) welcomeDone = false;
}

/** عند تغيير لغة الواجهة: تُنطق الشاشة المعروضة من جديد باللغة الجديدة. */
export async function respeakScreen(text: string): Promise<boolean> {
  const next = text || screenText || WELCOME[currentLang()];
  if (!next) return false;
  stopSpeaking();
  lastScreen = "";
  setScreenSpeech(next);
  return speak(next, true);
}

const NAV_RE = /^(?:العودة|رجوع|الرئيسية|إغلاق|اغلاق|الإعدادات|تغيير اللغة|عرض المزيد|المزيد|تغيير المحافظة|show more|more|change governorate|back|home|close|settings|language|返回|主页|关闭|设置|语言)|^(?:0|00|back_step)$/i;
const SOON_RE = /قريب(?:اً|ا)?|coming\s*soon|即将推出/i;

function optionLabel(title: string, lang: Lang) {
  // المواصفات المهمة تُكتب بين قوسين (القدرة، السعة) — نُبقي محتواها ونحذف القوسين فقط.
  const unwrap = (s: string) => s.replace(/[([]([^)\]]*)[)\]]/g, " $1 ");
  // أكواد موديلات المصنع بين قوسين (لاتينية/أرقام فقط) تُحذف قبل فك الأقواس.
  const noCodes = (title || "").replace(/[([][^()\[\]\u0621-\u064A]*[)\]]/g, (m) => (/[A-Za-z]/.test(m) && !/^\(\s*\d+(?:\.\d+)?\s*(?:k?W|kWh|Ah|V|A|HP)\s*\)$/i.test(m) ? " " : m));
  // حرف العطف يتبع لغة التطبيق، حتى لا تتسرّب «و» العربية إلى النطق الإنجليزي.
  const andWord = lang === "ar" ? " و" : lang === "zh" ? "、" : " and ";
  let t = unwrap(noCodes)
    .replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF\uFE0F]/gu, " ")
    .replace(/^\s*\d+\s*[-.)—:]*\s*/, "")
    .replace(/[*_#>•|/\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  // الترجمة أولاً لتُطابق مفاتيح القاموس التي تحتوي رمز الجمع، ثم يُستبدل الرمز بحرف العطف.
  if (lang !== "ar") t = unwrap(translateText(t, lang)).replace(/\s+/g, " ").trim();
  return t.replace(/\s*\+\s*/g, andWord).replace(/\s+/g, " ").trim();
}

/** رسالة صوتية واحدة للشاشة: تعريف + ماذا تفعل + الخيارات الفعلية أو ماذا تكتب. نص جاهز بلغة التطبيق. */
let fromResBrowse = false;

export function viewSpeech(view: {
  heading: string;
  sections: { title?: string; lines: string[] }[];
  options?: { id: string; title: string }[];
  needsInput?: boolean;
  inputHint?: string;
}, ctx: { step?: string } = {}) {
  const lang = currentLang();
  let stepKey = ctx.step && /_dist$/.test(ctx.step) ? "loc_dist" : ctx.step;
  // شاشة اختيار المعدات: نطق واحد موحّد «اختر الصنف المطلوب» لكل الأقسام.
  if (stepKey === "com_inv_ask") {
    // تنبيه العميل السكني عند تجاوز استهلاكه أكبر منظومة سكنية وتحويله للتجاري
    const h = `${view.heading || ""} ${view.sections.map((s) => s.lines.join(" ")).join(" ")}`.replace(/[\u064B-\u0652]/g, "");
    if (/أعلى من أكبر منظومة سكنية|اعلى من اكبر منظومة سكنية/.test(h)) stepKey = "res_to_com";
  } else if (stepKey === "res_bill" || stepKey === "res_value") {
    // إدخال غير صحيح: ننبّه العميل بسبب الرفض بدل إعادة نفس الترحيب
    const h = `${view.heading || ""} ${view.sections.map((s) => s.lines.join(" ")).join(" ")}`.replace(/[\u064B-\u0652]/g, "");
    if (/لم نفهم اختيارك|لم نفهم/.test(h)) stepKey = "res_bill_retry";
  } else if (stepKey === "com_value") {
    // نطق مطابق لوحدة القياس التي اختارها العميل (فاتورة / كيلووات / ديزل)
    const h = `${view.heading || ""} ${view.sections.map((s) => s.lines.join(" ")).join(" ")} ${view.inputHint || ""}`.replace(/[\u064B-\u0652]/g, "");
    if (/لم نفهم اختيارك|لم نفهم|بالارقام فقط/.test(h)) stepKey = "com_value_retry";
    else if (/ديزل|لتر/.test(h)) stepKey = "com_value_diesel";
    else if (/كيلووات|كيلو وات|كيلوواط/.test(h)) stepKey = "com_value_kwh";
    else if (/فاتور/.test(h)) stepKey = "com_value_bill";
  } else if (stepKey === "com_quote_ask") {
    // بعد اكتمال حجز الزيارة الميدانية: نؤكد الحجز بدل إعادة وصف المنظومة
    const h = `${view.heading || ""} ${view.sections.map((s) => s.lines.join(" ")).join(" ")}`.replace(/[\u064B-\u0652]/g, "");
    if (/موعد الزيارة الميدانية|الزيارة الميدانية/.test(h)) stepKey = "com_visit_done";
  } else if (stepKey === "ind_shift") {
    // وقت الوردية غير مقروء: ننبّه العميل بصيغة الإدخال الصحيحة
    const h = `${view.heading || ""} ${view.sections.map((s) => s.lines.join(" ")).join(" ")}`.replace(/[\u064B-\u0652]/g, "");
    if (/لم نتمكن من قراءة|لم نفهم/.test(h)) stepKey = "ind_shift_retry";
  } else if (stepKey === "ind_total_kw" || stepKey === "ind_max_mach" || stepKey === "ind_motor_kw" || stepKey === "ind_old_pv") {
    // قدرة غير صحيحة: ننبّه أن الإدخال بالأرقام وبالكيلووات
    const h = `${view.heading || ""} ${view.sections.map((s) => s.lines.join(" ")).join(" ")}`.replace(/[\u064B-\u0652]/g, "");
    if (/لم نفهم اختيارك|لم نفهم/.test(h)) stepKey = "ind_kw_retry";
  } else if (stepKey === "done") {
    // تجاوز احتياج المنشأة للمنظومات الجاهزة: نطمئن العميل بتصميم هندسي خاص
    const h = `${view.heading || ""} ${view.sections.map((s) => s.lines.join(" ")).join(" ")}`.replace(/[\u064B-\u0652]/g, "");
    if (/تصميما هندسيا خاصا|تصميماً هندسياً خاصاً|المهندس المختص/.test(h)) stepKey = "ind_out_of_range";
    else if (/نعتذر منك|الموظف المختص|غير معتمد/.test(h)) stepKey = "com_out_of_range";
    // شاشة استلام إشعار التحويل: نطق مخصص لطمأنة العميل بعد إرسال الإشعار
    else if (/استلام اشعار التحويل|استلام إشعار التحويل|استلام اشعارك|استلام إشعارك/.test(h)) stepKey = "pay_notice_done";
  } else if (stepKey === "item_cart") {
    // تلخيص السلة: عدد الأصناف فقط دون سرد الأسعار أو الكميات (العميل يراها في الشاشة)
    const n = view.sections.flatMap((s) => s.lines).filter((l) => /^\s*\d+\s*[*\-–—.)]/.test(l)).length;
    if (n > 0) {
      if (lang === "en") return `Your cart has ${n} item${n === 1 ? "" : "s"}. Review it, then continue to the quote`;
      if (lang === "zh") return `清单中有${n}项产品。核对后可继续申请报价`;
      const word = n === 1 ? "صِنْفٌ وَاحِد" : n === 2 ? "صِنْفَيْن" : n <= 10 ? `${n} أَصْنَاف` : `${n} صِنْفاً`;
      return `سَلَّةُ الطَّلَبِ تَحْتَوِي عَلَى ${word}. رَاجِعِ السَّلَّةَ ثُمَّ تَابِعْ لِعَرْضِ السِّعْر`;
    }
  }
  // مسار «المنظومات الجاهزة»: نطق خاص لشاشة المنظومة المقترحة
  if (stepKey === "res_browse_inv" || stepKey === "res_browse") fromResBrowse = true;
  else if (stepKey === "res_bill" || stepKey === "res_value" || stepKey === "res_tie" || stepKey === "res_bill_retry") fromResBrowse = false;
  if (stepKey === "res_quote_ask" && fromResBrowse) stepKey = "res_quote_ask_browse";
  // قدرة الإنفرتر المختارة تُنطق داخل شاشة المنظومات الجاهزة
  let invKw = "";
  if (stepKey === "res_browse") {
    const h = `${view.heading || ""} ${view.sections.map((s) => s.lines.join(" ")).join(" ")}`;
    const m = h.match(/(\d+(?:[.,]\d+)?)\s*(?:كيلو|كِيلُو|kW)/i);
    if (m && m[1]) invKw = m[1].replace(",", ".");
  }
  const script = stepKey ? (SCRIPTS[stepKey] ?? SCRIPTS[`${stepKey}_gov`]) : undefined;
  const parts: string[] = [];
  if (script) {
    if (!script[lang]) return "";
    const raw = String(script[lang]);
    parts.push(invKw
      ? raw.replace(/\{kw\}/g, invKw)
      : raw.replace(/\s*مَعَ إِنْفِرْتَر \{kw\} كِيلُو وَاط/, "").replace(/\s*that suit a \{kw\} kilowatt inverter/, "").replace(/与\{kw\}千瓦逆变器匹配的/, ""));

  } else {
    const head = optionLabel(view.heading || "", lang);
    if (head) parts.push(head);
    const last = view.sections[view.sections.length - 1];
    const q = last?.lines.map((l) => l.trim()).filter((l) => l && !/^\d+\s*[-.)—]/.test(l) && !SOON_RE.test(l) && !/مثال|example|示例/i.test(l)).slice(-1)[0];
    if (q && q.length < 140) parts.push(lang === "ar" ? cleanSpeechText(q) : cleanSpeechText(translateText(q, lang)));
  }
  const opts = [...new Set((view.options || [])
    .filter((o) => !NAV_RE.test((o.title || "").trim()) && !SOON_RE.test(o.title || ""))
    .map((o) => optionLabel(o.title, lang))
    .filter(Boolean))];
  const sep = lang === "zh" ? "、" : lang === "ar" ? "، " : ", ";
  const scriptText = script ? String((script as Record<string, unknown>)[lang] || "") : "";
  const isYesNo = opts.length === 2 && opts.every((o) => /^(نعم|لا|yes|no|是|否)$/i.test(o.replace(/[\u064B-\u0652]/g, "").trim()));
  const saysPick = /القَائِمَة|القائمة|list|列表/i.test(scriptText);
  // شاشات المفاضلة والتصفح والقدرات: الأسماء والأسعار والموديلات تُقرأ بالعين لا بالأذن.
  const silentOpts = stepKey === "res_tie" || stepKey === "res_browse" || stepKey === "res_browse_inv"
    || stepKey === "com_inv_ask" || stepKey === "com_visit_ask"
    // شاشة نوع الطلب وشاشة طريقة الحساب: أسماء الأزرار تُقرأ من الشاشة ولا تُنطق.
    || stepKey === "quote_menu" || stepKey === "com_method" || stepKey === "pay_notice_done"
    // شاشة نوع التوصيل الكهربائي: أسماء الأزرار Single/Three Phase تُقرأ من الشاشة ولا تُنطق.
    || stepKey === "com_phase_ask"
    // شاشة اختيار المعدات: أسماء الأصناف وأسعارها تُقرأ من الشاشة ولا تُنطق.
    || stepKey === "item_pick"
    // المسار الصناعي: قوائم الأنشطة والمصادر والأهداف وخيارات التصميم تُقرأ من الشاشة.
    || stepKey === "ind_activity" || stepKey === "ind_source" || stepKey === "ind_goal"
    || stepKey === "ind_shifts" || stepKey === "ind_load_src" || stepKey === "ind_result"
    // المسار الزراعي: أنواع الضخ والمصادر وخيارات النتيجة تُقرأ من الشاشة.
    || stepKey === "agr_pump_type" || stepKey === "agr_source" || stepKey === "agr_result";
  // لا نسرد أسماء الأزرار التي يراها المستخدم؛ نكتفي بتوجيهه للقائمة إلا في خيارين فقط.
  if (silentOpts) { /* الصوت يكتفي بالعبارة التوجيهية */ }
  else if (opts.length > 2) { if (!saysPick) parts.push(MANY_OPTIONS[lang]); }
  else if (opts.length > 1 && !script?.input && !isYesNo) parts.push(`${OPTIONS_WORD[lang]}: ${opts.join(sep)}`);

  else if (!opts.length && !script && view.needsInput && view.inputHint) parts.push(cleanSpeechText(lang === "ar" ? view.inputHint : translateText(view.inputHint, lang)));
  return composeScreenSpeech(parts, lang);
}

/** يبني نص الشاشة النهائي من أجزائه بنفس الطريقة دائماً، ليتطابق مع الصوت المُخزَّن مسبقاً. */
export function composeScreenSpeech(parts: string[], lang: Lang) {
  const end = lang === "zh" ? "。" : ". ";
  return stripTrailingPick(parts.filter(Boolean).map((p) => p.replace(/[.。،,\s]+$/, "")).join(end).slice(0, 800));
}


/** شاشة النتيجة/عرض السعر: خلاصة مختصرة — الإجمالي وتنبيه لجدول المواصفات والخطوة التالية. */
export function quoteSpeech(quote: {
  number: string;
  customer?: string;
  items: { name: string; qty: number }[];
  total: number;
  fileName?: string;
}, opts?: { residential?: boolean; lang?: Lang }): string {
  const lang = opts?.lang ?? currentLang();
  const total = Number(quote.total);
  const t = Number.isFinite(total) && total > 0 ? Math.round(total) : 0;
  // عرض المنظومة السكنية يأتي ببنود مفصّلة (ألواح وإنفرتر وبطارية)، فنستدل عليه باسم الملف أيضاً.
  const isSystem = /منظومة|نظام|system|系统/i.test(quote.fileName || "")
    || quote.items.some((it) => /منظومة|نظام|system|系统/i.test(it.name || ""))
    || (quote.items.some((it) => /لوح|panel/i.test(it.name || ""))
      && quote.items.some((it) => /انفرتر|إنفرتر|inverter/i.test(it.name || "")));
  // نص قصير جداً: كل ثانية إضافية في النص تعني انتظاراً أطول لتوليد الصوت،
  // والأزرار الأربعة معروضة أمام العميل فلا حاجة لسردها صوتياً.
  const tailAr = "يُمْكِنُكَ مُتَابَعَةُ الشِّرَاءِ أَوِ اخْتِيَارُ مَا تُرِيدُ مِنَ الأَزْرَار";
  const tailEn = "You can continue the purchase or pick any option shown";
  const tailZh = "您可以继续购买或选择下方任一选项";
  // لا نهجّي رقم العرض ولا نسرد الأصناف ومواصفاتها؛ المستخدم يراها في الجدول أمامه.
  if (lang === "en") return [
    isSystem ? "Your system quote is ready" : "Your items quote is ready",
    t ? `at ${t} dollars` : "",
    tailEn,
  ].filter(Boolean).join(", ").replace(/, You can/, ". You can");
  if (lang === "zh") return [
    isSystem ? "您的系统报价已准备好" : "您的产品报价已准备好",
    t ? `总价${t}美元` : "",
    tailZh,
  ].filter(Boolean).join("，");
  return [
    isSystem ? "عَرْضُ سِعْرِ المَنْظُومَةِ جَاهِز" : "عَرْضُ سِعْرِ الأَصْنَافِ جَاهِز",
    t ? `بِمَبْلَغِ ${t} دُولَار` : "",
    tailAr,
  ].filter(Boolean).join(". ").slice(0, 600);

}


/** نطق مختصر لشاشة دراسة PVsyst: أهم رقمين ثم الأزرار المتاحة. */
export function studySpeech(study: {
  params: Record<string, unknown> | null;
  number: string;
  customer: string;
  city: string;
  monthlyConsumption: string;
}): string {
  const lang = currentLang();
  const r = buildPvsystStudy(study.params, {
    city: study.city,
    customer: study.customer,
    reference: study.number,
    monthlyConsumption: study.monthlyConsumption,
  });
  const annual = r?.annualEnergy ? Math.round(r.annualEnergy) : 0;
  const pr = r?.annualPr ? Math.round(r.annualPr * 1000) / 10 : 0;
  if (lang === "en") return [
    "Your PVsyst simulation study is ready",
    annual ? `Annual production about ${annual} kilowatt hours` : "",
    pr ? `with a performance ratio of ${pr} percent` : "",
    "You can download the full report, continue the purchase, go back to the quote, or request the SLD diagram",
  ].filter(Boolean).join(". ");
  if (lang === "zh") return [
    "您的PVsyst模拟研究已准备好",
    annual ? `年发电量约${annual}千瓦时` : "",
    pr ? `性能比${pr}%` : "",
    "您可以下载完整报告、继续购买、返回报价，或申请SLD图纸",
  ].filter(Boolean).join("，");
  return [
    "دِرَاسَةُ المُحَاكَاةِ الشَّمْسِيَّةِ جَاهِزَة",
    annual ? `الإِنْتَاجُ السَّنَوِيُّ حَوَالِي ${annual} كِيلُو وَاط سَاعَة` : "",
    pr ? `وَمُعَامِلُ الأَدَاءِ ${pr} بِالمِئَة` : "",
    "يُمْكِنُكَ تَحْمِيلُ التَّقْرِيرِ الكَامِل، أَوْ مُتَابَعَةُ الشِّرَاء، أَوِ العَوْدَةُ لِعَرْضِ السِّعْر، أَوْ طَلَبُ مُخَطَّطِ إِسْ إِلْ دِي",
  ].filter(Boolean).join(". ");
}
