import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../generated/prisma';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

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

export async function POST(req: NextRequest) {
  try {
    const { name, phone } = await req.json();
    if (!name || !phone) {
      return NextResponse.json({ error: 'Необходимо указать ФИО и телефон.' }, { status: 400 });
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
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Нет доступа' }, { status: 401 });
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'Не указан id' }, { status: 400 });
    await prisma.request.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера.' }, { status: 500 });
  }
} 