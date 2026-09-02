/**
 * Stage 4 admin bootstrap.
 *
 * Usage:
 *   npx tsx scripts/createAdmin.ts <username> <password>
 *
 * Idempotent: if the username already exists the password is rotated
 * to the new value (handy for first deploys and for "I forgot my
 * password" recovery — the script lives on the server so access is
 * controlled by SSH / Fly SSH).
 *
 * Not exposed via HTTP on purpose.
 */

import { prisma } from "../src/db";
import { hashPassword, packPassword } from "../src/lib/auth";

async function main() {
  const [username, password] = process.argv.slice(2);
  if (!username || !password) {
    console.error("Usage: tsx scripts/createAdmin.ts <username> <password>");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters");
    process.exit(1);
  }

  const { hash, salt } = hashPassword(password);
  const passwordHash = packPassword({ hash, salt });

  const user = await prisma.adminUser.upsert({
    where: { username },
    update: { passwordHash, role: "admin" },
    create: { username, passwordHash, role: "admin" },
  });

  // Wipe any existing sessions so the new password takes effect
  // immediately (no cookie carries the old credential).
  await prisma.adminSession.deleteMany({ where: { adminUserId: user.id } });

  console.log(`Admin ready: ${user.username} (id=${user.id})`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
