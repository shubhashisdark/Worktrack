import { z } from 'zod';

export const createDailyReportSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD date format').optional(),
  completedWork: z.string().trim().min(5, 'Describe completed work (at least 5 characters)').max(3000),
  ongoingWork: z.string().trim().max(3000).optional().default(''),
  blockers: z.string().trim().max(2000).optional().default(''),
  nextDayPlan: z.string().trim().max(2000).optional().default(''),
  relatedTaskIds: z.array(z.string()).optional().default([]),
  hoursWorked: z.number().min(0).max(24).optional().default(8),
});

export const managerNoteSchema = z.object({
  managerNote: z.string().trim().min(2, 'Note cannot be empty').max(1500),
});
