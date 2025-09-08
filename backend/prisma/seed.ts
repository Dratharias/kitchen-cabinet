import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const username = process.env.MEALTICKET_USER!;
  const password = process.env.MEALTICKET_PASSWORD!;
  const role = process.env.MEALTICKET_ROLE || 'user';

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.appUser.upsert({
    where: { username },
    update: {},
    create: {
      username,
      password: hashedPassword,
      role,
    },
  });

  console.log(`User ${username} seeded.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
