-- CreateTable
CREATE TABLE "TeamMember" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "photo" TEXT,
    "bio" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "siteName" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "workingHours" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "vkLink" TEXT NOT NULL DEFAULT '',
    "telegramLink" TEXT NOT NULL DEFAULT '',
    "guaranteeText" TEXT NOT NULL DEFAULT 'Гарантия результата или вернем 100% оплаченной суммы!',
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Settings" ("address", "description", "email", "id", "phone", "siteName", "telegramLink", "updatedAt", "vkLink", "workingHours") SELECT "address", "description", "email", "id", "phone", "siteName", "telegramLink", "updatedAt", "vkLink", "workingHours" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
