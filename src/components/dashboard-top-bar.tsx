"use client";

import Link from "next/link";
import { BarChart3, Settings, Sparkles } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { AssistantModal } from "@/components/assistant-modal";
import { SettingsModal, type SettingsProfile } from "@/components/settings-modal";
import { cn } from "@/lib/utils";

const btnBase =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition-all duration-300";

export function DashboardTopBar({ profile }: { profile: SettingsProfile }) {
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <header className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-2 gap-y-2 opacity-0 motion-safe:animate-fade-in motion-reduce:opacity-100 sm:gap-3">
        <button
          type="button"
          onClick={() => setAssistantOpen(true)}
          className={cn(
            btnBase,
            "bg-black/[0.04] text-[rgb(var(--fg))] backdrop-blur-md",
            "hover:bg-black/[0.08] hover:scale-[1.02] active:scale-[0.98]",
            "dark:bg-white/10 dark:hover:bg-white/15"
          )}
        >
          <Sparkles className="h-[18px] w-[18px] text-[rgb(var(--accent))]" strokeWidth={1.75} />
          Помічник
        </button>

        <div className="flex items-center gap-2">
          <Link
            href="/stats"
            className={cn(
              btnBase,
              "bg-black/[0.04] text-[rgb(var(--fg))] backdrop-blur-md",
              "hover:bg-black/[0.08] hover:scale-[1.02] active:scale-[0.98]",
              "dark:bg-white/10 dark:hover:bg-white/15"
            )}
          >
            <BarChart3 className="h-[18px] w-[18px] text-[rgb(var(--accent))]" strokeWidth={1.75} />
            <span className="hidden sm:inline">Статистика</span>
          </Link>
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className={cn(
              btnBase,
              "min-w-[44px] px-3 sm:px-4",
              "bg-black/[0.04] text-[rgb(var(--fg))] backdrop-blur-md",
              "hover:bg-black/[0.08] hover:scale-[1.02] active:scale-[0.98]",
              "dark:bg-white/10 dark:hover:bg-white/15"
            )}
            aria-label="Налаштування"
            title="Налаштування"
          >
            <Settings className="h-[18px] w-[18px]" strokeWidth={1.75} />
            <span className="hidden sm:inline">Налаштування</span>
          </button>
        </div>
      </header>
      <AssistantModal open={assistantOpen} onClose={() => setAssistantOpen(false)} />
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        profile={profile}
      />
    </>
  );
}
