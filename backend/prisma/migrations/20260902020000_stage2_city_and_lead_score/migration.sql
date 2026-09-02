-- Stage 2: capture the company's home city and a rule-based lead score.
--
-- All changes are additive so existing rows are preserved with sensible
-- defaults: city=NULL, leadScore=0, leadTier=NULL. The application fills
-- those in on the next update / on new submissions.

-- AlterTable
ALTER TABLE "Registration"
  ADD COLUMN "city"        TEXT,
  ADD COLUMN "leadScore"   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "leadTier"    TEXT;
