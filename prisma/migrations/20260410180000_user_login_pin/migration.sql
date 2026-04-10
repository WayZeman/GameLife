-- AlterTable
ALTER TABLE "User" ADD COLUMN "loginPinHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_loginPinHash_key" ON "User"("loginPinHash");
