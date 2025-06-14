import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET() {
  const advantages = await prisma.advantage.findMany({ orderBy: { order: 'asc' } });
  return NextResponse.json({ advantages });
}

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 401 });
  }
  const data = await req.json();
  const advantage = await prisma.advantage.create({ data });
  return NextResponse.json(advantage);
}

export async function PUT(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 401 });
  }
  const data = await req.json();
  const { id, ...rest } = data;
  const advantage = await prisma.advantage.update({ where: { id }, data: rest });
  return NextResponse.json(advantage);
}

export async function DELETE(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 401 });
  }
  const data = await req.json();
  await prisma.advantage.delete({ where: { id: data.id } });
  return NextResponse.json({ ok: true });
} 