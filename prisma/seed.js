const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

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

  // Создаем начальные настройки
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      siteName: 'Название сайта',
      footerCompanyName: 'Название компании',
      phone: '',
      email: '',
      address: '',
      workingHours: '',
      description: '',
      vkLink: '',
      telegramLink: '',
      guaranteeText: '',
      privacyPolicy: ''
    },
  });
  console.log('Начальные настройки созданы или уже существуют');
}

main().finally(() => prisma.$disconnect()); 