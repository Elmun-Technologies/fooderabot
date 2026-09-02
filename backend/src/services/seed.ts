import { prisma } from "../db";

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
