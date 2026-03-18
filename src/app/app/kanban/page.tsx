export const dynamic = "force-dynamic";
import { prisma } from '@/lib/db';
import { startOfDay, endOfDay, addDays } from 'date-fns';

export default async function KanbanPage() {
  const tasks = await prisma.task.findMany({ where: { deletedAt: null }, include: { project: true }, orderBy: { order: 'asc' } });
  const today = new Date();
  const todayTasks = tasks.filter(t=>t.dueAt && t.dueAt >= startOfDay(today) && t.dueAt <= endOfDay(today));
  const upcoming = tasks.filter(t=>t.dueAt && t.dueAt > endOfDay(today) && t.dueAt <= addDays(today, 7));
  const cols = ['BACKLOG','TODO','IN_PROGRESS','REVIEW','DONE'] as const;

  return <div>
    <h1 className='mb-4 text-2xl font-semibold'>Global Kanban</h1>
    <div className='mb-6 grid gap-3 lg:grid-cols-5'>{cols.map(c => <div key={c} className='rounded-lg border border-white/10 p-3'><h3 className='mb-2 text-sm font-medium'>{c}</h3>{tasks.filter(t=>t.status===c).map(t=><div key={t.id} className='mb-2 rounded bg-white/5 p-2 text-sm'>{t.title}<div className='text-xs text-white/60'>{t.project?.key ?? 'Unassigned'} · {t.priority}</div></div>)}</div>)}</div>
    <section className='grid gap-4 md:grid-cols-2'><div><h2 className='mb-2 font-semibold'>Today</h2>{todayTasks.map(t=><div key={t.id} className='mb-2 rounded border border-white/10 p-2 text-sm'>{t.title}</div>)}</div><div><h2 className='mb-2 font-semibold'>Upcoming</h2>{upcoming.map(t=><div key={t.id} className='mb-2 rounded border border-white/10 p-2 text-sm'>{t.title}</div>)}</div></section>
  </div>;
}
