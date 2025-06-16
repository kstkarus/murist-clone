const fs = require('fs');
const path = require('path');

// Создаем директорию prisma в .next/standalone если её нет
const standalonePrismaDir = path.join(__dirname, '..', '.next', 'standalone', 'prisma');
if (!fs.existsSync(standalonePrismaDir)) {
  fs.mkdirSync(standalonePrismaDir, { recursive: true });
}

// Копируем базу данных
const sourceDb = path.join(__dirname, '..', 'prisma', 'dev.db');
const targetDb = path.join(standalonePrismaDir, 'dev.db');
if (fs.existsSync(sourceDb)) {
  fs.copyFileSync(sourceDb, targetDb);
  console.log('База данных скопирована');
}

// Копируем директорию migrations
const sourceMigrations = path.join(__dirname, '..', 'prisma', 'migrations');
const targetMigrations = path.join(standalonePrismaDir, 'migrations');
if (fs.existsSync(sourceMigrations)) {
  if (!fs.existsSync(targetMigrations)) {
    fs.mkdirSync(targetMigrations, { recursive: true });
  }
  fs.cpSync(sourceMigrations, targetMigrations, { recursive: true });
  console.log('Миграции скопированы');
}

console.log('Копирование завершено'); 