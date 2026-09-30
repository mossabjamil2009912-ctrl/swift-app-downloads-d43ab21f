import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { applyWaqf, diacritizeNumberWords } from "@/lib/ar-lexicon";

const Body = z.object({
  text: z.string().min(1).max(900),
  lang: z.enum(["ar", "en", "zh"]).default("ar"),
});

const INSTRUCTIONS: Record<string, string> = {
  ar: "اقرأ النص العربي التالي بالفصحى بأسلوب معلق مؤسسي راقٍ لكبرى شركات الطاقة العالمية، نبرة رجالية دافئة ورخيمة وواثقة، فصاحة متقنة ومخارج حروف واضحة ومريحة للأذن. التزم بالتشكيل المكتوب على كل حرف حرفياً. قف على أواخر الكلمات بالسكون قبل علامات الترقيم وفي نهاية الجملة، ولا تُشبع الحركة الأخيرة أبداً. لا تترجم ولا تضف أي كلام:",
  en: "Say the following text in English only, in a warm, rich, confident corporate male narrator voice for a global energy company, with polished diction and natural pacing. Do not add anything else:",
  zh: "请用标准普通话以国际能源企业官方男声旁白的风格朗读以下文字，声音温暖浑厚、自信清晰，语速自然，不要添加任何其他内容：",

};

export const Route = createFileRoute("/api/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("Missing key", { status: 500 });
        const parsed = Body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return new Response("Bad request", { status: 400 });
        const { lang } = parsed.data;
        const text = lang === "ar" ? applyWaqf(diacritizeNumberWords(parsed.data.text)) : parsed.data.text;
        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3.1-flash-tts-preview",
            contents: [{ role: "user", parts: [{ text: `${INSTRUCTIONS[lang]} ${text}` }] }],
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Enceladus" } } },
            },
            stream_format: "audio",
          }),
        });
        if (!upstream.ok) {
          return new Response(await upstream.text(), { status: upstream.status });
        }
        return new Response(upstream.body, {
          headers: { "Content-Type": upstream.headers.get("Content-Type") || "audio/wav", "Cache-Control": "private, max-age=86400" },
        });
      },
    },
  },
});
