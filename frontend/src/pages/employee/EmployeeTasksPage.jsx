import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Upload } from 'lucide-react';
import { taskApi } from '@/services/api';
import { getApiErrorMessage } from '@/services/apiClient';
import { useDebounce } from '@/hooks/useDebounce';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { ProgressBar, StatusBadge, TabsBar } from '@/components/ui/Primitives';
import { Select } from '@/components/ui/FormControls';
import { Button } from '@/components/ui/Button';
import { SubmitDeliverableModal, TaskDetailsDrawer } from '@/components/modals/TaskModals';
import { formatDate } from '@/utils/formatters';
import { PRIORITY_META, TASK_STATUS_META } from '@/utils/statusMaps';

export function EmployeeTasksPage({ historyOnly = false }) {
  const [tab, setTab] = useState(historyOnly ? 'approved' : 'all');
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('dueDate');
  const [sortOrder, setSortOrder] = useState('asc');
  const [drawerTaskId, setDrawerTaskId] = useState(null);
  const [submitTask, setSubmitTask] = useState(null);

  const debouncedSearch = useDebounce(search, 250);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['tasks', 'employee', { tab, debouncedSearch, priority, page, sortBy, sortOrder }],
    queryFn: () =>
      taskApi.list({
        page,
        limit: 15,
        search: debouncedSearch || undefined,
        priority: priority || undefined,
        assignmentStatus: tab !== 'all' ? tab : undefined,
        sortBy,
        sortOrder,
      }),
  });

  const rows = data?.data || [];

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
              to={`/employee/tasks/${row._id}`}
              onClick={(e) => e.stopPropagation()}
              className="font-medium text-[#202124] hover:text-[#3867D6]"
            >
              {row.title}
            </Link>
          </div>
          {row.createdBy && (
            <div className="mt-0.5 text-[11px] text-[#747B87]">
              Assigned by {row.createdBy.firstName} {row.createdBy.lastName}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      render: (row) => <StatusBadge map={PRIORITY_META} value={row.priority} />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge map={TASK_STATUS_META} value={row.myAssignment?.status || row.status} />,
    },
    {
      key: 'progress',
      header: 'Progress',
      render: (row) => (
        <div className="w-28">
          <ProgressBar value={row.progress} />
        </div>
      ),
    },
    {
      key: 'dueDate',
      header: 'Deadline',
      sortable: true,
      render: (row) => (
        <span className={row.isOverdue ? 'font-medium text-[#C0392B]' : 'text-[#5F6672]'}>
          {formatDate(row.dueDate)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => {
        const status = row.myAssignment?.status || row.status;
        return (
          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
            <Link to={`/employee/tasks/${row._id}`}>
              <Button variant="ghost" size="sm">
                View
              </Button>
            </Link>
            {status !== 'approved' && (
              <Button variant="secondary" size="sm" onClick={() => setSubmitTask(row)}>
                <Upload className="h-3 w-3" />
                Submit
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title={historyOnly ? 'Task History' : 'My Tasks'}
        subtitle={
          historyOnly
            ? 'Archive of completed and approved deliverables.'
            : 'Track your assigned work, update progress, and submit deliverables.'
        }
        actions={
          !historyOnly ? (
            <Link to="/employee/tasks/history">
              <Button variant="secondary" size="sm">
                Task History
              </Button>
            </Link>
          ) : (
            <Link to="/employee/tasks">
              <Button variant="secondary" size="sm">
                Back to Active Tasks
              </Button>
            </Link>
          )
        }
      />

      {!historyOnly && (
        <TabsBar
          activeTab={tab}
          onChange={(v) => {
            setTab(v);
            setPage(1);
          }}
          tabs={[
            { value: 'all', label: 'All Tasks' },
            { value: 'assigned', label: 'Assigned' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'submitted', label: 'Pending Review' },
            { value: 'revision_requested', label: 'Revision Needed' },
            { value: 'approved', label: 'Approved' },
          ]}
        />
      )}

      <DataTable
        columns={columns}
        data={rows}
        loading={isLoading}
        error={error ? getApiErrorMessage(error) : null}
        onRetry={refetch}
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        searchPlaceholder="Search by task code or title..."
        filters={
          <Select
            className="h-8 w-36 text-[12px]"
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </Select>
        }
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(col, dir) => {
          setSortBy(col);
          setSortOrder(dir);
        }}
        meta={data?.meta}
        onPageChange={setPage}
        onRowClick={(row) => setDrawerTaskId(row._id)}
        emptyTitle="No tasks match these filters"
        emptyDescription="Tasks assigned by your manager will appear here."
      />

      <TaskDetailsDrawer
        open={Boolean(drawerTaskId)}
        onOpenChange={(o) => !o && setDrawerTaskId(null)}
        taskId={drawerTaskId}
        rolePrefix="employee"
        onSubmitDeliverable={(task) => {
          setDrawerTaskId(null);
          setSubmitTask(task);
        }}
      />

      <SubmitDeliverableModal open={Boolean(submitTask)} onOpenChange={(o) => !o && setSubmitTask(null)} task={submitTask} />
    </div>
  );
}
