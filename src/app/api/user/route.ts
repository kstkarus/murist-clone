import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import pino from 'pino';
import { getUserFromRequest } from '@/lib/auth';

const logger = pino({ level: 'info' });
const rateLimitMap = new Map<string, number>();

interface UserUpdateData {
  notify?: boolean;
  email?: string;
  password?: string;
}

// Регистрация пользователя (только для admin)
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();
  if (rateLimitMap.has(ip) && now - rateLimitMap.get(ip)! < 10000) {
    return NextResponse.json({ error: 'Слишком часто. Попробуйте позже.' }, { status: 429 });
  }
  rateLimitMap.set(ip, now);
  
  const user = getUserFromRequest(req);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 401 });
  }

  try {
    const { username, password, role, notify, email } = await req.json();
    // Валидация username
    if (!username || typeof username !== 'string' || username.trim().length < 3 || /\s/.test(username)) {
      return NextResponse.json({ error: 'Некорректный логин (минимум 3 символа, без пробелов).' }, { status: 400 });
    }
    // Валидация email
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string' || !emailPattern.test(email)) {
      return NextResponse.json({ error: 'Некорректный email.' }, { status: 400 });
    }
    // Валидация пароля
    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'Пароль должен быть не менее 6 символов.' }, { status: 400 });
    }
    if (!role) {
      return NextResponse.json({ error: 'Не указана роль.' }, { status: 400 });
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
    logger.info({ action: 'create_user', admin: user.username, username, email, role });
    return NextResponse.json({ success: true, user: { id: newUser.id, username: newUser.username, role: newUser.role, email: newUser.email, notify: newUser.notify } });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Ошибка сервера.' }, { status: 500 });
  }
}

// Получение списка пользователей (только для авторизованных)
export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Нет доступа' }, { status: 401 });
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
  const user = getUserFromRequest(req);
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Нет доступа' }, { status: 401 });
  try {
    const { id, notify, email, password } = await req.json();
    if (typeof id !== 'string') {
      return NextResponse.json({ error: 'Некорректные данные' }, { status: 400 });
    }
    const data: UserUpdateData = {};
    if (typeof notify === 'boolean') data.notify = notify;
    if (typeof email === 'string') {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email)) {
        return NextResponse.json({ error: 'Некорректный email.' }, { status: 400 });
      }
      data.email = email;
    }
    if (typeof password === 'string' && password.length > 0) {
      if (password.length < 6) {
        return NextResponse.json({ error: 'Пароль должен быть не менее 6 символов.' }, { status: 400 });
      }
      data.password = await bcrypt.hash(password, 10);
    }
    await prisma.user.update({ where: { id }, data });
    logger.info({ action: 'update_user', admin: user.username, id, data });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Ошибка сервера.' }, { status: 500 });
  }
}

// Удаление пользователя (только для admin)
export async function DELETE(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Нет доступа' }, { status: 401 });
  try {
    const { id } = await req.json();
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Ошибка сервера.' }, { status: 500 });
  }
} 