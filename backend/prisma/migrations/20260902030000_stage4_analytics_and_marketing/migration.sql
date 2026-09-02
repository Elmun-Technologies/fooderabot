-- Stage 4: analytics + marketing + admin.
--
-- All additions are purely additive: the existing User and Registration
-- tables are not touched. New tables can be backfilled at runtime by the
-- application (see services/seed.ts) so production only needs to run
-- `prisma migrate deploy` and then restart the service.

-- CreateTable: Event
CREATE TABLE "Event" (
    "id"          BIGSERIAL NOT NULL,
    "anonymousId" TEXT,
    "userId"      INTEGER,
    "name"        TEXT NOT NULL,
    "screen"      TEXT,
    "props"       JSONB,
    "utmSource"   TEXT,
    "utmMedium"   TEXT,
    "utmCampaign" TEXT,
    "utmContent"  TEXT,
    "utmTerm"     TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Event_name_createdAt_idx" ON "Event"("name", "createdAt");
CREATE INDEX "Event_userId_createdAt_idx" ON "Event"("userId", "createdAt");
CREATE INDEX "Event_screen_createdAt_idx" ON "Event"("screen", "createdAt");

ALTER TABLE "Event"
  ADD CONSTRAINT "Event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL;

-- CreateTable: Sequence
CREATE TABLE "Sequence" (
    "id"          TEXT NOT NULL,
    "key"         TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "description" TEXT,
    "enabled"     BOOLEAN NOT NULL DEFAULT true,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sequence_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Sequence_key_key" ON "Sequence"("key");

-- CreateTable: SequenceStep
CREATE TABLE "SequenceStep" (
    "id"           TEXT NOT NULL,
    "sequenceId"   TEXT NOT NULL,
    "order"        INTEGER NOT NULL,
    "afterMinutes" INTEGER NOT NULL,
    "condition"    JSONB,
    "textUz"       TEXT NOT NULL,
    "textRu"       TEXT NOT NULL,
    "textEn"       TEXT NOT NULL,
    "cta"          BOOLEAN NOT NULL DEFAULT false,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SequenceStep_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SequenceStep_sequenceId_order_idx" ON "SequenceStep"("sequenceId", "order");

ALTER TABLE "SequenceStep"
  ADD CONSTRAINT "SequenceStep_sequenceId_fkey" FOREIGN KEY ("sequenceId") REFERENCES "Sequence"("id") ON DELETE CASCADE;

-- CreateTable: Broadcast
CREATE TABLE "Broadcast" (
    "id"          TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "segment"     JSONB NOT NULL,
    "textUz"      TEXT NOT NULL,
    "textRu"      TEXT NOT NULL,
    "textEn"      TEXT NOT NULL,
    "status"      TEXT NOT NULL DEFAULT 'DRAFT',
    "scheduledAt" TIMESTAMP(3),
    "startedAt"   TIMESTAMP(3),
    "finishedAt"  TIMESTAMP(3),
    "totalCount"  INTEGER NOT NULL DEFAULT 0,
    "sentCount"   INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy"   TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Broadcast_pkey" PRIMARY KEY ("id")
);

-- CreateTable: BroadcastRecipient
CREATE TABLE "BroadcastRecipient" (
    "id"          TEXT NOT NULL,
    "broadcastId" TEXT NOT NULL,
    "userId"      INTEGER,
    "telegramId"  BIGINT,
    "status"      TEXT NOT NULL DEFAULT 'PENDING',
    "error"       TEXT,
    "sentAt"      TIMESTAMP(3),
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BroadcastRecipient_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BroadcastRecipient_broadcastId_status_idx" ON "BroadcastRecipient"("broadcastId", "status");

ALTER TABLE "BroadcastRecipient"
  ADD CONSTRAINT "BroadcastRecipient_broadcastId_fkey" FOREIGN KEY ("broadcastId") REFERENCES "Broadcast"("id") ON DELETE CASCADE;

-- CreateTable: Workflow
CREATE TABLE "Workflow" (
    "id"         TEXT NOT NULL,
    "name"       TEXT NOT NULL,
    "trigger"    TEXT NOT NULL,
    "enabled"    BOOLEAN NOT NULL DEFAULT true,
    "conditions" JSONB,
    "actions"    JSONB NOT NULL,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AdminUser
CREATE TABLE "AdminUser" (
    "id"           TEXT NOT NULL,
    "username"     TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role"         TEXT NOT NULL DEFAULT 'admin',
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt"  TIMESTAMP(3),

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdminUser_username_key" ON "AdminUser"("username");

-- CreateTable: AdminSession
CREATE TABLE "AdminSession" (
    "id"          TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "tokenHash"   TEXT NOT NULL,
    "userAgent"   TEXT,
    "ip"          TEXT,
    "expiresAt"   TIMESTAMP(3) NOT NULL,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdminSession_tokenHash_key" ON "AdminSession"("tokenHash");
CREATE INDEX "AdminSession_expiresAt_idx" ON "AdminSession"("expiresAt");

ALTER TABLE "AdminSession"
  ADD CONSTRAINT "AdminSession_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE;

-- CreateTable: AuditLog
CREATE TABLE "AuditLog" (
    "id"          BIGSERIAL NOT NULL,
    "adminUserId" TEXT,
    "action"      TEXT NOT NULL,
    "target"      TEXT,
    "meta"        JSONB,
    "ip"          TEXT,
    "userAgent"   TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditLog_adminUserId_createdAt_idx" ON "AuditLog"("adminUserId", "createdAt");
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL;
