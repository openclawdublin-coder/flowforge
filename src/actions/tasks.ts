'use server';

import { Priority, TaskStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  bulkQueueAssignSchema,
  commentCreateSchema,
  queueQuickAddSchema,
  reorderTaskSchema,
  taskSchema,
} from '@/lib/validations/task';

function parseMentions(content: string) {
  const mentions = [...content.matchAll(/@([a-zA-Z0-9._-]{2,30})/g)].map((m) => m[1].toLowerCase());
  return Array.from(new Set(mentions));
}

export async function quickAddTask(title: string) {
  const parsed = queueQuickAddSchema.parse({ title });
  const task = await prisma.task.create({
    data: {
      title: parsed.title,
      status: TaskStatus.BACKLOG,
      priority: Priority.MEDIUM,
      order: (await prisma.task.count({ where: { projectId: null } })) + 1,
    },
  });

  await prisma.activityLog.create({
    data: {
      taskId: task.id,
      action: 'TASK_CREATED_IN_QUEUE',
      meta: { source: 'queue-quick-add' },
    },
  });

  revalidatePath('/app/queue');
  revalidatePath('/app/kanban');
}

export async function createTask(input: {
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  projectId?: string | null;
  assigneeId?: string | null;
}) {
  const parsed = taskSchema.parse(input);

  const task = await prisma.task.create({
    data: {
      title: parsed.title,
      description: parsed.description || null,
      priority: parsed.priority,
      status: parsed.status,
      projectId: parsed.projectId || null,
      assigneeId: parsed.assigneeId || null,
      order:
        (await prisma.task.count({
          where: { projectId: parsed.projectId || null, status: parsed.status },
        })) + 1,
    },
  });

  await prisma.activityLog.create({
    data: {
      taskId: task.id,
      action: 'TASK_CREATED',
      meta: {
        projectId: parsed.projectId || null,
        status: parsed.status,
      },
    },
  });

  revalidatePath('/app/queue');
  revalidatePath('/app/kanban');
  if (parsed.projectId) revalidatePath(`/app/projects/${parsed.projectId}`);
}

export async function updateTask(taskId: string, input: Omit<Parameters<typeof createTask>[0], 'projectId'> & { projectId?: string | null }) {
  const parsed = taskSchema.parse(input);

  const prev = await prisma.task.findUnique({ where: { id: taskId } });
  if (!prev) throw new Error('Task not found');

  await prisma.task.update({
    where: { id: taskId },
    data: {
      title: parsed.title,
      description: parsed.description || null,
      priority: parsed.priority,
      status: parsed.status,
      projectId: parsed.projectId || null,
      assigneeId: parsed.assigneeId || null,
    },
  });

  await prisma.activityLog.create({
    data: {
      taskId,
      action: 'TASK_UPDATED',
      meta: {
        from: { status: prev.status, priority: prev.priority, projectId: prev.projectId },
        to: { status: parsed.status, priority: parsed.priority, projectId: parsed.projectId || null },
      },
    },
  });

  revalidatePath('/app/queue');
  revalidatePath('/app/kanban');
  revalidatePath('/app/tasks');
  if (prev.projectId) revalidatePath(`/app/projects/${prev.projectId}`);
  if (parsed.projectId) revalidatePath(`/app/projects/${parsed.projectId}`);
}

export async function reorderTask(input: { taskId: string; toStatus: TaskStatus; toOrder: number }) {
  const parsed = reorderTaskSchema.parse(input);

  const task = await prisma.task.findUnique({ where: { id: parsed.taskId } });
  if (!task) throw new Error('Task not found');

  await prisma.$transaction(async (tx) => {
    await tx.task.updateMany({
      where: {
        id: { not: task.id },
        projectId: task.projectId,
        status: parsed.toStatus,
        order: { gte: parsed.toOrder },
      },
      data: { order: { increment: 1 } },
    });

    await tx.task.update({
      where: { id: task.id },
      data: { status: parsed.toStatus, order: parsed.toOrder },
    });

    await tx.activityLog.create({
      data: {
        taskId: task.id,
        action: 'TASK_REORDERED',
        meta: {
          fromStatus: task.status,
          toStatus: parsed.toStatus,
          toOrder: parsed.toOrder,
        },
      },
    });
  });

  revalidatePath('/app/queue');
  revalidatePath('/app/kanban');
  if (task.projectId) revalidatePath(`/app/projects/${task.projectId}`);
}

export async function bulkAssignQueueTasks(input: {
  taskIds: string[];
  projectId?: string | null;
  assigneeId?: string | null;
}) {
  const parsed = bulkQueueAssignSchema.parse(input);

  await prisma.$transaction(async (tx) => {
    await tx.task.updateMany({
      where: { id: { in: parsed.taskIds } },
      data: {
        projectId: parsed.projectId || null,
        assigneeId: parsed.assigneeId || null,
      },
    });

    await tx.activityLog.createMany({
      data: parsed.taskIds.map((taskId) => ({
        taskId,
        action: 'QUEUE_BULK_ASSIGN',
        meta: {
          projectId: parsed.projectId || null,
          assigneeId: parsed.assigneeId || null,
        },
      })),
    });
  });

  revalidatePath('/app/queue');
  revalidatePath('/app/kanban');
  if (parsed.projectId) revalidatePath(`/app/projects/${parsed.projectId}`);
}

export async function addTaskComment(input: { taskId: string; content: string; parentId?: string | null }) {
  const session = await auth();
  if (!session?.user?.email) throw new Error('Unauthorized');

  const parsed = commentCreateSchema.parse(input);
  const author = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!author) throw new Error('Author not found');

  const comment = await prisma.comment.create({
    data: {
      taskId: parsed.taskId,
      authorId: author.id,
      content: parsed.content,
      parentId: parsed.parentId || null,
    },
  });

  const mentions = parseMentions(parsed.content);

  await prisma.activityLog.create({
    data: {
      taskId: parsed.taskId,
      action: parsed.parentId ? 'TASK_COMMENT_REPLY' : 'TASK_COMMENT_ADDED',
      meta: {
        commentId: comment.id,
        parentId: parsed.parentId || null,
        mentions,
        preview: parsed.content.slice(0, 120),
      },
    },
  });

  const task = await prisma.task.findUnique({ where: { id: parsed.taskId }, select: { projectId: true } });
  revalidatePath('/app/queue');
  revalidatePath('/app/kanban');
  if (task?.projectId) revalidatePath(`/app/projects/${task.projectId}`);
}
