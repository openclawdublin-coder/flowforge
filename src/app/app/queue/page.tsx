export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/db';
import { QueueBoard } from '@/components/queue/queue-board';

export default async function QueuePage() {
  const [tasks, projects, users] = await Promise.all([
    prisma.task.findMany({
      where: { projectId: null, deletedAt: null },
      orderBy: { order: 'asc' },
      select: { id: true, title: true, projectId: true, status: true, order: true },
    }),
    prisma.project.findMany({ where: { deletedAt: null }, select: { id: true, name: true }, orderBy: { updatedAt: 'desc' } }),
    prisma.user.findMany({
      where: { name: { not: null } },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <QueueBoard
      initialTasks={tasks}
      projects={projects}
      users={users.map((u) => ({ id: u.id, name: u.name ?? 'Unknown' }))}
    />
  );
}
