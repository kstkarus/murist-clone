import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET() {
  const services = await prisma.service.findMany({ orderBy: { order: 'asc' } });
  return NextResponse.json({ services });
}

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 401 });
  }
  const data = await req.json();
  const service = await prisma.service.create({ data });
  return NextResponse.json(service);
}

export async function PUT(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 401 });
  }
  const data = await req.json();
  const { id, ...rest } = data;
  const numId = Number(id);
  if (!numId || isNaN(numId) || numId <= 0) {
    return NextResponse.json({ error: 'Некорректный id' }, { status: 400 });
  }
  const service = await prisma.service.update({ where: { id: numId }, data: rest });
  return NextResponse.json(service);
}

export async function DELETE(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 401 });
  }
  const data = await req.json();
  const numId = Number(data.id);
  if (!numId || isNaN(numId) || numId <= 0) {
    return NextResponse.json({ error: 'Некорректный id' }, { status: 400 });
  }
  await prisma.service.delete({ where: { id: numId } });
  return NextResponse.json({ ok: true });
} 