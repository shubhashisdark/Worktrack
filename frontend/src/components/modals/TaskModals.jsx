import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { ExternalLink, FileText, Paperclip, Plus, Trash2, Upload } from 'lucide-react';
import { Modal, Drawer } from '@/components/ui/Overlays';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Select, Textarea } from '@/components/ui/FormControls';
import { Avatar, ProgressBar, StatusBadge } from '@/components/ui/Primitives';
import { taskFormSchema } from '@/schemas/forms';
import { departmentApi, employeeApi, taskApi } from '@/services/api';
import { getApiErrorMessage } from '@/services/apiClient';
import { formatDate, formatDateTime } from '@/utils/formatters';
import { PRIORITY_META, TASK_STATUS_META } from '@/utils/statusMaps';

export function TaskFormModal({ open, onOpenChange, task = null, onSuccess }) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(task?._id);
  const [files, setFiles] = useState([]);

  const { data: employeesRes } = useQuery({
    queryKey: ['employees', 'assignable'],
    queryFn: () => employeeApi.list({ limit: 100, status: 'active' }),
    enabled: open,
  });

  const { data: deptsRes } = useQuery({
    queryKey: ['departments', 'list'],
    queryFn: () => departmentApi.list({ limit: 100, status: 'active' }),
    enabled: open,
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      dueDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
      departmentId: '',
      assigneeIds: [],
    },
  });

  useEffect(() => {
    if (open) {
      setFiles([]);
      if (task) {
        reset({
          title: task.title || '',
          description: task.description || '',
          priority: task.priority || 'medium',
          dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '',
          departmentId: task.departmentId?._id || task.departmentId || '',
          assigneeIds: (task.assignments || []).map((a) => a.employeeId?._id || a.employeeId),
        });
      } else {
        reset({
          title: '',
          description: '',
          priority: 'medium',
          dueDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
          departmentId: '',
          assigneeIds: [],
        });
      }
    }
  }, [open, task, reset]);

  const selectedAssignees = watch('assigneeIds') || [];
  const toggleAssignee = (id) => {
    if (selectedAssignees.includes(id)) {
      setValue('assigneeIds', selectedAssignees.filter((x) => x !== id));
    } else {
      setValue('assigneeIds', [...selectedAssignees, id]);
    }
  };

  const mutation = useMutation({
    mutationFn: async (values) => {
      if (isEdit) {
        await taskApi.update(task._id, {
          title: values.title,
          description: values.description,
          priority: values.priority,
          dueDate: values.dueDate,
          departmentId: values.departmentId || null,
        });
        if (values.assigneeIds?.length > 0) {
          await taskApi.assign(task._id, values.assigneeIds);
        }
        return;
      }
      return taskApi.create(values, files);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Task updated' : 'Task created successfully');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const employees = employeesRes?.data || [];
  const departments = deptsRes?.data || [];

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit Task' : 'Create Task'}
      description={isEdit ? 'Update task parameters, deadline, or add assignees.' : 'Define work scope, priority, deadline, and assignees.'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="task-modal-form" loading={mutation.isPending}>
            {isEdit ? 'Save Changes' : 'Create Task'}
          </Button>
        </>
      }
    >
      <form id="task-modal-form" onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <FormField label="Task Title" required error={errors.title?.message}>
          <Input placeholder="e.g., Audit Q4 security permissions" {...register('title')} error={errors.title} />
        </FormField>

        <FormField label="Description" error={errors.description?.message}>
          <Textarea
            rows={4}
            placeholder="Describe acceptance criteria, deliverables, and context..."
            {...register('description')}
          />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField label="Priority" required error={errors.priority?.message}>
            <Select {...register('priority')}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </Select>
          </FormField>

          <FormField label="Due Date" required error={errors.dueDate?.message}>
            <Input type="date" {...register('dueDate')} error={errors.dueDate} />
          </FormField>

          <FormField label="Department" error={errors.departmentId?.message}>
            <Select {...register('departmentId')}>
              <option value="">Default department</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <FormField label="Assign Employees" helper="Select one or more team members to assign this task.">
          <div className="max-h-40 overflow-y-auto rounded-md border border-[#E8EAED] divide-y divide-[#E8EAED]">
            {employees.length === 0 ? (
              <div className="px-3 py-4 text-center text-[12px] text-[#747B87]">No team members available</div>
            ) : (
              employees.map((emp) => {
                const checked = selectedAssignees.includes(emp._id);
                return (
                  <label
                    key={emp._id}
                    className="flex cursor-pointer items-center justify-between px-3 py-2 text-[13px] hover:bg-[#F8F9FB]"
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleAssignee(emp._id)}
                        className="h-3.5 w-3.5 rounded accent-[#3867D6]"
                      />
                      <Avatar name={emp.fullName} src={emp.avatarUrl} size="xs" />
                      <div>
                        <div className="font-medium text-[#202124]">{emp.fullName}</div>
                        <div className="text-[11px] text-[#747B87]">{emp.jobTitle}</div>
                      </div>
                    </div>
                    <span className="text-[11px] text-[#747B87]">{emp.employeeCode}</span>
                  </label>
                );
              })
            )}
          </div>
        </FormField>

        {!isEdit && (
          <FormField label="Reference Attachments" helper="Optional. PDF, docs, images, or ZIP up to 10MB each.">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-[#D5D9E0] bg-[#F8F9FB] px-4 py-3 text-[13px] text-[#5F6672] hover:border-[#3867D6] hover:text-[#3867D6]">
              <Upload className="h-4 w-4" />
              <span>Select reference files</span>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => setFiles(Array.from(e.target.files || []).slice(0, 5))}
              />
            </label>
            {files.length > 0 && (
              <div className="mt-2 space-y-1">
                {files.map((f, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded bg-[#F1F3F6] px-2.5 py-1 text-[12px]">
                    <span className="truncate">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => setFiles(files.filter((_, i) => i !== idx))}
                      className="text-[#747B87] hover:text-[#C0392B]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </FormField>
        )}
      </form>
    </Modal>
  );
}

export function SubmitDeliverableModal({ open, onOpenChange, task, onSuccess }) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState('');
  const [links, setLinks] = useState([{ label: '', url: '' }]);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    if (open) {
      setNotes('');
      setLinks([{ label: '', url: '' }]);
      setFiles([]);
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: () => {
      const cleanedLinks = links
        .filter((l) => l.url.trim())
        .map((l) => ({ label: l.label.trim() || 'Reference Link', url: l.url.trim() }));
      return taskApi.submitDeliverable(task._id, { notes, externalLinks: cleanedLinks, files });
    },
    onSuccess: () => {
      toast.success('Deliverable submitted for manager review');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', task?._id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Submit Deliverable for Review"
      description={task ? `${task.taskCode} — ${task.title}` : ''}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate()} loading={mutation.isPending}>
            Submit for Review
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormField label="Submission Notes" required helper="Summarize what you completed and any verification details.">
          <Textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe completed deliverables, testing performed, and key outcomes..."
          />
        </FormField>

        <FormField label="Upload Files" helper="Up to 5 files (PDF, images, Office docs, CSV, ZIP · max 10MB each).">
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-[#D5D9E0] bg-[#F8F9FB] px-4 py-3 text-[13px] text-[#5F6672] hover:border-[#3867D6] hover:text-[#3867D6]">
            <Paperclip className="h-4 w-4" />
            <span>Attach deliverable files</span>
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => setFiles(Array.from(e.target.files || []).slice(0, 5))}
            />
          </label>
          {files.length > 0 && (
            <div className="mt-2 space-y-1">
              {files.map((f, idx) => (
                <div key={idx} className="flex items-center justify-between rounded bg-[#F1F3F6] px-2.5 py-1 text-[12px]">
                  <span className="truncate">{f.name}</span>
                  <button
                    type="button"
                    onClick={() => setFiles(files.filter((_, i) => i !== idx))}
                    className="text-[#747B87] hover:text-[#C0392B]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </FormField>

        <FormField label="External Links (PR, Docs, Figma)">
          <div className="space-y-2">
            {links.map((link, idx) => (
              <div key={idx} className="grid grid-cols-1 gap-2 sm:grid-cols-5">
                <Input
                  className="sm:col-span-2"
                  placeholder="Label (e.g., PR #142)"
                  value={link.label}
                  onChange={(e) => {
                    const next = [...links];
                    next[idx].label = e.target.value;
                    setLinks(next);
                  }}
                />
                <Input
                  className="sm:col-span-3"
                  placeholder="https://..."
                  value={link.url}
                  onChange={(e) => {
                    const next = [...links];
                    next[idx].url = e.target.value;
                    setLinks(next);
                  }}
                />
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLinks([...links, { label: '', url: '' }])}
            >
              <Plus className="h-3.5 w-3.5" />
              Add link
            </Button>
          </div>
        </FormField>
      </div>
    </Modal>
  );
}

export function TaskDetailsDrawer({ open, onOpenChange, taskId, rolePrefix = 'employee', onSubmitDeliverable }) {
  const { data, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => taskApi.getById(taskId),
    enabled: open && Boolean(taskId),
  });

  const task = data?.data;

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={task ? `${task.taskCode} · ${task.title}` : 'Task Details'}
      subtitle={task ? `Due ${formatDate(task.dueDate)}` : ''}
      footer={
        task && (
          <>
            <Link to={`/${rolePrefix}/tasks/${task._id}`} onClick={() => onOpenChange(false)}>
              <Button variant="secondary" size="sm">
                <ExternalLink className="h-3.5 w-3.5" />
                Open Full View
              </Button>
            </Link>
            {rolePrefix === 'employee' && task.myAssignment?.status !== 'approved' && onSubmitDeliverable && (
              <Button size="sm" onClick={() => onSubmitDeliverable(task)}>
                Submit Deliverable
              </Button>
            )}
          </>
        )
      }
    >
      {isLoading || !task ? (
        <div className="space-y-3">
          <div className="h-5 w-48 animate-pulse rounded bg-[#ECEEF2]" />
          <div className="h-24 w-full animate-pulse rounded bg-[#ECEEF2]" />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge map={TASK_STATUS_META} value={task.myAssignment?.status || task.status} />
            <StatusBadge map={PRIORITY_META} value={task.priority} />
            {task.departmentId?.name && (
              <span className="rounded bg-[#F1F3F6] px-2 py-0.5 text-[12px] text-[#5F6672]">
                {task.departmentId.name}
              </span>
            )}
          </div>

          <div>
            <div className="mb-1 text-[12px] font-medium text-[#747B87]">Progress</div>
            <ProgressBar value={task.progress} />
          </div>

          <div>
            <div className="mb-1 text-[12px] font-medium text-[#747B87]">Description</div>
            <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-[#202124]">
              {task.description || 'No description provided.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-[8px] border border-[#E8EAED] bg-[#F8F9FB] p-3 text-[12px]">
            <div>
              <div className="text-[#747B87]">Created By</div>
              <div className="mt-0.5 font-medium text-[#202124]">
                {task.createdBy ? `${task.createdBy.firstName} ${task.createdBy.lastName}` : '—'}
              </div>
            </div>
            <div>
              <div className="text-[#747B87]">Due Date</div>
              <div className="mt-0.5 font-medium text-[#202124]">{formatDate(task.dueDate)}</div>
            </div>
          </div>

          {task.deliverables?.length > 0 && (
            <div>
              <div className="mb-2 text-[12px] font-medium text-[#747B87]">
                Submitted Deliverables ({task.deliverables.length})
              </div>
              <div className="space-y-2">
                {task.deliverables.slice(0, 3).map((d) => (
                  <div key={d._id} className="rounded-[8px] border border-[#E8EAED] p-3 text-[12px]">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-[#202124]">Version {d.version}</span>
                      <span className="text-[#747B87]">{formatDateTime(d.submittedAt)}</span>
                    </div>
                    {d.notes && <p className="mt-1 text-[#5F6672]">{d.notes}</p>}
                    {d.files?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {d.files.map((f, idx) => (
                          <a
                            key={idx}
                            href={f.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded bg-[#F1F3F6] px-2 py-0.5 text-[11px] text-[#3867D6] hover:underline"
                          >
                            <FileText className="h-3 w-3" />
                            {f.originalName}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}
