import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, MessageSquare } from 'lucide-react';
import { employeeApi, taskApi } from '@/services/api';
import { getApiErrorMessage } from '@/services/apiClient';
import { useDebounce } from '@/hooks/useDebounce';
import { PageHeader } from '@/components/common/PageHeader';
import { MetricStrip } from '@/components/common/MetricStrip';
import { DataTable } from '@/components/common/DataTable';
import { ErrorState, PageSkeleton } from '@/components/common/States';
import { Avatar, Panel, PanelHeader, ProgressBar, StatusBadge } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';
import { GiveFeedbackModal } from '@/components/modals/OrgModals';
import { formatDate, formatMinutes, formatTime } from '@/utils/formatters';
import { ATTENDANCE_STATUS_META, EMPLOYEE_STATUS_META, PRIORITY_META, TASK_STATUS_META } from '@/utils/statusMaps';

export function ManagerTeamPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 250);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['employees', 'team', debouncedSearch, page],
    queryFn: () => employeeApi.list({ search: debouncedSearch || undefined, page, limit: 20 }),
  });

  const columns = [
    {
      key: 'fullName',
      header: 'Employee',
      render: (e) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={e.fullName} src={e.avatarUrl} size="sm" />
          <div>
            <div className="font-medium text-[#202124]">{e.fullName}</div>
            <div className="text-[12px] text-[#747B87]">{e.email}</div>
          </div>
        </div>
      ),
    },
    { key: 'jobTitle', header: 'Role / Title', render: (e) => e.jobTitle },
    { key: 'department', header: 'Department', render: (e) => e.departmentId?.name || '—' },
    { key: 'activeTasksCount', header: 'Active Tasks', render: (e) => e.activeTasksCount ?? 0 },
    {
      key: 'todayAttendance',
      header: 'Today',
      render: (e) =>
        e.todayAttendance ? (
          <StatusBadge map={ATTENDANCE_STATUS_META} value={e.todayAttendance.status} />
        ) : (
          <span className="text-[12px] text-[#9AA0A6]">Not checked in</span>
        ),
    },
    { key: 'status', header: 'Status', render: (e) => <StatusBadge map={EMPLOYEE_STATUS_META} value={e.status} /> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (e) => (
        <div className="flex justify-end gap-1.5" onClick={(ev) => ev.stopPropagation()}>
          <Link to={`/manager/team/${e._id}`}>
            <Button variant="ghost" size="sm">
              Details
            </Button>
          </Link>
          <Link to={`/manager/performance/${e._id}`}>
            <Button variant="secondary" size="sm">
              Performance
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Team Members"
        subtitle="Manage your direct reports and monitor workload, attendance, and performance."
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
        searchPlaceholder="Search team by name, email, or title..."
        meta={data?.meta}
        onPageChange={setPage}
        onRowClick={(e) => navigate(`/manager/team/${e._id}`)}
        emptyTitle="No team members found"
        emptyDescription="Employees assigned to you or your department will appear here."
      />
    </div>
  );
}

export function ManagerEmployeeDetailPage({ rolePrefix = 'manager' }) {
  const { id } = useParams();
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => employeeApi.getById(id),
  });

  const { data: tasksRes } = useQuery({
    queryKey: ['tasks', 'employee-detail', id],
    queryFn: () => taskApi.list({ assigneeId: id, limit: 15 }),
    enabled: Boolean(id),
  });

  if (isLoading) return <PageSkeleton />;
  if (error || !data?.data) return <ErrorState message={getApiErrorMessage(error)} onRetry={refetch} />;

  const emp = data.data;
  const tasks = tasksRes?.data || [];

  return (
    <div className="space-y-5">
      <PageHeader
        title={emp.fullName}
        subtitle={`${emp.jobTitle} · ${emp.employeeCode}`}
        breadcrumbs={[
          { label: rolePrefix === 'admin' ? 'Employees' : 'Team Members', to: rolePrefix === 'admin' ? '/admin/employees' : '/manager/team' },
          { label: emp.fullName },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setFeedbackOpen(true)}>
              <MessageSquare className="h-3.5 w-3.5" />
              Give Feedback
            </Button>
            <Link to={`/${rolePrefix}/performance/${emp._id}`}>
              <Button size="sm">
                <BarChart3 className="h-3.5 w-3.5" />
                Performance Profile
              </Button>
            </Link>
          </div>
        }
      />

      <MetricStrip
        items={[
          { label: 'Total Tasks', value: emp.taskStats?.total ?? 0 },
          { label: 'In Progress', value: (emp.taskStats?.assigned ?? 0) + (emp.taskStats?.in_progress ?? 0) },
          { label: 'Pending Review', value: emp.taskStats?.submitted ?? 0, tone: 'warning' },
          { label: 'Approved', value: emp.taskStats?.approved ?? 0, tone: 'success' },
        ]}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Panel className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <Avatar name={emp.fullName} src={emp.avatarUrl} size="lg" />
            <div>
              <div className="font-semibold text-[#202124]">{emp.fullName}</div>
              <div className="text-[12px] text-[#747B87]">{emp.email}</div>
              <div className="mt-1">
                <StatusBadge map={EMPLOYEE_STATUS_META} value={emp.status} />
              </div>
            </div>
          </div>
          <dl className="space-y-2.5 border-t border-[#E8EAED] pt-4 text-[13px]">
            <div className="flex justify-between">
              <dt className="text-[#747B87]">Department</dt>
              <dd className="font-medium">{emp.departmentId?.name || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#747B87]">Phone</dt>
              <dd className="font-medium">{emp.phone || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#747B87]">Location</dt>
              <dd className="font-medium">{emp.location || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#747B87]">Hire Date</dt>
              <dd className="font-medium">{formatDate(emp.hireDate)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#747B87]">Leave Balances</dt>
              <dd className="font-medium">
                {emp.leaveBalances?.annual ?? 0}A / {emp.leaveBalances?.sick ?? 0}S / {emp.leaveBalances?.casual ?? 0}C
              </dd>
            </div>
          </dl>
        </Panel>

        <div className="space-y-5 lg:col-span-2">
          <Panel>
            <PanelHeader title="Assigned Tasks" />
            {tasks.length ? (
              <div className="divide-y divide-[#E8EAED]">
                {tasks.map((t) => (
                  <Link
                    key={t._id}
                    to={`/${rolePrefix}/tasks/${t._id}`}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-[#F8F9FB]"
                  >
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium text-[#202124]">
                        <span className="mr-2 text-[11px] text-[#747B87]">{t.taskCode}</span>
                        {t.title}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-[12px] text-[#747B87]">
                        <span>Due {formatDate(t.dueDate)}</span>
                        <StatusBadge map={PRIORITY_META} value={t.priority} />
                        <StatusBadge map={TASK_STATUS_META} value={t.status} />
                      </div>
                    </div>
                    <div className="w-24">
                      <ProgressBar value={t.progress} />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-[13px] text-[#747B87]">No tasks assigned.</div>
            )}
          </Panel>

          <Panel>
            <PanelHeader title="Recent Attendance" />
            {emp.recentAttendance?.length ? (
              <div className="divide-y divide-[#E8EAED]">
                {emp.recentAttendance.slice(0, 6).map((a) => (
                  <div key={a._id} className="flex items-center justify-between px-4 py-2.5 text-[13px]">
                    <span className="font-medium">{a.date}</span>
                    <span className="text-[#747B87]">
                      {formatTime(a.checkInAt)} – {a.checkOutAt ? formatTime(a.checkOutAt) : 'Active'}
                    </span>
                    <span className="text-[#5F6672]">{formatMinutes(a.workingMinutes)}</span>
                    <StatusBadge map={ATTENDANCE_STATUS_META} value={a.status} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-[13px] text-[#747B87]">No recent attendance logs.</div>
            )}
          </Panel>
        </div>
      </div>

      <GiveFeedbackModal open={feedbackOpen} onOpenChange={setFeedbackOpen} employeeId={emp._id} />
    </div>
  );
}
