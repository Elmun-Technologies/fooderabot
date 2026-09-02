import { prisma } from "../db";
import type { Language, RegistrationType } from "../types";
import { botText } from "./i18n";
import { notifyText } from "./bot";

const HOUR = 60 * 60 * 1000;

/**
 * Marketing automation: users who opened the bot (picked a language) but
 * never finished the form get a short nudge sequence; users who did finish
 * get a different, non-pushy follow-up. Both stop after their schedule ends
 * so nobody gets spammed forever.
 */

function nudgeText(stage: 1 | 2 | 3, language: Language): string {
  const texts: Record<1 | 2 | 3, Record<Language, string>> = {
    1: {
      uz: "Siz FOODERA EXPO 2026'ga ro'yxatdan o'tishni boshlagan edingiz 👋 Bor-yo'g'i 30 sekunda — yakunlab qo'yasizmi?",
      ru: "Вы начали регистрацию на FOODERA EXPO 2026 👋 Это займёт всего 30 секунд — завершим?",
      en: "You started registering for FOODERA EXPO 2026 👋 It only takes 30 seconds — want to finish it?",
    },
    2: {
      uz: "Eslatma: FOODERA EXPO 2026'da 125M+ iste'molchi bozoriga chiqish imkoniyati va 6 mamlakatdan hamkorlar kutmoqda. Joylar soni cheklangan — ro'yxatdan o'tishni yakunlang.",
      ru: "Напоминаем: на FOODERA EXPO 2026 вас ждёт выход на рынок 125M+ потребителей и партнёры из 6 стран. Количество мест ограничено — завершите регистрацию.",
      en: "Reminder: FOODERA EXPO 2026 opens access to a 125M+ consumer market and partners from 6 countries. Spots are limited — finish your registration.",
    },
    3: {
      uz: "Bu — FOODERA EXPO 2026'ga ro'yxatdan o'tish haqidagi oxirgi eslatmamiz. 20–22 oktabr, SOF EXPO, Samarqand. Ishtirok etishni xohlasangiz, hoziroq yakunlang.",
      ru: "Это последнее напоминание о регистрации на FOODERA EXPO 2026. 20–22 октября, SOF EXPO, Самарканд. Если хотите участвовать — завершите регистрацию сейчас.",
      en: "This is our last reminder about registering for FOODERA EXPO 2026. October 20–22, SOF EXPO, Samarkand. Finish your registration now if you'd like to join.",
    },
  };
  return texts[stage][language];
}

const NUDGE_SCHEDULE: { stage: 1 | 2 | 3; afterMs: number }[] = [
  { stage: 1, afterMs: 3 * HOUR },
  { stage: 2, afterMs: 24 * HOUR },
  { stage: 3, afterMs: 72 * HOUR },
];

function followUpText(type: RegistrationType, language: Language): string {
  if (type === "STAND") {
    const msg: Record<Language, string> = {
      uz: "Stend arizangiz jarayonda 🗂 Hamkasb yoki hamkorlaringiz ham FOODERA EXPO 2026'da qatnashmoqchi bo'lsa, botimizni ular bilan bo'lishing.",
      ru: "Ваша заявка на стенд в работе 🗂 Если коллеги или партнёры тоже хотят участвовать в FOODERA EXPO 2026 — поделитесь с ними ботом.",
      en: "Your booth application is in progress 🗂 If colleagues or partners also want to join FOODERA EXPO 2026, feel free to share the bot with them.",
    };
    return msg[language];
  }
  const msg: Record<Language, string> = {
    uz: "Beydjikingiz tayyorlanmoqda 🎟 Do'stlaringiz ham FOODERA EXPO 2026'ga kelmoqchi bo'lsa, botimizni ularga yuboring — birga boramiz!",
    ru: "Ваш бейдж готовится 🎟 Если друзья тоже хотят прийти на FOODERA EXPO 2026 — отправьте им нашего бота, пойдём вместе!",
    en: "Your badge is being prepared 🎟 If your friends want to join FOODERA EXPO 2026 too, share the bot with them — see you there together!",
  };
  return msg[language];
}

const FOLLOWUP_SCHEDULE: { stage: 1; afterMs: number }[] = [{ stage: 1, afterMs: 24 * HOUR }];

export async function runFollowUpJob(): Promise<void> {
  const now = Date.now();

  for (const step of NUDGE_SCHEDULE) {
    const threshold = new Date(now - step.afterMs);
    const users = await prisma.user.findMany({
      where: { registration: null, language: { not: null }, nudgeStage: step.stage - 1, createdAt: { lte: threshold } },
      take: 200,
    });

    for (const user of users) {
      const language = (user.language as Language) ?? "uz";
      try {
        await notifyText(Number(user.telegramId), nudgeText(step.stage, language), botText.openAppButton[language], language);
      } catch (err) {
        console.error("Failed to send nudge to user", user.id, err);
      }
      await prisma.user
        .update({ where: { id: user.id }, data: { nudgeStage: step.stage, nudgeSentAt: new Date() } })
        .catch((err) => console.error("Failed to record nudge stage for user", user.id, err));
    }
  }

  for (const step of FOLLOWUP_SCHEDULE) {
    const threshold = new Date(now - step.afterMs);
    const registrations = await prisma.registration.findMany({
      where: { followUpStage: step.stage - 1, createdAt: { lte: threshold } },
      include: { user: true },
      take: 200,
    });

    for (const registration of registrations) {
      const language = (registration.language as Language) ?? "uz";
      try {
        await notifyText(Number(registration.user.telegramId), followUpText(registration.type, language));
      } catch (err) {
        console.error("Failed to send follow-up for registration", registration.id, err);
      }
      await prisma.registration
        .update({ where: { id: registration.id }, data: { followUpStage: step.stage, followUpSentAt: new Date() } })
        .catch((err) => console.error("Failed to record follow-up stage for registration", registration.id, err));
    }
  }
}

export function startFollowUpScheduler(intervalMs = 30 * 60 * 1000): void {
  runFollowUpJob().catch((err) => console.error("Follow-up job failed", err));
  setInterval(() => {
    runFollowUpJob().catch((err) => console.error("Follow-up job failed", err));
  }, intervalMs);
}
