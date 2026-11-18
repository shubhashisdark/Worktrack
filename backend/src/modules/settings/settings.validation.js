import { z } from 'zod';

export const updateOrgSettingsSchema = z.object({
  organizationName: z.string().trim().min(2).max(120).optional(),
  timezone: z.string().trim().min(2).max(60).optional(),
  workStartTime: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:mm format').optional(),
  workEndTime: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:mm format').optional(),
  lateThresholdMinutes: z.number().int().min(0).max(180).optional(),
  defaultLeaveQuotas: z
    .object({
      annual: z.number().min(0).max(90),
      sick: z.number().min(0).max(90),
      casual: z.number().min(0).max(90),
    })
    .optional(),
  performanceWeights: z
    .object({
      taskCompletion: z.number().min(0).max(100),
      onTimeCompletion: z.number().min(0).max(100),
      approvalRate: z.number().min(0).max(100),
      attendanceRate: z.number().min(0).max(100),
      feedbackRating: z.number().min(0).max(100),
    })
    .refine(
      (w) => w.taskCompletion + w.onTimeCompletion + w.approvalRate + w.attendanceRate + w.feedbackRating === 100,
      { message: 'Performance weights must total exactly 100%' }
    )
    .optional(),
  maxUploadSizeMb: z.number().int().min(1).max(50).optional(),
});

export const updateRolePermissionsSchema = z.object({
  permissions: z.record(z.string(), z.boolean()),
});
