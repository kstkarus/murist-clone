import { NextRequest, NextResponse } from 'next/server';
import { generateCsrfSecret, generateCsrfToken } from '@/lib/csrf';

export async function GET(req: NextRequest) {
  // Генерируем новый секрет и токен
  const secret = generateCsrfSecret();
  const token = generateCsrfToken(secret);

  // Создаем ответ
  const res = NextResponse.json({ token });

  // Устанавливаем cookie с секретом
  res.cookies.set('csrfSecret', secret, {
    httpOnly: false, // Должен быть доступен для JavaScript
    path: '/',
    maxAge: 60 * 60 * 24, // 24 часа
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });

  return res;
} 