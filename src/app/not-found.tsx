import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))] text-center">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-[rgb(var(--muted))]">
        404
      </p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
        Сторінку не знайдено
      </h1>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[rgb(var(--muted))]">
        Можливо, посилання застаріло або сторінку перенесли. Повернися на головну
        й продовж гру.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex min-h-[48px] items-center justify-center rounded-full bg-[rgb(var(--accent))] px-8 text-[15px] font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:opacity-95"
      >
        На головну
      </Link>
    </main>
  );
}
