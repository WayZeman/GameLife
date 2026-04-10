import { prisma } from "@/lib/prisma";

const WINDOW = 15;

/** Ім'я для таблиці: перше слово + ініціал прізвища (як у змаганнях). */
export function formatLeagueDisplayName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Гравець";
  if (parts.length === 1) return parts[0];
  const first = parts[0];
  const last = parts[parts.length - 1];
  const initial = last[0] ? `${last[0].toUpperCase()}.` : "";
  return initial ? `${first} ${initial}` : first;
}

export type LeagueRow = {
  globalRank: number;
  userId: string;
  displayName: string;
  totalXP: number;
  isCurrentUser: boolean;
};

export type LeagueLeaderboard = {
  entries: LeagueRow[];
  totalPlayers: number;
  yourGlobalRank: number;
};

/**
 * Вікно з ~15 гравців навколо поточного за totalXP (як «ліга» в Duolingo — сусіди в таблиці).
 */
export async function getLeagueLeaderboardForUser(
  currentUserId: string
): Promise<LeagueLeaderboard | null> {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, totalXP: true },
    orderBy: [{ totalXP: "desc" }, { createdAt: "asc" }],
  });

  const totalPlayers = users.length;
  const idx = users.findIndex((u) => u.id === currentUserId);
  if (idx === -1) return null;

  const yourGlobalRank = idx + 1;
  const half = Math.floor(WINDOW / 2);
  let start = Math.max(0, idx - half);
  let end = Math.min(users.length, start + WINDOW);
  if (end - start < WINDOW) {
    start = Math.max(0, end - WINDOW);
  }

  const entries: LeagueRow[] = users.slice(start, end).map((u, i) => ({
    globalRank: start + i + 1,
    userId: u.id,
    displayName: formatLeagueDisplayName(u.name),
    totalXP: u.totalXP,
    isCurrentUser: u.id === currentUserId,
  }));

  return { entries, totalPlayers, yourGlobalRank };
}
