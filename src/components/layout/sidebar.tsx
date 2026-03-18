'use client';
import Link from 'next/link';
import { Home, Inbox, FolderKanban, Columns2, Menu, X, CheckSquare, Trash2 } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

const items = [
  { href: '/app/home', label: 'Home', icon: Home },
  { href: '/app/queue', label: 'Queue', icon: Inbox },
  { href: '/app/projects', label: 'Projects', icon: FolderKanban },
  { href: '/app/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/app/kanban', label: 'Kanban', icon: Columns2 },
  { href: '/app/recycle', label: 'Recycle ♻️', icon: Trash2 },
];

function NavLinks({ onClick }: { onClick?: () => void }) {
  const path = usePathname();
  return (
    <>
      {items.map((i) => {
        const Icon = i.icon;
        return (
          <Link
            key={i.href}
            href={i.href}
            onClick={onClick}
            className={cn(
              'mb-2 flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-white/10',
              path.startsWith(i.href) && 'bg-white/10'
            )}
          >
            <Icon size={16} />
            {i.label}
          </Link>
        );
      })}
    </>
  );
}

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const path = usePathname();

  // Close menu on route change
  useEffect(() => {
    setOpen(false);
  }, [path]);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="fixed left-4 top-4 z-50 rounded-md bg-black/50 p-2 backdrop-blur-sm"
        aria-label={open ? 'Close menu' : 'Open menu'}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60"
            onClick={() => setOpen(false)}
          />
          <aside className="fixed left-0 top-0 z-40 h-full w-64 border-r border-white/10 bg-background p-4 pt-16">
            <NavLinks onClick={() => setOpen(false)} />
          </aside>
        </>
      )}
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden w-64 border-r border-white/10 bg-black/30 p-4 md:block">
      <NavLinks />
    </aside>
  );
}
