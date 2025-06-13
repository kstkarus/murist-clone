import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../generated/prisma';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pino from 'pino';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const logger = pino({ level: 'info' });
const rateLimitMap = new Map<string, number>();

function getUserFromRequest(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as { username: string; role: string };
  } catch {
    return null;
  }
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
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Нет доступа' }, { status: 401 });
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
    const existsEmail = await prisma.user.findUnique({ where: { email } });
    if (existsEmail) {
      return NextResponse.json({ error: 'Пользователь с таким email уже существует.' }, { status: 400 });
    }
    // Хэшируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({ data: { username, password: hashedPassword, role, notify, email } });
    logger.info({ action: 'create_user', admin: user.username, username, email, role });
    return NextResponse.json({ success: true, user: { id: newUser.id, username: newUser.username, role: newUser.role, email: newUser.email, notify: newUser.notify } });
  } catch (error) {
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
    return NextResponse.json({ error: 'Ошибка сервера.' }, { status: 500 });
  }
}

// Удаление пользователя (только для admin)
export async function DELETE(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Нет доступа' }, { status: 401 });
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'Не указан id' }, { status: 400 });
    await prisma.user.delete({ where: { id } });
    logger.info({ action: 'delete_user', admin: user.username, id });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера.' }, { status: 500 });
  }
}

// Обновление notify/email (только для admin)
export async function PATCH(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Нет доступа' }, { status: 401 });
  try {
    const { id, notify, email, password } = await req.json();
    if (typeof id !== 'number') {
      return NextResponse.json({ error: 'Некорректные данные' }, { status: 400 });
    }
    const data: any = {};
    if (typeof notify === 'boolean') data.notify = notify;
    if (typeof email === 'string') data.email = email;
    if (typeof password === 'string' && password.length > 0) data.password = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { id }, data });
    logger.info({ action: 'update_user', admin: user.username, id, data });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера.' }, { status: 500 });
  }
} 