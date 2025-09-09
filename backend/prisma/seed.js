import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const hashed = await bcrypt.hash("test123", 10);

  await prisma.appUser.create({
    data: {
      username: "dratharias",
      password: hashed,
      role: "user",
    },
  });

  console.log("Seeded test user");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
