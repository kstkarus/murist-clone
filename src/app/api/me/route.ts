import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not set');
const JWT_SECRET = process.env.JWT_SECRET;

export async function GET(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return NextResponse.json({ authorized: false }, { status: 401 });
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: string; username: string; role: string };
    return NextResponse.json({ authorized: true, user: { id: payload.id, username: payload.username, role: payload.role } });
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('JWT VERIFY ERROR:', e);
    }
    return NextResponse.json({ authorized: false }, { status: 401 });
  }
} 