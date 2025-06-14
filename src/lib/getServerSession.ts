import { getToken } from '@auth/core/jwt';
import { NextRequest } from 'next/server';

export async function getServerSession(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  return token;
} 