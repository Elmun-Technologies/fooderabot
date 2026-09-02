import { Markup, Telegraf } from "telegraf";
import { config } from "../config";
import { prisma } from "../db";
import { resolveUtmFromStartPayload } from "../lib/utm";
import type { Language, RegistrationType } from "../types";
import { botText } from "./i18n";
import { buildLeadsMessage, buildStatsMessage } from "./stats";

export const bot = new Telegraf(config.botToken);

function isLeadsGroup(chatId: number): boolean {
  return Boolean(config.leadsGroupChatId) && String(chatId) === String(config.leadsGroupChatId);
}

// /stats and /leads only answer inside the internal leads group - lead data
// (names, phones, UTM) must not be readable from a random private chat.
bot.command("stats", async (ctx) => {
  if (!isLeadsGroup(ctx.chat.id)) return;
  await ctx.reply(await buildStatsMessage());
});

bot.command("leads", async (ctx) => {
  if (!isLeadsGroup(ctx.chat.id)) return;
  await ctx.reply(await buildLeadsMessage());
});

function webAppUrlFor(language: Language): string {
  const url = new URL(config.webAppUrl);
  url.searchParams.set("lang", language);
  return url.toString();
}

async function sendLanguagePrompt(chatId: number) {
  await bot.telegram.sendMessage(
    chatId,
    botText.chooseLanguage,
    Markup.inlineKeyboard([
      [Markup.button.callback("🇺🇿 O'zbekcha", "lang:uz")],
      [Markup.button.callback("🇷🇺 Русский", "lang:ru")],
      [Markup.button.callback("🇬🇧 English", "lang:en")],
    ]),
  );
}

async function sendWarmupAndOpenApp(chatId: number, language: Language) {
  // A short "progrev" before the CTA: build a little context/interest first
  // instead of dropping straight into a form.
  await bot.telegram.sendMessage(chatId, botText.warmup(language));
  await bot.telegram.sendMessage(
    chatId,
    botText.openApp[language],
    Markup.inlineKeyboard([Markup.button.webApp(botText.openAppButton[language], webAppUrlFor(language))]),
  );
}

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

  await sendLanguagePrompt(ctx.chat.id);
});

bot.action(/^lang:(uz|ru|en)$/, async (ctx) => {
  const language = ctx.match[1] as Language;
  await ctx.answerCbQuery();

  const user = await prisma.user.update({
    where: { telegramId: BigInt(ctx.from.id) },
    data: { language },
    include: { registration: true },
  });

  if (user.registration) {
    const lang = (user.registration.language as Language) ?? language;
    await ctx.reply(botText.alreadyRegistered[lang]);
    return;
  }

  await sendWarmupAndOpenApp(ctx.chat!.id, language);
});

export async function notifyRegistrationConfirmed(
  telegramId: number,
  type: RegistrationType,
  language: Language,
  willAttend?: boolean,
) {
  await bot.telegram.sendMessage(telegramId, botText.confirmed(type, language, willAttend));
}

export async function notifyText(telegramId: number, text: string, webAppButtonLabel?: string, language?: Language) {
  if (webAppButtonLabel && language) {
    await bot.telegram.sendMessage(
      telegramId,
      text,
      Markup.inlineKeyboard([Markup.button.webApp(webAppButtonLabel, webAppUrlFor(language))]),
    );
    return;
  }
  await bot.telegram.sendMessage(telegramId, text);
}
