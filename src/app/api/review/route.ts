import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

const prisma = new PrismaClient();

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
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 401 });
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
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 401 });
  }

  try {
    const { id, ...data } = await req.json();
    const review = await prisma.review.update({
      where: { id },
      data
    });
    return NextResponse.json(review);
  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json({ error: 'Ошибка сервера.' }, { status: 500 });
  }
}

// Удаление отзыва (только для admin)
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 401 });
  }

  try {
    const { id } = await req.json();
    await prisma.review.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json({ error: 'Ошибка сервера.' }, { status: 500 });
  }
} 