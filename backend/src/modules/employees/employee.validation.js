import { z } from 'zod';

const objectIdOrEmpty = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((v) => (v === '' ? null : v));

export const createEmployeeSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(80),
  lastName: z.string().trim().min(1, 'Last name is required').max(80),
  email: z.string().trim().email('Valid email is required').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  role: z.enum(['employee', 'manager', 'admin']).default('employee'),
  employeeCode: z.string().trim().min(2).max(24).optional(),
  phone: z.string().trim().max(30).optional().default(''),
  jobTitle: z.string().trim().min(2, 'Job title is required').max(120),
  departmentId: objectIdOrEmpty,
  managerId: objectIdOrEmpty,
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'intern']).default('full_time'),
  status: z.enum(['active', 'inactive', 'on_leave']).default('active'),
  hireDate: z.string().optional(),
  location: z.string().trim().max(100).optional().default('Remote'),
});

export const updateEmployeeSchema = z.object({
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  phone: z.string().trim().max(30).optional(),
  avatarUrl: z.string().trim().max(500).optional(),
  jobTitle: z.string().trim().min(2).max(120).optional(),
  departmentId: objectIdOrEmpty,
  managerId: objectIdOrEmpty,
  role: z.enum(['employee', 'manager', 'admin']).optional(),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'intern']).optional(),
  status: z.enum(['active', 'inactive', 'on_leave']).optional(),
  location: z.string().trim().max(100).optional(),
  hireDate: z.string().optional(),
  leaveBalances: z
    .object({
      annual: z.number().min(0).optional(),
      sick: z.number().min(0).optional(),
      casual: z.number().min(0).optional(),
    })
    .optional(),
});

export const bulkStatusSchema = z.object({
  employeeIds: z.array(z.string().min(1)).min(1),
  status: z.enum(['active', 'inactive']),
});
