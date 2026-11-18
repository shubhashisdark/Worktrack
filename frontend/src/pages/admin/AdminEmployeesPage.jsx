import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Edit3, Plus, UserCheck, UserX } from 'lucide-react';
import { departmentApi, employeeApi } from '@/services/api';
import { getApiErrorMessage } from '@/services/apiClient';
import { useDebounce } from '@/hooks/useDebounce';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { ConfirmDialog } from '@/components/common/States';
import { Avatar, StatusBadge } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/FormControls';
import { EmployeeFormModal } from '@/components/modals/OrgModals';
import { EMPLOYEE_STATUS_META, ROLE_META } from '@/utils/statusMaps';

export function AdminEmployeesPage({ managersOnly = false }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [roleFilter, setRoleFilter] = useState(managersOnly ? 'manager' : '');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);
  const [deactivateEmp, setDeactivateEmp] = useState(null);

  const debouncedSearch = useDebounce(search, 250);

  const { data: deptsRes } = useQuery({
    queryKey: ['departments', 'filter'],
    queryFn: () => departmentApi.list({ limit: 100 }),
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['employees', 'admin', { managersOnly, debouncedSearch, departmentId, roleFilter, statusFilter, page }],
    queryFn: () =>
      employeeApi.list({
        search: debouncedSearch || undefined,
        departmentId: departmentId || undefined,
        role: managersOnly ? 'manager' : roleFilter || undefined,
        status: statusFilter || undefined,
        page,
        limit: 20,
      }),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id) => employeeApi.deactivate(id),
    onSuccess: () => {
      toast.success('Employee deactivated');
      setDeactivateEmp(null);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const bulkMutation = useMutation({
    mutationFn: (status) => employeeApi.bulkStatus({ employeeIds: selectedIds, status }),
    onSuccess: (_res, status) => {
      toast.success(`Updated ${selectedIds.length} employee(s) to ${status}`);
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const columns = [
    {
      key: 'fullName',
      header: 'Employee',
      render: (e) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={e.fullName} src={e.avatarUrl} size="sm" />
          <div>
            <Link
              to={`/admin/employees/${e._id}`}
              onClick={(ev) => ev.stopPropagation()}
              className="font-medium text-[#202124] hover:text-[#3867D6]"
            >
              {e.fullName}
            </Link>
            <div className="text-[12px] text-[#747B87]">{e.email}</div>
          </div>
        </div>
      ),
    },
    { key: 'employeeCode', header: 'ID', render: (e) => <span className="text-[#5F6672]">{e.employeeCode}</span> },
    { key: 'jobTitle', header: 'Title', render: (e) => e.jobTitle },
    { key: 'department', header: 'Department', render: (e) => e.departmentId?.name || '—' },
    managersOnly
      ? { key: 'directReportsCount', header: 'Direct Reports', render: (e) => e.directReportsCount ?? 0 }
      : { key: 'role', header: 'Role', render: (e) => <StatusBadge map={ROLE_META} value={e.role} /> },
    { key: 'status', header: 'Status', render: (e) => <StatusBadge map={EMPLOYEE_STATUS_META} value={e.status} /> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (e) => (
        <div className="flex justify-end gap-1" onClick={(ev) => ev.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            title="Edit"
            onClick={() => {
              setEditingEmp(e);
              setModalOpen(true);
            }}
          >
            <Edit3 className="h-3.5 w-3.5" />
          </Button>
          {e.status !== 'inactive' && (
            <Button variant="ghost" size="icon" title="Deactivate" onClick={() => setDeactivateEmp(e)}>
              <UserX className="h-3.5 w-3.5 text-[#C0392B]" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={managersOnly ? 'Manager Management' : 'Employee Directory'}
        subtitle={
          managersOnly
            ? 'Manage department leads, reporting hierarchies, and team managers.'
            : 'Add, edit, assign departments, and manage organization user accounts.'
        }
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditingEmp(null);
              setModalOpen(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            {managersOnly ? 'Add Manager' : 'Add Employee'}
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={data?.data || []}
        loading={isLoading}
        error={error ? getApiErrorMessage(error) : null}
        onRetry={refetch}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        bulkActions={
          <>
            <Button variant="secondary" size="sm" onClick={() => bulkMutation.mutate('active')} loading={bulkMutation.isPending}>
              <UserCheck className="h-3.5 w-3.5" />
              Activate
            </Button>
            <Button variant="danger-outline" size="sm" onClick={() => bulkMutation.mutate('inactive')} loading={bulkMutation.isPending}>
              <UserX className="h-3.5 w-3.5" />
              Deactivate
            </Button>
          </>
        }
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
          setSelectedIds([]);
        }}
        searchPlaceholder="Search by name, email, or employee ID..."
        filters={
          <>
            <Select className="h-8 w-40 text-[12px]" value={departmentId} onChange={(e) => { setDepartmentId(e.target.value); setPage(1); setSelectedIds([]); }}>
              <option value="">All departments</option>
              {(deptsRes?.data || []).map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </Select>
            {!managersOnly && (
              <Select className="h-8 w-32 text-[12px]" value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); setSelectedIds([]); }}>
                <option value="">All roles</option>
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </Select>
            )}
            <Select className="h-8 w-32 text-[12px]" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); setSelectedIds([]); }}>
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="on_leave">On Leave</option>
              <option value="inactive">Inactive</option>
            </Select>
            {(departmentId || (!managersOnly && roleFilter) || statusFilter || search) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setDepartmentId('');
                  if (!managersOnly) setRoleFilter('');
                  setStatusFilter('');
                  setPage(1);
                  setSelectedIds([]);
                }}
              >
                Reset
              </Button>
            )}
          </>
        }
        meta={data?.meta}
        onPageChange={(p) => {
          setPage(p);
          setSelectedIds([]);
        }}
        onRowClick={(e) => navigate(`/admin/employees/${e._id}`)}
        emptyTitle="No employees found"
        emptyDescription="Add an employee account or adjust your filters."
      />

      <EmployeeFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        employee={editingEmp}
        defaultRole={managersOnly ? 'manager' : 'employee'}
      />

      <ConfirmDialog
        open={Boolean(deactivateEmp)}
        onOpenChange={(o) => !o && setDeactivateEmp(null)}
        title="Deactivate Employee"
        description={`Deactivate ${deactivateEmp?.fullName}? They will no longer be able to sign in, while historical records remain intact.`}
        confirmLabel="Deactivate"
        variant="danger"
        loading={deactivateMutation.isPending}
        onConfirm={() => deactivateMutation.mutate(deactivateEmp._id)}
      />
    </div>
  );
}
