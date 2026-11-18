import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Overlays';
import { Button } from '@/components/ui/Button';
import { FormField, Input, PasswordInput, Select, Textarea } from '@/components/ui/FormControls';
import { departmentFormSchema, employeeFormSchema, feedbackFormSchema, leaveFormSchema } from '@/schemas/forms';
import { departmentApi, employeeApi, feedbackApi, leaveApi } from '@/services/api';
import { getApiErrorMessage } from '@/services/apiClient';

export function ApplyLeaveModal({ open, onOpenChange, leaveBalances, onSuccess }) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(leaveFormSchema),
    defaultValues: {
      leaveType: 'annual',
      startDate: '',
      endDate: '',
      reason: '',
    },
  });

  useEffect(() => {
    if (open) reset({ leaveType: 'annual', startDate: '', endDate: '', reason: '' });
  }, [open, reset]);

  const mutation = useMutation({
    mutationFn: (values) => leaveApi.create(values),
    onSuccess: () => {
      toast.success('Leave request submitted for manager approval');
      queryClient.invalidateQueries({ queryKey: ['leave'] });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Apply for Leave"
      description="Submit your leave dates and reason for manager review."
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="apply-leave-form" loading={mutation.isPending}>
            Submit Request
          </Button>
        </>
      }
    >
      {leaveBalances && (
        <div className="mb-4 grid grid-cols-3 gap-2 rounded-[8px] border border-[#E8EAED] bg-[#F8F9FB] p-3 text-center text-[12px]">
          <div>
            <div className="text-[#747B87]">Annual</div>
            <div className="font-semibold text-[#202124]">{leaveBalances.annual ?? 0}d</div>
          </div>
          <div>
            <div className="text-[#747B87]">Sick</div>
            <div className="font-semibold text-[#202124]">{leaveBalances.sick ?? 0}d</div>
          </div>
          <div>
            <div className="text-[#747B87]">Casual</div>
            <div className="font-semibold text-[#202124]">{leaveBalances.casual ?? 0}d</div>
          </div>
        </div>
      )}

      <form id="apply-leave-form" onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <FormField label="Leave Type" required error={errors.leaveType?.message}>
          <Select {...register('leaveType')}>
            <option value="annual">Annual Leave</option>
            <option value="sick">Sick Leave</option>
            <option value="casual">Casual Leave</option>
            <option value="unpaid">Unpaid Leave</option>
            <option value="other">Other</option>
          </Select>
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Start Date" required error={errors.startDate?.message}>
            <Input type="date" {...register('startDate')} error={errors.startDate} />
          </FormField>
          <FormField label="End Date" required error={errors.endDate?.message}>
            <Input type="date" {...register('endDate')} error={errors.endDate} />
          </FormField>
        </div>

        <FormField label="Reason" required error={errors.reason?.message}>
          <Textarea
            rows={3}
            placeholder="Briefly share context or handoff notes..."
            {...register('reason')}
            error={errors.reason}
          />
        </FormField>
      </form>
    </Modal>
  );
}

export function EmployeeFormModal({ open, onOpenChange, employee = null, defaultRole = 'employee', onSuccess }) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(employee?._id);

  const { data: deptsRes } = useQuery({
    queryKey: ['departments', 'all'],
    queryFn: () => departmentApi.list({ limit: 100 }),
    enabled: open,
  });

  const { data: managersRes } = useQuery({
    queryKey: ['employees', 'managers-select'],
    queryFn: () => employeeApi.list({ limit: 100 }),
    enabled: open,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: defaultRole,
      jobTitle: '',
      phone: '',
      location: 'Remote',
      departmentId: '',
      managerId: '',
      employmentType: 'full_time',
      status: 'active',
    },
  });

  useEffect(() => {
    if (open) {
      if (employee) {
        reset({
          firstName: employee.firstName || '',
          lastName: employee.lastName || '',
          email: employee.email || '',
          password: '',
          role: employee.role || employee.userId?.role || 'employee',
          jobTitle: employee.jobTitle || '',
          phone: employee.phone || '',
          location: employee.location || 'Remote',
          departmentId: employee.departmentId?._id || employee.departmentId || '',
          managerId: employee.managerId?._id || employee.managerId || '',
          employmentType: employee.employmentType || 'full_time',
          status: employee.status || 'active',
        });
      } else {
        reset({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          role: defaultRole,
          jobTitle: '',
          phone: '',
          location: 'Remote',
          departmentId: '',
          managerId: '',
          employmentType: 'full_time',
          status: 'active',
        });
      }
    }
  }, [open, employee, defaultRole, reset]);

  const mutation = useMutation({
    mutationFn: (values) => {
      const payload = { ...values };
      if (!payload.password) delete payload.password;
      if (isEdit) {
        delete payload.email;
        return employeeApi.update(employee._id, payload);
      }
      return employeeApi.create(payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Employee updated' : 'Employee account created');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const departments = deptsRes?.data || [];
  const managers = (managersRes?.data || []).filter((m) => ['manager', 'admin'].includes(m.role));

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit Employee' : 'Add Employee'}
      description={isEdit ? 'Update role, reporting line, and account status.' : 'Create an employee record and WorkTrack login credentials.'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="employee-modal-form" loading={mutation.isPending}>
            {isEdit ? 'Save Changes' : 'Create Employee'}
          </Button>
        </>
      }
    >
      <form id="employee-modal-form" onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField label="First Name" required error={errors.firstName?.message}>
            <Input {...register('firstName')} error={errors.firstName} />
          </FormField>
          <FormField label="Last Name" required error={errors.lastName?.message}>
            <Input {...register('lastName')} error={errors.lastName} />
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField label="Work Email" required error={errors.email?.message}>
            <Input type="email" disabled={isEdit} {...register('email')} error={errors.email} />
          </FormField>
          {!isEdit && (
            <FormField label="Temporary Password" helper="Leave blank to auto-generate a secure password (user can reset via email)">
              <PasswordInput autoComplete="new-password" placeholder="Min 8 characters" {...register('password')} />
            </FormField>
          )}
          {isEdit && (
            <FormField label="Account Status" error={errors.status?.message}>
              <Select {...register('status')}>
                <option value="active">Active</option>
                <option value="on_leave">On Leave</option>
                <option value="inactive">Inactive</option>
              </Select>
            </FormField>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <FormField label="Job Title" required error={errors.jobTitle?.message}>
            <Input placeholder="e.g., Product Designer" {...register('jobTitle')} error={errors.jobTitle} />
          </FormField>
          <FormField label="Role" required error={errors.role?.message}>
            <Select {...register('role')}>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="admin">Administrator</option>
            </Select>
          </FormField>
          <FormField label="Employment Type">
            <Select {...register('employmentType')}>
              <option value="full_time">Full Time</option>
              <option value="part_time">Part Time</option>
              <option value="contract">Contract</option>
              <option value="intern">Intern</option>
            </Select>
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField label="Department">
            <Select {...register('departmentId')}>
              <option value="">Unassigned</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Reporting Manager">
            <Select {...register('managerId')}>
              <option value="">None</option>
              {managers.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.fullName} — {m.jobTitle}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField label="Phone">
            <Input placeholder="+1 (555) 000-0000" {...register('phone')} />
          </FormField>
          <FormField label="Location">
            <Input placeholder="e.g., New York, NY or Remote" {...register('location')} />
          </FormField>
        </div>
      </form>
    </Modal>
  );
}

export function DepartmentFormModal({ open, onOpenChange, department = null }) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(department?._id);

  const { data: managersRes } = useQuery({
    queryKey: ['employees', 'dept-managers'],
    queryFn: () => employeeApi.list({ limit: 100 }),
    enabled: open,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: { name: '', code: '', description: '', managerId: '', status: 'active' },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: department?.name || '',
        code: department?.code || '',
        description: department?.description || '',
        managerId: department?.managerId?._id || department?.managerId || '',
        status: department?.status || 'active',
      });
    }
  }, [open, department, reset]);

  const mutation = useMutation({
    mutationFn: (values) =>
      isEdit ? departmentApi.update(department._id, values) : departmentApi.create(values),
    onSuccess: () => {
      toast.success(isEdit ? 'Department updated' : 'Department created');
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      onOpenChange(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const managers = (managersRes?.data || []).filter((m) => ['manager', 'admin'].includes(m.role));

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit Department' : 'Create Department'}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="dept-modal-form" loading={mutation.isPending}>
            {isEdit ? 'Save Changes' : 'Create Department'}
          </Button>
        </>
      }
    >
      <form id="dept-modal-form" onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <FormField className="col-span-2" label="Department Name" required error={errors.name?.message}>
            <Input placeholder="e.g., Engineering" {...register('name')} error={errors.name} />
          </FormField>
          <FormField label="Code" required error={errors.code?.message}>
            <Input placeholder="ENG" {...register('code')} error={errors.code} />
          </FormField>
        </div>

        <FormField label="Department Manager">
          <Select {...register('managerId')}>
            <option value="">Unassigned</option>
            {managers.map((m) => (
              <option key={m._id} value={m._id}>
                {m.fullName} ({m.jobTitle})
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Description">
          <Textarea rows={3} placeholder="Mission and responsibilities..." {...register('description')} />
        </FormField>

        {isEdit && (
          <FormField label="Status">
            <Select {...register('status')}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </FormField>
        )}
      </form>
    </Modal>
  );
}

export function GiveFeedbackModal({ open, onOpenChange, employeeId = '', employees = [] }) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      employeeId,
      category: 'performance',
      rating: 4,
      comment: '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({ employeeId: employeeId || employees[0]?._id || '', category: 'performance', rating: 4, comment: '' });
    }
  }, [open, employeeId, employees, reset]);

  const mutation = useMutation({
    mutationFn: (values) => feedbackApi.create(values),
    onSuccess: () => {
      toast.success('Feedback sent to employee');
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
      queryClient.invalidateQueries({ queryKey: ['performance'] });
      onOpenChange(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Provide Employee Feedback"
      description="Constructive, transparent feedback contributes directly to the employee's performance record."
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="feedback-modal-form" loading={mutation.isPending}>
            Send Feedback
          </Button>
        </>
      }
    >
      <form id="feedback-modal-form" onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        {!employeeId && (
          <FormField label="Employee" required error={errors.employeeId?.message}>
            <Select {...register('employeeId')}>
              <option value="">Select employee</option>
              {employees.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.fullName} — {e.jobTitle}
                </option>
              ))}
            </Select>
          </FormField>
        )}

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Category" required>
            <Select {...register('category')}>
              <option value="performance">Performance</option>
              <option value="recognition">Recognition</option>
              <option value="task_review">Task Review</option>
              <option value="improvement">Area for Improvement</option>
              <option value="general">General</option>
            </Select>
          </FormField>
          <FormField label="Rating (1–5)" required error={errors.rating?.message}>
            <Select {...register('rating')}>
              <option value={5}>5 — Exceptional</option>
              <option value={4}>4 — Exceeds Expectations</option>
              <option value={3}>3 — Meets Expectations</option>
              <option value={2}>2 — Needs Attention</option>
              <option value={1}>1 — Unsatisfactory</option>
            </Select>
          </FormField>
        </div>

        <FormField label="Feedback Comment" required error={errors.comment?.message}>
          <Textarea rows={4} placeholder="Share specific observations and actionable guidance..." {...register('comment')} />
        </FormField>
      </form>
    </Modal>
  );
}
