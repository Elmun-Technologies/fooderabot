-- AlterTable
ALTER TABLE "User"
  ADD COLUMN "language" TEXT,
  ADD COLUMN "nudgeStage" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "nudgeSentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Registration"
  ADD COLUMN "followUpStage" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "followUpSentAt" TIMESTAMP(3);
