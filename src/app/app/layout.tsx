import { redirect } from 'next/navigation';
import { auth, signOut } from '@/lib/auth';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  return <AppShell><div className='mb-4 flex items-center justify-end'><form action={async()=>{'use server'; await signOut({redirectTo:'/login'});}}><Button variant='ghost'>Logout</Button></form></div>{children}</AppShell>;
}
