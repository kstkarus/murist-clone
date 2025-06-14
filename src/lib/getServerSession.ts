import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export async function getServerSession(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    
    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    return decoded;
  } catch (error) {
    return null;
  }
} 