import { z } from 'zod';

export const loginFormSchema = z.object({
  email: z.string().trim().email('Enter a valid work email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const forgotPasswordFormSchema = z.object({
  email: z.string().trim().email('Enter a valid work email'),
});

export const resetPasswordFormSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Confirm your new password'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const changePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(6, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Please confirm your new password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'New passwords do not match',
    path: ['confirmPassword'],
  });

export const taskFormSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().trim().max(5000).optional().default(''),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  dueDate: z.string().min(1, 'Due date is required'),
  departmentId: z.string().optional().default(''),
  assigneeIds: z.array(z.string()).optional().default([]),
});

export const leaveFormSchema = z
  .object({
    leaveType: z.enum(['annual', 'sick', 'casual', 'unpaid', 'other']),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    reason: z.string().trim().min(5, 'Provide a brief reason (at least 5 characters)').max(1000),
  })
  .refine((d) => !d.startDate || !d.endDate || new Date(d.endDate) >= new Date(d.startDate), {
    message: 'End date must be on or after start date',
    path: ['endDate'],
  });

export const dailyReportFormSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  completedWork: z.string().trim().min(5, 'Describe completed work').max(3000),
  ongoingWork: z.string().trim().max(3000).optional().default(''),
  blockers: z.string().trim().max(2000).optional().default(''),
  nextDayPlan: z.string().trim().max(2000).optional().default(''),
  hoursWorked: z.coerce.number().min(0).max(24),
});

export const employeeFormSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  email: z.string().trim().email('Valid email is required'),
  password: z.string().optional(),
  role: z.enum(['employee', 'manager', 'admin']),
  jobTitle: z.string().trim().min(2, 'Job title is required'),
  phone: z.string().trim().optional().default(''),
  location: z.string().trim().optional().default('Remote'),
  departmentId: z.string().optional().default(''),
  managerId: z.string().optional().default(''),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'intern']).default('full_time'),
  status: z.enum(['active', 'inactive', 'on_leave']).default('active'),
});

export const departmentFormSchema = z.object({
  name: z.string().trim().min(2, 'Department name is required'),
  code: z.string().trim().min(2, 'Code is required').max(20),
  description: z.string().trim().max(500).optional().default(''),
  managerId: z.string().optional().default(''),
  status: z.enum(['active', 'inactive']).default('active'),
});

export const feedbackFormSchema = z.object({
  employeeId: z.string().min(1, 'Select an employee'),
  taskId: z.string().optional().default(''),
  category: z.enum(['task_review', 'performance', 'recognition', 'improvement', 'general']),
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().trim().min(5, 'Feedback must be at least 5 characters'),
});
