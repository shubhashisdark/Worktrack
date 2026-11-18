import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Archive, ClipboardCheck, Edit3, Plus } from 'lucide-react';
import { approvalApi, taskApi } from '@/services/api';
import { getApiErrorMessage } from '@/services/apiClient';
import { useDebounce } from '@/hooks/useDebounce';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { ConfirmDialog, ErrorState, PageSkeleton } from '@/components/common/States';
import { Avatar, Panel, PanelHeader, ProgressBar, StatusBadge, TabsBar } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/FormControls';
import { TaskDetailsDrawer, TaskFormModal } from '@/components/modals/TaskModals';
import { ApproveConfirmModal, RequestRevisionModal, ReviewSubmissionDrawer } from '@/components/modals/ApprovalModals';
import { formatDate, formatDateTime, formatRelative } from '@/utils/formatters';
import { APPROVAL_STATUS_META, PRIORITY_META, TASK_STATUS_META } from '@/utils/statusMaps';

export function ManagerTasksPage({ rolePrefix = 'manager', title = 'Task Management' }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('dueDate');
  const [sortOrder, setSortOrder] = useState('asc');
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [drawerTaskId, setDrawerTaskId] = useState(null);
  const [archiveTask, setArchiveTask] = useState(null);

  const debouncedSearch = useDebounce(search, 250);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['tasks', rolePrefix, { debouncedSearch, status, priority, page, sortBy, sortOrder }],
    queryFn: () =>
      taskApi.list({
        page,
        limit: 15,
        search: debouncedSearch || undefined,
        status: status || undefined,
        priority: priority || undefined,
        sortBy,
        sortOrder,
      }),
  });

  const archiveMutation = useMutation({
    mutationFn: (id) => taskApi.archive(id),
    onSuccess: () => {
      toast.success('Task archived');
      setArchiveTask(null);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const columns = [
    {
      key: 'title',
      header: 'Task',
      sortable: true,
      render: (row) => (
        <div className="min-w-[220px]">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-[#747B87]">{row.taskCode}</span>
            <Link
              to={`/${rolePrefix}/tasks/${row._id}`}
              onClick={(e) => e.stopPropagation()}
              className="font-medium text-[#202124] hover:text-[#3867D6]"
            >
              {row.title}
            </Link>
          </div>
          {row.departmentId?.name && <div className="text-[11px] text-[#747B87]">{row.departmentId.name}</div>}
        </div>
      ),
    },
    {
      key: 'assignees',
      header: 'Assignees',
      render: (row) =>
        row.assignments?.length ? (
          <div className="flex items-center gap-1.5">
            <Avatar
              name={row.assignments[0].employeeId ? `${row.assignments[0].employeeId.firstName} ${row.assignments[0].employeeId.lastName}` : ''}
              src={row.assignments[0].employeeId?.avatarUrl}
              size="xs"
            />
            <span className="text-[12px] text-[#202124]">
              {row.assignments[0].employeeId?.firstName} {row.assignments[0].employeeId?.lastName}
              {row.assignments.length > 1 ? ` +${row.assignments.length - 1}` : ''}
            </span>
          </div>
        ) : (
          <span className="text-[12px] text-[#9AA0A6]">Unassigned</span>
        ),
    },
    { key: 'priority', header: 'Priority', sortable: true, render: (r) => <StatusBadge map={PRIORITY_META} value={r.priority} /> },
    { key: 'status', header: 'Status', sortable: true, render: (r) => <StatusBadge map={TASK_STATUS_META} value={r.status} /> },
    {
      key: 'progress',
      header: 'Progress',
      render: (r) => (
        <div className="w-24">
          <ProgressBar value={r.progress} />
        </div>
      ),
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      sortable: true,
      render: (r) => (
        <span className={r.isOverdue ? 'font-medium text-[#C0392B]' : 'text-[#5F6672]'}>
          {formatDate(r.dueDate)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            title="Edit task"
            onClick={() => {
              setEditingTask(r);
              setFormOpen(true);
            }}
          >
            <Edit3 className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" title="Archive task" onClick={() => setArchiveTask(r)}>
            <Archive className="h-3.5 w-3.5 text-[#747B87]" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title={title}
        subtitle="Create, assign, and monitor work items across your team."
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditingTask(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            Create Task
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={data?.data || []}
        loading={isLoading}
        error={error ? getApiErrorMessage(error) : null}
        onRetry={refetch}
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        searchPlaceholder="Search tasks by code or title..."
        filters={
          <>
            <Select className="h-8 w-36 text-[12px]" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              <option value="">All statuses</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="submitted">Pending Review</option>
              <option value="revision_requested">Revision Needed</option>
              <option value="approved">Approved</option>
              <option value="archived">Archived</option>
            </Select>
            <Select className="h-8 w-32 text-[12px]" value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1); }}>
              <option value="">All priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </Select>
            {(status || priority || search) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setStatus('');
                  setPriority('');
                  setPage(1);
                }}
              >
                Reset
              </Button>
            )}
          </>
        }
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(col, dir) => {
          setSortBy(col);
          setSortOrder(dir);
        }}
        meta={data?.meta}
        onPageChange={setPage}
        onRowClick={(r) => setDrawerTaskId(r._id)}
        emptyTitle="No tasks found"
        emptyDescription="Create a task and assign it to a team member to get started."
        emptyAction={
          <Button size="sm" onClick={() => { setEditingTask(null); setFormOpen(true); }}>
            Create Task
          </Button>
        }
      />

      <TaskFormModal open={formOpen} onOpenChange={setFormOpen} task={editingTask} />
      <TaskDetailsDrawer
        open={Boolean(drawerTaskId)}
        onOpenChange={(o) => !o && setDrawerTaskId(null)}
        taskId={drawerTaskId}
        rolePrefix={rolePrefix}
      />
      <ConfirmDialog
        open={Boolean(archiveTask)}
        onOpenChange={(o) => !o && setArchiveTask(null)}
        title="Archive Task"
        description={`Archive "${archiveTask?.title}"? Archived tasks are removed from active queues while preserving history.`}
        confirmLabel="Archive"
        variant="danger"
        loading={archiveMutation.isPending}
        onConfirm={() => archiveMutation.mutate(archiveTask._id)}
      />
    </div>
  );
}

export function ManagerApprovalsPage() {
  const [decision, setDecision] = useState('pending');
  const [page, setPage] = useState(1);
  const [reviewId, setReviewId] = useState(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['approvals', decision, page],
    queryFn: () => approvalApi.list({ decision: decision === 'all' ? undefined : decision, page, limit: 20 }),
  });

  const columns = [
    {
      key: 'task',
      header: 'Task',
      render: (r) => (
        <div>
          <span className="mr-1.5 text-[11px] font-medium text-[#747B87]">{r.taskId?.taskCode}</span>
          <span className="font-medium text-[#202124]">{r.taskId?.title || '—'}</span>
        </div>
      ),
    },
    {
      key: 'submittedBy',
      header: 'Submitted By',
      render: (r) => (
        <div className="flex items-center gap-2">
          <Avatar
            name={r.submittedBy ? `${r.submittedBy.firstName} ${r.submittedBy.lastName}` : ''}
            src={r.submittedBy?.avatarUrl}
            size="xs"
          />
          <span>{r.submittedBy ? `${r.submittedBy.firstName} ${r.submittedBy.lastName}` : '—'}</span>
        </div>
      ),
    },
    { key: 'version', header: 'Version', render: (r) => `v${r.deliverableId?.version || 1}` },
    { key: 'submittedAt', header: 'Submitted', render: (r) => formatRelative(r.createdAt) },
    { key: 'decision', header: 'Status', render: (r) => <StatusBadge map={APPROVAL_STATUS_META} value={r.decision} /> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => (
        <Button variant="secondary" size="sm" onClick={() => setReviewId(r._id)}>
          <ClipboardCheck className="h-3.5 w-3.5" />
          {r.decision === 'pending' ? 'Review' : 'Inspect'}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Task Approvals"
        subtitle="Inspect submitted deliverables, approve completed work, or request targeted revisions."
      />

      <TabsBar
        activeTab={decision}
        onChange={(v) => {
          setDecision(v);
          setPage(1);
        }}
        tabs={[
          { value: 'pending', label: 'Pending Review' },
          { value: 'approved', label: 'Approved' },
          { value: 'revision_requested', label: 'Revision Requested' },
          { value: 'all', label: 'All Submissions' },
        ]}
      />

      <DataTable
        columns={columns}
        data={data?.data || []}
        loading={isLoading}
        error={error ? getApiErrorMessage(error) : null}
        onRetry={refetch}
        meta={data?.meta}
        onPageChange={setPage}
        onRowClick={(r) => setReviewId(r._id)}
        emptyTitle="No submissions in this queue"
        emptyDescription="Deliverables submitted by team members will appear here."
      />

      <ReviewSubmissionDrawer open={Boolean(reviewId)} onOpenChange={(o) => !o && setReviewId(null)} approvalId={reviewId} />
    </div>
  );
}

export function ManagerReviewDetailPage() {
  const { id } = useParams();
  const [approveOpen, setApproveOpen] = useState(false);
  const [revisionOpen, setRevisionOpen] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['approval', id],
    queryFn: () => approvalApi.getById(id),
  });

  if (isLoading) return <PageSkeleton />;
  if (error || !data?.data) return <ErrorState message={getApiErrorMessage(error)} onRetry={refetch} />;

  const approval = data.data;
  const deliv = approval.deliverableId;

  return (
    <div className="max-w-3xl space-y-5">
      <PageHeader
        title={`Review Submission · ${approval.taskId?.taskCode || ''}`}
        subtitle={approval.taskId?.title}
        breadcrumbs={[
          { label: 'Task Approvals', to: '/manager/approvals' },
          { label: `v${deliv?.version || 1}` },
        ]}
        actions={
          approval.decision === 'pending' && (
            <>
              <Button variant="danger-outline" size="sm" onClick={() => setRevisionOpen(true)}>
                Request Revision
              </Button>
              <Button size="sm" onClick={() => setApproveOpen(true)}>
                Approve Submission
              </Button>
            </>
          )
        }
      />

      <Panel>
        <PanelHeader
          title={`Deliverable v${deliv?.version || 1}`}
          description={`Submitted ${formatDateTime(deliv?.submittedAt)} by ${approval.submittedBy?.firstName} ${approval.submittedBy?.lastName}`}
          action={<StatusBadge map={APPROVAL_STATUS_META} value={approval.decision} />}
        />
        <div className="space-y-4 p-5 text-[13px]">
          <p className="whitespace-pre-wrap text-[#202124]">{deliv?.notes || 'No submission notes provided.'}</p>
          {approval.comments && (
            <div className="rounded-[8px] border border-[#E8EAED] bg-[#F8F9FB] p-3">
              <div className="text-[12px] font-medium text-[#747B87]">Review Notes</div>
              <p className="mt-1 text-[#202124]">{approval.comments}</p>
            </div>
          )}
        </div>
      </Panel>

      <ApproveConfirmModal open={approveOpen} onOpenChange={setApproveOpen} approval={approval} onSuccess={refetch} />
      <RequestRevisionModal open={revisionOpen} onOpenChange={setRevisionOpen} approval={approval} onSuccess={refetch} />
    </div>
  );
}
