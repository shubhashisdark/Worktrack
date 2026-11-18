import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { cloudinary, hasCloudinaryConfig } from '../config/cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_UPLOAD_DIR = path.resolve(__dirname, '../../uploads');

export async function uploadFile(file, folder = 'worktrack/general') {
  if (!file) return null;

  if (hasCloudinaryConfig) {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
          use_filename: true,
          unique_filename: true,
        },
        (error, uploaded) => {
          if (error) return reject(error);
          return resolve(uploaded);
        }
      );
      stream.end(file.buffer);
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      provider: 'cloudinary',
    };
  }

  await fs.mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
  const ext = path.extname(file.originalname || '').replace(/[^a-zA-Z0-9.]/g, '').slice(0, 12);
  const safeName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
  const fullPath = path.join(LOCAL_UPLOAD_DIR, safeName);
  await fs.writeFile(fullPath, file.buffer);

  return {
    url: `/api/v1/files/${safeName}`,
    publicId: safeName,
    originalName: file.originalname,
    mimeType: file.mimetype,
    sizeBytes: file.size,
    provider: 'local',
  };
}

export async function uploadFiles(files = [], folder = 'worktrack/general') {
  const results = [];
  for (const file of files) {
    results.push(await uploadFile(file, folder));
  }
  return results;
}

export function getLocalUploadPath(filename) {
  const sanitized = path.basename(filename);
  return path.join(LOCAL_UPLOAD_DIR, sanitized);
}
