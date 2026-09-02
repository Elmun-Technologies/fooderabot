import { Prisma, RegistrationStatus } from "@prisma/client";
import { notifyRegistrationConfirmed } from "../bot/bot";
import { notifyLeadsGroup } from "../bot/leadsGroup";
import { prisma } from "../db";
import { createLeadForRegistration } from "./amocrm";
import { computeLeadScore } from "./leadScoring";
import type { SubmitRegistrationBody } from "../types";
import type { TelegramWebAppUser } from "../lib/validateInitData";

async function upsertUser(tgUser: TelegramWebAppUser) {
  return prisma.user.upsert({
    where: { telegramId: BigInt(tgUser.id) },
    update: {
      username: tgUser.username,
      firstName: tgUser.first_name,
      lastName: tgUser.last_name,
      languageCode: tgUser.language_code,
    },
    create: {
      telegramId: BigInt(tgUser.id),
      username: tgUser.username,
      firstName: tgUser.first_name,
      lastName: tgUser.last_name,
      languageCode: tgUser.language_code,
    },
    include: { registration: true },
  });
}

export async function checkRegistration(tgUser: TelegramWebAppUser) {
  const user = await upsertUser(tgUser);
  const r = user.registration;
  return {
    alreadyRegistered: Boolean(r),
    type: r?.type,
    language: r?.language,
    fullName: r?.fullName,
    position: r?.position,
    phone: r?.phone ?? undefined,
    companyName: r?.companyName ?? undefined,
    companyYears: r?.companyYears ?? undefined,
    companyActivity: r?.companyActivity ?? undefined,
    spaceNeeded: r?.spaceNeeded ?? undefined,
    willAttend: r?.willAttend ?? undefined,
    city: r?.city ?? undefined,
  };
}

export class AlreadyRegisteredError extends Error {}

export async function submitRegistration(tgUser: TelegramWebAppUser, body: SubmitRegistrationBody) {
  const user = await upsertUser(tgUser);
  if (user.registration) {
    throw new AlreadyRegisteredError();
  }

  let registration;
  try {
    registration = await prisma.registration.create({
      data: {
        userId: user.id,
        type: body.type,
        language: body.language,
        position: body.position,
        fullName: body.fullName,
        phone: body.phone,
        companyName: body.companyName,
        companyYears: body.companyYears,
        companyActivity: body.companyActivity,
        spaceNeeded: body.spaceNeeded,
        willAttend: body.willAttend,
        city: body.city,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new AlreadyRegisteredError();
    }
    throw err;
  }

  // Stage-2: compute the lead score and tier right after the row lands.
  // The leads-group message uses these to flag HOT leads and the admin
  // panel (Stage 5) will sort/filter by them.
  const scoring = computeLeadScore(body);
  registration = await prisma.registration.update({
    where: { id: registration.id },
    data: { leadScore: scoring.score, leadTier: scoring.tier },
  });

  try {
    const { leadId, contactId } = await createLeadForRegistration({
      ...body,
      telegramId: tgUser.id,
      telegramUsername: tgUser.username,
      utmSource: user.utmSource ?? undefined,
      utmMedium: user.utmMedium ?? undefined,
      utmCampaign: user.utmCampaign ?? undefined,
      utmContent: user.utmContent ?? undefined,
      utmTerm: user.utmTerm ?? undefined,
    });
    registration = await prisma.registration.update({
      where: { id: registration.id },
      data: { status: RegistrationStatus.SYNCED, amoLeadId: leadId, amoContactId: contactId },
    });
  } catch (err) {
    // The registration is saved either way - amoCRM sync failure must never
    // lose the lead or block the user's confirmation. It just needs a
    // human/cron to retry later using the FAILED rows.
    registration = await prisma.registration.update({
      where: { id: registration.id },
      data: { status: RegistrationStatus.FAILED, syncError: err instanceof Error ? err.message : String(err) },
    });
    console.error("amoCRM sync failed for registration", registration.id, err);
  }

  await notifyRegistrationConfirmed(tgUser.id, body.type, body.language, body.willAttend).catch((err) => {
    console.error("Failed to send Telegram confirmation", err);
  });

  await notifyLeadsGroup(registration, user).catch((err) => {
    console.error("Failed to notify leads group", err);
  });

  return registration;
}
