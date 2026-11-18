import multer from 'multer';

/**
 * In-memory upload for files that go straight to Cloudinary.
 * nginx caps request bodies at 15 MB, so that is the effective limit; keep
 * multer at the same value so the backend never buffers more than nginx allows.
 */
export const MAX_MEDIA_BYTES = 15 * 1024 * 1024;

const ALLOWED_MEDIA = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'video/mp4', 'video/quicktime', 'video/webm',
];

export const mediaUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_MEDIA_BYTES },
  fileFilter: (_req, file, cb) => cb(null, ALLOWED_MEDIA.includes(file.mimetype)),
});
