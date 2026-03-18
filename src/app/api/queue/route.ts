import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const tasks = await prisma.task.findMany({
    where: { projectId: null, deletedAt: null },
    orderBy: { order: 'asc' },
    select: { id: true, title: true, projectId: true, status: true, order: true },
  });
  return NextResponse.json(tasks);
}
