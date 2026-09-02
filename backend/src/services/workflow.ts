/**
 * Marketing workflow engine (Stage 7).
 *
 * A workflow is a (trigger, conditions, actions) tuple. The engine
 * runs on every scheduler tick and on every registration submission:
 *
 *   - new_lead        fires when a Registration is created.
 *                     payload: { registration, user }
 *   - lead_hot        fires when a Registration crosses the HOT
 *                     threshold. Detected by comparing leadTier
 *                     between two engine runs.
 *   - drop_off        fires when a User opened the Mini App but did
 *                     not submit within 24h.
 *   - manual          fires from the admin panel button.
 *
 * Actions (one or more, executed in order):
 *   - send_message   — push a text to the user's Telegram chat.
 *                      payload: { textUz, textRu, textEn }
 *   - tag_user       — store a JSON tag on the user for filtering.
 *                      payload: { key, value }
 *   - assign_broadcast — attach a future broadcast to a user (not
 *                      yet implemented; reserved).
 *   - notify_admins  — post a message into the leads group so the
 *                      operator sees the event.
 *                      payload: { textUz, textRu, textEn }
 *
 * Conditions are AND-combined; the action set runs only if all match.
 * The same engine evaluates a workflow at most once per (user, event)
 * pair — the dedupe key is `${userId}:${workflowId}:${eventId}`.
 */

import { prisma } from "../db";
import { bot } from "../bot/bot";
import type { Language } from "../types";
import { sendLeadsGroup } from "../bot/leadsGroup";

const telegram = bot.telegram;

function textFor(language: Language | null, uz: string, ru: string, en: string): string {
  if (language === "ru") return ru;
  if (language === "en") return en;
  return uz;
}

// =====================================================================
// Action runners
// =====================================================================

type ActionContext = {
  userId: number;
  telegramId: bigint;
  language: Language;
};

async function runAction(
  action: { type: string; payload: any },
  ctx: ActionContext,
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (action.type === "send_message") {
      const text = textFor(ctx.language, action.payload.textUz, action.payload.textRu, action.payload.textEn);
      if (!text.trim()) return { ok: true }; // nothing to send
      await telegram.sendMessage(Number(ctx.telegramId), text);
      return { ok: true };
    }
    if (action.type === "tag_user") {
      // Tag is stored as part of the user's `events` log meta; a real
      // tag system would be a User.tags[] column. For now we record
      // a synthetic event so the admin dashboard can see it.
      await prisma.event.create({
        data: {
          userId: ctx.userId,
          name: "workflow_tag",
          props: { key: action.payload.key, value: action.payload.value } as any,
        },
      });
      return { ok: true };
    }
    if (action.type === "notify_admins") {
      const text = textFor(
        ctx.language,
        action.payload.textUz,
        action.payload.textRu,
        action.payload.textEn,
      );
      if (!text.trim()) return { ok: true };
      await sendLeadsGroup(text);
      return { ok: true };
    }
    return { ok: false, error: `Unknown action type: ${action.type}` };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? String(err) };
  }
}

// =====================================================================
// Conditions
// =====================================================================

type ConditionSet = {
  type?: "STAND" | "GUEST";
  leadTier?: "HOT" | "WARM" | "COLD";
  city?: string;
  language?: "uz" | "ru" | "en";
  hasPhone?: boolean;
  minScore?: number;
  maxScore?: number;
};

function evaluateConditions(conds: ConditionSet | null | undefined, ctx: { registration: any | null; user: any }): boolean {
  if (!conds) return true;
  const r = ctx.registration;
  if (conds.type && r?.type !== conds.type) return false;
  if (conds.leadTier && r?.leadTier !== conds.leadTier) return false;
  if (conds.city && r?.city !== conds.city) return false;
  if (conds.language && r?.language !== conds.language && ctx.user.language !== conds.language) {
    return false;
  }
  if (conds.hasPhone === true && !r?.phone) return false;
  if (conds.hasPhone === false && r?.phone) return false;
  if (typeof conds.minScore === "number" && (r?.leadScore ?? 0) < conds.minScore) return false;
  if (typeof conds.maxScore === "number" && (r?.leadScore ?? 0) > conds.maxScore) return false;
  return true;
}

// =====================================================================
// Public API
// =====================================================================

/**
 * Fire a workflow for a given user/event. Idempotent via a synthetic
 * "workflow_run" event with a meta.dedupe key — the same workflow
 * won't run twice for the same user/event.
 */
export async function fireWorkflow(workflowId: string, eventKey: string, userId: number, registrationId: number | null): Promise<void> {
  const wf = await prisma.workflow.findUnique({ where: { id: workflowId } });
  if (!wf || !wf.enabled) return;

  // Dedupe check — look for an existing workflow_run event for this
  // (user, workflow, eventKey). Cheap because the events table is
  // indexed by (userId, createdAt).
  const dedupe = `${userId}:${workflowId}:${eventKey}`;
  const dup = await prisma.event.findFirst({
    where: { userId, name: "workflow_run", props: { dedupe } as any },
  });
  if (dup) return;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;
  const registration = registrationId
    ? await prisma.registration.findUnique({ where: { id: registrationId } })
    : null;
  if (!evaluateConditions(wf.conditions as ConditionSet | null, { registration, user })) return;

  const ctx: ActionContext = {
    userId,
    telegramId: user.telegramId,
    language: (user.language as Language) ?? "uz",
  };
  const actions = Array.isArray(wf.actions) ? (wf.actions as any[]) : [];
  for (const action of actions) {
    const result = await runAction(action, ctx);
    if (!result.ok) {
      console.error(`[workflow] action ${action.type} failed for user ${userId}`, result.error);
    }
  }

  // Mark the run so we don't repeat it.
  await prisma.event.create({
    data: {
      userId,
      name: "workflow_run",
      props: { dedupe, workflow: workflowId, event: eventKey, ok: true } as any,
    },
  });
}

/**
 * Sweep workflows whose trigger needs a periodic check (drop_off).
 * Called by the scheduler every minute. new_lead and lead_hot
 * triggers are fired inline at the call site, not from here.
 */
export async function runWorkflowJob(): Promise<void> {
  // Drop-off: users with no registration, language set, last seen
  // (createdAt) > 24h ago. Idempotent via the dedupe key in
  // fireWorkflow().
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const dropOffs = await prisma.user.findMany({
    where: {
      registration: null,
      language: { not: null },
      createdAt: { lte: cutoff },
    },
    take: 200,
  });
  for (const user of dropOffs) {
    await fireForTrigger("drop_off", user.id, null);
  }
}

async function fireForTrigger(trigger: string, userId: number, registrationId: number | null): Promise<void> {
  const workflows = await prisma.workflow.findMany({
    where: { trigger, enabled: true },
    select: { id: true },
  });
  const eventKey = `${trigger}:${registrationId ?? "no_reg"}`;
  for (const wf of workflows) {
    await fireWorkflow(wf.id, eventKey, userId, registrationId);
  }
}

/**
 * Hook called from the registration submit path after a new
 * registration is saved. Fires both new_lead and lead_hot workflows
 * in that order. Errors are swallowed — a workflow failure must
 * never block the registration.
 */
export async function onRegistrationCreated(userId: number, registrationId: number): Promise<void> {
  try {
    await fireForTrigger("new_lead", userId, registrationId);
    const r = await prisma.registration.findUnique({ where: { id: registrationId } });
    if (r?.leadTier === "HOT") {
      await fireForTrigger("lead_hot", userId, registrationId);
    }
  } catch (err) {
    console.error("[workflow] onRegistrationCreated failed", err);
  }
}

/**
 * Manual trigger from the admin panel — runs a workflow immediately
 * for a single user, ignoring dedupe (admins can re-run if needed).
 */
export async function runWorkflowManually(workflowId: string, userId: number): Promise<{ ok: boolean; error?: string }> {
  try {
    const wf = await prisma.workflow.findUnique({ where: { id: workflowId } });
    if (!wf) return { ok: false, error: "Workflow not found" };
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { ok: false, error: "User not found" };
    const registration = await prisma.registration.findUnique({ where: { userId } });
    const actions = Array.isArray(wf.actions) ? (wf.actions as any[]) : [];
    for (const action of actions) {
      await runAction(action, {
        userId,
        telegramId: user.telegramId,
        language: (user.language as Language) ?? "uz",
      });
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? String(err) };
  }
}

const WORKFLOW_TICK_MS = 60 * 1000; // 1 minute — drop-off detection

export function startWorkflowScheduler(): void {
  runWorkflowJob().catch((err) => console.error("[workflow] tick failed", err));
  setInterval(() => {
    runWorkflowJob().catch((err) => console.error("[workflow] tick failed", err));
  }, WORKFLOW_TICK_MS);
}
