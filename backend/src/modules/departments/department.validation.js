import { z } from 'zod';

const objectIdOrEmpty = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((v) => (v === '' ? null : v));

export const createDepartmentSchema = z.object({
  name: z.string().trim().min(2, 'Department name is required').max(100),
  code: z.string().trim().min(2, 'Department code is required').max(20).toUpperCase(),
  description: z.string().trim().max(500).optional().default(''),
  managerId: objectIdOrEmpty,
  status: z.enum(['active', 'inactive']).default('active'),
});

export const updateDepartmentSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  code: z.string().trim().min(2).max(20).toUpperCase().optional(),
  description: z.string().trim().max(500).optional(),
  managerId: objectIdOrEmpty,
  status: z.enum(['active', 'inactive']).optional(),
});
