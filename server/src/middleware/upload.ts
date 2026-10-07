import fs from 'node:fs';
import path from 'node:path';
import type { RequestHandler } from 'express';
import multer from 'multer';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import { ApiError } from '../lib/errors.js';

export const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Free API hosts wipe their disk on restart/redeploy, so in production images go
// to Cloudinary (the SDK reads CLOUDINARY_URL itself). Local dev keeps disk storage.
const useCloudinary = Boolean(process.env.CLOUDINARY_URL);

const storage = useCloudinary
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${crypto.randomUUID()}${ext}`);
      },
    });

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

/** The frontend's ImageUpload always posts the file under the field name "image". */
const parseImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.has(file.mimetype)) {
      return cb(new ApiError(400, 'Unsupported image type.'));
    }
    cb(null, true);
  },
}).single('image');

function uploadToCloudinary(buffer: Buffer): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: 'nsmk', resource_type: 'image' }, (err, result) =>
        err || !result ? reject(err ?? new Error('Empty Cloudinary response')) : resolve(result),
      )
      .end(buffer);
  });
}

/** Parses the "image" field and, with Cloudinary enabled, stores its URL in `req.file.path`. */
export const uploadImage: RequestHandler = (req, res, next) => {
  parseImage(req, res, (err) => {
    if (err || !req.file || !useCloudinary) return next(err);
    uploadToCloudinary(req.file.buffer)
      .then((result) => {
        req.file!.path = result.secure_url;
        next();
      })
      .catch(() => next(new ApiError(502, 'Image upload failed.')));
  });
};

export function uploadedPath(file?: Express.Multer.File): string | undefined {
  if (!file) return undefined;
  return useCloudinary ? file.path : `/media/${file.filename}`;
}
