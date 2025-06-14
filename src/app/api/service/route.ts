import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET() {
  const services = await prisma.service.findMany({ orderBy: { order: 'asc' } });
  return NextResponse.json({ services });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
  }
  const data = await req.json();
  const service = await prisma.service.create({ data });
  return NextResponse.json(service);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
  }
  const data = await req.json();
  const { id, ...rest } = data;
  const service = await prisma.service.update({ where: { id }, data: rest });
  return NextResponse.json(service);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
  }
  const data = await req.json();
  await prisma.service.delete({ where: { id: data.id } });
  return NextResponse.json({ ok: true });
} 