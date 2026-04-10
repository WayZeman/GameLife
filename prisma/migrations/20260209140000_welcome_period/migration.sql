-- AlterTable
ALTER TABLE "User" ADD COLUMN "welcomeMessage" TEXT;

-- AlterTable
ALTER TABLE "Achievement" ADD COLUMN "period" TEXT NOT NULL DEFAULT 'year';
