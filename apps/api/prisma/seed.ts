import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('admin123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@spontaneous.social' },
    update: {},
    create: {
      email: 'admin@spontaneous.social',
      passwordHash,
      fullName: 'Admin',
      emailVerified: true,
      profile: {
        create: { displayName: 'Admin' },
      },
      roles: {
        createMany: {
          data: [{ role: 'admin' }, { role: 'user' }],
        },
      },
    },
  });

  console.log(`Admin user created: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
