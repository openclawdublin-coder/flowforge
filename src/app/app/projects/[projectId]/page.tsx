export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { ProjectDetail } from '@/components/projects/project-detail';

export default async function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const project = await prisma.project.findUnique({
    where: { id: projectId, deletedAt: null },
    include: {
      tasks: {
        where: { deletedAt: null },
        include: {
          comments: {
            include: { author: { select: { name: true, email: true } } },
            orderBy: { createdAt: 'asc' },
          },
          activities: { orderBy: { createdAt: 'desc' } },
        },
        orderBy: { updatedAt: 'desc' },
      },
    },
  });

  if (!project) return notFound();

  return (
    <ProjectDetail
      project={{
        ...project,
        tasks: project.tasks.map((task) => ({
          ...task,
          comments: task.comments.map((comment) => ({ ...comment, createdAt: comment.createdAt.toISOString() })),
          activities: task.activities.map((activity) => ({ ...activity, createdAt: activity.createdAt.toISOString() })),
        })),
      }}
    />
  );
}
