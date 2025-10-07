import { PrismaClient } from '@prisma/client';

// Adiciona `prisma` ao escopo global do NodeJS para evitar múltiplas instâncias
// durante o hot-reloading em desenvolvimento.
declare global {
  var prisma: PrismaClient | undefined
}

// FIX: Replace `global` with `globalThis` to resolve "Cannot find name 'global'" error.
export const prisma = globalThis.prisma || new PrismaClient()

// FIX: Replace `global` with `globalThis` to resolve "Cannot find name 'global'" error.
if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma