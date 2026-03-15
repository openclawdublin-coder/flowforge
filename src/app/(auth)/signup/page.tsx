import { hash } from 'bcryptjs';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function SignupPage() {
  return <div className='mx-auto mt-24 max-w-md rounded-2xl glass p-6'>
    <h1 className='mb-4 text-2xl font-semibold'>Create account</h1>
    <form action={async (fd)=>{ 'use server'; await prisma.user.create({ data: { name: String(fd.get('name')), email: String(fd.get('email')), passwordHash: await hash(String(fd.get('password')), 10) }}); redirect('/login'); }} className='space-y-3'>
      <Input name='name' placeholder='Name' required/><Input name='email' type='email' placeholder='Email' required/><Input name='password' type='password' placeholder='Password' required/>
      <Button className='w-full'>Sign up</Button>
    </form></div>;
}
