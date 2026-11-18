import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email('Valid email address is required').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Valid email address is required').toLowerCase(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10, 'Reset token is required'),
  password: z.string().min(8, 'New password must be at least 8 characters'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export const updatePreferencesSchema = z.object({
  notificationPrefs: z.object({
    taskAssigned: z.boolean().optional(),
    taskApproved: z.boolean().optional(),
    revisionRequested: z.boolean().optional(),
    leaveUpdates: z.boolean().optional(),
    dailyReportReminders: z.boolean().optional(),
    feedbackReceived: z.boolean().optional(),
  }),
});
