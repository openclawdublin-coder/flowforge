'use server';

import { hash } from 'bcryptjs';
import crypto from 'node:crypto';
import { addHours } from 'date-fns';
import { prisma } from '@/lib/db';
import { forgotPasswordRequestSchema, passwordResetSchema } from '@/lib/validations/auth';

const RESET_TOKEN_TTL_HOURS = 2;

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function requestPasswordReset(email: string) {
  const parsed = forgotPasswordRequestSchema.parse({ email });
  const user = await prisma.user.findUnique({ where: { email: parsed.email } });

  if (!user) return { ok: true };

  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  const rawToken = crypto.randomBytes(32).toString('hex');
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(rawToken),
      expiresAt: addHours(new Date(), RESET_TOKEN_TTL_HOURS),
    },
  });

  return {
    ok: true,
    resetLink: `/forgot-password?token=${rawToken}`,
    expiresInHours: RESET_TOKEN_TTL_HOURS,
  };
}

export async function resetPassword(input: { token: string; password: string; confirmPassword: string }) {
  const parsed = passwordResetSchema.parse(input);
  const tokenHash = hashToken(parsed.token);

  const token = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!token || token.usedAt || token.expiresAt < new Date()) {
    throw new Error('This reset link is invalid or expired');
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: token.userId },
      data: { passwordHash: await hash(parsed.password, 10) },
    }),
    prisma.passwordResetToken.update({
      where: { id: token.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return { ok: true };
}
