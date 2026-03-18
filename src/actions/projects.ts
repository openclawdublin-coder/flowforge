'use server';

import { Priority, ProjectStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { columnSchema, projectSchema } from '@/lib/validations/project';

export async function deleteProject(projectId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error('Project not found');

  const now = new Date();

  await prisma.$transaction([
    prisma.task.updateMany({ where: { projectId, deletedAt: null }, data: { deletedAt: now } }),
    prisma.project.update({ where: { id: projectId }, data: { deletedAt: now } }),
  ]);

  revalidatePath('/app/projects');
  revalidatePath('/app/tasks');
  revalidatePath('/app/kanban');
  revalidatePath('/app/queue');
  revalidatePath('/app/recycle');
}

export async function createProject(input: {
  name: string;
  key: string;
  description?: string;
  color?: string;
  status?: ProjectStatus;
  priority?: Priority;
}): Promise<{ error?: string }> {
  const result = projectSchema.safeParse({
    ...input,
    color: input.color ?? '#22c55e',
    status: input.status ?? ProjectStatus.PLANNING,
    priority: input.priority ?? Priority.MEDIUM,
  });

  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? 'Invalid input' };
  }

  try {
    await prisma.project.create({
      data: {
        name: result.data.name,
        key: result.data.key.toUpperCase(),
        description: result.data.description || null,
        color: result.data.color,
        status: result.data.status,
        priority: result.data.priority,
      },
    });
  } catch (err) {
    if (
      err instanceof Error &&
      err.message.includes('Unique constraint')
    ) {
      return { error: 'A project with this key already exists' };
    }
    return { error: 'Failed to create project' };
  }

  revalidatePath('/app/projects');
  return {};
}

export async function updateProject(
  projectId: string,
  input: {
    name: string;
    key: string;
    description?: string;
    color?: string;
    status?: ProjectStatus;
    priority?: Priority;
  },
) {
  const parsed = projectSchema.parse({
    ...input,
    color: input.color ?? '#22c55e',
    status: input.status ?? ProjectStatus.PLANNING,
    priority: input.priority ?? Priority.MEDIUM,
  });

  await prisma.project.update({
    where: { id: projectId },
    data: {
      name: parsed.name,
      key: parsed.key.toUpperCase(),
      description: parsed.description || null,
      color: parsed.color,
      status: parsed.status,
      priority: parsed.priority,
    },
  });

  revalidatePath(`/app/projects/${projectId}`);
  revalidatePath('/app/projects');
}

export async function createKanbanColumn(input: {
  projectId: string;
  name: string;
  status: string;
}) {
  const parsed = columnSchema.parse(input);

  const lastColumn = await prisma.kanbanColumn.findFirst({
    where: { projectId: parsed.projectId },
    orderBy: { position: 'desc' },
  });

  await prisma.kanbanColumn.create({
    data: {
      projectId: parsed.projectId,
      name: parsed.name,
      status: parsed.status,
      position: (lastColumn?.position ?? -1) + 1,
    },
  });

  revalidatePath(`/app/projects/${parsed.projectId}`);
  revalidatePath('/app/kanban');
}
