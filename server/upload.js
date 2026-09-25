import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOAD_DIR = path.join(__dirname, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const IMAGE_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};
const VIDEO_TYPES = {
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
};

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  // Random names: never trust (or expose) the uploader's filename.
  filename: (_req, file, cb) => {
    const ext = IMAGE_TYPES[file.mimetype] || VIDEO_TYPES[file.mimetype];
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
  },
});

function filter(allowed) {
  return (_req, file, cb) => {
    if (allowed[file.mimetype]) return cb(null, true);
    const err = new Error('Unsupported file type. Use JPG, PNG, WEBP, GIF, MP4, WEBM or MOV.');
    err.status = 400;
    cb(err);
  };
}

// Contestant / team photos: images only, 5 MB.
export const photoUpload = multer({
  storage,
  fileFilter: filter(IMAGE_TYPES),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Blog media: images or videos, 200 MB.
export const mediaUpload = multer({
  storage,
  fileFilter: filter({ ...IMAGE_TYPES, ...VIDEO_TYPES }),
  limits: { fileSize: 200 * 1024 * 1024 },
});

export const fileUrl = (file) => (file ? `/uploads/${file.filename}` : '');
export const isVideo = (file) => Boolean(VIDEO_TYPES[file.mimetype]);
