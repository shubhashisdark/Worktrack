import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import fs from 'fs';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import { apiRateLimiter } from './middleware/rateLimit.middleware.js';
import { requireAuth } from './middleware/auth.middleware.js';
import { sanitizeInput } from './middleware/sanitize.middleware.js';
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js';
import { getLocalUploadPath } from './utils/storage.js';

import authRoutes from './modules/auth/auth.routes.js';
import employeeRoutes from './modules/employees/employee.routes.js';
import departmentRoutes from './modules/departments/department.routes.js';
import taskRoutes from './modules/tasks/task.routes.js';
import approvalRoutes from './modules/tasks/approval.routes.js';
import attendanceRoutes from './modules/attendance/attendance.routes.js';
import leaveRoutes from './modules/leave/leave.routes.js';
import dailyReportRoutes from './modules/daily-reports/dailyReport.routes.js';
import feedbackRoutes from './modules/feedback/feedback.routes.js';
import performanceRoutes from './modules/performance/performance.routes.js';
import reportsRoutes from './modules/reports/reports.routes.js';
import notificationRoutes from './modules/notifications/notification.routes.js';
import activityLogRoutes from './modules/activity-logs/activityLog.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import settingsRoutes from './modules/settings/settings.routes.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  const allowedOrigins = (env.frontendUrl || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin(origin, callback) {
        if (
          !origin ||
          allowedOrigins.includes(origin) ||
          !env.isProd ||
          origin.endsWith('.onrender.com') ||
          origin.endsWith('.vercel.app') ||
          origin.endsWith('.pages.dev')
        ) {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    })
  );

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(cookieParser());
  app.use(sanitizeInput);

  if (!env.isTest) {
    app.use(morgan(env.isProd ? 'combined' : 'dev'));
  }

  app.use('/api/v1', apiRateLimiter);

  app.get(['/', '/health'], (_req, res) => {
    res.json({
      name: 'WorkTrack API',
      status: 'online',
      version: '1.0.0',
      health: '/api/v1/health',
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/v1/health', (_req, res) => {
    const dbReady = mongoose.connection.readyState === 1;
    const statusCode = dbReady ? 200 : 503;
    res.status(statusCode).json({
      success: dbReady,
      data: {
        status: dbReady ? 'ok' : 'degraded',
        database: dbReady ? 'connected' : 'disconnected',
        service: 'worktrack-api',
        timestamp: new Date().toISOString(),
      },
    });
  });

  // Authenticated local file serving (when Cloudinary is not configured)
  app.get('/api/v1/files/:filename', requireAuth, (req, res, next) => {
    const filePath = getLocalUploadPath(req.params.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'File not found' } });
    }
    return res.sendFile(filePath, (err) => {
      if (err) next(err);
    });
  });

  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/dashboard', dashboardRoutes);
  app.use('/api/v1/employees', employeeRoutes);
  app.use('/api/v1/departments', departmentRoutes);
  app.use('/api/v1/tasks', taskRoutes);
  app.use('/api/v1/approvals', approvalRoutes);
  app.use('/api/v1/attendance', attendanceRoutes);
  app.use('/api/v1/leave-requests', leaveRoutes);
  app.use('/api/v1/daily-reports', dailyReportRoutes);
  app.use('/api/v1/feedback', feedbackRoutes);
  app.use('/api/v1/performance', performanceRoutes);
  app.use('/api/v1/reports', reportsRoutes);
  app.use('/api/v1/notifications', notificationRoutes);
  app.use('/api/v1/activity-logs', activityLogRoutes);
  app.use('/api/v1/settings', settingsRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
