import { PrismaClient } from '../generated/prisma'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma 