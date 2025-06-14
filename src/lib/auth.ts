import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not set');
const JWT_SECRET = process.env.JWT_SECRET;

export function getUserFromRequest(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; username: string; role: string };
  } catch {
    return null;
  }
} 