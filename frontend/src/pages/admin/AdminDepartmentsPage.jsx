import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Edit3, Plus } from 'lucide-react';
import { departmentApi } from '@/services/api';
import { getApiErrorMessage } from '@/services/apiClient';
import { PageHeader } from '@/components/common/PageHeader';
import { MetricStrip } from '@/components/common/MetricStrip';
import { DataTable } from '@/components/common/DataTable';
import { ErrorState, PageSkeleton } from '@/components/common/States';
import { Avatar, Panel, PanelHeader, StatusBadge } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';
import { DepartmentFormModal } from '@/components/modals/OrgModals';
import { EMPLOYEE_STATUS_META, ROLE_META, TASK_STATUS_META } from '@/utils/statusMaps';
import { formatDate } from '@/utils/formatters';

export function AdminDepartmentsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['departments', 'table', search],
    queryFn: () => departmentApi.list({ search: search || undefined, limit: 50 }),
  });

  const columns = [
    {
      key: 'name',
      header: 'Department',
      render: (d) => (
        <div>
          <Link
            to={`/admin/departments/${d._id}`}
            onClick={(e) => e.stopPropagation()}
            className="font-medium text-[#202124] hover:text-[#3867D6]"
          >
            {d.name}
          </Link>
          <div className="text-[11px] text-[#747B87]">{d.description || '—'}</div>
        </div>
      ),
    },
    { key: 'code', header: 'Code', render: (d) => <span className="font-mono text-[12px]">{d.code}</span> },
    {
      key: 'manager',
      header: 'Department Manager',
      render: (d) =>
        d.managerId ? (
          <div className="flex items-center gap-2">
            <Avatar name={`${d.managerId.firstName} ${d.managerId.lastName}`} src={d.managerId.avatarUrl} size="xs" />
            <span>
              {d.managerId.firstName} {d.managerId.lastName}
            </span>
          </div>
        ) : (
          <span className="text-[#9AA0A6]">Unassigned</span>
        ),
    },
    { key: 'employeeCount', header: 'Members', render: (d) => d.employeeCount ?? 0 },
    { key: 'activeTaskCount', header: 'Active Tasks', render: (d) => d.activeTaskCount ?? 0 },
    { key: 'status', header: 'Status', render: (d) => <StatusBadge map={EMPLOYEE_STATUS_META} value={d.status} /> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (d) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            setEditingDept(d);
            setModalOpen(true);
          }}
        >
          <Edit3 className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Departments"
        subtitle="Organize teams, assign department managers, and monitor staffing."
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditingDept(null);
              setModalOpen(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            Create Department
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
        onSearchChange={setSearch}
        searchPlaceholder="Search departments..."
        onRowClick={(d) => navigate(`/admin/departments/${d._id}`)}
        emptyTitle="No departments configured"
        emptyDescription="Create your organization's departments to group employees and managers."
      />

      <DepartmentFormModal open={modalOpen} onOpenChange={setModalOpen} department={editingDept} />
    </div>
  );
}

export function AdminDepartmentDetailPage() {
  const { id } = useParams();
  const [editOpen, setEditOpen] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['department', id],
    queryFn: () => departmentApi.getById(id),
  });

  if (isLoading) return <PageSkeleton />;
  if (error || !data?.data) return <ErrorState message={getApiErrorMessage(error)} onRetry={refetch} />;

  const dept = data.data;

  return (
    <div className="space-y-5">
      <PageHeader
        title={`${dept.name} (${dept.code})`}
        subtitle={dept.description || 'Department details and staffing roster'}
        breadcrumbs={[
          { label: 'Departments', to: '/admin/departments' },
          { label: dept.name },
        ]}
        actions={
          <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
            <Edit3 className="h-3.5 w-3.5" />
            Edit Department
          </Button>
        }
      />

      <MetricStrip
        items={[
          { label: 'Members', value: dept.employeeCount ?? 0 },
          { label: 'Active Tasks', value: dept.tasks?.length ?? 0 },
          {
            label: 'Department Lead',
            value: dept.managerId ? `${dept.managerId.firstName} ${dept.managerId.lastName}` : 'Unassigned',
          },
        ]}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel>
          <PanelHeader title={`Department Members (${dept.employees?.length || 0})`} />
          <div className="divide-y divide-[#E8EAED]">
            {(dept.employees || []).map((emp) => (
              <Link
                key={emp._id}
                to={`/admin/employees/${emp._id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-[#F8F9FB]"
              >
                <div className="flex items-center gap-2.5">
                  <Avatar name={emp.fullName} src={emp.avatarUrl} size="sm" />
                  <div>
                    <div className="text-[13px] font-medium text-[#202124]">{emp.fullName}</div>
                    <div className="text-[12px] text-[#747B87]">{emp.jobTitle}</div>
                  </div>
                </div>
                <StatusBadge map={ROLE_META} value={emp.role} />
              </Link>
            ))}
            {(!dept.employees || dept.employees.length === 0) && (
              <div className="px-4 py-8 text-center text-[13px] text-[#747B87]">No members assigned yet.</div>
            )}
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Active Tasks" />
          <div className="divide-y divide-[#E8EAED]">
            {(dept.tasks || []).map((t) => (
              <Link
                key={t._id}
                to={`/admin/tasks/${t._id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-[#F8F9FB]"
              >
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-medium text-[#202124]">
                    <span className="mr-1.5 text-[11px] text-[#747B87]">{t.taskCode}</span>
                    {t.title}
                  </div>
                  <div className="text-[11px] text-[#747B87]">Due {formatDate(t.dueDate)}</div>
                </div>
                <StatusBadge map={TASK_STATUS_META} value={t.status} />
              </Link>
            ))}
            {(!dept.tasks || dept.tasks.length === 0) && (
              <div className="px-4 py-8 text-center text-[13px] text-[#747B87]">No active tasks in this department.</div>
            )}
          </div>
        </Panel>
      </div>

      <DepartmentFormModal open={editOpen} onOpenChange={setEditOpen} department={dept} />
    </div>
  );
}
