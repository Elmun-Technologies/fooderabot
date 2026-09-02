-- Stage 7: broadcast media (Telegram-uploaded photo by file_id).
-- Add `imageFileId` to Broadcast so the admin composer can attach a
-- photo to a post and we don't have to re-upload it per recipient
-- (Telegram gives us a stable file_id after the first upload).

ALTER TABLE "Broadcast"
  ADD COLUMN "imageFileId" TEXT;
