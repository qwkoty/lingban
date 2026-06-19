import { PrismaClient } from '../../generated/prisma/client.ts'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const isProduction = process.env.NODE_ENV === 'production'

// 生产环境（Koyeb / Render 等托管 PostgreSQL）通常强制 SSL，
// 本地开发可保持不启用以避免自签名证书问题。
const ssl = isProduction
  ? { rejectUnauthorized: false }
  : false

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl,
})

const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

export default prisma
