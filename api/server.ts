/**
 * local / production server entry file
 */
import fs from 'fs'
import path from 'path'
import app from './app.js'
import prisma from './lib/prisma.js'

/**
 * start server with port
 */
const PORT = process.env.PORT || 3001
const isProduction = process.env.NODE_ENV === 'production'

async function startServer() {
  console.log(`[startup] NODE_ENV=${process.env.NODE_ENV || 'not set'}`)
  console.log(`[startup] PORT=${PORT}`)
  console.log(`[startup] DATABASE_URL=${process.env.DATABASE_URL || 'not set'}`)
  console.log(`[startup] cwd=${process.cwd()}`)

  // 验证数据库连接
  try {
    await prisma.$queryRaw`SELECT 1`
    console.log('[startup] database connection: ok')
  } catch (error) {
    console.error('[startup] database connection failed:', error)
    process.exit(1)
  }

  // 生产环境验证前端构建产物
  if (isProduction) {
    const distPath = path.join(process.cwd(), 'dist')
    if (!fs.existsSync(distPath)) {
      console.error(`[startup] production dist not found at ${distPath}`)
      process.exit(1)
    }
    console.log(`[startup] dist directory: ok`)
  }

  const server = app.listen(PORT, () => {
    console.log(`[startup] server ready on port ${PORT}`)
  })

  // close server
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received')
    server.close(() => {
      console.log('Server closed')
      process.exit(0)
    })
  })

  process.on('SIGINT', () => {
    console.log('SIGINT signal received')
    server.close(() => {
      console.log('Server closed')
      process.exit(0)
    })
  })
}

startServer().catch((error) => {
  console.error('[startup] unexpected error:', error)
  process.exit(1)
})

export default app
