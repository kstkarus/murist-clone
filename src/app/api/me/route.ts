import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not set');
const JWT_SECRET = process.env.JWT_SECRET;

export async function GET(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return NextResponse.json({ authorized: false }, { status: 401 });
  
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: string; username: string; role: string };
    
    // Проверяем существование пользователя в базе данных только при первоначальной проверке
    const user = await prisma.user.findUnique({
      where: { id: payload.id }
    });

    if (!user) {
      // Если пользователь не найден, очищаем токен
      const res = NextResponse.json({ authorized: false }, { status: 401 });
      res.cookies.set('token', '', { httpOnly: true, path: '/', maxAge: 0 });
      return res;
    }

    return NextResponse.json({ 
      authorized: true, 
      user: { 
        id: user.id, 
        username: user.username, 
        role: user.role 
      } 
    });
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('JWT VERIFY ERROR:', e);
    }
    const res = NextResponse.json({ authorized: false }, { status: 401 });
    res.cookies.set('token', '', { httpOnly: true, path: '/', maxAge: 0 });
    return res;
  }
} 