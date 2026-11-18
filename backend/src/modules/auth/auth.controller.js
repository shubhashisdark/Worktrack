import { env } from '../../config/env.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import * as authService from './auth.service.js';
import { logActivity } from '../activity-logs/activityLog.service.js';

export const login = asyncHandler(async (req, res) => {
  const { token, user, employee, permissions } = await authService.loginUser({
    ...req.body,
    ipAddress: req.ip,
  });

  res.cookie(env.cookieName, token, authService.getCookieOptions());

  return sendSuccess(res, {
    data: { user, employee, permissions },
    message: 'Signed in successfully',
  });
});

export const logout = asyncHandler(async (req, res) => {
  if (req.user) {
    await logActivity({
      actorUser: req.user,
      actorEmployee: req.employee,
      action: 'auth.logout',
      entityType: 'user',
      entityId: req.user._id,
      summary: `${req.employee?.fullName || req.user.email} signed out`,
      ipAddress: req.ip,
    });
  }

  res.clearCookie(env.cookieName, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: env.isProd ? 'none' : 'lax',
    path: '/',
  });

  return sendSuccess(res, { message: 'Signed out successfully' });
});

export const me = asyncHandler(async (req, res) => {
  return sendSuccess(res, {
    data: {
      user: req.user.toSafeJSON(),
      employee: req.employee,
      permissions: req.permissions,
    },
  });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body);
  return sendSuccess(res, { data: result, message: result.message });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const result = await authService.resetPassword(req.body);
  return sendSuccess(res, { message: result.message });
});

export const changePassword = asyncHandler(async (req, res) => {
  const result = await authService.changePassword({
    userId: req.user._id,
    ...req.body,
  });
  return sendSuccess(res, { message: result.message });
});

export const updatePreferences = asyncHandler(async (req, res) => {
  const user = await authService.updateNotificationPreferences(req.user._id, req.body.notificationPrefs);
  return sendSuccess(res, { data: { user }, message: 'Preferences updated' });
});
