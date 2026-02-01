import { PrismaClient } from '../generated/prisma';

/**
 * Prisma 客户端单例
 *
 * 防止在开发环境下热重载时创建多个 PrismaClient 实例，
 * 导致数据库连接池耗尽。
 *
 * 在生产环境中，每次启动都会创建新实例。
 * 在开发环境中，实例会被缓存在 global 对象中。
 */

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  });

// 确保在开发环境下复用实例，避免连接数爆炸

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
