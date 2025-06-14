import { NextRequest, NextResponse } from 'next/server';
import { generateCsrfSecret, generateCsrfToken } from '@/lib/csrf';

export async function GET(req: NextRequest) {
  try {
    // Генерируем новый секрет
    const secret = generateCsrfSecret();
    // Генерируем токен на основе секрета
    const token = generateCsrfToken(secret);

    // Создаем ответ
    const response = NextResponse.json({ token });

    // Устанавливаем cookie с секретом
    response.cookies.set('csrfSecret', secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate CSRF token' }, { status: 500 });
  }
} 