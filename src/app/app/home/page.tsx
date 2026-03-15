export const dynamic = "force-dynamic";
import { prisma } from '@/lib/db';
import { Card } from '@/components/ui/card';

export default async function HomePage() {
  const [projects, tasks, done] = await Promise.all([
    prisma.project.count(), prisma.task.count(), prisma.task.count({ where: { status: 'DONE' } }),
  ]);
  return <div className='grid gap-4 md:grid-cols-3'>{[
    ['Projects', projects], ['Tasks', tasks], ['Completed', done],
  ].map(([k,v]) => <Card key={String(k)} className='p-4'><p className='text-sm text-white/70'>{k}</p><p className='text-3xl font-semibold'>{String(v)}</p></Card>)}</div>;
}
