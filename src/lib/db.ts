import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

declare global { var prisma: PrismaClient | undefined; }

function createPrisma() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is required');
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter, log: ['error'] });
}

export const prisma = global.prisma ?? createPrisma();
if (process.env.NODE_ENV !== 'production') global.prisma = prisma;
