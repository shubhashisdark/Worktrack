import multer from 'multer';
import { env } from '../config/env.js';
import { sendError } from '../utils/apiResponse.js';

export function notFoundHandler(req, res) {
  return sendError(res, {
    statusCode: 404,
    code: 'NOT_FOUND',
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
}

export function errorHandler(err, _req, res, _next) {
  if (err instanceof multer.MulterError) {
    return sendError(res, {
      statusCode: 400,
      code: 'UPLOAD_ERROR',
      message: err.code === 'LIMIT_FILE_SIZE' ? 'File exceeds the 10MB upload limit' : err.message,
    });
  }

  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors || {}).map((e) => ({
      path: e.path,
      message: e.message,
    }));
    return sendError(res, {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details,
    });
  }

  if (err.name === 'CastError') {
    return sendError(res, {
      statusCode: 400,
      code: 'INVALID_ID',
      message: `Invalid identifier for field "${err.path}"`,
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return sendError(res, {
      statusCode: 409,
      code: 'DUPLICATE_KEY',
      message: `A record with this ${field} already exists`,
    });
  }

  if (err.isOperational) {
    return sendError(res, {
      statusCode: err.statusCode,
      code: err.code,
      message: err.message,
      details: err.details,
    });
  }

  if (!env.isTest) {
    console.error('[UNHANDLED ERROR]', err);
  }

  return sendError(res, {
    statusCode: 500,
    code: 'INTERNAL_ERROR',
    message: env.isProd ? 'An unexpected server error occurred' : err.message || 'Internal server error',
  });
}
