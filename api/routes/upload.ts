import { Router } from 'express';
import multer from 'multer';
import { extname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { authMiddleware } from '../middleware/auth';

const router = Router();

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'avatars');

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    await mkdir(UPLOAD_DIR, { recursive: true });
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = extname(file.originalname) || '.png';
    cb(null, `${randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('仅支持 PNG / JPEG / WebP / GIF 格式'));
    }
  },
});

router.use(authMiddleware);

router.post('/avatar', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      // multer 错误交给全局错误处理
      next(err);
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: '请选择要上传的图片' });
      return;
    }
    const url = `/uploads/avatars/${req.file.filename}`;
    res.json({ url });
  });
});

export default router;
