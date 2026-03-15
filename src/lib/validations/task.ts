import { Priority, TaskStatus } from '@prisma/client';
import { z } from 'zod';

export const taskSchema = z.object({
  title: z.string().trim().min(2),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  priority: z.nativeEnum(Priority),
  status: z.nativeEnum(TaskStatus),
  projectId: z.string().cuid().optional().nullable(),
  assigneeId: z.string().cuid().optional().nullable(),
});

export const queueQuickAddSchema = z.object({
  title: z.string().trim().min(2).max(120),
});

export const reorderTaskSchema = z.object({
  taskId: z.string().cuid(),
  toStatus: z.nativeEnum(TaskStatus),
  toOrder: z.number().int().min(0),
});

export const bulkQueueAssignSchema = z.object({
  taskIds: z.array(z.string().cuid()).min(1),
  projectId: z.string().cuid().nullable().optional(),
  assigneeId: z.string().cuid().nullable().optional(),
});

export const commentCreateSchema = z.object({
  taskId: z.string().cuid(),
  content: z.string().trim().min(1).max(2000),
  parentId: z.string().cuid().optional().nullable(),
});
