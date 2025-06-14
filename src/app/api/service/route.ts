import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from '@/lib/getServerSession';

const prismaClient = new PrismaClient();

export async function GET() {
  const services = await prismaClient.service.findMany({ orderBy: { order: 'asc' } });
  return NextResponse.json({ services });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(req);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
  }
  const data = await req.json();
  const service = await prismaClient.service.create({ data });
  return NextResponse.json(service);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(req);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
  }
  const data = await req.json();
  const { id, ...rest } = data;
  const service = await prismaClient.service.update({ where: { id }, data: rest });
  return NextResponse.json(service);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(req);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
  }
  const data = await req.json();
  await prismaClient.service.delete({ where: { id: data.id } });
  return NextResponse.json({ ok: true });
} 