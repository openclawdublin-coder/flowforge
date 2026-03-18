export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/db';
import { TaskList } from '@/components/tasks/task-list';

export default async function TasksPage() {
  const [tasks, projects, users] = await Promise.all([
    prisma.task.findMany({
      where: {
        status: { not: 'DONE' },
        deletedAt: null,
      },
      orderBy: [
        { dueAt: { sort: 'asc', nulls: 'last' } },
        { priority: 'desc' },
      ],
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueAt: true,
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
    }),
    prisma.project.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.user.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return <TaskList tasks={tasks} projects={projects} users={users} />;
}
