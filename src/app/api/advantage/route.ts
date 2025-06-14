import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from '@/lib/getServerSession';

const prismaClient = new PrismaClient();

export async function GET() {
  const advantages = await prismaClient.advantage.findMany({ orderBy: { order: 'asc' } });
  return NextResponse.json({ advantages });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(req);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
  }
  const data = await req.json();
  const advantage = await prismaClient.advantage.create({ data });
  return NextResponse.json(advantage);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(req);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
  }
  const data = await req.json();
  const { id, ...rest } = data;
  const advantage = await prismaClient.advantage.update({ where: { id }, data: rest });
  return NextResponse.json(advantage);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(req);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
  }
  const data = await req.json();
  await prismaClient.advantage.delete({ where: { id: data.id } });
  return NextResponse.json({ ok: true });
} 