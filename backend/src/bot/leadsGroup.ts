import type { Registration, User } from "@prisma/client";
import { config } from "../config";
import { bot } from "./bot";

function formatDate(date: Date): string {
  return date.toLocaleString("uz-UZ", { timeZone: "Asia/Tashkent", dateStyle: "short", timeStyle: "short" });
}

function utmLine(user: User): string | null {
  const parts = [
    user.utmSource ? `source=${user.utmSource}` : null,
    user.utmMedium ? `medium=${user.utmMedium}` : null,
    user.utmCampaign ? `campaign=${user.utmCampaign}` : null,
    user.utmContent ? `content=${user.utmContent}` : null,
    user.utmTerm ? `term=${user.utmTerm}` : null,
  ].filter(Boolean);
  if (!parts.length) return null;
  return `🔗 UTM: ${parts.join(" · ")}`;
}

function crmLine(registration: Registration): string {
  if (registration.status === "SYNCED") return `✅ amoCRM: lead #${registration.amoLeadId}`;
  if (registration.status === "FAILED") return "⚠️ amoCRM: sinxronizatsiya xatosi";
  return "⏳ amoCRM: kutilmoqda";
}

function tierBadge(registration: Registration): string | null {
  if (!registration.leadTier) return null;
  switch (registration.leadTier) {
    case "HOT":
      return "🔥🔥🔥 HOT LEAD — 1 soat ichida bog'laning!";
    case "WARM":
      return "🟡 WARM — 24 soat ichida bog'laning";
    case "COLD":
      return "🔵 COLD — navbat bilan";
    default:
      return null;
  }
}

function formatLead(registration: Registration, user: User): string {
  const lines: string[] = [];

  // Title + tier (Stage 2). HOT leads get a louder header so the team
  // notices them in a busy group chat.
  const hot = registration.leadTier === "HOT";
  lines.push(
    hot
      ? `🚨 Yangi ariza — ${registration.type === "STAND" ? "STEND" : "MEHMON"} 🚨`
      : registration.type === "STAND"
        ? "🆕 Yangi ariza — STEND"
        : "🆕 Yangi ariza — MEHMON",
  );
  const tier = tierBadge(registration);
  if (tier) {
    lines.push(tier);
    lines.push(`📊 Lead score: ${registration.leadScore}/100`);
  }
  lines.push(`👤 ${registration.fullName} — ${registration.position}`);

  if (registration.companyName) {
    const extra = [
      registration.companyYears ? `faoliyat: ${registration.companyYears}` : null,
      registration.companyActivity ? `yo'nalish: ${registration.companyActivity}` : null,
    ]
      .filter(Boolean)
      .join(", ");
    lines.push(`🏢 ${registration.companyName}${extra ? ` (${extra})` : ""}`);
  }

  if (registration.type === "STAND") {
    if (registration.spaceNeeded) lines.push(`📐 Stend: ${registration.spaceNeeded}`);
    if (registration.city) lines.push(`📍 Shahar: ${registration.city}`);
  }
  if (registration.type === "GUEST" && registration.willAttend !== null) {
    lines.push(`🎟 Kelishi: ${registration.willAttend ? "Ha" : "Aniq emas"}`);
  }
  if (registration.phone) {
    lines.push(`📞 ${registration.phone}`);
  }

  lines.push(`🌐 Til: ${registration.language.toUpperCase()}`);
  lines.push(`💬 ${user.username ? `@${user.username}` : user.firstName ?? "—"} (id: ${user.telegramId})`);

  const utm = utmLine(user);
  if (utm) lines.push(utm);

  lines.push(crmLine(registration));
  lines.push(`🕒 ${formatDate(registration.createdAt)}`);

  return lines.join("\n");
}

// =====================================================================
// Sending + diagnostics
// =====================================================================

interface TelegramApiError {
  status?: number;
  description?: string;
  message?: string;
  parameters?: { retry_after?: number };
}

function describeTelegramError(err: unknown): string {
  const e = err as TelegramApiError;
  if (e && typeof e === "object") {
    const parts = [e.description ?? e.message];
    if (typeof e.status === "number") parts.push(`HTTP ${e.status}`);
    return parts.filter(Boolean).join(" · ");
  }
  return String(err);
}

/** 401 (bad token), 400 (bad chat id) and 403 (kicked / no rights) are
 *  deterministic — retrying the same call won't help. Everything else
 *  (network hiccups, 429 flood, 5xx) is worth one retry. */
function isTransientTelegramError(err: unknown): boolean {
  const status = (err as TelegramApiError)?.status;
  return status === undefined || status === 429 || status >= 500;
}

async function sendToLeadsGroup(chatId: string, text: string): Promise<void> {
  try {
    await bot.telegram.sendMessage(chatId, text);
  } catch (err) {
    if (!isTransientTelegramError(err)) throw err;
    const retryAfter = (err as TelegramApiError)?.parameters?.retry_after;
    const waitMs = retryAfter ? Math.max(2000, retryAfter * 1000 + 500) : 2000;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    await bot.telegram.sendMessage(chatId, text);
  }
}

export async function notifyLeadsGroup(registration: Registration, user: User): Promise<void> {
  if (!config.leadsGroupChatId) return;
  const text = formatLead(registration, user);
  try {
    await sendToLeadsGroup(config.leadsGroupChatId, text);
  } catch (err) {
    // Re-throw with full context: the caller only logs, and the team has
    // been flying blind on group-delivery failures (see admin panel
    // "Telegram guruhi" section for a manual test).
    throw new Error(
      `leads group delivery failed for registration #${registration.id} ` +
        `(chat_id=${config.leadsGroupChatId}): ${describeTelegramError(err)}`,
    );
  }
}

/**
 * Send a raw text message to the leads group. Used by the workflow
 * engine (`notify_admins` action) to push custom notifications.
 */
export async function sendLeadsGroup(text: string): Promise<void> {
  if (!config.leadsGroupChatId) return;
  await sendToLeadsGroup(config.leadsGroupChatId, text);
}

// =====================================================================
// Diagnostics — "guruhga xabar kelmayapti" triage
// =====================================================================

export type LeadsGroupFailedAt = "not_configured" | "get_me" | "get_chat" | "send" | null;

export interface LeadsGroupDiagnosis {
  configured: boolean;
  chatId: string | null;
  bot: { id: number; username: string; firstName: string } | null;
  chat: { title: string; type: string; memberCount: number | null } | null;
  /** true only when a test message was actually delivered. */
  sendOk: boolean;
  /** Which step failed (null when everything passed). */
  failedAt: LeadsGroupFailedAt;
  error: string | null;
  /** Plain-language explanation of what to fix, in Uzbek. */
  hintUz: string | null;
  /** Same, in English, for the logs. */
  hintEn: string | null;
}

function hintFor(failedAt: LeadsGroupFailedAt, err: unknown): { uz: string; en: string } {
  const status = (err as TelegramApiError)?.status;
  const desc = (err as TelegramApiError)?.description ?? "";
  const d = desc.toLowerCase();
  const chatId = config.leadsGroupChatId;

  if (failedAt === "not_configured") {
    return {
      uz: "LEADS_GROUP_CHAT_ID o'zgaruvchisi sozlanmagan — deploy'da (fly secrets set LEADS_GROUP_CHAT_ID=...) yoki .env da qiymatini kiriting.",
      en: "LEADS_GROUP_CHAT_ID is not set — configure it in the deployment secrets.",
    };
  }
  if (failedAt === "get_me") {
    // No HTTP status at all -> we never reached Telegram (network issue).
    if (status === undefined) {
      return {
        uz: "Telegram API'ga ulanib bo'lmadi (tarmoq xatosi). Birazdan qayta tekshiring; izchil davom etib tursade server tarmoq sozlamalarini va BOT_TOKEN'ni tekshiring.",
        en: "Could not reach the Telegram API (network error). Re-check in a bit; if it persists, review the server network config and the BOT_TOKEN.",
      };
    }
  }
  if (status === 401) {
    return {
      uz: "BOT_TOKEN xato (401) — token eskirgan yoki noto'g'ri. BotFather'da yangisini oling va deploy'ga yangilang.",
      en: "BOT_TOKEN rejected (401) — regenerate it in BotFather and update the deployment secret.",
    };
  }
  if (d.includes("chat not found") || d.includes("chat_id is invalid")) {
    return {
      uz: `Bot bu chatga yetolmayapti: ID (${chatId}) noto'g'ri bo'lsa kerak yoki bot guruhda a'zo emas. Guruh o'chirib qayta yaratilgan bo'lsa ID o'zgargan — yangi ID'ni kichik guruhga @userinfobot'ga yoki @getidsbot'ga so'rabi oling, keyin LEADS_GROUP_CHAT_ID'ni yangilang va botni qayta guruhga qo'shing.`,
      en: `Bot can't reach this chat: the ID (${chatId}) is wrong or the bot is not a member. If the group was recreated the ID changed — get the new one (e.g. via @userinfobot) and update LEADS_GROUP_CHAT_ID, then re-add the bot to the group.`,
    };
  }
  if (d.includes("kicked") || d.includes("chat_write_forbidden")) {
    return {
      uz: "Bot guruhdan chiqarilgan yoki guruhga qo'shilmagan. Botni qayta guruhga a'zo qilib qo'shing.",
      en: "The bot was kicked from the group or is not a member. Re-add the bot to the group.",
    };
  }
  if (d.includes("not enough rights") || d.includes("forbidden")) {
    return {
      uz: "Bot yuborishga ruxsatsiz (403). Ko'pincha sabab: guruh sozlamalarida 'Xabar yuborish — faqat adminlar' yoqilgan. Botni guruh admini qiling yoki sozlamani ochiq qiling.",
      en: "The bot is forbidden to post (403). Usually the group has 'Send messages — admins only' enabled. Make the bot an admin or open the setting.",
    };
  }
  if (status === 429 || d.includes("flood wait")) {
    return {
      uz: "Telegram vaqtincha cheklov qo'ydi (FloodWait) — bir necha soniya o'tib qayta urining.",
      en: "Telegram flood control is active — wait a few seconds and retry.",
    };
  }
  if (failedAt === "send" || failedAt === "get_chat") {
    return {
      uz: "Telegram xatosi qaytardi (yuqoriga). Server loglarida aniq tafsilot bor: fly logs | grep 'leads group'.",
      en: "Telegram returned an error (above). Check server logs: fly logs | grep 'leads group'.",
    };
  }
  return {
    uz: "Bekor xato — aniq tafsilot server loglarida.",
    en: "Unexpected error — see server logs for details.",
  };
}

/**
 * Step-by-step check of the leads-group pipeline:
 *   1. is a chat id configured?
 *   2. does the bot token work?          (getMe)
 *   3. can the bot see the group?        (getChat -> title)
 *   4. can the bot post into it?         (sendMessage — only when sendTest)
 *
 * Returns a structured result so the admin panel can show exactly which
 * step broke and what to do about it — no more guessing why the group
 * goes silent.
 */
export async function diagnoseLeadsGroup(opts: { sendTest?: boolean } = {}): Promise<LeadsGroupDiagnosis> {
  const chatId = config.leadsGroupChatId || null;
  const base: LeadsGroupDiagnosis = {
    configured: Boolean(chatId),
    chatId,
    bot: null,
    chat: null,
    sendOk: false,
    failedAt: null,
    error: null,
    hintUz: null,
    hintEn: null,
  };
  if (!chatId) {
    const hint = hintFor("not_configured", null);
    return { ...base, failedAt: "not_configured", error: "LEADS_GROUP_CHAT_ID sozlanmagan", hintUz: hint.uz, hintEn: hint.en };
  }

  // 2. token
  let me: { id: number; username: string; first_name: string };
  try {
    me = await bot.telegram.getMe();
  } catch (err) {
    const hint = hintFor("get_me", err);
    return { ...base, failedAt: "get_me", error: describeTelegramError(err), hintUz: hint.uz, hintEn: hint.en };
  }
  base.bot = { id: me.id, username: me.username, firstName: me.first_name };

  // 3. group reachable?
  try {
    const chat = await bot.telegram.getChat(chatId);
    let title: string;
    let memberCount: number | null = null;
    if (chat.type === "group" || chat.type === "supergroup") {
      title = chat.title;
      try {
        memberCount = await bot.telegram.getChatMembersCount(chatId);
      } catch {
        // member count is cosmetic — never fail the diagnosis on it
      }
    } else {
      // LEADS_GROUP_CHAT_ID should point at a group; a private chat here
      // means someone pasted a user id — surface it clearly.
      title = "private chat (buning guruh emas!)";
    }
    base.chat = { title, type: chat.type, memberCount };
  } catch (err) {
    const hint = hintFor("get_chat", err);
    return { ...base, failedAt: "get_chat", error: describeTelegramError(err), hintUz: hint.uz, hintEn: hint.en };
  }

  if (!opts.sendTest) {
    // Read-only pass: bot can see the chat, which is enough to say the
    // configuration is *likely* fine. Full confirmation needs sendTest.
    return { ...base, sendOk: false, error: null, hintUz: null, hintEn: null };
  }

  // 4. actually post a test message.
  const now = new Date().toLocaleString("uz-UZ", { timeZone: "Asia/Tashkent", dateStyle: "short", timeStyle: "short" });
  const text =
    `🔔 TEST — leads guruhiga ulanish tekshiruvi\n` +
    `Bot: @${me.username} (id: ${me.id})\n` +
    `Chat: ${chatId}\n` +
    `Vaqt: ${now}\n` +
    `Bu xabar admin panel "Telegram guruhi" bo'limidan yuborildi.`;
  try {
    await sendToLeadsGroup(chatId, text);
    return { ...base, sendOk: true };
  } catch (err) {
    const hint = hintFor("send", err);
    return { ...base, failedAt: "send", error: describeTelegramError(err), hintUz: hint.uz, hintEn: hint.en };
  }
}
