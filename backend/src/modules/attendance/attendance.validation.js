import { z } from 'zod';

export const checkInSchema = z.object({
  notes: z.string().trim().max(500).optional().default(''),
});

export const checkOutSchema = z.object({
  notes: z.string().trim().max(500).optional().default(''),
});

export const adjustAttendanceSchema = z.object({
  checkOutAt: z.string().optional(),
  status: z.enum(['present', 'late', 'half_day', 'absent', 'on_leave', 'missing_checkout']).optional(),
  notes: z.string().trim().max(500).optional(),
});
