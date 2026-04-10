import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";

// Гарантує завантаження .env з кореня проєкту, якщо модуль prisma піднявся раніше за Next.
loadEnvConfig(process.cwd());

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
