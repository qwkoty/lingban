import { type Request, type Response, type NextFunction } from 'express'
import prisma from '../lib/prisma.js'

// 认证中间件:从 Authorization header 中解析 token,验证用户
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: '未提供认证信息' })
    return
  }

  const token = authHeader.substring(7)
  prisma.user
    .findUnique({ where: { token } })
    .then((user) => {
      if (!user) {
        res.status(401).json({ success: false, error: '无效的认证信息' })
        return
      }
      req.userId = user.id
      next()
    })
    .catch(() => {
      res.status(500).json({ success: false, error: '服务器错误' })
    })
}
