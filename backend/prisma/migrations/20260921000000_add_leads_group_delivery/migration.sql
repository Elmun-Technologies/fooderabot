-- AlterTable
ALTER TABLE "Registration"
  ADD COLUMN "groupNotifiedAt" TIMESTAMP(3),
  ADD COLUMN "groupNotifyError" TEXT;
