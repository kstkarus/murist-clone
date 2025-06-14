import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateCsrfSecret, generateCsrfToken } from '@/lib/csrf';

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not set');
const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    
    if (!username || !password) {
      return NextResponse.json({ error: 'Нет данных' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    
    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      return NextResponse.json({ error: 'Неверный пароль' }, { status: 401 });
    }

    // Генерируем JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role 
      }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    // Генерируем CSRF secret и token
    const csrfSecret = generateCsrfSecret();
    const csrfToken = generateCsrfToken(csrfSecret);

    const res = NextResponse.json({ 
      user: { 
        id: user.id, 
        username: user.username, 
        role: user.role 
      }, 
      csrfToken 
    });

    // Устанавливаем куки
    res.cookies.set('token', token, { 
      httpOnly: true, 
      path: '/', 
      maxAge: 60 * 60 * 24 * 7, // 7 дней
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    res.cookies.set('csrfSecret', csrfSecret, { httpOnly: false, path: '/', maxAge: 60 * 60 * 24 * 7, secure: true, sameSite: 'lax' });

    return res;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.set('token', '', { 
    httpOnly: true, 
    path: '/', 
    maxAge: 0 
  });
  res.cookies.set('csrfSecret', '', { httpOnly: false, path: '/', maxAge: 0 });
  return res;
} 