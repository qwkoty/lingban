// 扩展 Express Request 类型,附加 userId
declare global {
  namespace Express {
    interface Request {
      userId?: number
    }
  }
}

export {}
