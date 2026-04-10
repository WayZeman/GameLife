import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { USER_COOKIE } from "@/lib/constants";
import { getLeagueLeaderboardForUser } from "@/lib/league";
import { LeagueBoard } from "@/components/league-board";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function StatsPage() {
  const userId = cookies().get(USER_COOKIE)?.value;
  if (!userId) redirect("/setup");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true },
  });

  if (!user) redirect("/setup");

  const league = await getLeagueLeaderboardForUser(user.id);

  return (
    <main className="min-h-dvh px-4 pb-[max(5rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-10">
      <header className="mx-auto flex max-w-3xl items-center justify-between opacity-0 motion-safe:animate-fade-in motion-reduce:opacity-100">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-[rgb(var(--muted))] transition hover:text-[rgb(var(--fg))]"
        >
          ← До досягнень
        </Link>
        <ThemeToggle />
      </header>

      <div className="mx-auto mt-8 max-w-3xl opacity-0 motion-safe:animate-spring-up motion-reduce:opacity-100 sm:mt-10">
        <h1
          id="stats-league-title"
          className="text-2xl font-semibold tracking-tight sm:text-3xl"
        >
          Змагальна ліга
        </h1>

        {league ? (
          <div className="glass mt-6 rounded-[1.5rem] p-5 sm:p-8 md:p-10">
            <LeagueBoard
              entries={league.entries}
              totalPlayers={league.totalPlayers}
              yourGlobalRank={league.yourGlobalRank}
              yourName={user.name}
              ariaLabelledBy="stats-league-title"
            />
          </div>
        ) : null}
      </div>
    </main>
  );
}
