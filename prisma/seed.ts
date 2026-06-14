import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001";
const DEFAULT_USER_EMAIL = "v1@local";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  await prisma.user.upsert({
    where: { id: DEFAULT_USER_ID },
    update: { email: DEFAULT_USER_EMAIL },
    create: {
      id: DEFAULT_USER_ID,
      email: DEFAULT_USER_EMAIL,
    },
  });
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
