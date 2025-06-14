import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

// Получение списка отзывов
export async function GET() {
  try {
    const reviews = await prisma.review.findMany({
      orderBy: { order: 'asc' }
    });
    return NextResponse.json({ reviews });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: 'Ошибка сервера.' }, { status: 500 });
  }
}

// Создание отзыва (только для admin)
export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
  }

  try {
    const data = await req.json();
    const review = await prisma.review.create({ data });
    return NextResponse.json(review);
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json({ error: 'Ошибка сервера.' }, { status: 500 });
  }
}

// Обновление отзыва (только для admin)
export async function PUT(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
  }

  try {
    const data = await req.json();
    const { id, ...rest } = data;
    const review = await prisma.review.update({ where: { id }, data: rest });
    return NextResponse.json(review);
  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json({ error: 'Ошибка сервера.' }, { status: 500 });
  }
}

// Удаление отзыва (только для admin)
export async function DELETE(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
  }

  try {
    const data = await req.json();
    await prisma.review.delete({ where: { id: data.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json({ error: 'Ошибка сервера.' }, { status: 500 });
  }
} 