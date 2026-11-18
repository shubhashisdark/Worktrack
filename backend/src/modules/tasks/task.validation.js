import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().trim().min(3, 'Task title must be at least 3 characters').max(200),
  description: z.string().trim().max(5000).optional().default(''),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  dueDate: z.string().min(1, 'Due date is required'),
  departmentId: z.string().trim().optional().nullable().transform((v) => (v === '' ? null : v)),
  assigneeIds: z.array(z.string().min(1)).optional().default([]),
  tags: z.array(z.string().trim().max(40)).max(10).optional().default([]),
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(3).max(200).optional(),
  description: z.string().trim().max(5000).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  dueDate: z.string().optional(),
  departmentId: z.string().trim().optional().nullable().transform((v) => (v === '' ? null : v)),
  tags: z.array(z.string().trim().max(40)).max(10).optional(),
  isArchived: z.boolean().optional(),
});

export const assignTaskSchema = z.object({
  employeeIds: z.array(z.string().min(1)).min(1, 'Select at least one employee'),
});

export const updateProgressSchema = z.object({
  progress: z.number().min(0).max(100),
  note: z.string().trim().max(1000).optional().default(''),
});

export const addCommentSchema = z.object({
  message: z.string().trim().min(1, 'Comment cannot be empty').max(2000),
});

export const submitDeliverableSchema = z.object({
  notes: z.string().trim().max(3000).optional().default(''),
  externalLinks: z
    .union([
      z.string(),
      z.array(
        z.object({
          label: z.string().trim().max(100).optional().default('Link'),
          url: z.string().trim().url('Must be a valid URL'),
        })
      ),
    ])
    .optional()
    .transform((val) => {
      if (!val) return [];
      if (typeof val === 'string') {
        try {
          return JSON.parse(val);
        } catch {
          return [];
        }
      }
      return val;
    }),
});

export const reviewApprovalSchema = z.object({
  comments: z.string().trim().max(2000).optional().default(''),
});

export const requestRevisionSchema = z.object({
  comments: z.string().trim().min(5, 'Please provide clear revision feedback (at least 5 characters)').max(2000),
});
