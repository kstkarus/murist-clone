import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { verifyCsrfToken } from '@/lib/csrf';

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not set');
const JWT_SECRET = process.env.JWT_SECRET;

function getUserFromRequest(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as { username: string; role: string };
  } catch {
    return null;
  }
}

async function sendEmailNotification(name: string, phone: string) {
  if (!process.env.SMTP_HOST) return;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  // Получаем всех пользователей с notify=true и email
  const notifyUsers = await prisma.user.findMany({ where: { notify: true, NOT: { email: null } } });
  for (const user of notifyUsers) {
    if (!user.email) continue;
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: user.email,
      subject: 'Новая заявка с сайта',
      text: `ФИО: ${name}\nТелефон: ${phone}`,
    });
  }
}

function getCsrfSecretFromRequest(req: NextRequest) {
  return req.cookies.get('csrfSecret')?.value || '';
}

export async function POST(req: NextRequest) {
  // CSRF check
  const csrfToken = req.headers.get('x-csrf-token') || '';
  const csrfSecret = getCsrfSecretFromRequest(req);
  
  if (!csrfToken || !csrfSecret || !verifyCsrfToken(csrfSecret, csrfToken)) {
    return NextResponse.json({ error: 'CSRF token invalid' }, { status: 403 });
  }

  try {
    const { name, phone } = await req.json();
    // Валидация имени
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'Введите корректное имя (минимум 2 символа).' }, { status: 400 });
    }
    // Валидация телефона
    const phonePattern = /^\+7 \(\d{3}\) \d{3} \d{2} \d{2}$/;
    if (!phone || typeof phone !== 'string' || !phonePattern.test(phone)) {
      return NextResponse.json({ error: 'Введите корректный номер телефона в формате +7 (XXX) XXX XX XX.' }, { status: 400 });
    }
    const request = await prisma.request.create({
      data: { name, phone },
    });
    await sendEmailNotification(name, phone);
    return NextResponse.json({ success: true, request });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Нет доступа' }, { status: 401 });
  try {
    const requests = await prisma.request.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ requests });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Нет доступа' }, { status: 401 });
  
  // CSRF check
  const csrfToken = req.headers.get('x-csrf-token') || '';
  const csrfSecret = getCsrfSecretFromRequest(req);
  
  if (!csrfToken || !csrfSecret || !verifyCsrfToken(csrfSecret, csrfToken)) {
    return NextResponse.json({ error: 'CSRF token invalid' }, { status: 403 });
  }

  try {
    const { id } = await req.json();
    const numId = Number(id);
    if (!numId || isNaN(numId) || numId <= 0) {
      return NextResponse.json({ error: 'Некорректный id' }, { status: 400 });
    }
    await prisma.request.delete({ where: { id: numId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера.' }, { status: 500 });
  }
} 