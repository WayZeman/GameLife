-- AlterTable
ALTER TABLE "Achievement" ADD COLUMN "periodWindowKey" TEXT NOT NULL DEFAULT '';

-- Migrate legacy period values
UPDATE "Achievement" SET "period" = 'month' WHERE "period" = 'year';
