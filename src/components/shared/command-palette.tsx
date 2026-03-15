'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') setOpen(v => !v);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') router.push('/app/projects/new');
    };
    window.addEventListener('keydown', fn); return () => window.removeEventListener('keydown', fn);
  }, [router]);
  if (!open) return null;
  return <div className='fixed inset-0 z-50 grid place-items-center bg-black/60' onClick={() => setOpen(false)}><div className='w-full max-w-lg rounded-xl border border-white/10 bg-neutral-900 p-4'>Cmd/Ctrl+N to create project</div></div>;
}
