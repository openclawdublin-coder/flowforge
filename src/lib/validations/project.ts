import { Priority, ProjectStatus, TaskStatus } from '@prisma/client';
import { z } from 'zod';

export const projectSchema = z.object({
  name: z.string().trim().min(2).max(80),
  key: z
    .string()
    .trim()
    .min(2)
    .max(8)
    .regex(/^[a-zA-Z][a-zA-Z0-9_-]*$/, 'Key must start with a letter and contain only letters, numbers, hyphens, or underscores'),
  description: z.string().trim().max(500).optional().or(z.literal('')),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  status: z.nativeEnum(ProjectStatus),
  priority: z.nativeEnum(Priority),
});

export const columnSchema = z.object({
  projectId: z.string().cuid(),
  name: z.string().trim().min(2).max(40),
  status: z.nativeEnum(TaskStatus),
});
