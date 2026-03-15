import 'dotenv/config';
import { PrismaClient, Priority, ProjectStatus, Role, TaskStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcryptjs';
import { addDays, addHours } from 'date-fns';

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error('DIRECT_URL or DATABASE_URL is required');
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.activityLog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.subtask.deleteMany();
  await prisma.taskLabel.deleteMany();
  await prisma.task.deleteMany();
  await prisma.label.deleteMany();
  await prisma.kanbanColumn.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  const pwd = await hash('Password123!', 10);
  const [owner, alex, rina] = await Promise.all([
    prisma.user.create({ data: { name: 'Gopinath', email: 'owner@flowforge.dev', passwordHash: pwd } }),
    prisma.user.create({ data: { name: 'Alex Chen', email: 'alex@flowforge.dev', passwordHash: pwd } }),
    prisma.user.create({ data: { name: 'Rina Park', email: 'rina@flowforge.dev', passwordHash: pwd } }),
  ]);

  const labels = await Promise.all([
    prisma.label.create({ data: { name: 'frontend', color: '#60a5fa' } }),
    prisma.label.create({ data: { name: 'backend', color: '#34d399' } }),
    prisma.label.create({ data: { name: 'design', color: '#f472b6' } }),
  ]);

  const project = await prisma.project.create({
    data: {
      name: 'FlowForge Launch', key: 'FLW', description: 'Ship production MVP', status: ProjectStatus.ACTIVE, priority: Priority.HIGH, color: '#22c55e',
      members: { create: [{ userId: owner.id, role: Role.OWNER }, { userId: alex.id }, { userId: rina.id }] },
      columns: { create: [
        { name: 'Backlog', status: TaskStatus.BACKLOG, position: 0 },
        { name: 'Todo', status: TaskStatus.TODO, position: 1 },
        { name: 'In Progress', status: TaskStatus.IN_PROGRESS, position: 2 },
        { name: 'Review', status: TaskStatus.REVIEW, position: 3 },
        { name: 'Done', status: TaskStatus.DONE, position: 4 },
      ] },
    },
  });

  const task = await prisma.task.create({
    data: {
      projectId: project.id,
      title: 'Implement queue drag & drop',
      description: 'Support dragging unassigned tasks into projects',
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      assigneeId: alex.id,
      reporterId: owner.id,
      dueAt: addDays(new Date(), 2),
      estimatedHours: 8,
      actualHours: 3,
      order: 1,
      labels: { create: [{ labelId: labels[0].id }, { labelId: labels[1].id }] },
      subtasks: { create: [{ title: 'Build queue list' }, { title: 'Hook dnd-kit drop handler', done: true }] },
      attachments: { create: [{ name: 'Spec doc', url: 'https://example.com/spec' }] },
      comments: {
        create: [
          { authorId: owner.id, content: 'Need @alex update before EOD.' },
          { authorId: alex.id, content: 'On it, finishing reorder edge cases.' },
        ],
      },
      activities: { create: [{ action: 'Task created' }, { action: 'Status changed to IN_PROGRESS', createdAt: addHours(new Date(), -2) }] },
    },
  });

  await prisma.task.createMany({
    data: [
      { title: 'Glass UI polish', projectId: project.id, status: TaskStatus.TODO, priority: Priority.MEDIUM, assigneeId: rina.id, reporterId: owner.id, dueAt: addDays(new Date(), 1), order: 2 },
      { title: 'Neon production DB setup', status: TaskStatus.BACKLOG, priority: Priority.URGENT, reporterId: owner.id, dueAt: addDays(new Date(), 3), order: 1 },
      { title: 'Create onboarding tour', projectId: project.id, status: TaskStatus.REVIEW, priority: Priority.LOW, assigneeId: rina.id, reporterId: alex.id, dueAt: addDays(new Date(), 4), order: 3 },
    ],
  });

  console.log('Seed complete', { project: project.name, sampleTask: task.title });
}

main().finally(() => prisma.$disconnect());
