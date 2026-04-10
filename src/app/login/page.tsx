"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const code = pin.replace(/\D/g, "").slice(0, 6);
    if (code.length !== 6) {
      setError("Введи 6 цифр коду.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: code }),
      });
      const d = (await r.json()) as { error?: string };
      if (!r.ok) {
        throw new Error(d.error ?? "Не вдалося увійти");
      }
      window.location.assign("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Помилка входу");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-dvh px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-8">
      <header className="mx-auto flex max-w-md items-center justify-between">
        <Link
          href="/"
          className="text-sm font-medium text-[rgb(var(--muted))] transition hover:text-[rgb(var(--fg))]"
        >
          ← На головну
        </Link>
        <ThemeToggle />
      </header>

      <div className="mx-auto mt-16 max-w-md">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Вхід
        </h1>
        <p className="mt-2 text-[rgb(var(--muted))]">
          Введи свій 6-значний код, який ти створив під час реєстрації.
        </p>

        <div
          className={cn(
            "glass mt-8 rounded-[1.5rem] p-6 shadow-glass sm:p-8",
            "opacity-0 motion-safe:animate-spring-up motion-reduce:opacity-100"
          )}
        >
          {error && (
            <p
              role="alert"
              className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/15 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-300"
            >
              {error}
            </p>
          )}
          <label className="block text-sm font-medium text-[rgb(var(--fg))]">
            Код доступу
          </label>
          <input
            type="password"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={pin}
            onChange={(e) =>
              setPin(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") void submit();
            }}
            disabled={loading}
            placeholder="••••••"
            className={cn(
              "mt-2 w-full rounded-2xl border border-black/[0.08] bg-white/80 px-4 py-4 text-center font-mono text-2xl tracking-[0.4em]",
              "focus:border-[rgb(var(--accent))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]/25",
              "dark:border-white/10 dark:bg-black/20",
              "disabled:opacity-50"
            )}
          />
          <button
            type="button"
            onClick={() => void submit()}
            disabled={loading || pin.replace(/\D/g, "").length !== 6}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[rgb(var(--accent))] py-3.5 text-[15px] font-semibold text-white shadow-md transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading && <Loader2 className="h-5 w-5 animate-spin" />}
            Увійти
          </button>
          <p className="mt-6 text-center text-sm text-[rgb(var(--muted))]">
            Ще немає акаунта?{" "}
            <Link
              href="/setup"
              className="font-medium text-[rgb(var(--accent))] underline-offset-2 hover:underline"
            >
              Почати реєстрацію
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
