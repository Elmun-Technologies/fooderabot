import { Markup, Telegraf } from "telegraf";
import { config } from "../config";
import { prisma } from "../db";
import { resolveUtmFromStartPayload } from "../lib/utm";
import type { Language, RegistrationType } from "../types";
import { botText } from "./i18n";

export const bot = new Telegraf(config.botToken);

bot.start(async (ctx) => {
  const from = ctx.from;
  const payload = ctx.startPayload?.trim();
  const utm = resolveUtmFromStartPayload(payload);

  const user = await prisma.user.upsert({
    where: { telegramId: BigInt(from.id) },
    update: {
      username: from.username,
      firstName: from.first_name,
      lastName: from.last_name,
      languageCode: from.language_code,
    },
    create: {
      telegramId: BigInt(from.id),
      username: from.username,
      firstName: from.first_name,
      lastName: from.last_name,
      languageCode: from.language_code,
      startPayload: payload,
      utmSource: utm.utmSource,
      utmMedium: utm.utmMedium,
      utmCampaign: utm.utmCampaign,
      utmContent: utm.utmContent,
      utmTerm: utm.utmTerm,
    },
    include: { registration: true },
  });

  if (user.registration) {
    const lang = (user.registration.language as Language) ?? "uz";
    await ctx.reply(botText.alreadyRegistered[lang]);
    return;
  }

  await ctx.reply(botText.welcomeMultilang);
  await ctx.reply(
    [botText.openApp.uz, botText.openApp.ru, botText.openApp.en].join("\n"),
    Markup.inlineKeyboard([Markup.button.webApp(botText.openAppButton, config.webAppUrl)]),
  );
});

export async function notifyRegistrationConfirmed(
  telegramId: number,
  type: RegistrationType,
  language: Language,
  willAttend?: boolean,
) {
  await bot.telegram.sendMessage(telegramId, botText.confirmed(type, language, willAttend));
}
