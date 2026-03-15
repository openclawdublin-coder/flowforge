'use client';
import Link from 'next/link';
import { Home, Inbox, FolderKanban, Columns2 } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const items = [
  { href: '/app/home', label: 'Home', icon: Home },
  { href: '/app/queue', label: 'Queue', icon: Inbox },
  { href: '/app/projects', label: 'Projects', icon: FolderKanban },
  { href: '/app/kanban', label: 'Kanban', icon: Columns2 },
];

export function Sidebar() {
  const path = usePathname();
  return <aside className='hidden w-64 border-r border-white/10 bg-black/30 p-4 md:block'>{items.map(i => {
    const Icon = i.icon;
    return <Link key={i.href} href={i.href} className={cn('mb-2 flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-white/10', path.startsWith(i.href) && 'bg-white/10')}><Icon size={16}/>{i.label}</Link>;
  })}</aside>;
}
