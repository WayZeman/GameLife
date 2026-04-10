"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <span className={cn("inline-flex h-11 w-11 rounded-full bg-black/5 dark:bg-white/10", className)} />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "inline-flex h-11 w-11 items-center justify-center rounded-full",
        "bg-black/[0.04] text-[rgb(var(--fg))] backdrop-blur-md transition-all duration-300",
        "hover:bg-black/[0.08] hover:scale-105 active:scale-95",
        "dark:bg-white/10 dark:hover:bg-white/15",
        className
      )}
      aria-label={theme === "dark" ? "Світла тема" : "Темна тема"}
    >
      {isDark ? <Sun className="h-[18px] w-[18px]" strokeWidth={1.75} /> : <Moon className="h-[18px] w-[18px]" strokeWidth={1.75} />}
    </button>
  );
}
