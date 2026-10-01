// بعض فيديوهات المعرض كبيرة الحجم ومخزّنة داخل المشروع على هيئة أجزاء متتابعة
// (لأن حد حجم الملف الواحد في المستودع أصغر من حجم الفيديو الأصلي).
// نعيد تجميع الأجزاء في المتصفح قبل التشغيل، فيبقى الفيديو بجودته الأصلية
// وداخل المشروع نفسه بلا أي ارتباط بخادم أو حساب خارجي.
import { useEffect, useState } from "react";

const SPLIT_VIDEOS: Record<string, string[]> = {
  "/videos/pylontech-rv12314.mp4": [
    "/videos/parts/pylontech-rv12314.mp4.part00",
    "/videos/parts/pylontech-rv12314.mp4.part01",
  ],
  "/videos/suntech-stp720s-d66-nsh.mp4": [
    "/videos/parts/suntech-stp720s-d66-nsh.mp4.part00",
    "/videos/parts/suntech-stp720s-d66-nsh.mp4.part01",
  ],
  "/videos/hithium-heroee-maxpower-16.mp4": [
    "/videos/parts/hithium-heroee-maxpower-16.mp4.part00",
    "/videos/parts/hithium-heroee-maxpower-16.mp4.part01",
  ],
  "/videos/suntech-stp595s-c72-nsh.mp4": [
    "/videos/parts/suntech-stp595s-c72-nsh.mp4.part00",
    "/videos/parts/suntech-stp595s-c72-nsh.mp4.part01",
  ],
};

const cache = new Map<string, string>();

/** يُرجع مسار التشغيل النهائي: المسار المباشر، أو رابط مؤقت لفيديو أُعيد تجميعه من أجزائه. */
export function useResolvedVideoSrc(src: string): string {
  const parts = SPLIT_VIDEOS[src];
  const [resolved, setResolved] = useState<string>(() => (parts ? cache.get(src) ?? "" : src));

  useEffect(() => {
    if (!parts) {
      setResolved(src);
      return;
    }
    const cached = cache.get(src);
    if (cached) {
      setResolved(cached);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const buffers = await Promise.all(
          parts.map(async (p) => {
            const res = await fetch(p);
            if (!res.ok) throw new Error(`part failed: ${p}`);
            return res.blob();
          }),
        );
        if (cancelled) return;
        const url = URL.createObjectURL(new Blob(buffers, { type: "video/mp4" }));
        cache.set(src, url);
        setResolved(url);
      } catch {
        if (!cancelled) setResolved("");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [src, parts]);

  return resolved;
}
