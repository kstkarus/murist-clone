import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET() {
  const team = await prisma.teamMember.findMany({ orderBy: { order: 'asc' } });
  return NextResponse.json({ team });
}

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 401 });
  }
  const data = await req.json();
  const member = await prisma.teamMember.create({ data });
  return NextResponse.json(member);
}

export async function PUT(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 401 });
  }
  const data = await req.json();
  const { id, ...rest } = data;
  const member = await prisma.teamMember.update({ where: { id }, data: rest });
  return NextResponse.json(member);
}

export async function DELETE(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 401 });
  }
  const data = await req.json();
  await prisma.teamMember.delete({ where: { id: data.id } });
  return NextResponse.json({ ok: true });
} 