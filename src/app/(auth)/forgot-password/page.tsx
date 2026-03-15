import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className='mx-auto mt-24 max-w-md rounded-2xl glass p-6'>
      <h1 className='mb-2 text-xl font-semibold'>{token ? 'Reset your password' : 'Forgot password'}</h1>
      <p className='mb-4 text-sm text-white/70'>
        {token
          ? 'Create a new secure password. This link expires automatically.'
          : 'Enter your email and we will generate a secure reset link.'}
      </p>
      <ForgotPasswordForm token={token} />
    </div>
  );
}
