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
  const service = await prisma.service.update({ where: { id }, data: rest });
  return NextResponse.json(service);
}

export async function DELETE(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 401 });
  }
  const data = await req.json();
  await prisma.service.delete({ where: { id: data.id } });
  return NextResponse.json({ ok: true });
} 