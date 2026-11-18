import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { User } from '../users/user.model.js';
import { Employee } from '../employees/employee.model.js';
import { RolePermission, DEFAULT_ROLE_PERMISSIONS } from '../settings/rolePermission.model.js';
import { AppError } from '../../utils/AppError.js';
import { sendMail } from '../../utils/mailer.js';
import { logActivity } from '../activity-logs/activityLog.service.js';

export function signAuthToken(user) {
  return jwt.sign({ sub: String(user._id), role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

export function getCookieOptions() {
  return {
    httpOnly: true,
    secure: env.isProd,
    sameSite: env.isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };
}

export async function buildAuthPayload(user) {
  const employee = await Employee.findOne({ userId: user._id })
    .populate('departmentId', 'name code managerId')
    .populate('managerId', 'firstName lastName email jobTitle avatarUrl');

  const rolePermDoc = await RolePermission.findOne({ role: user.role }).lean();
  const permissions = rolePermDoc?.permissions
    ? Object.fromEntries(Object.entries(rolePermDoc.permissions))
    : { ...(DEFAULT_ROLE_PERMISSIONS[user.role] || {}) };

  return {
    user: user.toSafeJSON(),
    employee,
    permissions,
  };
}

export async function loginUser({ email, password, ipAddress }) {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user) {
    throw AppError.unauthorized('Invalid email or password');
  }
  if (!user.isActive) {
    throw AppError.forbidden('Your account has been deactivated. Contact your administrator.');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw AppError.unauthorized('Invalid email or password');
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = signAuthToken(user);
  const payload = await buildAuthPayload(user);

  await logActivity({
    actorUser: user,
    actorEmployee: payload.employee,
    action: 'auth.login',
    entityType: 'user',
    entityId: user._id,
    summary: `${payload.employee?.fullName || user.email} signed in`,
    ipAddress,
  });

  return { token, ...payload };
}

export async function forgotPassword({ email }) {
  const user = await User.findOne({ email: email.toLowerCase() });
  // Always return success message to prevent email enumeration
  if (!user || !user.isActive) {
    return { message: 'If an account with that email exists, a password reset link has been sent.' };
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  user.resetPasswordTokenHash = tokenHash;
  user.resetPasswordExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();

  const resetUrl = `${env.frontendUrl}/reset-password/${rawToken}`;

  // Dispatch reset email without blocking the client response
  sendMail({
    to: user.email,
    subject: 'WorkTrack — Password Reset Request',
    text: `You requested a password reset. Open this link within 15 minutes: ${resetUrl}`,
    html: `<p>You requested a password reset for WorkTrack.</p><p><a href="${resetUrl}">Reset Password</a> (valid for 15 minutes)</p>`,
  }).catch((err) => {
    console.error('[AUTH:MAIL] Error dispatching reset email:', err.message);
  });

  return {
    message: 'If an account with that email exists, a password reset link has been sent.',
    ...(env.isTest ? { devResetToken: rawToken } : {}),
  };
}

export async function resetPassword({ token, password }) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    resetPasswordTokenHash: tokenHash,
    resetPasswordExpiresAt: { $gt: new Date() },
  }).select('+passwordHash +resetPasswordTokenHash +resetPasswordExpiresAt');

  if (!user) {
    throw AppError.badRequest('Reset token is invalid or has expired');
  }

  user.passwordHash = await bcrypt.hash(password, 10);
  user.resetPasswordTokenHash = null;
  user.resetPasswordExpiresAt = null;
  await user.save();

  return { message: 'Password has been reset successfully. You can now sign in.' };
}

export async function changePassword({ userId, currentPassword, newPassword }) {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) throw AppError.notFound('User not found');

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    throw AppError.badRequest('Current password is incorrect');
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();

  return { message: 'Password updated successfully' };
}

export async function updateNotificationPreferences(userId, notificationPrefs) {
  const user = await User.findById(userId);
  if (!user) throw AppError.notFound('User not found');

  user.notificationPrefs = {
    ...user.notificationPrefs.toObject(),
    ...notificationPrefs,
  };
  await user.save();
  return user.toSafeJSON();
}
