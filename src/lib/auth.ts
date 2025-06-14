import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not set');
const JWT_SECRET = process.env.JWT_SECRET;

export interface User {
  id: string;
  username: string;
  role: string;
}

export function getUserFromRequest(req: NextRequest): User | null {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;
  
  try {
    return jwt.verify(token, JWT_SECRET) as User;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

export function isAdmin(user: User | null): boolean {
  return user?.role === 'admin';
} 