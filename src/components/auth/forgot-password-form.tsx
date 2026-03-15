'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { requestPasswordReset, resetPassword } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { forgotPasswordRequestSchema, passwordResetSchema } from '@/lib/validations/auth';
import { z } from 'zod';

export function ForgotPasswordForm({ token }: { token?: string }) {
  const [isPending, startTransition] = useTransition();
  const requestForm = useForm<z.infer<typeof forgotPasswordRequestSchema>>({
    resolver: zodResolver(forgotPasswordRequestSchema),
    defaultValues: { email: '' },
  });

  const resetForm = useForm<z.infer<typeof passwordResetSchema>>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: { token: token ?? '', password: '', confirmPassword: '' },
  });

  if (token) {
    return (
      <form
        onSubmit={resetForm.handleSubmit((values) =>
          startTransition(async () => {
            await resetPassword(values);
            toast.success('Password reset successful');
            window.location.href = '/login';
          }),
        )}
        className='space-y-3'
      >
        <Input {...resetForm.register('password')} type='password' placeholder='New password' />
        <Input {...resetForm.register('confirmPassword')} type='password' placeholder='Confirm new password' />
        <Button className='w-full' disabled={isPending}>{isPending ? 'Saving...' : 'Reset password'}</Button>
      </form>
    );
  }

  return (
    <form
      onSubmit={requestForm.handleSubmit((values) =>
        startTransition(async () => {
          const result = await requestPasswordReset(values.email);
          toast.success('If your account exists, reset link is ready.');
          if ('resetLink' in result && result.resetLink) {
            toast.message(`Demo reset link: ${window.location.origin}${result.resetLink}`);
          }
        }),
      )}
      className='space-y-3'
    >
      <Input {...requestForm.register('email')} placeholder='Email' type='email' />
      <Button className='w-full' disabled={isPending}>{isPending ? 'Sending...' : 'Send reset link'}</Button>
    </form>
  );
}
