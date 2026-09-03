import { prisma } from "../db";
import { EXPO_STANDS } from "../data/expoStands";

/**
 * Idempotent seed for the marketing sequences.
 *
 * The hardcoded nudge / follow-up text used to live in followups.ts; we
 * now keep the same wording here and let followups.ts read from the DB.
 * If you edit the copy in the admin panel (Stage 5) the engine will pick
 * up the new text on the next scheduler tick.
 *
 * This function is safe to call on every server start: it does an
 * upsert-by-key on the sequence and a delete-then-recreate on its
 * steps so updated copy shows up without manual migrations.
 */
export async function seedDefaultSequences(): Promise<void> {
  const sequences: Array<{
    key: string;
    name: string;
    description: string;
    steps: Array<{ order: number; afterMinutes: number; textUz: string; textRu: string; textEn: string; cta?: boolean }>;
  }> = [
    {
      key: "nudge_unregistered",
      name: "Nudge (ro'yxatdan o'tmaganlar)",
      description: "Botni ochib, til tanlab, lekin formani yakunlamagan foydalanuvchilarga 3 ta eslatma.",
      steps: [
        {
          order: 1,
          afterMinutes: 3 * 60,
          cta: true,
          textUz:
            "Siz FOODERA EXPO 2026'ga ro'yxatdan o'tishni boshlagan edingiz 👋 Bor-yo'g'i 30 sekunda — yakunlab qo'yasizmi?",
          textRu:
            "Вы начали регистрацию на FOODERA EXPO 2026 👋 Это займёт всего 30 секунд — завершим?",
          textEn:
            "You started registering for FOODERA EXPO 2026 👋 It only takes 30 seconds — want to finish it?",
        },
        {
          order: 2,
          afterMinutes: 24 * 60,
          cta: true,
          textUz:
            "Eslatma: FOODERA EXPO 2026'da stend joylari soni cheklangan. Yetkazib beruvchilar va xaridorlar bilan to'g'ridan-to'g'ri uchrashuv — ro'yxatdan o'tishni yakunlang.",
          textRu:
            "Напоминаем: на FOODERA EXPO 2026 количество стендов ограничено. Прямые встречи с поставщиками и байерами — завершите регистрацию.",
          textEn:
            "Reminder: stand spots at FOODERA EXPO 2026 are limited. Direct meetings with suppliers and buyers — finish your registration.",
        },
        {
          order: 3,
          afterMinutes: 72 * 60,
          cta: true,
          textUz:
            "Bu — FOODERA EXPO 2026'ga ro'yxatdan o'tish haqidagi oxirgi eslatmamiz. 20–22 oktabr, SOF EXPO, Samarqand. Ishtirok etishni xohlasangiz, hoziroq yakunlang.",
          textRu:
            "Это последнее напоминание о регистрации на FOODERA EXPO 2026. 20–22 октября, SOF EXPO, Самарканд. Если хотите участвовать — завершите регистрацию сейчас.",
          textEn:
            "This is our last reminder about registering for FOODERA EXPO 2026. October 20–22, SOF EXPO, Samarkand. Finish your registration now if you'd like to join.",
        },
      ],
    },
    {
      key: "followup_registered",
      name: "Follow-up (ro'yxatdan o'tganlar)",
      description: "Arizasini yuborgan foydalanuvchilarga 1 ta minnatdorlik + do'stga ulashish.",
      steps: [
        {
          order: 1,
          afterMinutes: 24 * 60,
          textUz:
            "Stend arizangiz jarayonda 🗂 Hamkasb yoki hamkorlaringiz ham FOODERA EXPO 2026'da qatnashmoqchi bo'lsa, botimizni ular bilan bo'lishing.",
          textRu:
            "Ваша заявка на стенд в работе 🗂 Если коллеги или партнёры тоже хотят участвовать в FOODERA EXPO 2026 — поделитесь с ними ботом.",
          textEn:
            "Your booth application is in progress 🗂 If colleagues or partners also want to join FOODERA EXPO 2026, feel free to share the bot with them.",
        },
      ],
    },
  ];

  for (const seq of sequences) {
    const existing = await prisma.sequence.findUnique({ where: { key: seq.key }, include: { steps: true } });
    if (existing) {
      await prisma.sequence.update({
        where: { id: existing.id },
        data: { name: seq.name, description: seq.description, enabled: true },
      });
      // Replace steps so copy edits show up.
      await prisma.sequenceStep.deleteMany({ where: { sequenceId: existing.id } });
      await prisma.sequenceStep.createMany({
        data: seq.steps.map((s) => ({
          sequenceId: existing.id,
          order: s.order,
          afterMinutes: s.afterMinutes,
          textUz: s.textUz,
          textRu: s.textRu,
          textEn: s.textEn,
          cta: s.cta ?? false,
        })),
      });
    } else {
      const created = await prisma.sequence.create({
        data: {
          key: seq.key,
          name: seq.name,
          description: seq.description,
          steps: {
            create: seq.steps.map((s) => ({
              order: s.order,
              afterMinutes: s.afterMinutes,
              textUz: s.textUz,
              textRu: s.textRu,
              textEn: s.textEn,
              cta: s.cta ?? false,
            })),
          },
        },
      });
      console.log(`Seeded sequence ${created.key} with ${seq.steps.length} steps`);
    }
  }
}

/**
 * Idempotent seed for default marketing workflows. Two ready-to-use
 * rules ship with the install so the operator has examples to clone:
 *
 *   1. "HOT lead → ping admins" — whenever a new registration
 *      scores HOT, send a heads-up into the leads group.
 *   2. "Drop-off → nudge" — when a user has been around 24h without
 *      registering, the engine tags them so the admin can later
 *      filter & target them with a broadcast.
 *
 * Like sequences, the operator can edit / disable / delete from the
 * admin panel. Re-running this seeder won't clobber their changes —
 * it only inserts if a workflow with the same name doesn't exist.
 */
export async function seedDefaultWorkflows(): Promise<void> {
  const seeds: Array<{
    name: string;
    trigger: string;
    conditions: Record<string, unknown> | null;
    actions: Array<{ type: string; payload: any }>;
  }> = [
    {
      name: "HOT lead → ping admins",
      trigger: "lead_hot",
      conditions: null,
      actions: [
        {
          type: "notify_admins",
          payload: {
            textUz: "🔥🔥🔥 Yangi HOT lead! Admin panel'da darhol ko'ring.",
            textRu: "🔥🔥🔥 Новый HOT-лид! Срочно посмотрите в админ-панели.",
            textEn: "🔥🔥🔥 New HOT lead! Check the admin panel now.",
          },
        },
      ],
    },
    {
      name: "Drop-off 24h → tag for re-engagement",
      trigger: "drop_off",
      conditions: null,
      actions: [
        {
          type: "tag_user",
          payload: { key: "dropoff_24h", value: true },
        },
      ],
    },
  ];

  for (const s of seeds) {
    const existing = await prisma.workflow.findFirst({ where: { name: s.name } });
    if (existing) continue;
    await prisma.workflow.create({
      data: {
        name: s.name,
        trigger: s.trigger,
        enabled: true,
        conditions: s.conditions as any,
        actions: s.actions as any,
      },
    });
    console.log(`Seeded workflow "${s.name}" (${s.trigger})`);
  }
}

/**
 * Idempotent seed for the real floor-plan stands (see data/expoStands.ts
 * for where this geometry comes from and its known gaps).
 *
 * Insert-only by design: an admin may have since corrected a stand's
 * status, geometry, or note from the panel, and a code once removed from
 * the source array (a duplicate, a re-numbered booth) should stay in the
 * DB rather than silently vanish on the next deploy. Re-running this only
 * ever adds codes that don't exist yet.
 */
export async function seedExpoStands(): Promise<void> {
  const existing = await prisma.stand.findMany({ select: { code: true } });
  const known = new Set(existing.map((s) => s.code));
  const missing = EXPO_STANDS.filter((s) => !known.has(s.code));
  if (missing.length === 0) return;

  await prisma.stand.createMany({
    data: missing.map((s) => ({
      code: s.code,
      zone: s.zone,
      sqm: s.sqm,
      x: s.x,
      y: s.y,
      w: s.w,
      h: s.h,
    })),
  });
  console.log(`Seeded ${missing.length} expo stand(s)`);
}
