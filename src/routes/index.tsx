import { useCorporateMode } from "@/lib/corporate-mode";
import { createFileRoute } from "@tanstack/react-router";
import actesLogo from "@/assets/actes-logo-full.webp";
import actesLogoWhite from "@/assets/actes-logo-white.webp";
import { useLang, type Lang } from "@/lib/i18n";
import { SoundToggle } from "@/lib/click-sound";
import { prepareSpeech, prepareWelcome, quoteSpeech, replaySpeech, respeakScreen, setScreenSpeech, setScreenSpeechSilently, silenceNextScreen, speakScreen, speakWelcome, studySpeech, stopSpeaking, unlockVoice, viewSpeech } from "@/lib/voice-guide";
import { startVoiceWarmup } from "@/lib/voice-warmup";
import { preloadAppImages } from "@/lib/preload-images";
import PvsystStudy from "@/components/pvsyst-study";
import EconomicStudy from "@/components/economic-study";
import SldDiagram from "@/components/sld-diagram";

import { enterFullscreen, isFullscreen, toggleFullscreen } from "@/lib/fullscreen";
import actesSplashLogo from "@/assets/actes-logo-white.webp";
import startBgMobile from "@/assets/start-bg-mobile.webp";
import startBgDesktop from "@/assets/start-bg-desktop.webp";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BatteryCharging,
  Bell,
  Building2,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Download,
  FileCheck2,
  FileText,
  Grid2X2,
  Headphones,
  Package,
  Home,
  House,
  Languages,
  LineChart,
  Loader2,
  LogOut,
  Network,
  RotateCcw,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Sun,
  UserCircle,
  Zap,
  Volume2,
  Maximize2,
  Minimize2,
  Image as ImageIcon,
  LayoutGrid,
  Leaf,
  Facebook,
  Youtube,
  Linkedin,
  Globe,
  BadgeDollarSign,
} from "lucide-react";
import residentialImage from "@/assets/actes-residential.webp";
import commercialImage from "@/assets/actes-commercial.webp";
import industrialImage from "@/assets/actes-industrial.webp";
import agricultureImage from "@/assets/actes-agriculture.webp";
import homeHero from "@/assets/actes-home-hero.webp";
import partnersStrip from "@/assets/partners-strip.webp";

import refCardQuote from "@/assets/card-quote.webp";
import refCardEnergy from "@/assets/card-energy.webp";
import refCardSupport from "@/assets/card-support.webp";
import refCardProducts from "@/assets/card-products.webp";
import ProductsCatalog from "@/components/products-catalog";

import actesAvatar from "@/assets/actes-a-mark.webp";
import actesMark from "@/assets/actes-a-mark.webp";
import actesWordmark from "@/assets/actes-logo-full.webp";

import { findCatalogProductForSpec } from "@/lib/products-data";
import { itemImage } from "@/lib/item-images";

import { runBot, type BotResult, type BotSession } from "@/lib/bot-engine.js";
import { buildView, formatSystemName, money, type View } from "@/lib/present";
import { CERTIFICATES, CERTIFICATES_TITLE } from "@/lib/warranty";
import { useServerFn } from "@tanstack/react-start";
import { verifyAdminPassword } from "@/lib/admin.functions";
import { notifyAdminWhatsapp } from "@/lib/notify.functions";
import { ADMIN_NOTICE_BUTTONS, buildAdminNotice } from "@/lib/admin-notice";
import { createOrder, createSalesRequest, setPayment, switchClient, type PaymentMethod } from "@/lib/orders";
import { downloadQuotePdf } from "@/lib/quote-pdf";
import { PurchaseFlow } from "@/components/purchase-flow";
import { NotificationsBell } from "@/components/notifications";
import { OrderCenterButton } from "@/components/order-center";
import { AdminDashboard } from "@/components/admin-dashboard";



export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ACTES — حلول أنظمة الطاقة الشمسية" },
      { name: "description", content: "منصة أكتس لتصميم منظومات الطاقة الشمسية وإعداد عروض الأسعار ودراسات الأداء والمخططات." },
      { property: "og:title", content: "ACTES — حلول أنظمة الطاقة الشمسية" },
      { property: "og:description", content: "صمّم منظومتك واحصل على عرض سعر ودراسة أداء ومخطط واضح." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ActesApp,
});

const PHONE = "967700000000";

const STEP_LABELS: Record<string, string> = {
  start: "الرئيسية",
  welcome_services: "الرئيسية",
  menu_sys3: "نوع المشروع",
  energy_menu: "حلول الطاقة",
  quote_menu: "نوع الطلب",
  agr_bill: "المنظومة الزراعية",
  agr_pump_type: "نوع الاستخدام الزراعي",
  agr_pump_power: "قدرة المضخة",
  agr_well_depth: "عمق البئر",
  agr_hours: "ساعات الري",
  agr_pumps: "عدد المضخات",
  agr_source: "مصدر الطاقة الحالي",
  agr_diesel: "تكلفة التشغيل الشهرية",
  agr_loc_gov: "موقع المزرعة",
  agr_loc_dist: "موقع المزرعة",
  agr_result: "التصميم الهندسي للضخ",
  agr_name: "بيانات العميل",
  agr_visit_date: "موعد المعاينة",
  main_menu: "الخدمات",
  res_bill: "بيانات الاستهلاك",
  res_value: "قيمة الاستهلاك",
  res_tie: "خيارات المنظومة",
  res_browse: "المنظومات الجاهزة",
  res_browse_inv: "اختيار الإنفرتر",
  res_quote_ask: "عرض المنظومة",
  quote_name: "بيانات العميل",
  quote_city: "بيانات العميل",
  buy_ask: "عرض السعر",
  buy_invoice: "عرض السعر",
  com_method: "طريقة الحساب",
  com_value: "بيانات الاستهلاك",
  com_inv_ask: "اختيار الإنفرتر",
  com_phase_ask: "نوع التوصيل الكهربائي",
  com_visit_ask: "عرض المنظومة التجارية",
  com_quote_name: "بيانات العميل أو المنشأة",
  com_visit_date: "موعد الزيارة الميدانية",
  com_visit_facility: "اسم المنشأة والنشاط",
  com_visit_location_gov: "موقع المنشأة",
  com_visit_location_dist: "موقع المنشأة",
  com_quote_ask: "تأكيد الطلب والمتابعة",
  ind_name: "بيانات المشروع",
  ind_loc_gov: "موقع المصنع",
  ind_loc_dist: "موقع المصنع",
  ind_activity: "النشاط الصناعي",
  ind_shifts: "ساعات التشغيل",
  ind_shift: "مواعيد الورديات",
  ind_load_src: "بيانات الأحمال",
  ind_load_file: "جدول الأحمال",
  ind_total_kw: "حمل المصنع",
  ind_max_mach: "أكبر ماكينة",
  ind_motors: "تيار الإقلاع",
  ind_motor_kw: "قدرة المحرك",
  ind_source: "مصدر الكهرباء الحالي",
  ind_gen_kva: "المولد القائم",
  ind_diesel: "استهلاك الوقود",
  ind_old_pv: "المنظومة الشمسية القائمة",
  ind_goal: "الهدف من المنظومة",
  ind_result: "التصميم الهندسي",
  ind_quote_ask: "عرض السعر الصناعي",
  pv_loads: "بيانات الأحمال",
  pv_study_ask: "دراسة الأداء",
  pv_sld_ask: "المخطط الكهربائي",
  item_menu: "قائمة المعدات",
  item_pick: "اختيار المعدات",
  item_qty: "الكمية المطلوبة",
  sup_name: "الدعم الفني",
  sup_city_gov: "موقع الخدمة",
  sup_city_dist: "موقع الخدمة",
  sup_city: "موقع الخدمة",
  sup_device: "الجهاز أو النظام",
  sup_problem: "وصف المشكلة",
};

const BACK_OPTION_TITLES = new Set(["العودة خطوة", "العودة للبداية", "العودة إلى البداية"]);

const NAME_STEPS = new Set(["quote_name", "com_quote_name", "pv_quote_name"]);


const NAV_ITEMS = [
  { label: "الرئيسية", icon: Home, action: "home" },
  { label: "طلب عرض سعر", icon: FileText, action: "quote" },
  { label: "حلول أنظمة الطاقة", icon: Grid2X2, action: "energy" },
  { label: "الدعم الفني", icon: Headphones, action: "support" },
] as const;

function ActesApp() {
  const sessionRef = useRef<BotSession>({});
  const [session, setSession] = useState<BotSession>({});
  const [view, setView] = useState<View | null>(null);
  const [draft, setDraft] = useState("");
  const [step, setStep] = useState("start");
  const [busy, setBusy] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<"" | "sent" | "failed">("");
  // loading: قراءة الحساب المحفوظ — choose: اختيار عميل أو مشرف للزائر الجديد — boot: شاشة ابدأ للمسجل
  const [gate, setGate] = useState<"loading" | "choose" | "boot" | "client-login" | "admin-login" | "app" | "closed">("loading");
  const [isAdmin, setIsAdmin] = useState(false);
  const started = useRef(false);
  const clientNameRef = useRef("");
  const [clientName, setClientName] = useState("");
  const [hasClient, setHasClient] = useState(false);
  const lastQuoteRef = useRef<View["quote"]>(null);
  const chosenRef = useRef("");
  const viewRef = useRef<View | null>(null);
  viewRef.current = view;
  const stepRef = useRef("start");
  stepRef.current = step;
  // سجل الشاشات: كل انتقال يحفظ الشاشة الحالية، وزر الرجوع يعيد آخر شاشة فعلية بالضبط.
  const historyRef = useRef<{ session: BotSession; view: View | null; step: string }[]>([]);
  // مرجع منطقة المحتوى: كل شاشة جديدة تبدأ من أعلى نقطة فيها
  const mainRef = useRef<HTMLElement | null>(null);
  // لغة الواجهة: عند تغييرها تُنطق الشاشة المعروضة من جديد باللغة الجديدة
  const [uiLang] = useLang();
  const langReady = useRef(false);
  useEffect(() => {
    if (!langReady.current) { langReady.current = true; return; }
    const current = viewRef.current;
    if (!current) { void respeakScreen(""); return; }
    const isResidential = String(sessionRef.current["menu_choice"] ?? "") === "1";
    const text = current.study?.fresh
      ? studySpeech(current.study)
      : current.quote
        ? quoteSpeech(current.quote, { residential: isResidential })
        : viewSpeech(current, { step: stepRef.current });
    void respeakScreen(text);
  }, [uiLang]);
  const sendWhatsapp = useServerFn(notifyAdminWhatsapp);

  // تحميل صور خطوات الطلب مسبقاً حتى تظهر فوراً عند الانتقال إليها.
  useEffect(() => {
    [residentialImage, commercialImage, agricultureImage, industrialImage].forEach((src) => {
      const img = new Image();
      img.decoding = "async";
      img.src = src;
    });
  }, []);

  // رسالة نجاح الإشعار تبقى ظاهرة حتى يغادر العميل الشاشة (رجوع أو العودة للرئيسية)


  useEffect(() => {
    if (typeof window === "undefined") return;
    let registered = false;
    try {
      const saved = window.localStorage.getItem("actes.client");
      if (saved) {
        const parsed = JSON.parse(saved) as { name?: string };
        if (parsed?.name) { clientNameRef.current = parsed.name; setClientName(parsed.name); setHasClient(true); registered = true; }
      }
    } catch { /* ignore */ }
    if (window.localStorage.getItem("actes.admin") === "1" && window.localStorage.getItem("actes.adminpw")) {
      setIsAdmin(true);
      setGate("app");
      return;
    }
    // شاشة الترحيب هي أول شاشة دائماً؛ تسجيل الدخول يأتي لاحقاً عند طلب عرض سعر.
    void registered;
    setGate("boot");

    // تهيئة النطق المسبق فقط؛ الترحيب الصوتي يبدأ عند الضغط على «ابدأ» (بإيماءة المستخدم).
    prepareWelcome();
    // تخزين تدريجي لأصوات باقي الشاشات في الخلفية حتى تكتمل كلها.
    startVoiceWarmup();
    // تحميل مسبق لصور البطاقات حتى تظهر فوراً عند الانتقال للشاشات.
    preloadAppImages();
  }, []);



  const enterAdmin = useCallback((password?: string) => {
    setIsAdmin(true);
    setGate("app");
    if (typeof window !== "undefined") {
      window.localStorage.setItem("actes.admin", "1");
      if (password) window.localStorage.setItem("actes.adminpw", password);
    }
  }, []);

  const exitAdmin = useCallback(() => {
    setIsAdmin(false);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("actes.admin");
      window.localStorage.removeItem("actes.adminpw");
    }
    setGate("boot");
  }, []);

  const apply = useCallback((incoming: BotResult | null) => {
    if (!incoming) return;
    let result: BotResult | null = incoming;
    let guard = 0;
    // اسم العميل مأخوذ من شاشة تسجيل الدخول، فنتخطى أي خطوة تطلبه مجدداً
    while (result && NAME_STEPS.has(result.step || "") && clientNameRef.current && guard++ < 4) {
      sessionRef.current = { ...sessionRef.current, ...(result as unknown as BotSession) };
      result = runBot(sessionRef.current, {
        phone: PHONE,
        text: clientNameRef.current,
        message_id: `web.autoname.${Math.random().toString(36).slice(2)}`,
        phone_number_id: "actes-web",
      });
    }
    if (!result) return;
    sessionRef.current = { ...sessionRef.current, ...(result as unknown as BotSession) };
    setSession(sessionRef.current);
    setStep(result.step || "start");
    const nextView = buildView(result, result.step || "start");
    if (nextView.quote) lastQuoteRef.current = nextView.quote;
    setView(nextView);
    const st = result.step || "start";
    chosenRef.current = "";
    if (st !== "start") {
      // رسالة واحدة لكل شاشة جديدة؛ نفس الشاشة لا تُعاد.
      const key = `${st}|${nextView.heading}|${nextView.options.map((o) => o.id).join(",")}|${nextView.quote?.number || ""}${nextView.study?.fresh ? "|study" : ""}`;
      // المسار السكني (menu_choice = 1) يحتفظ بنطقه الحالي، وبقية الأنظمة تسمع شرح الخيارات الأربعة.
      const isResidential = String(sessionRef.current["menu_choice"] ?? "") === "1";
      // شاشة دراسة PVsyst المستقلة: نطق مختصر خاص بها بدل نطق عرض السعر.
      speakScreen(key, nextView.study?.fresh
        ? studySpeech(nextView.study)
        : nextView.quote
          ? quoteSpeech(nextView.quote, { residential: isResidential })
          : viewSpeech(nextView, { step: st }));
    }
    else stopSpeaking();
    setDraft("");
  }, []);

  // حضّر نطق كل اختيار معروض مسبقاً، ليبدأ فور النقرة التالية.
  // يعمل في وقت فراغ المتصفح بعد رسم الشاشة، حتى لا يبطّئ ظهورها.
  useEffect(() => {
    if (!view || gate === "closed") return;
    let cancelled = false;
    const handles: number[] = [];
    // نحضّر كل الوجهات الممكنة من هذه الشاشة، بما فيها الرجوع خطوة،
    // لكن كل وجهة تُحسب في فترة خمول مستقلة حتى لا يتجمّد الانتقال بين الشاشات.
    const targets = [...view.options.map((o) => o.id), "back_step"];
    const seen = new Set<string>();
    const queue = targets.filter((id) => {
      if (seen.has(id)) return false;
      seen.add(id);
      const title = view.options.find((o) => o.id === id)?.title || "";
      return !/قريب(?:اً|ا)?/.test(title);
    });

    type IdleWin = {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    const win = window as unknown as IdleWin;
    const usesIdle = typeof win.requestIdleCallback === "function";
    const idle = (fn: () => void) => {
      if (usesIdle) return win.requestIdleCallback!(fn, { timeout: 1500 });
      return window.setTimeout(fn, 120);
    };

    const step = (index: number) => {
      if (cancelled || index >= queue.length) return;
      const id = queue[index] as string;
      try {
        const previewSession = structuredClone(sessionRef.current) as typeof sessionRef.current;
        const preview = runBot(previewSession, {
          phone: PHONE,
          text: id,
          message_id: `web.prefetch.${id}`,
          phone_number_id: "actes-web",
        });
        if (preview && preview.step !== "start") {
          // نفس منطق النطق المستعمل عند العرض الفعلي: عرض السعر والدراسة لهما نص خاص.
          const previewView = buildView(preview, preview.step || "start");
          const previewResidential = String(previewSession["menu_choice"] ?? "") === "1";
          prepareSpeech(previewView.study?.fresh
            ? studySpeech(previewView.study)
            : previewView.quote
              ? quoteSpeech(previewView.quote, { residential: previewResidential })
              : viewSpeech(previewView, { step: preview.step || "" }), true);
        }
      } catch {
        // تجاهل أي فشل في التحضير المسبق؛ فهو تحسين اختياري فقط
      }
      handles.push(idle(() => step(index + 1)));
    };

    // نؤجل بداية التحضير حتى تستقر الشاشة الجديدة وتنتهي حركة ظهورها.
    handles.push(idle(() => step(0)));
    return () => {
      cancelled = true;
      // إلغاء دقيق لمهام الخمول حتى لا تتراكم الحسابات مع تنقل المستخدم.
      for (const handle of handles) {
        if (usesIdle && win.cancelIdleCallback) win.cancelIdleCallback(handle);
        else window.clearTimeout(handle);
      }
    };


  }, [gate, view]);

  const send = useCallback(async (text: string) => {
    const clean = text.trim();
    if (!clean) return;
    // أي نقرة توقف النطق الحالي فوراً، ثم يُنطق الاختيار والخطوة التالية
    stopSpeaking();
    chosenRef.current = viewRef.current?.options.find((o) => o.id === clean)?.title || "";
    setNotificationStatus("");
    const sourceStep = sessionRef.current["step"] || step;
    // زر الرجوع: يعود خطوة واحدة إلى الشاشة السابقة المعروضة فعلاً كما كانت.
    const isBackOne =
      clean === "back_step" || clean === "back" || clean === "00" ||
      /^(العودة خطوة|رجوع|Back one step)$/i.test(clean);
    if (isBackOne) {
      const previous = historyRef.current.pop();
      if (previous) {
        sessionRef.current = { ...previous.session };
        setSession(sessionRef.current);
        setStep(previous.step);
        setView(previous.view);
        setDraft("");
        chosenRef.current = "";
        const isResidential = String(sessionRef.current["menu_choice"] ?? "") === "1";
        // الرجوع صامت: نسجّل نص الشاشة فقط، وزر إعادة السماع في رأس الشاشة ينطقه عند الطلب.
        setScreenSpeechSilently(`back|${previous.step}`, previous.view
          ? (previous.view.study?.fresh
            ? studySpeech(previous.view.study)
            : previous.view.quote
              ? quoteSpeech(previous.view.quote, { residential: isResidential })
              : viewSpeech(previous.view, { step: previous.step }))
          : "");
        window.scrollTo({ top: 0, behavior: "auto" });
        if (mainRef.current) { mainRef.current.scrollTop = 0; mainRef.current.scrollLeft = 0; }
        return;
      }
    } else {
      historyRef.current.push({ session: { ...sessionRef.current }, view: viewRef.current, step: stepRef.current });
      if (historyRef.current.length > 40) historyRef.current.shift();
    }
    const result = runBot(sessionRef.current, {
      phone: PHONE,
      text: clean,
      message_id: `web.${Math.random().toString(36).slice(2)}`,
      phone_number_id: "actes-web",
    });
    // أوامر التنقل (رجوع/بداية) يجب ألا تُعتبر إرسال رقم حوالة أو اختيار دفع
    const isNavCommand =
      clean === "back_step" || clean === "back" || clean === "0" || clean === "00" ||
      /^(العودة خطوة|رجوع|العودة للبداية|Back one step)$/i.test(clean);
    const isPaymentNotice = sourceStep === "pay_notice" && !isNavCommand;
    const isSalesContact = !isNavCommand && (clean === "sales_contact" || /التواصل مع المبيعات/.test(clean));
    const isCodChoice =
      !isNavCommand &&
      (clean === "pay_cod" || (sourceStep === "pay_method" && (clean === "3" || /الدفع عند الاستلام/.test(clean))));
    // شاشة الانتظار تظهر فقط عند الإرسال الفعلي للإدارة؛ التنقل العادي فوري بلا تعتيم.
    const needsNetwork = Boolean(result) && (isPaymentNotice || isSalesContact || isCodChoice);
    // الإرسال للإدارة يتم في الخلفية حتى لا تتأخر الخطوة التالية.
    if (needsNetwork) setNotificationStatus("sent");


    // التواصل مع المبيعات والدفع عند الاستلام: إشعار داخل التطبيق للإدارة بلا أزرار تأكيد أو إلغاء
    if ((isSalesContact || isCodChoice) && result) {
      let clientPhone = "";
      try {
        const saved = window.localStorage.getItem("actes.client");
        if (saved) clientPhone = String((JSON.parse(saved) as { code?: string }).code || "");
      } catch {
        // نكمل الإشعار بدون رقم العميل عند تعذر قراءته
      }
      const customerName = String(clientNameRef.current || result["customer_name"] || sessionRef.current["customer_name"] || "عميل ACTES");
      const quoteNumber = String(result["quote_number"] || sessionRef.current["quote_number"] || "");
      const lastQuote = lastQuoteRef.current;
      const total = Number(lastQuote?.total) || 0;
      const kindLabel = isCodChoice ? "الدفع عند الاستلام" : "التواصل مع المبيعات";
      const notice = buildAdminNotice({
        customerName,
        clientPhone,
        items: lastQuote?.items || [],
        total,
        method: kindLabel,
      });

      try {
        createSalesRequest(
          {
            quoteNumber,
            customer: customerName,
            projectType: String(sessionRef.current["system_type"] || "—"),
            city: String(sessionRef.current["city"] || "—"),
            items: (lastQuote?.items || []).map((item) => ({
              name: item.name,
              qty: String(item.qty),
              unit: String(item.unit),
              price: Number(item.price) || 0,
              total: Number(item.total) || 0,
            })),
            total,
          },
          {
            method: isCodChoice ? "cod" : null,
            body: `${kindLabel} — العميل ${customerName}${clientPhone ? ` (${clientPhone})` : ""}. يرجى الاتصال بالعميل لإتمام التفاصيل.`,
          },
        );
      } catch {
        // نكمل الإشعار حتى لو تعذر الحفظ المحلي
      }

      const lines = [
        `🔔 *${kindLabel}*`,
        "طلب من عميل عبر تطبيق ACTES — يرجى التواصل معه، ولا يحتاج تأكيد أو إلغاء فاتورة.",
        "",
        `👤 اسم العميل: ${customerName}`,
        clientPhone ? `📞 رقم العميل: ${clientPhone}` : "",
        notice.system ? `☀️ المنظومة: ${notice.system}` : "",
        total > 0 ? `💰 السعر الإجمالي: ${total}$` : "",
      ].filter(Boolean).join("\n");

      void sendWhatsapp({
        data: { text: lines, clientName: customerName, clientPhone, quoteNumber, method: kindLabel, total, system: notice.system },
      }).catch(() => undefined);
    }


    if (isPaymentNotice && result) {
      let clientPhone = "";
      try {
        const saved = window.localStorage.getItem("actes.client");
        if (saved) clientPhone = String((JSON.parse(saved) as { code?: string }).code || "");
      } catch {
        // نرسل بقية بيانات الطلب إذا تعذرت قراءة رقم العميل.
      }

      const customerName = String(clientNameRef.current || result["customer_name"] || sessionRef.current["customer_name"] || "عميل ACTES");
      const paymentMethod = String(result["service_needed"] || sessionRef.current["service_needed"] || "حوالة");
      const quoteNumber = String(result["quote_number"] || sessionRef.current["quote_number"] || "");
      const lastQuote = lastQuoteRef.current;
      const total = Number(lastQuote?.total) || 0;
      const notice = buildAdminNotice({
        customerName,
        clientPhone,
        items: lastQuote?.items || [],
        total,
        method: paymentMethod,
        transferRef: clean,
      });

      // تسجيل الطلب وإشعاره داخل التطبيق ليظهر في «الطلبات المعلقة» لدى الإدارة
      try {
        const methodId: PaymentMethod = /محفظ|wallet/i.test(paymentMethod)
          ? "wallet"
          : /استلام|نقد|cod/i.test(paymentMethod)
            ? "cod"
            : "network";
        const created = createOrder({
          quoteNumber: quoteNumber || clean,
          customer: customerName,
          projectType: String(sessionRef.current["system_type"] || "—"),
          city: String(sessionRef.current["city"] || "—"),
          items: (lastQuote?.items || []).map((item) => ({
            name: item.name,
            qty: String(item.qty),
            unit: String(item.unit),
            price: Number(item.price) || 0,
            total: Number(item.total) || 0,
          })),
          total,
        });
        setPayment(created.id, methodId, { transferRef: clean });
      } catch {
        // نكمل الإشعار حتى لو تعذر الحفظ المحلي
      }



      void sendWhatsapp({
        data: {
            text: notice.text,
            clientName: customerName,
            clientPhone,
            quoteNumber,
            transferRef: clean,
            method: paymentMethod,
            total,
            system: notice.system,
            buttons: ADMIN_NOTICE_BUTTONS(quoteNumber || clean),
          },
      }).catch(() => undefined);
    }

    apply(result);
    setBusy(false);
    // تمرير فوري للأعلى: الانتقال بين الشاشات يجب أن يبدو لحظياً.
    window.scrollTo({ top: 0, behavior: "auto" });
    // منطقة المحتوى نفسها قابلة للتمرير، فتعاد لأول الشاشة حتى يظهر الجدول من بدايته.
    if (mainRef.current) { mainRef.current.scrollTop = 0; mainRef.current.scrollLeft = 0; }
    requestAnimationFrame(() => {
      if (mainRef.current) { mainRef.current.scrollTop = 0; mainRef.current.scrollLeft = 0; }
      document.querySelectorAll<HTMLElement>("[data-quote-scroll]").forEach((box) => { box.scrollLeft = 0; box.scrollTop = 0; });
    });
  }, [apply, sendWhatsapp, step]);

  // زر الرجوع في المتصفح أو في الماوس يعود خطوة داخل التطبيق بدل الخروج منه.
  const sendRef = useRef(send);
  sendRef.current = send;
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.history.pushState({ actes: true }, "");
    const onPop = () => {
      if (historyRef.current.length > 0) void sendRef.current("back_step");
      window.history.pushState({ actes: true }, "");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);


  const reset = useCallback(() => {
    // العودة إلى الرئيسية أو إعادة البدء تُسكت أي نطق جارٍ فوراً.
    stopSpeaking();
    setNotificationStatus("");
    historyRef.current = [];
    sessionRef.current = {};
    const result = runBot({}, { phone: PHONE, text: "مرحبا", message_id: "web.init", phone_number_id: "actes-web" });
    sessionRef.current = { ...((result || {}) as unknown as BotSession) };
    if (clientNameRef.current) {
      (sessionRef.current as Record<string, unknown>)["customer_name"] = clientNameRef.current;
    }
    setSession(sessionRef.current);
    setStep(result?.step || "start");
    setView(result ? buildView(result, result.step || "start") : null);
    setDraft("");
  }, []);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    reset();
  }, [reset]);

  const isHome = step === "start" || step === "welcome_services";

  // نافذة تسجيل الدخول المصغّرة: تظهر فقط عند طلب عرض سعر من عميل غير مسجَّل
  const [loginModal, setLoginModal] = useState(false);

  const runService = useCallback((kind: "quote" | "energy" | "support") => {
    const words = kind === "quote" ? ["عرض", "سعر"] : kind === "energy" ? ["حلول", "طاقة"] : ["دعم"];
    const option = view?.options.find((item) => words.every((word) => item.title.includes(word)));
    if (option) { send(option.id); return; }
    // إن لم تكن الخيارات جاهزة بعد، نرسل الاختيار مباشرة حتى تعمل البطاقة من أول نقرة
    const initial = runBot(sessionRef.current, {
      phone: PHONE,
      text: kind === "quote" ? "1" : kind === "energy" ? "2" : "3",
      message_id: `web.nav.${Date.now()}`,
      phone_number_id: "actes-web",
    });
    apply(initial);
  }, [send, view, apply]);

  const triggerService = useCallback((kind: "quote" | "energy" | "support") => {
    // طلب عرض السعر يتطلب حساباً؛ من سجّل مرة واحدة لا يُطلب منه التسجيل مجدداً
    if (kind === "quote" && !hasClient) { setLoginModal(true); return; }
    runService(kind);
  }, [hasClient, runService]);

  const handleNav = (action: (typeof NAV_ITEMS)[number]["action"]) => {
    if (action === "home") return reset();
    if (action === "quote" && !hasClient) { setLoginModal(true); return; }
    if (!isHome) {
      reset();
      window.setTimeout(() => {
        const initial = runBot(sessionRef.current, {
          phone: PHONE,
          text: action === "quote" ? "1" : action === "energy" ? "2" : "3",
          message_id: `web.nav.${Date.now()}`,
          phone_number_id: "actes-web",
        });
        apply(initial);
      }, 20);
      return;
    }
    triggerService(action);
  };

  // تسجيل دخول العميل: يُحفظ محلياً فلا يتكرر الطلب بعد إغلاق التطبيق
  const saveClient = useCallback((name: string, code: string) => {
    clientNameRef.current = name;
    setClientName(name);
    sessionRef.current = { ...sessionRef.current, customer_name: name, name, clientCode: code } as BotSession;
    setSession(sessionRef.current);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("actes.client", JSON.stringify({ name, code }));
    }
    // الرقم هو هوية الحساب: رقم مختلف يعني عميلاً مختلفاً بطلباته الخاصة.
    switchClient(code);
    setHasClient(true);
  }, []);


  const [settingsOpen, setSettingsOpen] = useState(false);
  // «تعرف على منتجاتنا»: شاشة معلوماتية مستقلة لا تمر بمحرك عروض الأسعار
  const [catalog, setCatalog] = useState<{ productId: string | null; fromQuote?: boolean | undefined } | null>(null);
  // فتح مباشر لمنتج عبر الرابط/رمز QR: /?product=<id>
  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = new URLSearchParams(window.location.search).get("product");
    if (id) setCatalog({ productId: id });
  }, []);
  const navFromMenu = (action: (typeof NAV_ITEMS)[number]["action"]) => { setCatalog(null); handleNav(action); };


  // زر الخروج يغلق البرنامج؛ الحساب يبقى محفوظاً فلا تظهر شاشة الدخول عند الفتح مجدداً
  const leaveApp = useCallback(() => {
    setSettingsOpen(false);
    reset();
    if (typeof window !== "undefined") {
      try { window.close(); } catch { /* ignore */ }
      setTimeout(() => { if (!window.closed) setGate("closed"); }, 250);
    }
  }, [reset]);

  // ملء الشاشة تلقائياً على الكمبيوتر عند أول نقرة أو ضغطة مفتاح (المتصفح يشترط ذلك)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      void enterFullscreen();
      window.removeEventListener("pointerdown", go);
      window.removeEventListener("keydown", go);
    };
    window.addEventListener("pointerdown", go);
    window.addEventListener("keydown", go);
    return () => {
      window.removeEventListener("pointerdown", go);
      window.removeEventListener("keydown", go);
    };
  }, []);


  if (gate === "closed") {
    return (
      <div className="grid min-h-screen place-items-center bg-background p-6 text-center">
        <div className="space-y-4">
          <p className="text-lg font-bold text-foreground">تم الخروج من البرنامج</p>
          <p className="text-sm text-muted-foreground">يمكنك إغلاق النافذة الآن</p>
          <button type="button" onClick={() => setGate("app")} className="rounded-md bg-brand px-4 py-2 text-sm font-bold text-brand-foreground">فتح البرنامج مرة أخرى</button>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-dvh bg-background text-foreground">
      <ScreenSizeButton />
      {gate === "loading" ? (
        <div className="grid h-dvh w-full place-items-center bg-sidebar" />
      ) : gate === "choose" ? (
        <AccountChoice onClient={() => setGate("client-login")} onAdmin={() => setGate("admin-login")} />
      ) : gate === "boot" ? (
        <StartScreen
          clientName={clientName}
          onStart={() => { unlockVoice(); void speakWelcome(); setGate("app"); }}
        />
      ) : gate === "client-login" ? (
        <ClientLogin
          onSuccess={(name, code) => {
            saveClient(name, code);
            reset();
            // الدخول بحساب جديد يعيد المستخدم إلى شاشة الترحيب.
            setGate("boot");
          }}
          onCancel={() => setGate(hasClient ? "app" : "boot")}
        />

      ) : gate === "admin-login" ? (
        <AdminLogin onSuccess={enterAdmin} onCancel={() => setGate(hasClient ? "app" : "choose")} />
      ) : isAdmin ? (
        <AdminDashboard onExit={exitAdmin} />
      ) : (

      <div className="flex h-dvh w-full items-stretch justify-center overflow-hidden bg-background p-0">
       <div className="flex h-full w-full max-w-full flex-col overflow-hidden border-border bg-card lg:grid lg:grid-rows-[minmax(0,1fr)_auto] lg:grid-cols-[minmax(0,1fr)_220px]">

      <AppSidebar active={isHome ? "home" : "quote"} onNavigate={navFromMenu} onSettings={() => setSettingsOpen(true)} onExit={leaveApp} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:col-start-1 lg:row-start-1">
        <TopBar isAdmin={isAdmin} clientName={clientName} onExitAdmin={exitAdmin} onSettings={() => setSettingsOpen(true)} onExit={leaveApp} />
         <main ref={mainRef} className={`mx-auto flex w-full min-h-0 flex-1 px-3 py-3 pb-24 sm:px-6 lg:px-8 lg:pb-4 xl:px-10 2xl:px-14 ${isHome && !catalog ? "overflow-hidden" : "overflow-y-auto"}`}>
          {busy && (
            // شريط تقدّم رفيع لا يحجب الشاشة ولا يقطع سلاسة الانتقال بين الخطوات
            <div role="status" aria-label="جارٍ تجهيز الخطوة التالية" className="thin-progress fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden bg-brand/15" />
          )}

          {notificationStatus === "sent" && (
            <div role="status" className="fixed inset-x-4 top-20 z-50 mx-auto max-w-xl rounded-lg border border-energy/35 bg-card px-4 py-3 text-center text-sm font-bold text-energy shadow-xl">
              تم استلام طلبك وإشعار الإدارة بنجاح.
            </div>
          )}

          {catalog ? (
            <ProductsCatalog
              productId={catalog.productId}
              onOpen={(id) => { setCatalog({ productId: id, fromQuote: catalog.fromQuote }); mainRef.current?.scrollTo({ top: 0 }); }}
              onBack={() => setCatalog(null)}
              returnTo={catalog.fromQuote ? { label: "العودة", onReturn: () => { setCatalog(null); mainRef.current?.scrollTo({ top: 0 }); } } : null}
            />
          ) : view && isHome ? (
            <HomeDashboard onService={triggerService} onProducts={() => setCatalog({ productId: null })} />
          ) : view ? (
            <QuoteWorkspace
              key={step}
              view={view}
              session={session}
              step={step}
              draft={draft}
              setDraft={setDraft}
              onPick={send}
              onBack={() => send("back_step")}
              onRestart={() => send("0")}
              onHome={() => { setCatalog(null); reset(); }}
              onOpenProduct={(id) => { setCatalog({ productId: id, fromQuote: true }); mainRef.current?.scrollTo({ top: 0 }); }}
            />


          ) : null}
        </main>
      </div>
      <AppFooter />
      <MobileNav active={isHome ? "home" : "quote"} onNavigate={navFromMenu} onSettings={() => setSettingsOpen(true)} />
      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        isAdmin={isAdmin}
        clientName={clientName}
        onRestart={() => { setSettingsOpen(false); reset(); }}
        onSwitchClient={() => { setSettingsOpen(false); setGate("client-login"); }}
        onAdminLogin={() => { setSettingsOpen(false); setGate("admin-login"); }}
        onAdminLogout={() => { setSettingsOpen(false); exitAdmin(); }}
      />
      {loginModal && (
        <ClientLoginDialog
          onSuccess={(name, code) => {
            saveClient(name, code);
            setLoginModal(false);
            setCatalog(null);
            window.setTimeout(() => runService("quote"), 0);
          }}
          onCancel={() => setLoginModal(false)}
        />
      )}

      </div>
      </div>
      )}
    </div>
  );
}

const START_SECTORS = ["سكني", "تجاري", "زراعي", "صناعي"];


// شاشة الزائر الجديد: اختيار عميل أو مشرف (لا تظهر فيها شاشة «ابدأ»)
function AccountChoice({ onClient, onAdmin }: { onClient: () => void; onAdmin: () => void }) {
  const [corporate] = useCorporateMode();
  if (corporate) return <CorporateWelcome onClient={onClient} onAdmin={onAdmin} />;
  return (
    <main className="relative grid h-dvh w-full place-items-center overflow-hidden bg-sidebar px-5 py-8 text-sidebar-foreground" dir="rtl">
      <img src={startBgMobile} alt="" width={896} height={1600} className="absolute inset-0 size-full object-cover opacity-60 lg:hidden" />
      <img src={startBgDesktop} alt="" width={1920} height={1088} className="absolute inset-0 hidden size-full object-cover opacity-60 lg:block" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--sidebar)_90%,transparent)_0%,color-mix(in_oklab,var(--sidebar)_70%,transparent)_50%,color-mix(in_oklab,var(--sidebar)_94%,transparent)_100%)]" />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card/95 p-7 text-center shadow-2xl backdrop-blur-sm sm:p-8">
        <img src={actesLogo} alt="ACTES — أكتس لأنظمة الطاقة وحلولها" className="mx-auto h-16 w-auto object-contain sm:h-20" />
        <p className="mt-4 text-[11px] font-black tracking-[0.3em] text-brand" dir="ltr">ACTES ENERGY SYSTEMS</p>
        <h1 className="mt-2 text-xl font-black leading-8 text-foreground sm:text-2xl">أكتس لأنظمة الطاقة وحلولها</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">اختر طريقة الدخول للمتابعة</p>

        <button
          type="button"
          onClick={onClient}
          className="mt-6 inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-brand text-lg font-black text-brand-foreground shadow-lg transition hover:opacity-90 active:scale-[0.99]"
        >
          <UserCircle className="size-5" /> دخول العميل
        </button>
        <button
          type="button"
          onClick={onAdmin}
          className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border text-sm font-bold text-foreground transition hover:bg-muted"
        >
          <ShieldCheck className="size-4" /> دخول المشرف
        </button>
        <p className="mt-5 text-[11px] font-semibold text-muted-foreground">أكتس لأنظمة الطاقة وحلولها — جميع الحقوق محفوظة</p>
      </div>
    </main>
  );
}

// شاشة «ابدأ» للمسجل سابقاً: زر واحد فقط
function StartScreen({ clientName, onStart }: { clientName: string; onStart: () => void }) {
  return (
    <main className="relative h-dvh w-full overflow-hidden bg-sidebar text-sidebar-foreground" dir="rtl">
      <img src={startBgMobile} alt="" width={896} height={1600} className="absolute inset-0 size-full object-cover opacity-70 lg:hidden" />
      <img src={startBgDesktop} alt="" width={1920} height={1088} className="absolute inset-0 hidden size-full object-cover opacity-70 lg:block" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--sidebar)_88%,transparent)_0%,color-mix(in_oklab,var(--sidebar)_55%,transparent)_45%,color-mix(in_oklab,var(--sidebar)_94%,transparent)_100%)]" />

      <div className="relative z-10 grid h-full place-items-center overflow-y-auto px-6 py-10">
        <div className="flex w-full max-w-lg flex-col items-center text-center">
          <img src={actesSplashLogo} alt="ACTES — أكتس لأنظمة الطاقة وحلولها" className="h-20 w-auto object-contain lg:h-28" />
          <p className="mt-5 text-[11px] font-black tracking-[0.34em] text-brand lg:text-xs lg:tracking-[0.42em]" dir="ltr">ACTES ENERGY SYSTEMS</p>
          <h1 className="mt-3 text-2xl font-black leading-tight lg:text-4xl">
            {clientName ? `مرحباً بك، ${clientName}` : "مرحباً بك في نظام أكتس"}
          </h1>
          <p className="mt-3 max-w-md text-sm leading-7 opacity-80 lg:text-base">
            صمّم منظومتك واحصل على عرض سعر رسمي ودراسة ومخطط معتمد.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {START_SECTORS.map((sector) => (
              <span key={sector} className="rounded-full border border-sidebar-foreground/25 px-4 py-1.5 text-xs font-bold">
                {sector}
              </span>
            ))}
          </div>

          <button
            type="button"
            onClick={onStart}
            className="mt-9 inline-flex h-16 w-full max-w-sm items-center justify-center gap-3 rounded-2xl bg-brand text-xl font-black text-brand-foreground shadow-2xl transition hover:opacity-90 active:scale-[0.99]"
          >
            <Sparkles className="size-6" /> ابدأ
          </button>

          <p className="mt-8 text-[11px] font-semibold opacity-70">أكتس لأنظمة الطاقة وحلولها — جميع الحقوق محفوظة</p>
        </div>
      </div>
    </main>
  );
}

function SettingsPanel({ open, onClose, isAdmin, clientName = "", onRestart, onSwitchClient, onAdminLogin, onAdminLogout }: { open: boolean; onClose: () => void; isAdmin: boolean; clientName?: string; onRestart: () => void; onSwitchClient: () => void; onAdminLogin: () => void; onAdminLogout: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-overlay/45 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-label="الإعدادات" onClick={onClose}>
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-secondary text-skyline"><Settings className="size-5" /></span>
          <div>
            <h2 className="text-lg font-black">الإعدادات</h2>
            <p className="text-xs text-muted-foreground">تفضيلات التطبيق وحالة الحساب</p>
          </div>
        </div>
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between rounded-md border border-border px-4 py-3 text-sm">
            <span className="font-bold">لغة الواجهة</span>
            <LangSwitch always />
          </div>
          <div className="flex items-center justify-between rounded-md border border-border px-4 py-3 text-sm">
            <span className="font-bold">نوع الحساب</span>
            <span className="font-semibold text-muted-foreground">{isAdmin ? "إدارة ACTES" : clientName ? `عميل — ${clientName}` : "عميل"}</span>
          </div>
          <button type="button" onClick={onRestart} className="flex w-full items-center gap-3 rounded-md border border-border px-4 py-3 text-sm font-bold transition hover:bg-muted">
            <RotateCcw className="size-4" /> بدء محادثة جديدة من البداية
          </button>
          <button type="button" onClick={onSwitchClient} className="flex w-full items-center gap-3 rounded-md border border-border px-4 py-3 text-sm font-bold transition hover:bg-muted">
            <UserCircle className="size-4" /> تسجيل الدخول بحساب آخر
          </button>
          {isAdmin ? (
            <button type="button" onClick={onAdminLogout} className="flex w-full items-center gap-3 rounded-md border border-border px-4 py-3 text-sm font-bold transition hover:bg-muted">
              <LogOut className="size-4" /> العودة إلى وضع العميل
            </button>
          ) : (
            <button type="button" onClick={onAdminLogin} className="flex w-full items-center gap-3 rounded-md border border-border px-4 py-3 text-sm font-bold transition hover:bg-muted">
              <ShieldCheck className="size-4" /> التبديل إلى وضع المشرف
            </button>
          )}
        </div>
        <button type="button" onClick={onClose} className="mt-5 w-full rounded-md bg-brand px-4 py-3 text-sm font-black text-brand-foreground transition hover:opacity-90">
          إغلاق
        </button>
      </div>
    </div>
  );
}


function ClientLogin({ onSuccess, onCancel }: { onSuccess: (name: string, code: string) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return setError("الرجاء إدخال اسم العميل");
    if (!code.trim()) return setError("الرجاء إدخال رقم العميل");
    setError("");
    onSuccess(name.trim(), code.trim());
  };

  return (
    <main className="relative grid h-dvh w-full place-items-center overflow-hidden bg-card px-6" dir="rtl">
      <img src={homeHero} alt="" data-photo className="absolute inset-0 size-full object-cover opacity-15" />
      <form onSubmit={submit} className="relative w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-brand text-brand-foreground"><UserCircle className="size-7" /></div>
          <h1 className="mt-4 text-2xl font-black">تسجيل الدخول</h1>
          <p className="mt-1 text-xs text-muted-foreground">أدخل بياناتك للمتابعة كعميل</p>
        </div>
        <label className="mt-6 block text-sm font-bold">اسم العميل</label>
        <input
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="الاسم الكامل"
          className="mt-2 h-12 w-full rounded-lg border border-border bg-background px-4 text-base outline-none transition focus:border-brand"
        />
        <label className="mt-4 block text-sm font-bold">رقم العميل</label>
        <input
          inputMode="numeric"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="مثال: 7xxxxxxxx"
          className="mt-2 h-12 w-full rounded-lg border border-border bg-background px-4 text-base outline-none transition focus:border-brand"
        />
        {error && <p className="mt-2 text-xs font-bold text-destructive">{error}</p>}
        <button
          type="submit"
          className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-brand text-base font-black text-brand-foreground transition hover:opacity-90"
        >
          دخول
        </button>
        <button type="button" onClick={onCancel} className="mt-3 w-full text-center text-xs font-bold text-muted-foreground transition hover:text-foreground">
          رجوع
        </button>
      </form>
    </main>
  );
}

// نافذة دخول مصغّرة فوق الشاشة (لا تملأ الشاشة) — تظهر عند طلب عرض سعر لأول مرة
function ClientLoginDialog({ onSuccess, onCancel }: { onSuccess: (name: string, code: string) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return setError("الرجاء إدخال اسم العميل");
    if (!code.trim()) return setError("الرجاء إدخال رقم العميل");
    setError("");
    onSuccess(name.trim(), code.trim());
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="تسجيل الدخول" dir="rtl" className="fixed inset-0 z-[60] grid place-items-center bg-navy/60 px-5 backdrop-blur-sm">
      <form onSubmit={submit} className="w-full max-w-[320px] rounded-2xl border border-border bg-card p-5 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto grid size-11 place-items-center rounded-full bg-brand text-brand-foreground"><UserCircle className="size-6" /></div>
          <h2 className="mt-2.5 text-lg font-black">تسجيل الدخول</h2>
          <p className="mt-1 text-[11px] text-muted-foreground">أدخل بياناتك لمتابعة طلب عرض السعر</p>
        </div>
        <label className="mt-4 block text-xs font-bold">اسم العميل</label>
        <input
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="الاسم الكامل"
          className="mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-brand"
        />
        <label className="mt-3 block text-xs font-bold">رقم العميل</label>
        <input
          inputMode="numeric"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="مثال: 7xxxxxxxx"
          className="mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-brand"
        />
        {error && <p className="mt-2 text-[11px] font-bold text-destructive">{error}</p>}
        <button
          type="submit"
          className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-lg bg-brand text-sm font-black text-brand-foreground transition hover:opacity-90"
        >
          دخول ومتابعة
        </button>
        <button type="button" onClick={onCancel} className="mt-2 w-full text-center text-[11px] font-bold text-muted-foreground transition hover:text-foreground">
          إلغاء
        </button>
      </form>
    </div>
  );
}


function AdminLogin({ onSuccess, onCancel }: { onSuccess: (password: string) => void; onCancel: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const check = useServerFn(verifyAdminPassword);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!password || loading) return;
    setLoading(true);
    setError(false);
    try {
      const result = await check({ data: { password } });
      if (result.ok) onSuccess(password);
      else setError(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative grid h-dvh w-full place-items-center overflow-hidden bg-card px-6" dir="ltr">
      <img src={industrialImage} alt="" data-photo className="absolute inset-0 size-full object-cover opacity-15" />
      <form onSubmit={submit} className="relative w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-brand text-brand-foreground"><ShieldCheck className="size-7" /></div>
          <h1 className="mt-4 text-2xl font-black">دخول الإدارة</h1>
          <p className="mt-1 text-xs text-muted-foreground">أدخل كلمة مرور الإدارة</p>
        </div>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="كلمة مرور الإدارة"
          className="mt-6 h-12 w-full rounded-lg border border-border bg-background px-4 text-base outline-none transition focus:border-brand"
        />
        {error && <p className="mt-2 text-xs font-bold text-destructive">كلمة المرور غير صحيحة</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-brand text-base font-black text-brand-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {loading ? <Loader2 className="size-5 animate-spin" /> : null} دخول
        </button>
        <button type="button" onClick={onCancel} className="mt-3 w-full text-center text-xs font-bold text-muted-foreground transition hover:text-foreground">
          رجوع
        </button>

      </form>
    </main>
  );
}

function CorporateToggle() {
  const [on, toggle] = useCorporateMode();
  return (
    <button type="button" onClick={toggle} aria-pressed={on} title={on ? "الوضع المصوّر" : "الوضع الرئيسي"} className="inline-flex items-center gap-2 rounded-full bg-skyline px-4 py-2 text-[13px] font-bold text-skyline-foreground shadow-sm transition hover:opacity-90">
      <span className="hidden sm:inline">{on ? "الوضع المصوّر" : "الوضع الرئيسي"}</span>
      {on ? <ImageIcon className="size-5" /> : <LayoutGrid className="size-5" />}
    </button>
  );
}

const CORPORATE_STATS = [
  { icon: Sun, value: "720W", label: "ألواح عالية الكفاءة" },
  { icon: Zap, value: "1.6–12kW", label: "إنفرترات هجينة" },
  { icon: BatteryCharging, value: "LiFePO4", label: "بطاريات ليثيوم" },
  { icon: Network, value: "24/7", label: "دعم فني ومتابعة" },
];

function CorporateHero() {
  return (
    <section className="corporate-only corporate-grid shrink-0 overflow-hidden rounded-lg border border-border bg-sidebar p-3 text-sidebar-foreground">
      <p className="text-[10px] font-bold tracking-widest text-brand" dir="ltr">ACTES · ENERGY SYSTEMS</p>
      <h2 className="mt-0.5 text-base font-black">أكتس لأنظمة الطاقة وحلولها</h2>
      <p className="text-[10px] opacity-75">حلول هندسية متكاملة للطاقة الشمسية — سكني، تجاري، صناعي، زراعي.</p>
      <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
        {CORPORATE_STATS.map(({ icon: Icon, value, label }) => (
          <div key={label} className="flex items-center gap-2 rounded-md border border-sidebar-foreground/15 bg-sidebar-foreground/5 px-2 py-1.5">
            <Icon className="size-3.5 shrink-0 text-brand" />
            <div className="min-w-0">
              <p className="text-[12px] font-black leading-4" dir="ltr">{value}</p>
              <p className="truncate text-[9px] opacity-70">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CorporateWelcome({ onClient, onAdmin }: { onClient: () => void; onAdmin: () => void }) {
  return (
    <main className="corporate-grid grid h-dvh w-full place-items-center bg-sidebar px-6 text-sidebar-foreground" dir="rtl">
      <div className="w-full max-w-md rounded-xl border border-sidebar-foreground/15 bg-card p-8 text-center text-foreground shadow-2xl">
        <div className="flex justify-center"><BrandMark /></div>
        <p className="mt-3 text-xs text-muted-foreground">نظام أكتس لأنظمة الطاقة</p>
        <button type="button" onClick={onClient} className="mt-6 h-12 w-full rounded-lg bg-brand text-base font-black text-brand-foreground transition hover:opacity-90">الدخول كعميل</button>
        <button type="button" onClick={onAdmin} className="mt-3 h-12 w-full rounded-lg border border-border text-base font-bold transition hover:bg-muted">دخول الإدارة</button>
      </div>
    </main>
  );
}

function BrandLockup() {
  return (
    <div className="flex flex-col items-center gap-1 text-center" aria-label="ACTES — أكتس لأنظمة الطاقة وحلولها">
      <img src={actesMark} alt="" className="h-11 w-auto" />
      <p className="text-[17px] font-black leading-none tracking-wide text-skyline-foreground" dir="ltr">ACTES</p>
      <p className="text-[10px] font-bold leading-3 text-skyline-foreground/90">أكتس لأنظمة الطاقة وحلولها</p>
    </div>
  );
}

function BrandMark({ compact = false, className, white = false }: { inverse?: boolean; compact?: boolean; className?: string; white?: boolean }) {
  return (
    <div className="flex items-center" aria-label="ACTES">
      <img src={white ? actesLogoWhite : actesLogo} alt="ACTES — أكتس لأنظمة الطاقة وحلولها" className={className ?? (compact ? "h-12 w-auto" : "h-16 w-auto")} />
    </div>
  );
}


function TopBar({ isAdmin, clientName = "", onExitAdmin, onSettings, onExit }: { isAdmin: boolean; clientName?: string; onExitAdmin: () => void; onSettings: () => void; onExit: () => void }) {
  return (
    <header className="grid h-[60px] shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center border-b border-border bg-card px-3 sm:px-4 lg:px-4">
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" onClick={onSettings} aria-label="الإعدادات" title="الإعدادات" className="grid size-10 place-items-center text-foreground lg:hidden"><Settings className="size-6" /></button>
        <div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full border border-navy-soft bg-navy">
          <img src={actesAvatar} alt="ACTES" className="size-8 object-contain" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[12px] font-bold text-muted-foreground">مرحباً بك</p>
          <p className="truncate text-[13px] font-black text-navy">{isAdmin ? "الإدارة" : clientName || "عميل"}<span className="hidden sm:inline">{isAdmin ? " في نظام مبيعات ACTES" : " في نظام مبيعات ACTES"}</span></p>
        </div>
        {isAdmin && (
          <span className="ms-2 hidden shrink-0 items-center gap-1 rounded-full bg-brand px-3 py-1 text-[11px] font-black text-brand-foreground sm:inline-flex" dir="ltr">
            <ShieldCheck className="size-3.5" /> Admin Mode
          </span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {isAdmin && (
          <button type="button" onClick={onExitAdmin} className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-bold text-foreground transition hover:bg-muted" dir="ltr">
            <LogOut className="size-4" /> Logout Admin
          </button>
        )}
        <ReplayVoiceButton />
        <span className="hidden lg:inline-flex"><CorporateToggle /></span>
        <span className="text-navy [&_svg]:size-5"><OrderCenterButton isAdmin={isAdmin} /></span>
        <span className="text-navy [&_svg]:size-5"><NotificationsBell isAdmin={isAdmin} /></span>
        <button type="button" onClick={onExit} aria-label="خروج" title="خروج" className="grid size-9 place-items-center rounded-md text-foreground transition hover:bg-muted lg:hidden"><LogOut className="size-5" /></button>
        <LangSwitch />
        <img src={actesWordmark} alt="ACTES — أكتس لأنظمة الطاقة وحلولها" className="hidden h-9 w-auto object-contain lg:block" />

      </div>
    </header>
  );
}

/** زر صغير في الزاوية لتصغير الشاشة أو إعادة ملئها. */
function ScreenSizeButton() {
  const [full, setFull] = useState(false);
  useEffect(() => {
    const sync = () => setFull(isFullscreen());
    sync();
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  const Icon = full ? Minimize2 : Maximize2;
  return (
    <button
      type="button"
      aria-label={full ? "تصغير الشاشة" : "ملء الشاشة"}
      title={full ? "تصغير الشاشة" : "ملء الشاشة"}
      onClick={() => void toggleFullscreen()}
      className="fixed left-2 top-2 z-[60] hidden size-7 place-items-center rounded-full border border-border bg-card/85 text-navy shadow-sm backdrop-blur transition hover:border-brand hover:text-brand lg:grid"
    >
      <Icon className="size-3.5" />
    </button>
  );
}

/** زر صغير لإعادة سماع نطق الشاشة الحالية. */
function ReplayVoiceButton() {
  const [playing, setPlaying] = useState(false);
  return (
    <button
      type="button"
      aria-label="إعادة سماع النطق"
      title="إعادة سماع النطق"
      onClick={() => {
        unlockVoice();
        setPlaying(true);
        void replaySpeech().finally(() => setTimeout(() => setPlaying(false), 600));
      }}
      className={`grid size-8 shrink-0 place-items-center rounded-full border border-border bg-card text-navy transition hover:border-brand hover:text-brand ${playing ? "border-brand text-brand" : ""}`}
    >
      <Volume2 className="size-4" />
    </button>
  );
}



function AppSidebar({ active, onNavigate, onSettings, onExit }: { active: string; onNavigate: (action: (typeof NAV_ITEMS)[number]["action"]) => void; onSettings: () => void; onExit: () => void }) {
  const row = "flex w-full items-center gap-3 border-b border-skyline-foreground/15 px-3 py-3.5 text-right text-[14px] font-bold text-skyline-foreground transition hover:bg-skyline-foreground/10";
  return (
    <aside className="relative order-2 hidden h-full flex-col overflow-hidden bg-navy text-skyline-foreground lg:flex lg:col-start-2 lg:row-start-1">
      <div className="pointer-events-none relative z-10 px-4 pb-4 pt-4">
        <BrandLockup />
      </div>
      <nav className="relative z-10 px-3" aria-label="التنقل الرئيسي">


        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const selected = active === item.action;
          return selected ? (
            <button key={item.action} type="button" onClick={() => onNavigate(item.action)} className="mb-2 flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-3 py-3 text-[15px] font-bold text-brand-foreground shadow-md">
              <Icon className="size-5 shrink-0" /> <span className="whitespace-nowrap">{item.label}</span>
            </button>
          ) : (
            <button key={item.action} type="button" onClick={() => onNavigate(item.action)} className={row}>
              <Icon className="size-5 shrink-0" /> <span className="flex-1 whitespace-nowrap">{item.label}</span><ArrowLeft className="size-3.5 shrink-0 opacity-80" />
            </button>
          );
        })}
        <button type="button" onClick={onSettings} className={row}><Settings className="size-5" /> <span className="flex-1">الإعدادات</span><ArrowLeft className="size-3.5 opacity-80" /></button>
        <button type="button" onClick={onExit} className="flex w-full items-center gap-3 px-3 py-3.5 text-[14px] font-bold text-skyline-foreground transition hover:bg-skyline-foreground/10"><LogOut className="size-5" /> خروج</button>
      </nav>
      <svg aria-hidden viewBox="0 0 200 160" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 bottom-10 z-0 h-40 w-full text-skyline">
        <path d="M0 110 C60 60 120 20 200 10 L200 160 L0 160 Z" fill="currentColor" opacity="0.55" />
        <path d="M0 140 C70 100 130 70 200 60 L200 160 L0 160 Z" fill="currentColor" opacity="0.35" />
      </svg>
      <div className="relative mt-auto px-4 pb-5 text-[13px] font-bold text-skyline-foreground">
        <span className="mb-2 block h-1 w-8 rounded-full bg-brand" />
        <p className="flex items-center gap-1.5"><Leaf className="size-4" /> معاً نحو طاقة مستدامة</p>
      </div>
    </aside>
  );
}

function MobileNav({ active, onNavigate, onSettings }: { active: string; onNavigate: (action: (typeof NAV_ITEMS)[number]["action"]) => void; onSettings: () => void }) {
  return (
    <nav aria-label="القائمة السفلية" className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-between border-t border-navy-soft bg-navy px-1 pb-[env(safe-area-inset-bottom)] text-skyline-foreground lg:hidden">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const selected = active === item.action;
        return (
          <button
            key={item.action}
            type="button"
            onClick={() => onNavigate(item.action)}
            aria-current={selected ? "page" : undefined}
            className={`flex flex-1 flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-bold leading-3 ${selected ? "text-brand" : "text-skyline-foreground/85"}`}
          >
            <Icon className="size-5" />
            <span className="truncate">{item.label}</span>
          </button>
        );
      })}
      <button type="button" onClick={onSettings} className="flex flex-1 flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-bold leading-3 text-skyline-foreground/85">
        <Settings className="size-5" />
        <span>الإعدادات</span>
      </button>
    </nav>
  );
}

function AppFooter() {
  return (
    <footer className="hidden h-8 shrink-0 items-center justify-between bg-navy px-6 text-[11px] font-bold text-skyline-foreground lg:col-span-2 lg:row-start-2 lg:flex">
      <span className="flex items-center gap-2"><Leaf className="size-4 text-energy" /> طاقة نظيفة.. لحياة أفضل</span>
      <span className="flex items-center gap-1.5">
        {[Facebook, Youtube, Linkedin].map((Icon, i) => (
          <span key={i} className="grid size-6 place-items-center rounded-full bg-skyline-foreground/15"><Icon className="size-3" /></span>
        ))}
      </span>
      <span className="flex items-center gap-2">جميع الحقوق محفوظة © 2026 <span className="text-[13px] font-black">ACTES</span> <Sun className="size-4" /></span>
    </footer>
  );
}

function HomeDashboard({ onService, onProducts }: { onService: (kind: "quote" | "energy" | "support") => void; onProducts: () => void }) {
  // نسجّل نص الشاشة الرئيسية حتى يعيده زر «إعادة السماع» عند الرجوع إليها، بلا نطق تلقائي.
  useEffect(() => {
    setScreenSpeech("الشاشة الرئيسية لأكتس. يمكنك طلب عرض سعر، أو استكشاف حلول أنظمة الطاقة، أو التواصل مع الدعم الفني، أو التعرف على منتجاتنا.");
  }, []);
  return (
    <div className="screen-enter flex min-h-0 w-full flex-col gap-2 lg:h-full">
      <CorporateHero />
      <section data-photo-section className="min-h-0 shrink overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:flex-1 lg:max-h-[30dvh]">
        <img src={homeHero} alt="أكتس لأنظمة الطاقة وحلولها" loading="eager" decoding="sync" fetchPriority="high" className="block aspect-[2064/416] w-full object-cover lg:h-full lg:w-full lg:aspect-auto" />
      </section>



      <PartnersStrip />


      <section className="stagger-in grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4 lg:gap-3">
        <ServiceCard image={refCardQuote} icon={<FileText />} title="طلب عرض سعر" description="احصل على أفضل العروض والأسعار المناسبة لمشروعك." action="ابدأ الآن" tone="brand" onClick={() => onService("quote")} />
        <ServiceCard image={refCardEnergy} icon={<Sun />} title="حلول أنظمة الطاقة" description="اكتشف حلولنا المتكاملة لأنظمة الشمسية للمنازل والمنشآت." action="حلول الطاقة" tone="energy" onClick={() => onService("energy")} />
        <ServiceCard image={refCardSupport} icon={<Headphones />} title="الدعم الفني" description="فريقنا المتخصص جاهز لمساعدتك في أي استفسار أو مشكلة فنية." action="تواصل معنا" tone="skyline" onClick={() => onService("support")} />
        <ServiceCard image={refCardProducts} icon={<Package />} title="تعرف على منتجاتنا" description="اكتشف منتجات ACTES، وتعرّف على مواصفاتها واستخداماتها واطلع على الكتالوجات والأدلة." action="استكشف المنتجات" tone="navy" onClick={onProducts} />
      </section>

      <footer className="shrink-0 rounded-xl bg-navy px-3 py-2.5 text-center text-[11px] font-bold text-skyline-foreground lg:hidden">
        <p className="flex items-center justify-center gap-1.5"><Leaf className="size-4 text-energy" /> معاً نحو طاقة مستدامة</p>
        <p className="mt-1 opacity-80">جميع الحقوق محفوظة © 2026 ACTES</p>
      </footer>
    </div>
  );
}

function PartnersStrip() {
  const trackRef = useRef<HTMLDivElement>(null);
  const scrollBy = (dir: number) => {
    const el = trackRef.current;
    if (el) el.scrollBy({ left: dir * Math.max(160, el.clientWidth * 0.6), behavior: "smooth" });
  };
  return (
    <section
      aria-label="وكلاء وشركاء ACTES"
      className="shrink-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
    >
      <div className="flex items-stretch">
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          aria-label="الوكلاء السابقون"
          className="grid w-10 shrink-0 place-items-center border-l border-border/70 text-navy/60 transition hover:bg-muted hover:text-navy"
        >
          <ChevronLeft className="size-4" />
        </button>

        <div ref={trackRef} className="min-w-0 flex-1 overflow-x-auto scrollbar-none">
          <img
            src={partnersStrip}
            alt="وكلاء ACTES: Li Power، PYLONTECH، SUNTECH، HTHIUM، sunways"
            loading="eager"
            decoding="sync"
            fetchPriority="high"
            className="mx-auto block h-12 w-auto max-w-none object-contain sm:h-14 lg:h-11 lg:w-full"
          />
        </div>

        <button
          type="button"
          onClick={() => scrollBy(1)}
          aria-label="الوكلاء التاليون"
          className="grid w-10 shrink-0 place-items-center border-r border-border/70 text-navy/60 transition hover:bg-muted hover:text-navy"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </section>
  );
}


function Feature({ icon, text }: { icon: ReactNode; text: string }) {
  return <div className="flex items-center gap-3 border-r border-sidebar-foreground/25 pr-3 [&_svg]:size-6 [&_svg]:text-brand">{icon}<span>{text}</span></div>;
}

function ServiceCard({ image, icon, title, description, action, tone, onClick }: { image: string; icon: ReactNode; title: string; description: string; action: string; tone: "brand" | "energy" | "skyline" | "navy"; onClick: () => void }) {
  const circle = tone === "brand" ? "bg-brand text-brand-foreground" : tone === "energy" ? "bg-energy text-energy-foreground" : tone === "navy" ? "bg-navy text-skyline-foreground" : "bg-skyline text-skyline-foreground";
  const btn = tone === "skyline" ? "bg-navy-soft text-navy" : circle;

  return (
    <button type="button" onClick={onClick} aria-label={title} className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card text-right shadow-sm transition hover:shadow-md">
      <span data-photo-frame className="block aspect-[16/9] w-full overflow-hidden bg-muted"><img data-photo src={image} alt={title} loading="eager" decoding="async" width={1280} height={720} className="size-full object-cover transition duration-500 group-hover:scale-[1.03]" /></span>
      <span className="relative flex flex-1 flex-col px-2 pb-2 pt-4 text-center lg:px-3 lg:pb-2.5 lg:pt-5">
        <span className={`absolute -top-3 right-1/2 grid size-6 translate-x-1/2 place-items-center rounded-full border-2 border-card shadow-md lg:size-8 ${circle} [&_svg]:size-3 lg:[&_svg]:size-4`}>{icon}</span>
        <span className="text-[11px] font-black leading-tight text-navy lg:text-[15px]">{title}</span>
        <span className="mx-auto mb-1 mt-0.5 line-clamp-2 max-w-xs text-[9px] leading-3 text-muted-foreground lg:mb-2 lg:mt-1 lg:line-clamp-2 lg:max-w-sm lg:text-[12px] lg:leading-4">{description}</span>
        <span className={`mx-auto mb-0 mt-auto inline-flex w-full max-w-32 items-center justify-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold shadow-sm transition group-hover:opacity-90 lg:max-w-44 lg:gap-1.5 lg:px-3 lg:py-1.5 lg:text-[13px] ${btn}`}>
          <ArrowRight className="size-3 lg:size-4" />{action}
        </span>

      </span>
    </button>

  );

}

// مراحل رحلة طلب عرض السعر — مؤشر بصري يوضح للعميل موقعه من المسار
const QUOTE_STAGES = ["نوع المشروع", "بيانات المشروع", "تصميم المنظومة", "عرض السعر"];

function stageIndex(step: string, hasQuote: boolean): number {
  if (hasQuote || /^(buy_|pay_|item_|qnext|aq_|done)/.test(step)) return 3;
  if (/(result|browse|tie|quote_ask|visit_ask|inv_ask|phase_ask|specs|sld|study)/.test(step)) return 2;
  if (/^(menu_sys3|main_menu|quote_menu|energy_menu|welcome_services|start)$/.test(step)) return 0;
  return 1;
}

// مراحل مسار الدعم الفني — مؤشر مستقل عن مسار عرض السعر
const SUPPORT_STAGES = ["بيانات العميل", "الموقع", "الجهاز", "المشكلة"];

function SupportProgress({ step }: { step: string }) {
  const current = step === "sup_name" ? 0 : step.startsWith("sup_city") ? 1 : step === "sup_device" ? 2 : 3;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {SUPPORT_STAGES.map((stage, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <span key={stage} className="flex items-center gap-1.5">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black transition lg:text-[11px] ${active ? "bg-skyline text-skyline-foreground shadow-sm" : done ? "bg-skyline/10 text-skyline" : "bg-muted text-muted-foreground"}`}>
              {done ? <Check className="size-3" /> : <span className="grid size-3.5 place-items-center rounded-full bg-current/20 text-[8px]">{index + 1}</span>}
              {stage}
            </span>
            {index < SUPPORT_STAGES.length - 1 && <span className={`h-px w-3 ${done ? "bg-skyline/50" : "bg-border"}`} />}
          </span>
        );
      })}
    </div>
  );
}


function StepProgress({ step, hasQuote }: { step: string; hasQuote: boolean }) {
  const current = stageIndex(step, hasQuote);
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {QUOTE_STAGES.map((stage, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <span key={stage} className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black transition lg:text-[11px] ${
                active
                  ? "bg-brand text-brand-foreground shadow-sm"
                  : done
                    ? "bg-brand/10 text-brand"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {done ? <Check className="size-3" /> : <span className="grid size-3.5 place-items-center rounded-full bg-current/20 text-[8px]">{index + 1}</span>}
              {stage}
            </span>
            {index < QUOTE_STAGES.length - 1 && <span className={`h-px w-3 ${done ? "bg-brand/50" : "bg-border"}`} />}
          </span>
        );
      })}
    </div>
  );
}


function QuoteWorkspace({ view, session, step, draft, setDraft, onPick, onBack, onRestart, onHome, onOpenProduct }: { view: View; session: BotSession; step: string; draft: string; setDraft: (value: string) => void; onPick: (value: string) => void; onBack: () => void; onRestart: () => void; onHome: () => void; onOpenProduct?: ((id: string) => void) | undefined }) {
  const [selected, setSelected] = useState<string>("");
  // شاشة الدراسة تُعرض وحدها عند طلبها، وزر «العودة لعرض السعر» يعيد عرض الجدول
  const [showStudyOnly, setShowStudyOnly] = useState(false);
  const studyFresh = Boolean(view.study?.fresh);
  useEffect(() => { setShowStudyOnly(studyFresh); }, [studyFresh, view.study?.number]);
  // شاشة دراسة الجدوى الاقتصادية المستقلة
  const [showEco, setShowEco] = useState(false);
  useEffect(() => { setShowEco(false); }, [view.study?.number]);
  const ecoScreen = showEco && view.study ? view.study : null;
  const studyScreen = !ecoScreen && studyFresh && showStudyOnly && view.study;
  // شاشة المخطط الكهربائي تُعرض وحدها كاملة عند طلبها
  const [showSldOnly, setShowSldOnly] = useState(true);
  const sldParams = view.sld?.params || null;
  useEffect(() => { setShowSldOnly(true); }, [view.sld?.number, Boolean(sldParams)]);
  const sldScreen = Boolean(sldParams) && showSldOnly && !studyScreen && !ecoScreen;
  const hasOutputs = Boolean(view.quote || view.study || view.sld || view.specs.length);
  // شاشة عرض السعر الرسمي: عنوان ثابت بدل نص المتابعة القادم من المحرك
  const title = ecoScreen
    ? "دراسة الجدوى الاقتصادية والوفر البيئي"
    : sldScreen
    ? "المخطط الكهربائي أحادي الخط (SLD)"
    : studyScreen
    ? "دراسة المحاكاة الشمسية PVsyst"
    : view.quote ? "عرض سعر رسمي" : hasOutputs ? view.heading : STEP_LABELS[step] || view.heading;

  const visibleOptions = useMemo(() => view.options.filter((option) => !BACK_OPTION_TITLES.has(option.title.trim())), [view.options]);
  const isProjectSelection = step === "menu_sys3";
  // شاشة حلول الطاقة: بطاقتان عريضتان بدل زرين صغيرين
  const isEnergyMenu = step === "energy_menu";
  // شاشات طلب صنف محدد: بطاقات بصور حقيقية للأصناف
  const isItemCards = step === "item_menu" || step === "item_pick";

  // مسار الدعم الفني: مؤشر مراحل خاص به بدل مراحل عرض السعر
  const isSupportPath = step.startsWith("sup_");
  // شاشة عرض السعر الرسمي: أربعة أزرار مباشرة بألوان مميزة لكل خدمة
  const isQuoteActions = !sldScreen && !ecoScreen && Boolean(view.quote) && (step === "qnext_ask" || step === "res_quote_ask" || step === "com_quote_ask" || step === "agr_quote_ask" || step === "buy_ask" || (studyFresh && !showStudyOnly));
  // شاشة المخطط الكهربائي لا تطلب أي إدخال
  const showEntry = step !== "done" && !view.quote && !view.sld && !isProjectSelection && (step in ENTRY_PROMPTS || (view.needsInput && visibleOptions.length === 0));


  const submit = () => {
    if (view.needsInput && draft.trim()) onPick(draft);
    else if (selected) onPick(selected);
  };

  return (
    <div className="screen-enter w-full space-y-6 pb-8">
      <section className="min-w-0">
        <div className="mb-5 flex items-end justify-between gap-4 border-b border-border pb-3">
          <div className="min-w-0">
            {!isEnergyMenu && !isSupportPath && <StepProgress step={step} hasQuote={Boolean(view.quote)} />}
            {isSupportPath && <SupportProgress step={step} />}
            <h1 className="mt-2 text-xl font-black sm:text-2xl">{title}</h1>
            <span className="mt-2 block h-1 w-10 rounded-full bg-brand" />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={() => { silenceNextScreen(); if (ecoScreen) { setShowEco(false); return; } if (sldScreen) { setShowSldOnly(false); return; } if (studyScreen) { setShowStudyOnly(false); return; } onBack(); }} title="رجوع خطوة" aria-label="رجوع خطوة" className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-xs font-bold text-navy shadow-sm transition hover:bg-muted hover:border-brand hover:text-brand lg:text-sm">
              <ArrowRight className="size-4" /> رجوع
            </button>
            {step === "done" && (
              <button type="button" onClick={onHome} title="العودة إلى الشاشة الرئيسية" aria-label="العودة إلى الشاشة الرئيسية" className="inline-flex items-center gap-1.5 rounded-full bg-skyline px-3 py-2 text-xs font-bold text-skyline-foreground shadow-sm transition hover:opacity-90 lg:text-sm">
                <Home className="size-4" /> الشاشة الرئيسية
              </button>
            )}

            <button type="button" onClick={onRestart} title="العودة للبداية" aria-label="العودة للبداية" className={`size-10 place-items-center rounded-full border border-border bg-card text-skyline transition hover:border-brand hover:text-brand ${view.specs.length > 0 ? "hidden" : "grid"}`}>
              <RotateCcw className="size-5" />
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-6">

            {ecoScreen ? (
              <EconomicStudy
                study={ecoScreen}
                actions={{
                  onBuy: () => onPick("buy_invoice"),
                  onBackToQuote: () => setShowEco(false),
                  onStudy: studyFresh ? () => { setShowEco(false); setShowStudyOnly(true); } : undefined,
                  onSld: () => { setShowEco(false); onPick("sld_yes"); },
                }}
              />
            ) : sldScreen ? (
              <SldDiagram
                params={sldParams}
                number={view.sld?.number}
                actions={{
                  onBackToQuote: () => setShowSldOnly(false),
                  onBuy: () => onPick("buy_invoice"),
                  onStudy: view.study ? () => { setShowSldOnly(false); setShowStudyOnly(true); } : undefined,
                }}
              />
            ) : studyScreen ? (
              <PvsystStudy
                study={studyScreen}
                actions={{
                  onBuy: () => onPick("buy_invoice"),
                  onBackToQuote: () => setShowStudyOnly(false),
                  onSld: () => onPick("sld_yes"),
                }}
              />
            ) : (

              <>
            {view.images.length > 0 && !view.quote && !isProjectSelection && <MediaGallery images={view.images} />}

            <div className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
              {view.quote || isProjectSelection ? (
                <div className="min-w-0" />
              ) : (
                <div className="min-w-0">
                  {(() => {
                    const allLines = view.sections.flatMap((section) => section.lines);
                    // شاشات طلب الأصناف تعرض كل أسطر السلة حتى تظهر جميع الأصناف المضافة
                    const showAllLines = step.startsWith("item_") || step === "agr_result";
                    const lines = showAllLines ? allLines : allLines.slice(0, 2);
                    return lines.map((line, index) => <p key={index} className="text-sm font-medium leading-6 text-foreground sm:text-base">{line}</p>);
                  })()}
                </div>
              )}
            </div>

            {view.specs.length > 0 && <SystemSpecs specs={view.specs} hint={[session["phase_type"], session["system_type"]].filter(Boolean).join(" ")} onOpenProduct={onOpenProduct} />}
            {view.quote && <QuoteCard quote={view.quote} />}
            {view.study && !studyFresh && <PvsystStudy study={view.study} />}
            {view.sld && (view.sld.params
              ? <SldDiagram params={view.sld.params} number={view.sld.number} />
              : <DetailCard icon={<Network />} title="المخطط الكهربائي أحادي الخط (SLD)" number={view.sld.number} rows={view.sld.rows} />)}
            {(() => {
              const visibleDocs = view.quote
                ? view.docs.filter((doc) => !(doc.url && view.quote?.fileUrl && doc.url === view.quote.fileUrl) && !/\.pdf$/i.test(doc.name))
                : view.docs;
              return visibleDocs.length > 0 ? <Documents docs={visibleDocs} /> : null;
            })()}

            {isQuoteActions ? (
              <div className="mt-6 border-t border-border pt-5">
                <QuoteActions onPick={onPick} hideEngineering={String((session as Record<string, unknown>)["menu_choice"] ?? "") === "1"} onEco={view.study ? () => { silenceNextScreen(); setShowEco(true); } : undefined} />
              </div>
            ) : (visibleOptions.length > 0 || showEntry) && (
              <div className="mt-6 space-y-5 border-t border-border pt-5">
                {showEntry && (step === "ind_shift"
                  ? (() => { const info = shiftEntryInfo(session); return <ShiftEntry key={`shift-${info.offset}-${info.count}`} count={info.count} offset={info.offset} onSubmit={onPick} />; })()
                  : step === "pv_loads"
                    ? <HourlyLoadEntry onSubmit={onPick} />
                    : <DataEntry value={draft} onChange={setDraft} prompt={entryPrompt(step, session)} onSubmit={submit} presets={ENTRY_PRESETS[step]} onQuick={onPick} />)}
                {visibleOptions.length > 0 && <OptionGrid options={visibleOptions} selected={selected} projectCards={isProjectSelection} energyCards={isEnergyMenu} itemCards={isItemCards} onSelect={(value) => { onPick(value); }} />}
              </div>
            )}

            {step === "done" && (
              <div className="mt-6 border-t border-border pt-5">
                <button type="button" onClick={onHome} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-skyline px-6 py-3 text-sm font-bold text-skyline-foreground transition hover:opacity-90 sm:w-auto">
                  <Home className="size-4" /> العودة إلى الشاشة الرئيسية
                </button>
              </div>
            )}

              </>
            )}
          </div>
        </section>
        {!view.quote && <ProjectAside session={session} />}
    </div>
  );
}

// أزرار شاشة عرض السعر الرسمي: لكل خدمة لونها الخاص
const QUOTE_ACTIONS: { id: string; title: string; note: string; icon: ReactNode; className: string; chip: string }[] = [
  { id: "aq_buy", title: "متابعة الشراء", note: "إتمام طلب المنظومة", icon: <ShoppingCart />, className: "bg-energy text-energy-foreground", chip: "bg-energy-foreground/20" },
  { id: "sales_contact", title: "التواصل مع المبيعات", note: "استفسار أو عرض رسمي", icon: <Headphones />, className: "border border-border bg-soft text-foreground", chip: "bg-brand/10 text-brand" },
  { id: "aq_study", title: "دراسة PVsyst", note: "دراسة إنتاجية تفصيلية", icon: <LineChart />, className: "bg-skyline text-skyline-foreground", chip: "bg-skyline-foreground/20" },
  { id: "aq_eco", title: "دراسة الجدوى الاقتصادية", note: "العائد والاسترداد والوفر البيئي", icon: <BadgeDollarSign />, className: "bg-emerald-600 text-white", chip: "bg-white/20" },
  { id: "aq_sld", title: "مخطط SLD", note: "المخطط الكهربائي الأحادي", icon: <Network />, className: "bg-field text-field-foreground", chip: "bg-field-foreground/15" },
];

function QuoteActions({ onPick, hideEngineering = false, onEco }: { onPick: (value: string) => void; hideEngineering?: boolean; onEco?: (() => void) | undefined }) {
  const actions = QUOTE_ACTIONS.filter((a) => {
    if (a.id === "aq_eco") return Boolean(onEco) && !hideEngineering;
    if (hideEngineering) return a.id !== "aq_study" && a.id !== "aq_sld";
    return true;
  });
  return (
    <div className={`grid gap-3 sm:grid-cols-2 ${hideEngineering ? "" : "xl:grid-cols-3"}`}>
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          onClick={() => { if (action.id === "aq_eco" && onEco) { onEco(); return; } onPick(action.id); }}
          className={`flex items-center gap-3 rounded-xl px-4 py-3 text-right shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-lg ${action.className}`}
        >
          <span className={`grid size-9 shrink-0 place-items-center rounded-lg [&_svg]:size-4 ${action.chip}`}>{action.icon}</span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-black leading-5">{action.title}</span>
            <span className="block text-[10px] font-semibold leading-4 opacity-85">{action.note}</span>
          </span>
          <ArrowLeft className="size-4 shrink-0 opacity-80" />
        </button>
      ))}
    </div>
  );
}

/** يستخرج المواصفة الفنية المختصرة من اسم الصنف: الأمبير أولاً، ثم الجهد والقدرة والمقطع. */
function itemSpec(text: string): string {
  const t = text.replace(/[\u064B-\u0652]/g, "");
  const amp = t.match(/(\d+(?:\.\d+)?)\s*(?:أمبير|امبير|A\b)/i);
  if (amp) return `${amp[1]}A`;
  const cross = t.match(/(\d+)\s*[×xX*]\s*(\d+(?:\.\d+)?)\s*(?:ملي|مم|mm)/);
  if (cross) return `${cross[1]}×${cross[2]}mm²`;
  const kwh = t.match(/(\d+(?:\.\d+)?)\s*كيلو\s*وات\s*ساعة/);
  if (kwh) return `${kwh[1]}kWh`;
  const volt = t.match(/(\d+(?:\.\d+)?)\s*(?:فولت|V\b)/i);
  if (volt) return `${volt[1]}V`;
  const watt = t.match(/(\d+(?:\.\d+)?)\s*وات/);
  if (watt) return `${watt[1]}W`;
  const kw = t.match(/(\d+(?:\.\d+)?)\s*كيلو/);
  if (kw) return `${kw[1]}kW`;
  const mm = t.match(/(\d+(?:\.\d+)?)\s*(?:مم|ملي|mm)/);
  if (mm) return `${mm[1]}mm²`;
  const line = t.match(/(\d+)\s*خط/);
  if (line) return `${line[1]} خط`;
  return "";
}

function OptionGrid({ options, selected, projectCards = false, energyCards = false, itemCards = false, onSelect }: { options: View["options"]; selected: string; projectCards?: boolean; energyCards?: boolean; itemCards?: boolean; onSelect: (value: string) => void }) {

  const asActions = !energyCards && !itemCards && options.length <= 2 && options.every((option) => !option.description);


  // شاشة حلول الطاقة: بطاقتان عريضتان واضحتان تملآن الشاشة
  if (energyCards) {
    const energyVisual = (title: string) =>
      /pvsyst|دراسة/i.test(title)
        ? { icon: LineChart, subtitle: "محاكاة دقيقة لإنتاجية المنظومة وكفاءتها على مدار العام، مع تقرير أداء مفصّل.", action: "ابدأ الدراسة", tone: "bg-brand text-brand-foreground" }
        : { icon: Headphones, subtitle: "تواصل مع مهندسي أكتس لطلب استشارة فنية أو معاينة ميدانية لموقعك.", action: "تواصل مع الفريق", tone: "bg-skyline text-skyline-foreground" };
    return (
      <div className="stagger-in grid gap-3 sm:grid-cols-2">
        {options.map((option, index) => {
          const visual = energyVisual(option.title);
          const Icon = visual.icon;
          return (
            <button
              key={`${option.id}-${index}`}
              type="button"
              onClick={() => onSelect(option.id)}
              className="group flex h-full flex-col items-start gap-3 rounded-xl border border-border bg-card p-5 text-right shadow-sm transition hover:-translate-y-0.5 hover:border-brand hover:shadow-lg"
            >
              <span className={`grid size-12 shrink-0 place-items-center rounded-full ${visual.tone}`}><Icon className="size-6" /></span>
              <strong className="text-base font-black">{option.title}</strong>
              <small className="text-xs font-semibold leading-5 text-muted-foreground">{visual.subtitle}</small>
              <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-xs font-black text-brand">
                {visual.action} <ArrowLeft className="size-4 transition group-hover:-translate-x-0.5" />
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  if (asActions) {
    return (
      <div className="stagger-in flex flex-wrap gap-3">
        {options.map((option, index) => {
          const active = selected === option.id;
          const primary = index === 0;
          return (
            <button
              key={`${option.id}-${index}`}
              type="button"
              onClick={() => onSelect(option.id)}
              className={`inline-flex min-w-48 flex-1 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-black transition sm:flex-none ${
                primary || active
                  ? "bg-brand text-brand-foreground shadow-md hover:opacity-90"
                  : "border border-skyline/45 bg-card text-skyline hover:bg-muted"
              }`}
            >
              {option.title}
              <ArrowLeft className="size-4" />
            </button>
          );
        })}
      </div>
    );
  }

  // شاشات طلب صنف محدد: بطاقة لكل صنف بصورته الحقيقية إن وُجدت
  if (itemCards) {
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
        {options.map((option, index) => {
          const active = selected === option.id;
          const image = itemImage(option.title);
          const spec = itemSpec(`${option.title} ${option.description || ""}`);
          const priceMatch = option.description?.match(/^([\d.,]+\s*\S+\s*\/\s*\S+)/);
          return (
            <button
              key={`${option.id}-${index}`}
              type="button"
              onClick={() => onSelect(option.id)}
              className={`group flex h-full flex-col overflow-hidden rounded-xl border text-right transition-[border-color,box-shadow] duration-150 hover:border-brand/60 hover:shadow-md ${active ? "border-brand bg-brand/5 shadow-md" : "border-border bg-card shadow-sm"}`}
            >
              {image ? (
                <span className="block h-14 w-full overflow-hidden border-b border-border bg-muted sm:h-16">
                  <img src={image} alt="" loading="lazy" decoding="async" className="size-full object-contain p-1" />
                </span>
              ) : null}

              <span className="flex flex-1 flex-col gap-1.5 p-2.5">
                <span className="block text-[12.5px] font-black leading-5">{option.title}</span>
                {spec && <span className="inline-flex w-fit items-center rounded-md bg-skyline/10 px-1.5 py-0.5 text-[10.5px] font-black text-skyline" dir="ltr">{spec}</span>}
                {priceMatch && (
                  <span className="mt-auto inline-flex w-fit items-center gap-1 rounded-full bg-energy/10 px-2 py-0.5 text-[10px] font-black text-energy" dir="ltr">
                    <CircleDollarSign className="size-3" />
                    {(priceMatch[1] ?? "").trim()}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  if (projectCards) {

    const projectVisual = (title: string) => {
      if (/سكن/.test(title)) return { image: residentialImage, icon: House, subtitle: "للمنازل والفلل" };
      if (/تجار/.test(title)) return { image: commercialImage, icon: Building2, subtitle: "للمشاريع التجارية والمنشآت" };
      if (/زراع/.test(title)) return { image: agricultureImage, icon: Sun, subtitle: "للمزارع وأنظمة الري" };
      return { image: industrialImage, icon: Zap, subtitle: "للمشاريع الصناعية والمنشآت الكبرى" };
    };
    return (
      <div className="stagger-in grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {options.map((option, index) => {
          const visual = projectVisual(option.title);
          const Icon = visual.icon;
          const inactive = /قريباً/.test(option.title);
          return (
            <button key={`${option.id}-${index}`} type="button" onClick={() => onSelect(option.id)} className={`group overflow-hidden rounded-lg border bg-card text-right shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${index === 1 ? "border-brand ring-1 ring-brand" : "border-border"}`}>
              <span data-photo-frame className="relative block aspect-[16/9] w-full overflow-hidden border-b border-border bg-muted">
                <img data-photo src={visual.image} alt="" loading="eager" decoding="async" fetchPriority="high" className={`size-full object-cover transition duration-500 group-hover:scale-[1.03] ${inactive ? "opacity-65" : ""}`} />
                {inactive && <span className="absolute right-2 top-2 rounded-full bg-overlay/55 px-2 py-0.5 text-[10px] font-bold text-brand-foreground">قريباً</span>}
                <span className={`absolute -bottom-4 right-3 grid size-10 place-items-center rounded-full border-[3px] border-card ${index === 1 ? "bg-brand text-brand-foreground" : "bg-secondary text-skyline"}`}><Icon className="size-4" /></span>
              </span>
              <span className="flex min-h-[72px] flex-col px-3 pb-2 pt-6">
                <strong className="text-sm font-black">{option.title}</strong>
                <small className="mt-1 text-[11px] font-semibold text-muted-foreground">{visual.subtitle}</small>
                <span className={`mt-auto grid size-8 place-items-center self-end rounded-full ${index === 1 ? "bg-brand text-brand-foreground" : "bg-brand/10 text-brand"}`}><ArrowLeft className="size-4" /></span>
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="stagger-in grid gap-2 grid-cols-2 sm:grid-cols-3 xl:grid-cols-6">

      {options.map((option, index) => {
        const active = selected === option.id;
        const Icon = index % 4 === 0 ? House : index % 4 === 1 ? Building2 : index % 4 === 2 ? Zap : BatteryCharging;
        const priceMatch = option.description?.match(/السعر:\s*([\d.,]+\s*\$?)/);
        const details = option.description ? option.description.replace(/—?\s*السعر:.*$/, "").trim() : "";
        const spec = itemSpec(`${option.title} ${option.description || ""}`);
        return (
          <button
            key={`${option.id}-${index}`}
            type="button"
            onClick={() => onSelect(option.id)}
            className={`group flex h-full flex-col gap-2 rounded-xl border p-2.5 text-right transition hover:-translate-y-0.5 hover:border-brand/60 hover:shadow-lg ${active ? "border-brand bg-brand/5 shadow-md" : "border-border bg-card shadow-sm"}`}
          >
            <span className="flex items-start justify-between gap-2">
              <span className={`grid size-8 shrink-0 place-items-center rounded-lg transition ${active ? "bg-brand text-brand-foreground" : "bg-secondary text-skyline group-hover:bg-brand/10 group-hover:text-brand"}`}>
                <Icon className="size-4" />
              </span>
              {active ? (
                <span className="grid size-5 place-items-center rounded-full bg-brand text-brand-foreground"><Check className="size-3" /></span>
              ) : (
                <ArrowLeft className="size-3.5 text-muted-foreground transition group-hover:text-brand" />
              )}
            </span>
            <span className="block text-[13px] font-black leading-5">{option.title}</span>
            {spec && (
              <span className="inline-flex w-fit items-center rounded-md bg-skyline/10 px-2 py-0.5 text-[11px] font-black text-skyline" dir="ltr">{spec}</span>
            )}
            {details && <span className="block text-[10px] leading-4 text-muted-foreground">{details}</span>}
            {priceMatch && (
              <span className="mt-auto inline-flex w-fit items-center gap-1 rounded-full bg-energy/10 px-2 py-0.5 text-[10px] font-black text-energy">
                <CircleDollarSign className="size-3" />
                {(priceMatch[1] ?? "").trim()}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

type EntryPrompt = { label: string; hint: string; placeholder: string; cta: string; numeric?: boolean };

// قيم سريعة شائعة تُختار بنقرة واحدة بدل الكتابة اليدوية
const ENTRY_PRESETS: Record<string, { label: string; value: string }[]> = {
  res_bill: [
    { label: "20 ألف", value: "20000" },
    { label: "40 ألف", value: "40000" },
    { label: "70 ألف", value: "70000" },
    { label: "120 ألف", value: "120000" },
  ],
  agr_bill: [
    { label: "50 ألف", value: "50000" },
    { label: "100 ألف", value: "100000" },
    { label: "200 ألف", value: "200000" },
    { label: "400 ألف", value: "400000" },
  ],
  agr_pump_power: [
    { label: "5 حصان", value: "5" },
    { label: "10 حصان", value: "10" },
    { label: "15 حصان", value: "15" },
    { label: "25 حصان", value: "25" },
  ],
  agr_pumps: [
    { label: "مضخة", value: "1" },
    { label: "مضختان", value: "2" },
    { label: "3 مضخات", value: "3" },
  ],
  ind_total_kw: [
    { label: "50 كيلووات", value: "50" },
    { label: "100 كيلووات", value: "100" },
    { label: "150 كيلووات", value: "150" },
    { label: "250 كيلووات", value: "250" },
  ],

  item_qty: [
    { label: "1", value: "1" },
    { label: "2", value: "2" },
    { label: "4", value: "4" },
    { label: "8", value: "8" },
  ],

  sup_device: [
    { label: "إنفرتر هجين", value: "إنفرتر هجين" },
    { label: "بطارية ليثيوم", value: "بطارية ليثيوم" },
    { label: "ألواح شمسية", value: "ألواح شمسية" },
    { label: "لوحة تحكم وحماية", value: "لوحة تحكم وحماية" },
    { label: "منظومة كاملة", value: "منظومة كاملة" },
  ],
  sup_problem: [
    { label: "توقف مفاجئ", value: "المنظومة تتوقف عن العمل بشكل مفاجئ" },
    { label: "كود خطأ على الشاشة", value: "يظهر كود خطأ على شاشة الجهاز" },
    { label: "تفريغ سريع للبطارية", value: "البطارية تفرغ بسرعة غير طبيعية" },
    { label: "ضعف الإنتاج", value: "ضعف في إنتاج الطاقة من الألواح" },
    { label: "صيانة دورية", value: "طلب فحص وصيانة دورية للمنظومة" },
  ],
};

const ENTRY_PROMPTS: Record<string, EntryPrompt> = {
  res_bill: { label: "فاتورة الاستهلاك الشهري", hint: "ادخل متوسط الفاتورة الشهرية التي تدفعها بالريال اليمني", placeholder: "مثال: 43000 ريال يمني", cta: "متابعة", numeric: true },
  agr_bill: { label: "فاتورة المزرعة الشهرية", hint: "ادخل متوسط الفاتورة أو تكلفة الوقود الشهرية للمزرعة بالريال اليمني", placeholder: "مثال: 90000 ريال يمني", cta: "متابعة", numeric: true },
  agr_pump_power: { label: "قدرة المضخة", hint: "اكتب قدرة الغاطس أو المضخة بالحصان", placeholder: "مثال: 15", cta: "متابعة", numeric: true },
  agr_well_depth: { label: "عمق البئر أو ارتفاع الضخ", hint: "اكتب عمق تنزيل الغاطس بالمتر", placeholder: "مثال: 120", cta: "متابعة", numeric: true },
  agr_hours: { label: "ساعات الري اليومية", hint: "كم ساعة تحتاج تشغيل الضخ يومياً", placeholder: "مثال: 6", cta: "متابعة", numeric: true },
  agr_pumps: { label: "عدد المضخات", hint: "عدد المضخات المطلوب تشغيلها في المزرعة", placeholder: "مثال: 1", cta: "متابعة", numeric: true },
  agr_diesel: { label: "تكلفة التشغيل الشهرية", hint: "متوسط تكلفة الديزل أو الكهرباء شهرياً بالريال اليمني", placeholder: "مثال: 300000", cta: "متابعة", numeric: true },
  agr_name: { label: "اسم العميل", hint: "اكتب الاسم الذي سيعتمد في عرض السعر الرسمي", placeholder: "الاسم الكامل", cta: "متابعة" },
  agr_visit_date: { label: "موعد المعاينة", hint: "اكتب اليوم والوقت المناسبين لمعاينة البئر والمزرعة", placeholder: "مثال: السبت القادم صباحاً", cta: "متابعة" },
  res_value: { label: "قيمة الاستهلاك", hint: "ادخل قيمة استهلاكك الشهري كما هي في فاتورتك", placeholder: "اكتب الرقم هنا", cta: "متابعة", numeric: true },
  com_value: { label: "قيمة الاستهلاك", hint: "ادخل قيمة استهلاك المنشأة حسب الطريقة التي اخترتها", placeholder: "اكتب الرقم هنا", cta: "متابعة", numeric: true },
  com_quote_name: { label: "اسم العميل أو المنشأة", hint: "اكتب الاسم الذي سيعتمد في عرض السعر الرسمي", placeholder: "الاسم التجاري أو اسم المسؤول", cta: "متابعة" },
  com_visit_date: { label: "موعد الزيارة الميدانية", hint: "اكتب اليوم والوقت المناسبين للمعاينة", placeholder: "مثال: السبت القادم صباحاً", cta: "متابعة" },
  com_visit_facility: { label: "اسم المنشأة والنشاط التجاري", hint: "اكتب اسم المنشأة ونوع نشاطها", placeholder: "مثال: مركز تجاري، فندق، محطة وقود، ورشة", cta: "متابعة" },
  pv_loads: { label: "الأحمال الكهربائية", hint: "ادخل إجمالي الأحمال أو الاستهلاك اليومي للمشروع", placeholder: "اكتب الرقم هنا", cta: "متابعة", numeric: true },
  ind_name: { label: "اسم المشروع الصناعي", hint: "اكتب اسم المصنع أو الجهة المالكة للمشروع", placeholder: "مثال: مصنع الرواد للصناعات الغذائية", cta: "متابعة" },
  ind_shift: { label: "وقت الوردية", hint: "اكتب وقت بداية الوردية ونهايتها", placeholder: "مثال: 08:00 - 16:00", cta: "متابعة" },
  ind_total_kw: { label: "الحمل بالكيلووات", hint: "اختر قيمة قريبة أو اكتب الرقم الذي تعرفه", placeholder: "مثال: 120", cta: "متابعة", numeric: true },
  ind_max_mach: { label: "أكبر ماكينة منفردة", hint: "قدرة أعلى حمل تشغيلي أو ماكينة منفردة بالكيلووات", placeholder: "مثال: 30", cta: "متابعة", numeric: true },
  ind_motor_kw: { label: "قدرة أكبر محرك", hint: "قدرة المحرك ذي تيار الإقلاع العالي بالكيلووات", placeholder: "مثال: 22", cta: "متابعة", numeric: true },
  ind_gen_kva: { label: "قدرة المولد الحالي", hint: "اكتب قدرة المولد إن وُجد، وإن لم يوجد فاكتب 0", placeholder: "مثال: 250", cta: "متابعة", numeric: true },
  ind_diesel: { label: "استهلاك الديزل اليومي", hint: "متوسط استهلاك المولد من الديزل باللتر يومياً", placeholder: "مثال: 300", cta: "متابعة", numeric: true },
  ind_old_pv: { label: "المنظومة الشمسية القائمة", hint: "إجمالي قدرة الألواح الحالية بالكيلووات", placeholder: "مثال: 50", cta: "متابعة", numeric: true },
  quote_name: { label: "اسم العميل", hint: "اكتب اسمك كما تريده أن يظهر في عرض السعر", placeholder: "الاسم الكامل", cta: "متابعة" },
  quote_city: { label: "المدينة", hint: "اكتب اسم مدينتك", placeholder: "مثال: صنعاء", cta: "متابعة" },
  buy_invoice: { label: "رقم الحوالة", hint: "اكتب رقم الحوالة هنا", placeholder: "اكتب رقم الحوالة هنا", cta: "إرسال" },
  pay_notice: { label: "رقم الحوالة", hint: "اكتب رقم الحوالة هنا بعد تحويل المبلغ", placeholder: "اكتب رقم الحوالة هنا", cta: "إرسال" },
  pay_network: { label: "اسم الشبكة", hint: "اكتب اسم الشبكة التي حوّلت من خلالها", placeholder: "مثال: النجم العمقي", cta: "متابعة" },
  pay_network_name: { label: "اسم المرسل", hint: "اكتب اسم الشخص الذي حوّل المبلغ", placeholder: "اسم المرسل", cta: "متابعة" },
  pay_wallet: { label: "رقم مرجع العملية", hint: "ادخل رقم مرجع العملية هنا بعد الدفع عبر المحفظة", placeholder: "ادخل رقم مرجع العملية هنا", cta: "إرسال" },
  pay_wallet_name: { label: "اسم المرسل", hint: "اكتب اسم الشخص الذي دفع المبلغ", placeholder: "اسم المرسل", cta: "متابعة" },
  buy_location: { label: "الموقع", hint: "اكتب موقعك بالتفصيل لتسليم المنظومة", placeholder: "المدينة والحي", cta: "متابعة" },
  item_qty: { label: "الكمية المطلوبة", hint: "ادخل الكمية التي ترغب بشرائها", placeholder: "مثال: 4", cta: "متابعة", numeric: true },
  item_name: { label: "اسم العميل", hint: "اكتب الاسم الذي سيعتمد في عرض السعر الرسمي", placeholder: "أكتب الاسم هنا", cta: "متابعة" },
  sup_name: { label: "اسم العميل", hint: "اكتب اسمك ليتواصل معك فريق الدعم الفني", placeholder: "الاسم الكامل", cta: "متابعة" },
  sup_device: { label: "الجهاز أو النظام", hint: "اختر الجهاز من الخيارات السريعة أو اكتب اسمه وموديله", placeholder: "مثال: إنفرتر Deye 8kW", cta: "متابعة" },
  sup_problem: { label: "وصف المشكلة", hint: "اختر وصفاً سريعاً أو اشرح المشكلة بالتفصيل", placeholder: "اشرح ما يحدث بالضبط", cta: "إرسال الطلب" },

};

function entryPrompt(step: string, session: BotSession = {}): EntryPrompt {
  const payWay = String(session["service_needed"] || "");
  if (step === "pay_notice" && /محفظة|wallet/i.test(payWay)) {
    return { label: "رقم مرجع العملية", hint: "ادخل رقم مرجع العملية هنا بعد الدفع عبر المحفظة", placeholder: "ادخل رقم مرجع العملية هنا", cta: "إرسال" };
  }
  // خانة الاستهلاك التجاري تتبدّل بحسب طريقة الحساب التي اختارها العميل
  if (step === "com_value") {
    const method = String(session["activity_type"] || "").replace("com_", "");
    if (method === "2") return { label: "الاستهلاك الشهري (كيلووات)", hint: "أدخل الاستهلاك الشهري للمنشأة بالكيلووات", placeholder: "مثال: 900", cta: "متابعة", numeric: true };
    if (method === "3") return { label: "استهلاك الديزل الشهري", hint: "أدخل استهلاك المولد باللتر شهرياً", placeholder: "مثال: 250", cta: "متابعة", numeric: true };
    return { label: "فاتورة الكهرباء الشهرية", hint: "أدخل متوسط الفاتورة الشهرية بالريال اليمني", placeholder: "مثال: 50000", cta: "متابعة", numeric: true };
  }
  return ENTRY_PROMPTS[step] ?? { label: "البيانات المطلوبة", hint: "اكتب البيانات المطلوبة في الخانة ثم تابع", placeholder: "اكتب هنا", cta: "متابعة" };
}

function DataEntry({ value, onChange, onSubmit, prompt, presets, onQuick }: { value: string; onChange: (value: string) => void; onSubmit: () => void; prompt: EntryPrompt; presets?: { label: string; value: string }[] | undefined; onQuick?: ((value: string) => void) | undefined }) {
  return (
    <form onSubmit={(event) => { event.preventDefault(); onSubmit(); }} className="rounded-lg border border-border bg-muted/35 p-5">
      <label htmlFor="step-value" className="text-sm font-black">{prompt.label}</label>
      <p className="mt-1 text-xs text-muted-foreground">{prompt.hint}</p>
      {presets && presets.length > 0 && (
        <div className="stagger-in mt-3 flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => { if (onQuick) onQuick(preset.value); else { onChange(preset.value); onSubmit(); } }}
              className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-black text-navy shadow-sm transition hover:-translate-y-0.5 hover:border-brand hover:text-brand hover:shadow-md"
            >
              {preset.label}
            </button>
          ))}
          <span className="self-center text-[10px] font-semibold text-muted-foreground">أو اكتب القيمة بنفسك</span>
        </div>
      )}
      <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <input
          id="step-value"
          autoFocus
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={prompt.placeholder}
          inputMode={prompt.numeric ? "numeric" : "text"}
          className="min-w-0 rounded-md border border-input bg-card px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
        />
        <button type="submit" className="rounded-md bg-skyline px-6 py-3 text-sm font-bold text-skyline-foreground">{prompt.cta}</button>
      </div>
    </form>
  );
}

// عدد الورديات المطلوبة يُقرأ من حالة المسار الصناعي المحفوظة في الجلسة
function shiftEntryInfo(session: BotSession): { count: number; offset: number } {
  try {
    const raw = JSON.parse(String(session["main_loads"] || "")) as { ind?: { nsh?: number; shifts?: unknown[] } };
    const ind = raw?.ind;
    if (ind) {
      const nsh = Math.min(3, Math.max(1, Number(ind.nsh) || 1));
      const done = Array.isArray(ind.shifts) ? ind.shifts.length : 0;
      return { count: Math.max(1, nsh - done), offset: done };
    }
  } catch {
    // لا توجد حالة محفوظة بعد
  }
  return { count: 1, offset: 0 };
}

const SHIFT_ORDINALS = ["الأولى", "الثانية", "الثالثة"];
const SHIFT_EXAMPLES = ["08:00 - 16:00", "16:00 - 00:00", "00:00 - 08:00"];

// شاشة مواعيد الورديات: خانة لكل وردية بحسب عدد الدوريات المختار
function ShiftEntry({ count, offset, onSubmit }: { count: number; offset: number; onSubmit: (value: string) => void }) {
  const [values, setValues] = useState<string[]>(() => Array.from({ length: count }, () => ""));
  const filled = values.filter((entry) => entry.trim()).length;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const list = values.map((entry) => entry.trim()).filter(Boolean);
        if (list.length === count) onSubmit(list.join(" , "));
      }}
      className="rounded-lg border border-border bg-muted/35 p-5"
    >
      <p className="text-sm font-black">{count === 1 ? "وقت الوردية" : `مواعيد الورديات (${count})`}</p>
      <p className="mt-1 text-xs text-muted-foreground">اكتب وقت البداية والنهاية لكل وردية — ويمكنك الاختصار: 8-7 تعني 08:00 — 07:00</p>
      <div className="mt-4 space-y-3">
        {values.map((entry, index) => (
          <div key={index} className="grid gap-1.5">
            <label htmlFor={`shift-${index}`} className="text-xs font-bold text-muted-foreground">
              {`الوردية ${SHIFT_ORDINALS[offset + index] ?? String(offset + index + 1)}`}
            </label>
            <input
              id={`shift-${index}`}
              autoFocus={index === 0}
              value={entry}
              onChange={(event) => setValues((prev) => prev.map((old, i) => (i === index ? event.target.value : old)))}
              placeholder={`مثال: ${SHIFT_EXAMPLES[offset + index] ?? "08:00 - 16:00"}`}
              inputMode="text"
              className="min-w-0 rounded-md border border-input bg-card px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
            />
          </div>
        ))}
      </div>
      <button
        type="submit"
        disabled={filled !== count}
        className="mt-4 w-full rounded-md bg-skyline px-6 py-3 text-sm font-bold text-skyline-foreground disabled:opacity-50 sm:w-auto"
      >
        متابعة
      </button>
    </form>
  );
}

// تسمية كل ساعة من اليوم بنطق عربي واضح: 12–1 صباحاً … 11–12 مساءً
const HOUR_LABELS = Array.from({ length: 24 }, (_, hour) => {
  const fmt = (h: number) => {
    const mod = h % 24;
    const h12 = mod % 12 === 0 ? 12 : mod % 12;
    return h12;
  };
  const period = (h: number) => (h % 24 < 12 ? "صباحاً" : "مساءً");
  return `من ${fmt(hour)} إلى ${fmt(hour + 1)} ${period(hour + 1 === 24 ? 0 : hour)}`;
});

// شاشة بيانات الأحمال: 24 خانة، خانة لكل ساعة في اليوم بالكيلووات
function HourlyLoadEntry({ onSubmit }: { onSubmit: (value: string) => void }) {
  const [values, setValues] = useState<string[]>(() => Array.from({ length: 24 }, () => ""));
  const filled = values.filter((entry) => entry.trim()).length;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (filled === 24) onSubmit(values.map((entry, hour) => `${hour}=${entry.trim()}`).join("\n"));
      }}
      className="rounded-lg border border-border bg-muted/35 p-5"
    >
      <p className="text-sm font-black">بيانات الأحمال اليومية</p>
      <p className="mt-1 text-xs text-muted-foreground">اكتب الحمل المتوقع في كل ساعة من اليوم بالكيلووات (kW) — 24 خانة تغطي اليوم كاملاً</p>
      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
        {values.map((entry, index) => (
          <div key={index} className="grid gap-1">
            <label htmlFor={`hour-${index}`} className="text-[11px] font-bold text-muted-foreground">
              {HOUR_LABELS[index]}
            </label>
            <div className="relative">
              <input
                id={`hour-${index}`}
                autoFocus={index === 0}
                value={entry}
                onChange={(event) => setValues((prev) => prev.map((old, i) => (i === index ? event.target.value : old)))}
                placeholder="0"
                inputMode="decimal"
                className="w-full rounded-md border border-input bg-card px-3 py-2.5 pe-10 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
              />
              <span className="pointer-events-none absolute inset-y-0 end-3 grid place-items-center text-[10px] font-bold text-muted-foreground">kW</span>
            </div>
          </div>
        ))}
      </div>
      <button
        type="submit"
        disabled={filled !== 24}
        className="mt-4 w-full rounded-md bg-skyline px-6 py-3 text-sm font-bold text-skyline-foreground disabled:opacity-50 sm:w-auto"
      >
        متابعة ({filled}/24)
      </button>
    </form>
  );
}

function MediaGallery({ images }: { images: View["images"] }) {
  return <div className={`mb-4 grid gap-2 ${images.length > 1 ? "md:grid-cols-2" : ""}`}>{images.map((image, index) => <figure data-photo-section key={index} className="overflow-hidden rounded-lg border border-border bg-muted/35"><div className="flex min-h-24 items-center justify-center p-2"><img src={image.url} alt={image.caption || "صورة من منتجات ACTES"} className="max-h-[210px] w-auto max-w-full object-contain" /></div>{image.caption && <figcaption className="border-t border-border bg-card px-3 py-2 text-[11px] leading-5 text-muted-foreground">{image.caption}</figcaption>}</figure>)}</div>;
}

const SPEC_ICONS = [Sun, Zap, BatteryCharging, Network, Settings];

/** منتج الكتالوج الحقيقي المطابق للبند — بالموديل الرسمي ثم القدرة المحسوبة ونوع الطور، بلا صور افتراضية. */
function catalogMatchFor(text: string, category: "panels" | "inverters" | "batteries", hint: string) {
  const matched = findCatalogProductForSpec(text, category, hint);
  return { image: matched?.image ?? null, productId: matched?.id ?? null, model: matched ? `${matched.brand} ${matched.power}` : null };
}

function getSpecPresentation(title: string, lines: string[], index: number, hint = "") {
  const text = [title, ...lines].join(" ");
  if (/لوح|ألواح|شمسي/.test(title)) return { ...catalogMatchFor(text, "panels", hint), label: "الألواح الشمسية", icon: Sun };
  if (/انفرتر|إنفرتر|عاكس/.test(title)) return { ...catalogMatchFor(text, "inverters", hint), label: "الإنفرتر", icon: Zap };
  if (/بطارية|تخزين/.test(title)) return { ...catalogMatchFor(text, "batteries", hint), label: "البطارية", icon: BatteryCharging };
  return { image: null, productId: null, model: null, label: title, icon: SPEC_ICONS[index % SPEC_ICONS.length] ?? Settings };
}

function parseSpecFields(lines: string[]): { label: string; value: string }[] {
  let type = "";
  const extras: string[] = [];
  let qty = "";
  for (const line of lines) {
    const qtyMatch = line.match(/^الكمية\s*[:：]\s*(.+)$/);
    if (qtyMatch) { qty = qtyMatch[1]!.trim(); continue; }
    if (!type) type = line;
    else if (line) extras.push(line);
  }
  let power = "";
  let typeClean = type;
  if (type) {
    const pm = type.match(/\s*(?:بقدرة|بسعة)\s*[\d.,]+\s*(?:kWh|kW|W)\b/i) || type.match(/\s*\b[\d.,]+\s*(?:kWh|kW|W)\s*$/i);
    if (pm && pm[0]) {
      const raw = pm[0].match(/[\d.,]+\s*(kWh|kW|W)/i);
      if (raw && raw[1] && raw[0]) {
        const num = raw[0].replace(/kWh|kW|W/i, "").replace(",", ".").trim();
        const unit = /kWh/i.test(raw[1]) ? "كيلووات ساعة" : /kW/i.test(raw[1]) ? "كيلووات" : "وات";
        power = `${num} ${unit}`;
        typeClean = type.replace(pm[0], "").trim();
      }
    }
  }
  const rows: { label: string; value: string }[] = [];
  if (typeClean) rows.push({ label: "النوع", value: typeClean.replace(/\s*[|/]\s*$/, "") });
  if (power) rows.push({ label: "القدرة", value: power });
  else if (extras.length) rows.push({ label: "المواصفات", value: extras.join(" — ") });
  if (qty) rows.push({ label: "الكمية", value: qty });
  if (rows.length === 0) rows.push(...lines.map((line) => ({ label: "المواصفات", value: line })));
  return rows;
}

function SystemSpecs({ specs, hint = "", onOpenProduct }: { specs: View["specs"]; hint?: string; onOpenProduct?: ((id: string) => void) | undefined }) {
  return (
    <div className="space-y-3">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 text-base font-black sm:text-lg">
          <Sparkles className="size-5 text-brand" /> مكونات المنظومة المقترحة
        </div>
        <p className="mt-1 text-[11px] leading-5 text-muted-foreground">تم اختيار المكونات المناسبة حسب بياناتك لتحقيق أفضل أداء وكفاءة</p>
      </div>
      <div className="stagger-in grid gap-2 grid-cols-2 sm:grid-cols-3 xl:grid-cols-6">
        {specs.map((group, index) => {
          const presentation = getSpecPresentation(group.title, group.lines, index, hint);
          const Icon = presentation.icon;
          return (
            <article key={index} className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between gap-2 p-2.5 pb-1">
                <div>
                  <h3 className="text-sm font-black">{presentation.label}</h3>
                  <p className="mt-0.5 text-[10px] leading-4 text-muted-foreground">{group.title}</p>
                </div>
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand text-brand-foreground"><Icon className="size-4" /></span>
              </div>
              {presentation.image && (
                <div data-photo-section className="flex h-20 items-center justify-center px-3 py-1">
                  <img src={presentation.image} loading="eager" decoding="async" width={912} height={912} alt={group.title} className="size-full object-contain" />
                </div>
              )}
              <ul className="mx-2 mb-2 grid gap-1">
                {parseSpecFields(group.lines).map((row) => (
                  <li key={row.label} className="grid grid-cols-[minmax(0,1fr)_18px] items-center gap-1.5 rounded-md bg-muted/55 px-2 py-1.5 text-[11px] leading-4">
                    <span className="min-w-0"><span className="text-muted-foreground">{row.label}</span><strong className="block text-foreground">{row.value}</strong></span>
                    <span className="grid size-[18px] place-items-center rounded-full bg-energy text-energy-foreground"><Check className="size-3" /></span>
                  </li>
                ))}
              </ul>
              {presentation.productId && onOpenProduct ? (
                <button type="button" onClick={() => onOpenProduct(presentation.productId!)} className="mx-2 mb-2 mt-auto flex items-center gap-1.5 rounded-md bg-brand/10 px-2 py-1.5 text-[11px] font-bold text-foreground transition hover:bg-brand/20">
                  <BadgeCheck className="size-4 shrink-0 text-brand" /> عرض تفاصيل المنتج
                </button>
              ) : (
              <div className="mx-2 mb-2 mt-auto flex items-center gap-1.5 rounded-md bg-brand/10 px-2 py-1.5 text-[11px] font-bold text-foreground">
                <BadgeCheck className="size-4 shrink-0 text-brand" /> مكوّن موثوق
              </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function ProjectAside({ session }: { session: BotSession }) {

  const facts = [
    ["نوع المنظومة", formatSystemName(String(session["system_type"] ?? ""))],
    ["الاستهلاك الشهري", session["monthly_consumption"] ? `${session["monthly_consumption"]} kWh` : null],
    ["نوع الطور", session["phase_type"]],
    ["اسم العميل", session["customer_name"]],
    ["المدينة", session["city"]],
  ].filter((row) => row[1]);
  if (facts.length === 0) return null;
  return <aside className="mt-3 rounded-lg border border-border bg-card p-3 shadow-sm"><dl className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">{facts.map(([label, value]) => <div key={String(label)} className="rounded-md bg-muted/45 px-2.5 py-1.5 text-[11px]"><dt className="text-muted-foreground">{String(label)}</dt><dd className="mt-1 truncate font-bold">{String(value)}</dd></div>)}</dl></aside>;
}

function AsideBenefit({ icon, text }: { icon: ReactNode; text: string }) {
  return <div className="flex items-center gap-3 px-3 py-3 text-xs font-bold text-skyline [&_svg]:size-5">{icon}<span>{text}</span></div>;
}

function QuoteCard({ quote }: { quote: NonNullable<View["quote"]> }) {
  return (
    <section className="mt-1">
      <div className="overflow-hidden rounded-md border-2 border-black bg-white font-[Arial,Helvetica,sans-serif] text-black">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b-2 border-black bg-white px-4 py-3">
          <div className="min-w-0"><p className="text-sm font-black">أكتس لأنظمة الطاقة وحلولها</p><p className="text-[11px] font-bold">عرض سعر</p></div>
          <div className="text-left text-[11px] font-bold leading-5"><p>رقم العرض: {quote.number || "—"}</p><p>العميل: {quote.customer || "—"}</p></div>
        </div>
        <div data-quote-scroll className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-right text-xs">
            <thead>
              <tr className="bg-[#e8202a] text-black">
                <th className="border border-black p-2 text-center text-[13px] font-bold">م</th>
                <th className="border border-black p-2 text-center text-[13px] font-bold">البند والمواصفات</th>
                <th className="border border-black p-2 text-center text-[13px] font-bold">الوحدة</th>
                <th className="border border-black p-2 text-center text-[13px] font-bold">الكمية</th>
                <th className="border border-black p-2 text-center text-[13px] font-bold">سعر الوحدة</th>
                <th className="border border-black p-2 text-center text-[13px] font-bold">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {quote.items.map((item, index) => (
                <tr key={index} className="align-top">
                  <td className="border border-black p-1.5 text-center font-bold">{index + 1}</td>
                  <td className="border border-black p-1.5 text-right"><p className="text-[12px] font-bold leading-5">{item.name}</p>{item.details.map((detail, detailIndex) => <p key={detailIndex} className="text-[10px] leading-4">{detail}</p>)}</td>
                  <td className="border border-black p-1.5 text-center font-bold">{item.unit}</td>
                  <td className="border border-black p-1.5 text-center font-bold">{item.qty}</td>
                  <td className="border border-black p-1.5 text-center font-bold">{money(Number(item.price) || 0)}</td>
                  <td className="border border-black p-1.5 text-center font-bold">{money(Number(item.total) || 0)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[#bfbfbf]">
                <td colSpan={5} className="border border-black p-2 text-center text-[13px] font-black">الإجمالي الكلي</td>
                <td className="border border-black p-2 text-center text-[13px] font-black text-[#c00000]">{money(quote.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      <div className="mt-3 grid gap-3">
        <div className="rounded-lg border border-border bg-card p-3">
          <h3 className="text-sm font-black">{CERTIFICATES_TITLE}</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {CERTIFICATES.map((name) => (
              <span key={name} dir="ltr" className="rounded-full border border-energy/40 bg-energy/10 px-3 py-1 text-[11px] font-bold text-energy">{name}</span>
            ))}
          </div>
          <p className="mt-2 text-[10px] leading-5 text-muted-foreground">جميع المكونات الموردة من ACTES أصلية ومطابقة للمعايير الدولية أعلاه.</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => downloadQuotePdf(quote)}
        className="mt-3 inline-flex items-center gap-2 rounded-md bg-[#e8202a] px-5 py-2.5 text-xs font-bold text-white transition hover:brightness-95"
      >
        <Download className="size-4" /> تحميل ملف عرض السعر
      </button>
    </section>
  );
}


function DetailCard({ icon, title, number, rows }: { icon: ReactNode; title: string; number: string; rows: { label: string; value: string }[] }) {
  return <section className="mt-3 rounded-lg border border-border bg-card p-3"><div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-md bg-secondary text-skyline [&_svg]:size-4">{icon}</span><div><h3 className="text-sm font-black">{title}</h3>{number && <p className="text-[10px] text-muted-foreground">المرجع: {number}</p>}</div></div><dl className="mt-3 grid gap-2 sm:grid-cols-2">{rows.map((row) => <div key={row.label} className="rounded-md bg-muted/55 px-3 py-2"><dt className="text-[10px] text-muted-foreground">{row.label}</dt><dd className="mt-1 text-xs font-bold">{row.value}</dd></div>)}</dl></section>;
}

function Documents({ docs }: { docs: View["docs"] }) {
  return <div className="mt-3 grid gap-2 sm:grid-cols-3">{docs.map((doc, index) => <a key={index} href={doc.url || undefined} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-md border border-border bg-card p-2.5 transition hover:border-brand"><span className="grid size-8 place-items-center rounded-md bg-brand/10 text-brand"><FileCheck2 className="size-4" /></span><span className="min-w-0 flex-1"><strong className="block truncate text-[11px]">{doc.name}</strong>{doc.caption && <small className="block truncate text-[10px] text-muted-foreground">{doc.caption}</small>}</span><Download className="size-3.5 text-muted-foreground" /></a>)}</div>;
}
function LangSwitch({ always = false }: { always?: boolean }) {
  const [lang, setLang] = useLang();
  const languages: { id: Lang; label: string }[] = [
    { id: "ar", label: "العربية" },
    { id: "en", label: "English" },
    { id: "zh", label: "中文" },
  ];


  return (
    <span className={`${always ? "inline-flex" : "hidden sm:inline-flex"} items-center gap-2`}>
      <label className="inline-flex items-center gap-1.5 rounded-full bg-skyline px-3.5 py-2 text-[13px] font-bold text-skyline-foreground shadow-sm">
        <Globe className="size-5" />
        <select value={lang} onChange={(event) => setLang(event.target.value as Lang)} aria-label="لغة الواجهة" translate="no" data-no-translate className="cursor-pointer appearance-none bg-transparent font-bold outline-none" dir="auto">
          {languages.map((language) => <option key={language.id} value={language.id} translate="no" data-no-translate className="bg-card text-foreground">{language.label}</option>)}
        </select>
        <ChevronDown className="size-4 opacity-90" />
      </label>
      <SoundToggle />
    </span>
  );
}
