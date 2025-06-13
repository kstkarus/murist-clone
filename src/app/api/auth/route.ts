import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../generated/prisma';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pino from 'pino';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const logger = pino({ level: 'info' });
const rateLimitMap = new Map<string, number>();

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();
  if (rateLimitMap.has(ip) && now - rateLimitMap.get(ip)! < 5000) {
    return NextResponse.json({ error: 'Слишком часто. Попробуйте позже.' }, { status: 429 });
  }
  rateLimitMap.set(ip, now);
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: 'Необходимо указать логин и пароль.' }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      logger.warn({ action: 'login_failed', username });
      return NextResponse.json({ error: 'Неверный логин или пароль.' }, { status: 401 });
    }
    logger.info({ action: 'login_success', username });
    // Генерируем JWT
    const token = jwt.sign({ username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    const res = NextResponse.json({ success: true, user: { username: user.username, role: user.role } });
    res.cookies.set('token', token, { httpOnly: true, path: '/', maxAge: 60*60*24 });
    return res;
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера.' }, { status: 500 });
  }
} 