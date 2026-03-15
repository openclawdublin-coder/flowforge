import { Sidebar, MobileNav } from './sidebar';
import { Toaster } from 'sonner';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className='min-h-screen bg-background text-foreground'>
      <MobileNav />
      <div className='flex'>
        <Sidebar />
        <main className='flex-1 p-4 pt-16 md:p-8 md:pt-8'>{children}</main>
      </div>
      <Toaster richColors position='top-right' />
    </div>
  );
}
