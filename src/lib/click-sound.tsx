import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { stopSpeaking } from "@/lib/voice-guide";

const STORAGE_KEY = "actes-click-sound";

function isMuted() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "off";
  } catch {
    return false;
  }
}

/**
 * لا يوجد أي صوت نقر في التطبيق، ولا يوجد أي مستمع نقر عام.
 * النقر في أي مكان فارغ من الشاشة لا يقطع النطق إطلاقاً؛
 * الصوت يتوقف فقط عند الانتقال الفعلي لشاشة أخرى عبر زر.
 */
export function ClickSoundRuntime() {
  return null;
}

/** زر التحكم بالمرشد الصوتي (تشغيل / كتم). */
export function SoundToggle({ className = "" }: { className?: string }) {
  const [on, setOn] = useState(true);

  useEffect(() => {
    setOn(!isMuted());
  }, []);

  const toggle = () => {
    const next = !on;
    setOn(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
    } catch {
      /* storage blocked */
    }
    if (!next) { stopSpeaking(); window.speechSynthesis?.cancel(); }
    window.dispatchEvent(new Event("actes-mute"));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      data-no-sound
      aria-label={on ? "كتم الصوت" : "تشغيل الصوت"}
      title={on ? "كتم الصوت" : "تشغيل الصوت"}
      className={`inline-grid size-9 place-items-center rounded-lg bg-skyline text-skyline-foreground transition hover:opacity-90 ${className}`}
    >
      {on ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
    </button>
  );
}
