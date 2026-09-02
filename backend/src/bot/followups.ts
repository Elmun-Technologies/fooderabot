import { prisma } from "../db";
import type { Language, RegistrationType } from "../types";
import { notifyText } from "./bot";

/**
 * Marketing follow-up engine (Stage 4).
 *
 * Two sequences live in the DB now (`seed.ts` keeps them in sync with
 * the original hardcoded copy):
 *   - "nudge_unregistered"   — 3 stages at 3h / 24h / 72h
 *   - "followup_registered"  — 1 stage  at 24h
 *
 * The engine reads the next pending step for every user / registration
 * whose previous step's `afterMinutes` window has elapsed, dispatches
 * the message (with the matching language), and advances the stage
 * counter. The DB schema is the single source of truth, so an operator
 * can edit the copy and timings from the admin panel (Stage 5) without
 * a code change.
 */

const HOUR = 60 * 60 * 1000;

function textFor(language: Language, uz: string, ru: string, en: string): string {
  if (language === "ru") return ru;
  if (language === "en") return en;
  return uz;
}

/**
 * Look up the next pending nudge step for a user who opened the bot
 * (language set) but never finished the registration form.
 */
async function nextNudgeStep(stage: number) {
  return prisma.sequenceStep.findFirst({
    where: { sequence: { key: "nudge_unregistered" }, order: stage + 1 },
  });
}

/**
 * Look up the next pending follow-up step for a registered user.
 */
async function nextFollowUpStep(stage: number) {
  return prisma.sequenceStep.findFirst({
    where: { sequence: { key: "followup_registered" }, order: stage + 1 },
  });
}

export async function runFollowUpJob(): Promise<void> {
  const now = Date.now();

  // Nudge: users with no registration, language set, and a pending stage.
  const nudgeUsers = await prisma.user.findMany({
    where: { registration: null, language: { not: null } },
    take: 200,
  });
  for (const user of nudgeUsers) {
    const language = (user.language as Language) ?? "uz";
    const step = await nextNudgeStep(user.nudgeStage);
    if (!step) continue;
    const threshold = new Date(now - step.afterMinutes * 60 * 1000);
    // Only fire if the user has been around long enough for this step.
    if (user.createdAt > threshold) continue;
    const text = textFor(language, step.textUz, step.textRu, step.textEn);
    try {
      await notifyText(Number(user.telegramId), text, step.cta ? "📝 Ro'yxatdan o'tish" : undefined, language);
    } catch (err) {
      console.error("Failed to send nudge to user", user.id, err);
    }
    await prisma.user
      .update({ where: { id: user.id }, data: { nudgeStage: step.order, nudgeSentAt: new Date() } })
      .catch((err) => console.error("Failed to record nudge stage for user", user.id, err));
  }

  // Follow-up: registered users with a pending follow-up stage.
  const followUpRegs = await prisma.registration.findMany({
    where: {},
    take: 200,
    include: { user: true },
  });
  for (const registration of followUpRegs) {
    const step = await nextFollowUpStep(registration.followUpStage);
    if (!step) continue;
    const threshold = new Date(now - step.afterMinutes * 60 * 1000);
    if (registration.createdAt > threshold) continue;
    const language = (registration.language as Language) ?? "uz";
    const text = textFor(language, step.textUz, step.textRu, step.textEn);
    try {
      await notifyText(Number(registration.user.telegramId), text);
    } catch (err) {
      console.error("Failed to send follow-up for registration", registration.id, err);
    }
    await prisma.registration
      .update({ where: { id: registration.id }, data: { followUpStage: step.order, followUpSentAt: new Date() } })
      .catch((err) => console.error("Failed to record follow-up stage for registration", registration.id, err));
  }
}

export function startFollowUpScheduler(intervalMs = 30 * 60 * 1000): void {
  runFollowUpJob().catch((err) => console.error("Follow-up job failed", err));
  setInterval(() => {
    runFollowUpJob().catch((err) => console.error("Follow-up job failed", err));
  }, intervalMs);
}

export type { RegistrationType };
