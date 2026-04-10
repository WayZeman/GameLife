-- AlterTable
ALTER TABLE "Achievement" ADD COLUMN "archived" INTEGER NOT NULL DEFAULT 0;

-- Already completed achievements → archive
UPDATE "Achievement" SET "archived" = 1 WHERE "completed" = 1;
