import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test' || process.env.VITEST === 'true',
  port: Number(process.env.PORT || 5000),
  frontendUrl: process.env.FRONTEND_URL || 'https://worktrack-frontend.onrender.com',
  mongodbUri: process.env.MONGODB_URI || '',
  useInMemoryDb: process.env.USE_IN_MEMORY_DB === 'true',
  jwtSecret: process.env.JWT_SECRET || 'worktrack-dev-jwt-secret-change-in-production-32chars',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cookieName: process.env.COOKIE_NAME || 'worktrack_token',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'WorkTrack <no-reply@worktrack.local>',
  },
};

export const hasCloudinaryConfig = Boolean(
  env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret
);

export function validateProductionEnv() {
  if (!env.isProd) return;
  const errors = [];

  if (!env.mongodbUri) {
    errors.push('MONGODB_URI must be set in production.');
  }
  if (!env.jwtSecret || env.jwtSecret.length < 32 || env.jwtSecret.includes('replace-with') || env.jwtSecret.includes('worktrack-dev')) {
    errors.push('JWT_SECRET must be a strong secret (at least 32 characters) in production.');
  }
  if (!env.frontendUrl) {
    errors.push('FRONTEND_URL must be configured in production.');
  }

  if (errors.length > 0) {
    throw new Error(`Invalid production configuration:\n- ${errors.join('\n- ')}`);
  }

  if (env.frontendUrl.includes('localhost')) {
    console.warn('[WARN] FRONTEND_URL contains localhost in production. Set FRONTEND_URL to your deployed frontend domain in your hosting dashboard.');
  }
}
