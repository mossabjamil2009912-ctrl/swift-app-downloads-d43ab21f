import { useEffect, useRef, useState } from "react";
import { Loader2, Pause, Play, RotateCcw, SkipForward, Volume2, VolumeX } from "lucide-react";
import type { ProductVideo } from "@/lib/product-video";
import { videoNarration } from "@/lib/product-video";
import { isVoiceOn, speak, stopSpeaking, unlockVoice } from "@/lib/voice-guide";
import { useResolvedVideoSrc } from "@/lib/video-source";

/** مشغّل فيديو تعريف المنتج — فيديو حقيقي داخل معرض ACTES مع تعليق صوتي عربي وبطاقات مواصفات متزامنة. */
export default function ProductVideoPlayer({
  video,
  title,
  narration: narrationProp,
  onFinish,
}: {
  video: ProductVideo;
  title: string;
  narration?: string;
  onFinish: () => void;
}) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(!isVoiceOn());
  const [preparing, setPreparing] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const narration = narrationProp || videoNarration(title, video);
  const spokenRef = useRef("");
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  // الفيديو نفسه بلا مسار صوتي: ننتظر جاهزية التعليق الصوتي ثم ننطلق معاً في اللحظة نفسها.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.muted = true;
    let cancelled = false;
    const startVideo = () => {
      if (cancelled || !ref.current) return;
      ref.current.currentTime = 0;
      void ref.current.play().catch(() => setPlaying(false));
    };
    if (mutedRef.current || !isVoiceOn()) {
      startVideo();
      return () => { cancelled = true; };
    }
    spokenRef.current = narration;
    unlockVoice();
    setPreparing(true);
    void speak(narration, true).finally(() => {
      if (cancelled) return;
      setPreparing(false);
      startVideo();
    });
    return () => { cancelled = true; };
  }, [video.src, narration]);

  // لا نوقف التعليق عند إخفاء المشغّل: شرح صفحة المنتج يكمل مباشرة بعد تعليق الفيديو بلا انقطاع.

  const cue = video.cues.find((c) => time >= c.at && time < c.until);
  const progress = duration ? Math.min(100, (time / duration) * 100) : 0;

  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) void el.play();
    else {
      el.pause();
      stopSpeaking();
    }
  };

  /** إعادة التشغيل: الصوت يُجهَّز أولاً ثم ينطلق الفيديو معه من البداية. */
  const replay = async () => {
    const el = ref.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
    stopSpeaking();
    spokenRef.current = "";
    if (!muted && isVoiceOn()) {
      spokenRef.current = narration;
      setPreparing(true);
      await speak(narration, true);
      setPreparing(false);
    }
    el.currentTime = 0;
    void el.play();
  };

  const toggleSound = async () => {
    if (muted) {
      setMuted(false);
      unlockVoice();
      await replayWithVoice();
    } else {
      setMuted(true);
      stopSpeaking();
    }
  };

  /** تشغيل الشرح مع إعادة الفيديو من أوله حتى يتزامن الكلام مع بطاقات المواصفات. */
  const replayWithVoice = async () => {
    const el = ref.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
    spokenRef.current = narration;
    setPreparing(true);
    await speak(narration, true);
    setPreparing(false);
    if (!ref.current) return;
    ref.current.currentTime = 0;
    void ref.current.play();
  };




  return (
    <div className="w-full space-y-3">
      <div className="relative overflow-hidden rounded-3xl border border-navy/20 bg-navy shadow-xl">
        <video
          ref={ref}
          src={video.src}
          poster={video.poster}
          playsInline
          preload="auto"
          muted
          className="block aspect-video w-full object-cover"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
          onEnded={onFinish}
        />

        {/* تحضير الشرح الصوتي: الفيديو ينتظر حتى ينطلقا معاً */}
        {preparing ? (
          <div className="pointer-events-none absolute inset-0 grid place-items-center bg-navy/45 backdrop-blur-[2px]">
            <div className="flex items-center gap-2 rounded-full bg-navy/85 px-4 py-2 text-[11px] font-black text-skyline-foreground shadow-lg">
              <Loader2 className="size-4 animate-spin" /> جارٍ تحضير الشرح الصوتي…
            </div>
          </div>
        ) : null}

        {/* هوية المعرض */}
        <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-navy/70 px-3 py-1 text-[10px] font-black tracking-wide text-skyline-foreground backdrop-blur">
          معرض ACTES
        </div>


        {/* بطاقة المواصفة المتزامنة مع الكلام */}
        {cue ? (
          <div
            key={`${cue.at}-${cue.label}`}
            className="pointer-events-none absolute bottom-14 right-3 max-w-[70%] animate-in fade-in slide-in-from-bottom-2 rounded-2xl border border-skyline/40 bg-navy/80 px-4 py-2.5 text-right shadow-lg backdrop-blur duration-500"
          >
            <div className="text-[10px] font-bold text-skyline-foreground/70">{cue.label}</div>
            <div className="text-xl font-black leading-tight text-skyline-foreground">{cue.value}</div>
          </div>
        ) : null}

        {/* شريط التقدم */}
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-navy/60">
          <div className="h-full bg-skyline transition-[width] duration-200" style={{ width: `${progress}%` }} />
        </div>

        {/* أدوات التحكم */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? "إيقاف مؤقت" : "تشغيل"}
            className="inline-flex size-9 items-center justify-center rounded-full bg-navy/75 text-skyline-foreground backdrop-blur transition hover:bg-navy"
          >
            {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
          </button>
          <button
            type="button"
            onClick={() => void toggleSound()}
            aria-label={muted ? "تشغيل الشرح الصوتي" : "كتم الشرح الصوتي"}
            className="inline-flex size-9 items-center justify-center rounded-full bg-navy/75 text-skyline-foreground backdrop-blur transition hover:bg-navy"
          >
            {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </button>
          <button
            type="button"
            onClick={() => void replay()}

            aria-label="إعادة التشغيل"
            className="inline-flex size-9 items-center justify-center rounded-full bg-navy/75 text-skyline-foreground backdrop-blur transition hover:bg-navy"
          >
            <RotateCcw className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold text-muted-foreground">{title}</p>
        <button
          type="button"
          onClick={onFinish}
          className="inline-flex items-center gap-1.5 rounded-full bg-navy px-4 py-2 text-xs font-bold text-skyline-foreground shadow-sm transition hover:opacity-90"
        >
          <SkipForward className="size-3.5" /> تخطي إلى التفاصيل
        </button>
      </div>

      <p className="text-center text-[11px] font-bold text-muted-foreground">
        {muted ? "اضغط زر الصوت لسماع الشرح العربي للمنتج" : "شرح صوتي عربي: الاسم والنوع والقدرة وأهم المواصفات"}
      </p>
    </div>
  );
}
