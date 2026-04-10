import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { rolloverAchievementsForUser } from "@/lib/period-windows";
import { USER_COOKIE } from "@/lib/constants";
import { levelFromTotalXp, xpProgressInLevel } from "@/lib/utils";
import { DashboardTopBar } from "@/components/dashboard-top-bar";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const userId = cookies().get(USER_COOKIE)?.value;
  if (!userId) redirect("/setup");

  await rolloverAchievementsForUser(userId);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { achievements: { orderBy: { id: "asc" } } },
  });

  if (!user) redirect("/setup");

  const level = levelFromTotalXp(user.totalXP);
  const progress = xpProgressInLevel(user.totalXP);

  return (
    <main className="min-h-dvh px-4 pb-[max(5rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-10">
      <DashboardTopBar
        profile={{
          name: user.name,
          age: user.age,
          category: user.category,
          interests: user.interests,
          mainGoal: user.mainGoal,
        }}
      />

      <DashboardClient
        userName={user.name}
        welcomeMessage={user.welcomeMessage}
        totalXP={user.totalXP}
        level={level}
        progress={progress}
        achievements={user.achievements}
      />
    </main>
  );
}
