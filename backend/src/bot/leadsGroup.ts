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

function formatLead(registration: Registration, user: User): string {
  const lines: string[] = [];

  lines.push(registration.type === "STAND" ? "🆕 Yangi ariza — STEND" : "🆕 Yangi ariza — MEHMON");
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

  if (registration.type === "STAND" && registration.spaceNeeded) {
    lines.push(`📐 Stend: ${registration.spaceNeeded}`);
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

export async function notifyLeadsGroup(registration: Registration, user: User): Promise<void> {
  if (!config.leadsGroupChatId) return;
  await bot.telegram.sendMessage(config.leadsGroupChatId, formatLead(registration, user));
}
