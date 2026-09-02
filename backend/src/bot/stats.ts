import { prisma } from "../db";

function startOfTodayInTashkent(): Date {
  // Asia/Tashkent is UTC+5 with no DST - a fixed offset is safe here.
  const now = new Date();
  const tashkentNow = new Date(now.getTime() + 5 * 60 * 60 * 1000);
  tashkentNow.setUTCHours(0, 0, 0, 0);
  return new Date(tashkentNow.getTime() - 5 * 60 * 60 * 1000);
}

export async function buildStatsMessage(): Promise<string> {
  const todayStart = startOfTodayInTashkent();

  const [
    totalUsers,
    totalRegistrations,
    standCount,
    guestCount,
    todayCount,
    syncedCount,
    failedCount,
    pendingCount,
    utmGroups,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.registration.count(),
    prisma.registration.count({ where: { type: "STAND" } }),
    prisma.registration.count({ where: { type: "GUEST" } }),
    prisma.registration.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.registration.count({ where: { status: "SYNCED" } }),
    prisma.registration.count({ where: { status: "FAILED" } }),
    prisma.registration.count({ where: { status: "PENDING" } }),
    prisma.user.groupBy({
      by: ["utmSource"],
      where: { utmSource: { not: null }, registration: { isNot: null } },
      _count: { _all: true },
    }),
  ]);

  const conversion = totalUsers ? ((totalRegistrations / totalUsers) * 100).toFixed(1) : "0.0";
  const topUtm = [...utmGroups].sort((a, b) => b._count._all - a._count._all).slice(0, 5);

  const lines = [
    "📊 FOODERA EXPO — statistika",
    "",
    `👥 Botni boshlaganlar: ${totalUsers}`,
    `✅ Ro'yxatdan o'tganlar: ${totalRegistrations} (konversiya: ${conversion}%)`,
    `   🏢 Stend: ${standCount}   🎟 Mehmon: ${guestCount}`,
    `📅 Bugun: ${todayCount} ta yangi ariza`,
    "",
    `amoCRM: ✅ ${syncedCount}   ⚠️ ${failedCount}   ⏳ ${pendingCount}`,
  ];

  if (topUtm.length) {
    lines.push("", "🔝 Top manbalar (UTM source):");
    topUtm.forEach((g, i) => {
      lines.push(`${i + 1}. ${g.utmSource} — ${g._count._all} ta`);
    });
  }

  return lines.join("\n");
}

export async function buildLeadsMessage(limit = 10): Promise<string> {
  const registrations = await prisma.registration.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { user: true },
  });

  if (!registrations.length) {
    return "Hali ro'yxatdan o'tganlar yo'q.";
  }

  const lines = [`🧾 Oxirgi ${registrations.length} ta ariza:`, ""];
  for (const r of registrations) {
    const when = r.createdAt.toLocaleString("uz-UZ", { timeZone: "Asia/Tashkent", dateStyle: "short", timeStyle: "short" });
    const icon = r.type === "STAND" ? "🏢" : "🎟";
    const company = r.companyName ? ` (${r.companyName})` : "";
    const phone = r.phone ? ` — ${r.phone}` : "";
    lines.push(`${icon} ${r.fullName}${company}${phone} — ${when}`);
  }

  return lines.join("\n");
}
