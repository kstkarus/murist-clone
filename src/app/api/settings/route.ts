import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from '@/lib/getServerSession';

const prismaClient = new PrismaClient();

export async function GET() {
  try {
    const settings = await prismaClient.settings.findFirst();
    return NextResponse.json(settings || {});
  } catch (error) {
    console.error('Ошибка при получении настроек:', error);
    return NextResponse.json({ error: 'Ошибка при получении настроек' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
    }
    const data = await request.json();
    // Проверяем наличие всех необходимых полей
    const requiredFields = ['siteName', 'phone', 'email', 'address', 'workingHours', 'description', 'vkLink', 'telegramLink'];
    for (const field of requiredFields) {
      if (!(field in data)) {
        data[field] = '';
      }
    }
    const settings = await prismaClient.settings.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, ...data }
    });
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Ошибка при сохранении настроек:', error);
    return NextResponse.json({ 
      error: 'Ошибка при сохранении настроек',
      details: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }, { status: 500 });
  }
} 