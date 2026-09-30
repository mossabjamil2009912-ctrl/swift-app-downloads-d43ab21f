/** تكبير شاشة التطبيق لتملأ شاشة الكمبيوتر، مع إمكانية التصغير. */

export function isFullscreen(): boolean {
  if (typeof document === "undefined") return false;
  return Boolean(document.fullscreenElement);
}

export async function enterFullscreen(): Promise<void> {
  if (typeof document === "undefined") return;
  if (document.fullscreenElement) return;
  const el = document.documentElement;
  try {
    await el.requestFullscreen?.({ navigationUI: "hide" });
  } catch {
    // بعض المتصفحات تمنع التكبير دون نقرة من المستخدم — نتجاهل الخطأ بهدوء.
  }
}

export async function exitFullscreen(): Promise<void> {
  if (typeof document === "undefined") return;
  if (!document.fullscreenElement) return;
  try {
    await document.exitFullscreen?.();
  } catch {
    /* تجاهل */
  }
}

export async function toggleFullscreen(): Promise<void> {
  if (isFullscreen()) await exitFullscreen();
  else await enterFullscreen();
}
