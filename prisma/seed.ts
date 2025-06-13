import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('admin', 10);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: null,
      password,
      role: 'admin',
      notify: true,
    },
  });
  console.log('Админ создан или уже существует');
}

main().finally(() => prisma.$disconnect()); 