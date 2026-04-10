"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Sparkles, Trophy, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export type XpRewardData = {
  xpGained: number;
  totalXP: number;
  previousLevel: number;
  newLevel: number;
  levelUp: boolean;
};

type Props = {
  open: boolean;
  data: XpRewardData | null;
  onComplete: () => void;
};

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

export function XpRewardOverlay({ open, data, onComplete }: Props) {
  const [phase, setPhase] = useState<"xp" | "level">("xp");
  const [displayXp, setDisplayXp] = useState(0);
  const onCompleteRef = useRef(onComplete);
  const finishedRef = useRef(false);
  onCompleteRef.current = onComplete;

  const safeComplete = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onCompleteRef.current();
  }, []);

  useEffect(() => {
    if (open) finishedRef.current = false;
  }, [open]);

  useEffect(() => {
    if (!open || !data) return;
    setPhase("xp");
    setDisplayXp(0);
    const target = data.xpGained;
    const start = performance.now();
    const dur = 950;
    let frame: number;
    function tick(now: number) {
      const p = easeOutCubic(Math.min(1, (now - start) / dur));
      setDisplayXp(Math.max(0, Math.round(target * p)));
      if (p < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [open, data]);

  useEffect(() => {
    if (!open || !data) return;
    const xpHold = 2200;
    const levelHold = 2600;
    if (!data.levelUp) {
      const t = setTimeout(safeComplete, xpHold + 350);
      return () => clearTimeout(t);
    }
    const t1 = setTimeout(() => setPhase("level"), xpHold);
    const t2 = setTimeout(safeComplete, xpHold + levelHold);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [open, data, safeComplete]);

  if (!open || !data) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(0.5rem,env(safe-area-inset-top))] sm:p-6"
      role="presentation"
    >
      <div className="absolute inset-0 animate-fade-in bg-black/55 backdrop-blur-md" />

      {phase === "xp" && (
        <div className={cn("relative flex flex-col items-center text-center", "animate-xp-pop")}>
          <div className="animate-xp-glow mb-6 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-gradient-to-br from-amber-400/90 to-orange-500 shadow-2xl shadow-orange-500/40 ring-4 ring-white/25">
            <Zap className="h-12 w-12 text-white" fill="currentColor" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/85">
            Досвід отримано
          </p>
          <p
            className="mt-2 bg-gradient-to-r from-amber-100 via-white to-amber-100 bg-clip-text font-semibold tabular-nums text-transparent drop-shadow-sm"
            style={{
              fontSize: "clamp(2.75rem, 10vw, 4rem)",
              lineHeight: 1.1,
            }}
          >
            +{displayXp} XP
          </p>
          <p className="mt-4 max-w-xs text-[15px] text-white/80">
            Усього досвіду:{" "}
            <span className="font-semibold text-white tabular-nums">{data.totalXP}</span>
          </p>
        </div>
      )}

      {phase === "level" && data.levelUp && (
        <div className="relative flex flex-col items-center text-center animate-level-celebrate">
          <div className="pointer-events-none absolute -inset-24 rounded-full bg-[rgb(var(--accent))]/30 blur-3xl" />
          <div className="relative mb-6 flex h-28 w-28 items-center justify-center rounded-[2rem] bg-gradient-to-br from-[rgb(var(--accent))] to-sky-500 shadow-2xl shadow-blue-500/50 ring-4 ring-white/30">
            <Trophy className="h-14 w-14 text-white" strokeWidth={1.25} />
          </div>
          <div className="flex items-center gap-2 text-amber-200/95">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">Новий рівень</span>
            <Sparkles className="h-5 w-5" />
          </div>
          <p className="mt-3 text-5xl font-bold tabular-nums text-white drop-shadow-lg sm:text-6xl md:text-7xl">
            {data.newLevel}
          </p>
          <p className="mt-2 text-sm text-white/75">
            Було {data.previousLevel} → тепер {data.newLevel}
          </p>
        </div>
      )}
    </div>
  );
}
