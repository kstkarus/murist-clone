import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import pino from 'pino';
import { getServerSession } from '@/lib/getServerSession';

const prisma = new PrismaClient();
const logger = pino({ level: 'info' });
const rateLimitMap = new Map<string, number>();

// Регистрация пользователя (только для admin)
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();
  if (rateLimitMap.has(ip) && now - rateLimitMap.get(ip)! < 10000) {
    return NextResponse.json({ error: 'Слишком часто. Попробуйте позже.' }, { status: 429 });
  }
  rateLimitMap.set(ip, now);
  
  const session = await getServerSession(req);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 401 });
  }

  try {
    const { username, password, role, notify, email } = await req.json();
    if (!username || !password || !role || !email) {
      return NextResponse.json({ error: 'Необходимо указать логин, пароль, email и роль.' }, { status: 400 });
    }
    // Проверка на уникальность
    const exists = await prisma.user.findUnique({ where: { username } });
    if (exists) {
      return NextResponse.json({ error: 'Пользователь с таким логином уже существует.' }, { status: 400 });
    }
    const existsEmail = await prisma.user.findUnique({ where: { username: email } });
    if (existsEmail) {
      return NextResponse.json({ error: 'Пользователь с таким email уже существует.' }, { status: 400 });
    }
    // Хэшируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({ data: { username, password: hashedPassword, role, notify, email } });
    logger.info({ action: 'create_user', admin: session.username, username, email, role });
    return NextResponse.json({ success: true, user: { id: newUser.id, username: newUser.username, role: newUser.role, email: newUser.email, notify: newUser.notify } });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Ошибка сервера.' }, { status: 500 });
  }
}

// Получение списка пользователей (только для авторизованных)
export async function GET(req: NextRequest) {
  const session = await getServerSession(req);
  if (!session) return NextResponse.json({ error: 'Нет доступа' }, { status: 401 });
  try {
    const users = await prisma.user.findMany({ select: { id: true, username: true, role: true } });
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Ошибка сервера.' }, { status: 500 });
  }
}

// Обновление notify/email (только для admin)
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(req);
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Нет доступа' }, { status: 401 });
  try {
    const { id, notify, email, password } = await req.json();
    if (typeof id !== 'string') {
      return NextResponse.json({ error: 'Некорректные данные' }, { status: 400 });
    }
    const data: any = {};
    if (typeof notify === 'boolean') data.notify = notify;
    if (typeof email === 'string') data.email = email;
    if (typeof password === 'string' && password.length > 0) data.password = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { id }, data });
    logger.info({ action: 'update_user', admin: session.username, id, data });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Ошибка сервера.' }, { status: 500 });
  }
}

// Удаление пользователя (только для admin)
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(req);
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Нет доступа' }, { status: 401 });
  try {
    const { id } = await req.json();
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Ошибка сервера.' }, { status: 500 });
  }
} 