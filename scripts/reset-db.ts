import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

/**
 * Render 部署兜底脚本：当 prisma migrate deploy 失败时，
 * 直接用 schema 重建数据库表结构。
 */
async function main() {
  console.log('开始重置数据库 schema...');

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const tables = ['chat_messages', 'agents', 'users'];

  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "${table}" CASCADE;`);
      console.log(`  ✓ 已删除表 ${table}`);
    } catch (err) {
      console.log(`  - 跳过表 ${table}: ${(err as Error).message}`);
    }
  }

  // 同时清理 _prisma_migrations 表
  try {
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "_prisma_migrations" CASCADE;`);
    console.log('  ✓ 已删除 _prisma_migrations');
  } catch (err) {
    console.log(`  - 跳过 _prisma_migrations: ${(err as Error).message}`);
  }

  console.log('数据库 schema 已重置，请重新执行 migrate deploy');
  await prisma.$disconnect();
  await pool.end();
}

main().catch((err) => {
  console.error('重置失败:', err);
  process.exit(1);
});
