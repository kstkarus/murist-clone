import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET() {
  const team = await prisma.teamMember.findMany({ orderBy: { order: 'asc' } });
  return NextResponse.json({ team });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
  }
  const data = await req.json();
  const member = await prisma.teamMember.create({ data });
  return NextResponse.json(member);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
  }
  const data = await req.json();
  const { id, ...rest } = data;
  const member = await prisma.teamMember.update({ where: { id }, data: rest });
  return NextResponse.json(member);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
  }
  const data = await req.json();
  await prisma.teamMember.delete({ where: { id: data.id } });
  return NextResponse.json({ ok: true });
} 