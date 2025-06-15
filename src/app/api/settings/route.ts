import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET() {
  try {
    const settings = await prisma.settings.findFirst();
    return NextResponse.json(settings || {});
  } catch (error) {
    console.error('Ошибка при получении настроек:', error);
    return NextResponse.json({ error: 'Ошибка при получении настроек' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
  }
  try {
    const data = await request.json();
    // Проверяем наличие всех необходимых полей
    const requiredFields = ['siteName', 'footerCompanyName', 'phone', 'email', 'address', 'workingHours', 'description', 'vkLink', 'telegramLink', 'guaranteeText', 'privacyPolicy'];
    for (const field of requiredFields) {
      if (!(field in data)) {
        data[field] = '';
      }
    }
    const settings = await prisma.settings.upsert({
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