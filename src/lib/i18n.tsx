import { useEffect, useState } from "react";
import enDict from "./en-dict.json";
import zhDict from "./zh-dict.json";

export type Lang = "ar" | "en" | "zh";
const KEY = "actes-lang";
// توحيد أشكال الألف والهمزة حتى تتطابق «إنفرتر» مع «انفرتر» في القاموس.
const norm = (s: string) =>
  s
    .replace(/[\u064B-\u0652\u200f\u200e]/g, "")
    .replace(/[\u0623\u0625\u0622\u0671]/g, "\u0627")
    .replace(/\s+/g, " ")
    .trim();
const AR = /[\u0600-\u06FF]/;
const ATTRS = ["placeholder", "aria-label", "title", "alt"];
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const B = "(^|[^\\u0600-\\u06FF])";
const E = "(?=$|[^\\u0600-\\u06FF])";
function prepare(source: Record<string, string>) {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(source)) normalized[norm(key)] = value;
  const words = Object.entries(normalized)
    .filter(([key]) => key.includes(" ") || key.length >= 2)
    .sort((a, b) => b[0].length - a[0].length)
    .map(([arabic, translated]) => [new RegExp(B + esc(arabic) + E, "g"), translated] as const);
  return { normalized, words };
}

const dictionaries = {
  en: prepare(enDict as Record<string, string>),
  zh: prepare(zhDict as Record<string, string>),
};

const EN_PATTERNS: [RegExp, string | ((...m: string[]) => string)][] = [
  [/^(?:ال)?[اإأ]نفرتر\s+([\d.]+)\s*كيلو(?:\s*وات)?$/, (_, n) => `${n} kW Inverter`],
  [/^([\d.]+)\s*كيلو\s*وات$/, (_, n) => `${n} kW`],
  [/^(\d+)\s*منظومات?\s*سكنية\s*جاهزة$/, (_, n) => `${n} Ready Residential Systems`],
  [/^(\d+)\s*منظومات?\s*تجارية\s*جاهزة$/, (_, n) => `${n} Ready Commercial Systems`],
  [/^(\d+)\s*منظومات?\s*صناعية\s*جاهزة$/, (_, n) => `${n} Ready Industrial Systems`],
  [/^منظومة\s*(سكنية|تجارية|صناعية)\s*بقدرة\s*[إا]نتاجية\s*([\d.,]+)\s*(كيلووات|كيلو\s*وات|وات)$/, (_, t, n, u) =>
    `${t === "سكنية" ? "Residential" : t === "تجارية" ? "Commercial" : "Industrial"} System — ${n} ${u === "وات" ? "W" : "kW"}`],
  [/^الضمان\s*:?\s*(\d+)\s*سنوات?$/, (_, n) => `Warranty: ${n} years`],
  [/^الكمية\s*:?\s*(.+)$/, (_, n) => `Quantity: ${n}`],
  [/^(?:مرحبا?ً?|[اأ]هلا?ً?)\s*بك[،,]?\s*(.*)$/, (_, n) => `Welcome ${trLine(n, "en")}`.trim()],
  [/^مثال\s*:\s*(.+)$/, (_, n) => `e.g. ${n}`],
  [/^رقم\s*الحوالة\s*:\s*(.+)$/, (_, n) => `Transfer number: ${n}`],
  [/^رقم\s*مرجع\s*العملية\s*:\s*(.+)$/, (_, n) => `Transaction reference: ${n}`],
  [/^تم\s*تحديث\s*حالة\s*طلبك\s*إلى\s*:\s*(.+)$/, (_, n) => `Your order status is now: ${trLine(n, "en")}`],
  [/^جميع\s*الحقوق\s*محفوظة\s*©\s*(\d+)\s*ACTES$/, (_, y) => `All rights reserved © ${y} ACTES`],
];

const ZH_PATTERNS: typeof EN_PATTERNS = [
  [/^(?:ال)?[اإأ]نفرتر\s+([\d.]+)\s*كيلو(?:\s*وات)?$/, (_, n) => `${n} kW 逆变器`],
  [/^([\d.]+)\s*كيلو\s*وات$/, (_, n) => `${n} kW`],
  [/^(\d+)\s*منظومات?\s*سكنية\s*جاهزة$/, (_, n) => `${n} 套现成住宅系统`],
  [/^(\d+)\s*منظومات?\s*تجارية\s*جاهزة$/, (_, n) => `${n} 套现成商业系统`],
  [/^(\d+)\s*منظومات?\s*صناعية\s*جاهزة$/, (_, n) => `${n} 套现成工业系统`],
  [/^منظومة\s*(سكنية|تجارية|صناعية)\s*بقدرة\s*[إا]نتاجية\s*([\d.,]+)\s*(كيلووات|كيلو\s*وات|وات)$/, (_, t, n, u) =>
    `${t === "سكنية" ? "住宅" : t === "تجارية" ? "商业" : "工业"}系统 — ${n} ${u === "وات" ? "W" : "kW"}`],
  [/^الضمان\s*:?\s*(\d+)\s*سنوات?$/, (_, n) => `保修：${n} 年`],
  [/^الكمية\s*:?\s*(.+)$/, (_, n) => `数量：${n}`],
  [/^(?:مرحبا?ً?|[اأ]هلا?ً?)\s*بك[،,]?\s*(.*)$/, (_, n) => `欢迎 ${trLine(n, "zh")}`.trim()],
  [/^مثال\s*:\s*(.+)$/, (_, n) => `例如：${n}`],
  [/^رقم\s*الحوالة\s*:\s*(.+)$/, (_, n) => `汇款编号：${n}`],
  [/^رقم\s*مرجع\s*العملية\s*:\s*(.+)$/, (_, n) => `交易参考号：${n}`],
  [/^تم\s*تحديث\s*حالة\s*طلبك\s*إلى\s*:\s*(.+)$/, (_, n) => `您的订单状态已更新为：${trLine(n, "zh")}`],
  [/^جميع\s*الحقوق\s*محفوظة\s*©\s*(\d+)\s*ACTES$/, (_, y) => `版权所有 © ${y} ACTES`],
];

const PUNCT = /[.،,!؟?:؛]+$/;

// علامات الترقيم العربية تُستبدل بما يوافق لغة الواجهة، فلا تبقى «؟» أو «،» في نص إنجليزي أو صيني.
const PUNCT_MAP: Record<Exclude<Lang, "ar">, Record<string, string>> = {
  en: { "؟": "?", "،": ",", "؛": ";", "?": "?", ",": ",", ";": ";", ".": ".", "!": "!", ":": ":" },
  zh: { "؟": "？", "،": "，", "؛": "；", "?": "？", ",": "，", ";": "；", ".": "。", "!": "！", ":": "：" },
};
function trPunct(p: string, lang: Exclude<Lang, "ar">) {
  const map = PUNCT_MAP[lang];
  const out: string[] = [];
  for (const ch of p) {
    const next = map[ch] ?? ch;
    if (out[out.length - 1] !== next) out.push(next);
  }
  return out.join("");
}

function lookup(t: string, lang: Exclude<Lang, "ar">): string | undefined {
  const dictionary = dictionaries[lang].normalized;
  if (dictionary[t]) return dictionary[t];
  const m = t.match(PUNCT);
  if (m) {
    const core = t.slice(0, t.length - m[0].length).trim();
    const hit = dictionary[core];
    // إن كانت الترجمة تنتهي بعلامة ترقيم أصلاً فلا نضيف علامة ثانية.
    if (hit) return PUNCT.test(hit) ? hit : hit + trPunct(m[0], lang);
  }
  // strip leading emoji / symbols / markdown stars
  const lead = t.match(/^[^\u0600-\u06FFa-zA-Z0-9]+/);
  if (lead) {
    const rest = lookup(t.slice(lead[0].length).trim(), lang);
    if (rest) return lead[0] + rest;
  }
  const stars = t.match(/^\*(.+)\*$/);
  if (stars) {
    const inner = lookup((stars[1] ?? "").trim(), lang);
    if (inner) return `*${inner}*`;
  }
  return undefined;
}

function trLine(line: string, lang: Exclude<Lang, "ar">): string {
  if (!AR.test(line)) return line;
  const t = norm(line);
  if (!t) return line;
  const lead = line.match(/^\s*/)?.[0] ?? "", trail = line.match(/\s*$/)?.[0] ?? "";
  const direct = lookup(t, lang);
  if (direct) return lead + direct + trail;
  const tail = t.match(PUNCT)?.[0] ?? "";
  const bare = tail ? t.slice(0, t.length - tail.length).trim() : t;
  const patterns = lang === "zh" ? ZH_PATTERNS : EN_PATTERNS;
  for (const [re, rep] of patterns) {
    if (re.test(t)) return lead + t.replace(re, rep as any) + trail;
    if (re.test(bare)) return lead + bare.replace(re, rep as any) + trPunct(tail, lang) + trail;
  }
  let r = t;
  for (const [re, translated] of dictionaries[lang].words) if (AR.test(r)) r = r.replace(re, (_m, prefix) => prefix + translated);
  if (import.meta.env.DEV && AR.test(r)) (window as any).__i18nMissing?.add?.(t);
  // لا شيء تُرجم: نُعيد السطر كما كتبه المستخدم (أسماء الأشخاص تبقى بهمزاتها الأصلية).
  if (r === t) return line;
  // ما لم يبق فيه حرف عربي نُصلح علامات ترقيمه لتوافق اللغة المختارة.
  if (!AR.test(r)) {
    const rt = r.match(PUNCT)?.[0];
    if (rt) r = r.slice(0, r.length - rt.length) + trPunct(rt, lang);
  }
  return lead + r + trail;
}

function tr(s: string, lang: Exclude<Lang, "ar">) {
  if (!AR.test(s)) return s;
  const t = norm(s);
  const direct = dictionaries[lang].normalized[t];
  if (direct) return s.replace(s.trim(), direct);
  return s.split("\n").map((line) => trLine(line, lang)).join("\n");
}
if (typeof window !== "undefined") (window as any).__i18nMissing = new Set<string>();

const origText = new WeakMap<Node, string>();
const origAttr = new WeakMap<Element, Record<string, string>>();
const origDir = new WeakMap<Element, string>();

const NO_TR = '[translate="no"],[data-no-translate]';
function skipTranslate(n: Node) {
  const el = n.nodeType === 1 ? (n as Element) : n.parentElement;
  return !!el?.closest?.(NO_TR);
}

function apply(root: Node, lang: Lang) {
  if (skipTranslate(root)) return;
  const walk = (n: Node) => {

    if (n.nodeType === 3) {
      const cur = n.nodeValue ?? "";
      const prev = origText.get(n);
      // React may have changed text; treat any Arabic text as new original
      const orig = prev !== undefined && !AR.test(cur) && lang !== "ar" ? prev : cur;
      if (AR.test(cur) || prev === undefined) origText.set(n, orig);
      const base = origText.get(n) ?? cur;
      const next = lang === "ar" ? base : tr(base, lang);
      if (next !== cur) n.nodeValue = next;
      return;
    }
    if (n.nodeType !== 1) return;
    const el = n as Element;
    if (el.tagName === "SCRIPT" || el.tagName === "STYLE" || el.matches?.(NO_TR)) return;
    const store = origAttr.get(el) ?? {};
    for (const a of ATTRS) {
      const v = el.getAttribute(a);
      if (v == null) continue;
      if (AR.test(v)) store[a] = v;
      const base = store[a];
      if (!base) continue;
      const next = lang === "ar" ? base : tr(base, lang);
      if (next !== v) el.setAttribute(a, next);
    }
    origAttr.set(el, store);
    el.childNodes.forEach(walk);
  };
  walk(root);
}

let current: Lang = "ar";
export function currentLang() { return current; }
export function translateText(s: string, lang: Lang = current) { return lang === "ar" ? s : tr(s, lang); }
const listeners = new Set<(l: Lang) => void>();

export function setLang(l: Lang) {
  current = l;
  localStorage.setItem(KEY, l);
  document.documentElement.lang = l;
  document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
  document.querySelectorAll("[dir='rtl'],[dir='ltr']").forEach((el) => {
    if (!origDir.has(el)) origDir.set(el, el.getAttribute("dir") ?? "auto");
    el.setAttribute("dir", l === "ar" ? (origDir.get(el) ?? "auto") : "ltr");
  });
  apply(document.body, l);
  listeners.forEach((f) => f(l));
}

export function useLang() {
  const [lang, set] = useState<Lang>("ar");
  useEffect(() => {
    set(current);
    listeners.add(set);
    return () => void listeners.delete(set);
  }, []);
  return [lang, setLang] as const;
}

export function LanguageRuntime() {
  useEffect(() => {
    const stored = localStorage.getItem(KEY);
    const saved: Lang = stored === "en" || stored === "zh" ? stored : "ar";
    let busy = false;
    const obs = new MutationObserver((muts) => {
      if (busy || current === "ar") return;
      busy = true;
      for (const m of muts) {
        if (m.type === "characterData") apply(m.target, current);
        else if (m.type === "attributes") apply(m.target, current);
        else m.addedNodes.forEach((n) => apply(n, current));
      }
      busy = false;
    });
    obs.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    setLang(saved);
    return () => obs.disconnect();
  }, []);
  return null;
}
