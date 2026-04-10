import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { USER_COOKIE } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default async function LandingPage() {
  const hasSession = Boolean(cookies().get(USER_COOKIE)?.value);

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden">
      <div
        className="pointer-events-none absolute -left-1/4 top-1/4 h-[min(420px,55vw)] w-[min(420px,55vw)] rounded-full bg-[rgb(var(--accent))]/20 blur-3xl motion-safe:animate-orb-drift"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-1/4 bottom-1/4 h-[min(380px,50vw)] w-[min(380px,50vw)] rounded-full bg-violet-400/15 blur-3xl motion-safe:animate-orb-drift motion-safe:[animation-delay:-7s]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 h-40 w-40 -translate-x-1/2 rounded-full bg-sky-400/10 blur-2xl motion-safe:animate-pulse-soft"
        aria-hidden
      />

      <header
        className={cn(
          "relative z-10 flex items-center justify-end px-4 py-[max(1rem,env(safe-area-inset-top))] pr-[max(1rem,env(safe-area-inset-right))] sm:px-10",
          "opacity-0 motion-safe:animate-fade-in motion-reduce:opacity-100"
        )}
      >
        <ThemeToggle />
      </header>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-[max(6rem,env(safe-area-inset-bottom))] pt-6 text-center sm:px-10">
        <div className="max-w-2xl">
          <p
            style={{ animationDelay: "60ms" }}
            className={cn(
              "mb-4 text-sm font-medium uppercase tracking-[0.2em] text-[rgb(var(--muted))]",
              "opacity-0 motion-safe:animate-spring-up motion-reduce:translate-y-0 motion-reduce:opacity-100"
            )}
          >
            Гра життєвих досягнень
          </p>
          <h1
            style={{ animationDelay: "140ms" }}
            className={cn(
              "text-[clamp(1.75rem,5vw+0.75rem,3.75rem)] font-semibold leading-[1.12] tracking-tight sm:text-5xl md:text-6xl md:leading-[1.1]",
              "opacity-0 motion-safe:animate-spring-up motion-reduce:translate-y-0 motion-reduce:opacity-100"
            )}
          >
            Перетвори своє життя на гру
          </h1>
          <p
            style={{ animationDelay: "200ms" }}
            className={cn(
              "mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-[rgb(var(--muted))] sm:text-[17px]",
              "opacity-0 motion-safe:animate-spring-up motion-reduce:translate-y-0 motion-reduce:opacity-100"
            )}
          >
            Щоденні, щотижневі та щомісячні кроки, досвід і рівні — у зручному
            інтерфейсі на телефоні й на комп’ютері.
          </p>

          <div
            style={{ animationDelay: "260ms" }}
            className={cn(
              "mt-10 flex flex-col items-stretch gap-3 sm:mt-12 sm:flex-row sm:items-center sm:justify-center sm:gap-5",
              "opacity-0 motion-safe:animate-spring-up motion-reduce:translate-y-0 motion-reduce:opacity-100"
            )}
          >
            {hasSession ? (
              <Link
                href="/dashboard"
                aria-label="Продовжити до завдань"
                className="group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-[rgb(var(--accent))] px-10 py-4 text-[17px] font-semibold text-white shadow-xl shadow-blue-500/20 transition duration-300 hover:scale-[1.03] hover:shadow-blue-500/35 active:scale-[0.98] motion-safe:duration-300"
              >
                Продовжити
                <ArrowRight
                  className="h-5 w-5 transition duration-300 group-hover:translate-x-1"
                  strokeWidth={2}
                />
              </Link>
            ) : (
              <>
                <Link
                  href="/setup"
                  aria-label="Почати реєстрацію"
                  className="group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-[rgb(var(--accent))] px-10 py-4 text-[17px] font-semibold text-white shadow-xl shadow-blue-500/20 transition duration-300 hover:scale-[1.03] hover:shadow-blue-500/35 active:scale-[0.98] motion-safe:duration-300"
                >
                  Почати
                  <ArrowRight
                    className="h-5 w-5 transition duration-300 group-hover:translate-x-1"
                    strokeWidth={2}
                  />
                </Link>
                <Link
                  href="/login"
                  aria-label="Увійти за іменем і кодом"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-black/[0.12] bg-white/70 px-10 py-4 text-[17px] font-semibold text-[rgb(var(--fg))] shadow-sm backdrop-blur transition hover:bg-white/90 dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10"
                >
                  Увійти
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
