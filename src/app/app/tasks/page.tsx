export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/db';
import { TaskList } from '@/components/tasks/task-list';

export default async function TasksPage() {
  const tasks = await prisma.task.findMany({
    where: {
      status: { not: 'DONE' },
    },
    orderBy: [
      { dueAt: { sort: 'asc', nulls: 'last' } },
      { priority: 'desc' },
    ],
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      dueAt: true,
      project: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true } },
    },
  });

  return <TaskList tasks={tasks} />;
}
