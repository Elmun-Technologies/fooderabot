-- Real floor plan: individual, bookable stands.
-- Geometry is in the source PDF's own point space (1590 x 1126) so the
-- webapp can use it directly as an SVG viewBox over the floor-plan image.

-- CreateEnum
CREATE TYPE "StandStatus" AS ENUM ('AVAILABLE', 'REQUESTED', 'BOOKED');

-- AlterTable
ALTER TABLE "Registration" ADD COLUMN     "standCode" TEXT;

-- CreateTable
CREATE TABLE "Stand" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "sqm" INTEGER NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "w" DOUBLE PRECISION NOT NULL,
    "h" DOUBLE PRECISION NOT NULL,
    "status" "StandStatus" NOT NULL DEFAULT 'AVAILABLE',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stand_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Stand_code_key" ON "Stand"("code");

-- CreateIndex
CREATE INDEX "Stand_zone_idx" ON "Stand"("zone");

-- CreateIndex
CREATE INDEX "Stand_status_idx" ON "Stand"("status");
