import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { ApiError } from '../lib/errors.js';

export const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

/** The frontend's ImageUpload always posts the file under the field name "image". */
export const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.has(file.mimetype)) {
      return cb(new ApiError(400, 'Unsupported image type.'));
    }
    cb(null, true);
  },
}).single('image');

export function uploadedPath(file?: Express.Multer.File): string | undefined {
  return file ? `/media/${file.filename}` : undefined;
}
