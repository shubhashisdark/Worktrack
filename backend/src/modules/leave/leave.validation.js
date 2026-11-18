import { z } from 'zod';

export const createLeaveSchema = z.object({
  leaveType: z.enum(['annual', 'sick', 'casual', 'unpaid', 'other']).default('annual'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  reason: z.string().trim().min(5, 'Please provide a brief reason (at least 5 characters)').max(1000),
});

export const approveLeaveSchema = z.object({
  decisionNotes: z.string().trim().max(1000).optional().default(''),
});

export const rejectLeaveSchema = z.object({
  decisionNotes: z.string().trim().min(3, 'Please provide a reason for rejection').max(1000),
});
