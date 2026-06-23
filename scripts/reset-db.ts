import 'dotenv/config';
import { prisma } from '../api/lib/prisma';

/**
 * Render 部署兜底脚本：当 prisma migrate deploy 失败时，
 * 直接用 schema 重建数据库表结构。
 */
async function main() {
  console.log('开始重置数据库 schema...');

  const tables = ['chat_messages', 'agents', 'users'];

  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "${table}" CASCADE;`);
      console.log(`  ✓ 已删除表 ${table}`);
    } catch (err) {
      console.log(`  - 跳过表 ${table}: ${(err as Error).message}`);
    }
  }

  console.log('数据库 schema 已重置，请重新执行 migrate deploy');
}

main()
  .catch((err) => {
    console.error('重置失败:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
