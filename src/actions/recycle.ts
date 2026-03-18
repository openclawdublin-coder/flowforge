'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';

const RETENTION_DAYS = 30;

function expiryDate() {
  const d = new Date();
  d.setDate(d.getDate() - RETENTION_DAYS);
  return d;
}

export async function getRecycledItems() {
  const cutoff = expiryDate();

  const [tasks, projects] = await Promise.all([
    prisma.task.findMany({
      where: { deletedAt: { not: null, gte: cutoff } },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        deletedAt: true,
        project: { select: { id: true, name: true } },
      },
      orderBy: { deletedAt: 'desc' },
    }),
    prisma.project.findMany({
      where: { deletedAt: { not: null, gte: cutoff } },
      select: {
        id: true,
        name: true,
        key: true,
        status: true,
        deletedAt: true,
        _count: { select: { tasks: { where: { deletedAt: { not: null } } } } },
      },
      orderBy: { deletedAt: 'desc' },
    }),
  ]);

  return { tasks, projects };
}

export async function purgeExpiredItems() {
  const cutoff = expiryDate();

  await prisma.$transaction([
    prisma.task.deleteMany({ where: { deletedAt: { not: null, lt: cutoff } } }),
    prisma.project.deleteMany({ where: { deletedAt: { not: null, lt: cutoff } } }),
  ]);
}

export async function restoreTask(taskId: string) {
  await prisma.task.update({ where: { id: taskId }, data: { deletedAt: null } });

  revalidatePath('/app/recycle');
  revalidatePath('/app/tasks');
  revalidatePath('/app/kanban');
  revalidatePath('/app/queue');
}

export async function restoreProject(projectId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || !project.deletedAt) throw new Error('Project not found in recycle bin');

  await prisma.$transaction([
    prisma.task.updateMany({
      where: { projectId, deletedAt: project.deletedAt },
      data: { deletedAt: null },
    }),
    prisma.project.update({ where: { id: projectId }, data: { deletedAt: null } }),
  ]);

  revalidatePath('/app/recycle');
  revalidatePath('/app/projects');
  revalidatePath('/app/tasks');
  revalidatePath('/app/kanban');
  revalidatePath('/app/queue');
}

export async function permanentDeleteTask(taskId: string) {
  await prisma.task.delete({ where: { id: taskId } });

  revalidatePath('/app/recycle');
}

export async function permanentDeleteProject(projectId: string) {
  await prisma.$transaction([
    prisma.task.deleteMany({ where: { projectId } }),
    prisma.project.delete({ where: { id: projectId } }),
  ]);

  revalidatePath('/app/recycle');
}

export async function emptyRecycleBin() {
  await prisma.$transaction([
    prisma.task.deleteMany({ where: { deletedAt: { not: null } } }),
    prisma.project.deleteMany({ where: { deletedAt: { not: null } } }),
  ]);

  revalidatePath('/app/recycle');
}
