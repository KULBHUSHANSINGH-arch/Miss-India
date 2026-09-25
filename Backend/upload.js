import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Public: served at /uploads (ID-card photos, blog media).
export const UPLOAD_DIR = path.join(__dirname, 'uploads');
// Private: ID proofs, payment screenshots, full-length photos — only admins can open these.
export const PRIVATE_DIR = path.join(__dirname, 'private_uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
fs.mkdirSync(PRIVATE_DIR, { recursive: true });

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
const DOC_TYPES = { ...IMAGE_TYPES, 'application/pdf': '.pdf' };
const ALL_TYPES = { ...DOC_TYPES, ...VIDEO_TYPES };

// Registration fields that must stay private.
const PRIVATE_FIELDS = new Set(['photoFull', 'idProof', 'paymentProof']);

const randomName = (file) => `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ALL_TYPES[file.mimetype]}`;

const storage = multer.diskStorage({
  destination: (_req, file, cb) => cb(null, PRIVATE_FIELDS.has(file.fieldname) ? PRIVATE_DIR : UPLOAD_DIR),
  // Random names: never trust (or expose) the uploader's filename.
  filename: (_req, file, cb) => cb(null, randomName(file)),
});

function filter(allowedFor) {
  return (_req, file, cb) => {
    const allowed = allowedFor(file.fieldname);
    if (allowed[file.mimetype]) return cb(null, true);
    const kinds = [...new Set(Object.values(allowed))].join(', ').toUpperCase().replace(/\./g, '');
    cb(Object.assign(new Error(`Unsupported file type. Use ${kinds}.`), { status: 400 }));
  };
}

// Registration: close-up photo must be an image; documents may be image or PDF. 5 MB each.
export const registrationUpload = multer({
  storage,
  fileFilter: filter((field) => (field === 'photo' ? IMAGE_TYPES : DOC_TYPES)),
  limits: { fileSize: 5 * 1024 * 1024, files: 4 },
}).fields([
  { name: 'photo', maxCount: 1 },
  { name: 'photoFull', maxCount: 1 },
  { name: 'idProof', maxCount: 1 },
  { name: 'paymentProof', maxCount: 1 },
]);

// Team photos / profile completion: a single image, 5 MB.
export const photoUpload = multer({
  storage,
  fileFilter: filter(() => IMAGE_TYPES),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Blog media: images or videos, 200 MB.
export const mediaUpload = multer({
  storage,
  fileFilter: filter(() => ({ ...IMAGE_TYPES, ...VIDEO_TYPES })),
  limits: { fileSize: 200 * 1024 * 1024 },
});

export const publicUrl = (file) => (file ? `/uploads/${file.filename}` : '');
export const isVideo = (file) => Boolean(VIDEO_TYPES[file.mimetype]);

/** Deletes files a request uploaded (used when validation fails). */
export function discardFiles(req) {
  const files = [req.file, ...Object.values(req.files || {}).flat()].filter(Boolean);
  files.forEach((f) => fs.rm(f.path, () => {}));
}

/** Deletes a stored file given its DB value ('/uploads/x.jpg' or 'x.pdf' in the private dir). */
export function removeStored(value) {
  if (!value) return;
  const name = path.basename(value);
  const dir = value.startsWith('/uploads/') ? UPLOAD_DIR : PRIVATE_DIR;
  fs.rm(path.join(dir, name), () => {});
}
