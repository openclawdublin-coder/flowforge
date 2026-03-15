export const dynamic = "force-dynamic";
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const projects = await prisma.project.findMany({ where: q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { key: { contains: q, mode: 'insensitive' } }] } : {}, include: { _count: { select: { tasks: true, members: true } } }, orderBy: { updatedAt: 'desc' } });
  return <div>
    <div className='mb-4 flex items-center justify-between'><h1 className='text-2xl font-semibold'>Projects</h1><Link className='rounded-md bg-primary px-4 py-2 text-sm text-white' href='/app/projects/new'>New project</Link></div>
    <form className='mb-4'><input name='q' placeholder='Search projects...' className='h-10 w-full rounded-md border border-white/10 bg-black/20 px-3' defaultValue={q}/></form>
    <div className='grid gap-3 md:grid-cols-2'>{projects.map(p => <Link key={p.id} href={`/app/projects/${p.id}`}><Card className='p-4'><div className='flex items-center justify-between'><h3 className='font-medium'>{p.name}</h3><Badge>{p.key}</Badge></div><p className='mt-2 text-sm text-white/70'>{p.description}</p><p className='mt-3 text-xs text-white/60'>{p._count.tasks} tasks · {p._count.members} members</p></Card></Link>)}</div>
  </div>;
}
