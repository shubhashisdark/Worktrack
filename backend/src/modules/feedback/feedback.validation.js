import { z } from 'zod';

export const createFeedbackSchema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  taskId: z.string().trim().optional().nullable().transform((v) => (v === '' ? null : v)),
  category: z.enum(['task_review', 'performance', 'recognition', 'improvement', 'general']).default('general'),
  rating: z.number().min(1).max(5),
  comment: z.string().trim().min(5, 'Feedback comment must be at least 5 characters').max(2000),
});
