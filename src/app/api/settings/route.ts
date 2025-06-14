import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { Session } from 'next-auth';

interface CustomSession extends Session {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
    username?: string;
  }
}

export async function GET() {
  try {
    const settings = await prisma.settings.findFirst();
    return NextResponse.json(settings || {});
  } catch (error) {
    console.error('Ошибка при получении настроек:', error);
    return NextResponse.json({ error: 'Ошибка при получении настроек' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    console.log('Начало обработки POST запроса настроек');
    
    const session = await getServerSession(authOptions) as CustomSession | null;
    console.log('Сессия:', session);
    
    if (!session?.user) {
      console.log('Нет сессии пользователя');
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
    }
    
    if (session.user.role !== 'admin') {
      console.log('Недостаточно прав:', session.user.role);
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });
    }

    const data = await request.json();
    console.log('Полученные данные:', data);
    
    // Проверяем наличие всех необходимых полей
    const requiredFields = ['siteName', 'phone', 'email', 'address', 'workingHours', 'description', 'vkLink', 'telegramLink'];
    for (const field of requiredFields) {
      if (!(field in data)) {
        console.log(`Отсутствует поле ${field}, устанавливаем пустую строку`);
        data[field] = '';
      }
    }

    console.log('Подготовленные данные для сохранения:', data);

    const settings = await prisma.settings.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, ...data }
    });

    console.log('Настройки успешно сохранены:', settings);
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Ошибка при сохранении настроек:', error);
    return NextResponse.json({ 
      error: 'Ошибка при сохранении настроек',
      details: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }, { status: 500 });
  }
} 