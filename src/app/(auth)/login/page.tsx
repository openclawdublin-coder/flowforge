import Link from 'next/link';
import { signIn } from '@/lib/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  return <div className='mx-auto mt-24 max-w-md rounded-2xl glass p-6'>
    <h1 className='mb-4 text-2xl font-semibold'>Welcome back</h1>
    <form action={async (fd)=>{'use server'; await signIn('credentials', { email: fd.get('email'), password: fd.get('password'), redirectTo: '/app/home' });}} className='space-y-3'>
      <Input name='email' placeholder='Email' type='email' required />
      <Input name='password' placeholder='Password' type='password' required />
      <Button className='w-full'>Log in</Button>
    </form>
    <form action={async ()=>{'use server'; await signIn('google', { redirectTo: '/app/home' });}}><Button variant='outline' className='mt-3 w-full'>Continue with Google</Button></form>
    <p className='mt-3 text-sm text-white/70'>No account? <Link href='/signup' className='underline'>Sign up</Link> · <Link href='/forgot-password' className='underline'>Forgot</Link></p>
  </div>;
}
