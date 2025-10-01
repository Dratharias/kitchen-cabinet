import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function ensureUser(username, password, role = "user") {
  const found = await prisma.app_user.findUnique({ where: { username } });
  if (found) return found;

  const hashed = await bcrypt.hash(password, 10);
  return prisma.app_user.create({
    data: {
      user_id: uuidv4(),
      username,
      password: hashed,
      role,
    },
  });
}

async function main() {
  await ensureUser("dratharias", "Ch4ng3m3!", "admin");
  console.log("✅ Seed terminé : user admin créé");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
