import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { activityLogApi, settingsApi } from '@/services/api';
import { getApiErrorMessage } from '@/services/apiClient';
import { useDebounce } from '@/hooks/useDebounce';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { ErrorState, PageSkeleton } from '@/components/common/States';
import { Badge, Panel, PanelHeader, StatusBadge, Switch } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Select } from '@/components/ui/FormControls';
import { formatDateTime } from '@/utils/formatters';
import { ROLE_META } from '@/utils/statusMaps';

export function AdminRolesPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['settings', 'roles'],
    queryFn: () => settingsApi.listRoles(),
  });

  const mutation = useMutation({
    mutationFn: ({ role, permissions }) => settingsApi.updateRole(role, permissions),
    onSuccess: (_res, { role }) => {
      toast.success(`Updated permissions for ${role}`);
      queryClient.invalidateQueries({ queryKey: ['settings', 'roles'] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  if (isLoading) return <PageSkeleton />;
  if (error) return <ErrorState message={getApiErrorMessage(error)} onRetry={refetch} />;

  const roles = data?.data || [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Roles & Permissions"
        subtitle="Configure role-based capabilities enforced on the backend API across Employee, Manager, and Admin portals."
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {roles.map((r) => {
          const entries = Object.entries(r.permissions || {});
          return (
            <Panel key={r.role}>
              <PanelHeader
                title={<span className="capitalize">{r.role} Role</span>}
                description={`${entries.filter(([, v]) => v).length} of ${entries.length} permissions active`}
                action={<StatusBadge map={ROLE_META} value={r.role} />}
              />
              <div className="divide-y divide-[#E8EAED] px-4">
                {entries.map(([key, enabled]) => (
                  <div key={key} className="flex items-center justify-between py-3">
                    <div>
                      <div className="text-[13px] font-medium text-[#202124]">{key}</div>
                    </div>
                    <Switch
                      checked={Boolean(enabled)}
                      disabled={r.role === 'admin' || mutation.isPending}
                      onCheckedChange={(val) =>
                        mutation.mutate({
                          role: r.role,
                          permissions: { ...r.permissions, [key]: val },
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

export function AdminOrgSettingsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['settings', 'organization'],
    queryFn: () => settingsApi.getOrganization(),
  });

  const [form, setForm] = useState(null);

  useEffect(() => {
    if (data?.data) {
      setForm(data.data);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: (payload) => settingsApi.updateOrganization(payload),
    onSuccess: () => {
      toast.success('Organization settings saved');
      queryClient.invalidateQueries({ queryKey: ['settings', 'organization'] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  if (isLoading || !form) return <PageSkeleton />;
  if (error) return <ErrorState message={getApiErrorMessage(error)} onRetry={refetch} />;

  const weights = form.performanceWeights || {};
  const weightSum =
    Number(weights.taskCompletion || 0) +
    Number(weights.onTimeCompletion || 0) +
    Number(weights.approvalRate || 0) +
    Number(weights.attendanceRate || 0) +
    Number(weights.feedbackRating || 0);

  const handleSave = (e) => {
    e.preventDefault();
    if (weightSum !== 100) {
      toast.error(`Performance weights must sum to 100% (currently ${weightSum}%)`);
      return;
    }
    mutation.mutate({
      organizationName: form.organizationName,
      timezone: form.timezone,
      workStartTime: form.workStartTime,
      workEndTime: form.workEndTime,
      lateThresholdMinutes: Number(form.lateThresholdMinutes),
      defaultLeaveQuotas: {
        annual: Number(form.defaultLeaveQuotas.annual),
        sick: Number(form.defaultLeaveQuotas.sick),
        casual: Number(form.defaultLeaveQuotas.casual),
      },
      performanceWeights: {
        taskCompletion: Number(weights.taskCompletion),
        onTimeCompletion: Number(weights.onTimeCompletion),
        approvalRate: Number(weights.approvalRate),
        attendanceRate: Number(weights.attendanceRate),
        feedbackRating: Number(weights.feedbackRating),
      },
      maxUploadSizeMb: Number(form.maxUploadSizeMb),
    });
  };

  return (
    <div className="max-w-4xl space-y-5">
      <PageHeader
        title="Organization Settings"
        subtitle="Configure working hours, leave policies, and transparent performance metric weights."
      />

      <form onSubmit={handleSave} className="space-y-5">
        <Panel>
          <PanelHeader title="General & Attendance Schedule" />
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
            <FormField label="Organization Name">
              <Input
                value={form.organizationName}
                onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
              />
            </FormField>
            <FormField label="Timezone">
              <Input value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} />
            </FormField>
            <FormField label="Work Start Time (HH:mm)">
              <Input
                type="time"
                value={form.workStartTime}
                onChange={(e) => setForm({ ...form, workStartTime: e.target.value })}
              />
            </FormField>
            <FormField label="Work End Time (HH:mm)">
              <Input
                type="time"
                value={form.workEndTime}
                onChange={(e) => setForm({ ...form, workEndTime: e.target.value })}
              />
            </FormField>
            <FormField label="Late Arrival Grace (minutes)">
              <Input
                type="number"
                min={0}
                max={180}
                value={form.lateThresholdMinutes}
                onChange={(e) => setForm({ ...form, lateThresholdMinutes: e.target.value })}
              />
            </FormField>
            <FormField label="Max Upload File Size (MB)">
              <Input
                type="number"
                min={1}
                max={50}
                value={form.maxUploadSizeMb}
                onChange={(e) => setForm({ ...form, maxUploadSizeMb: e.target.value })}
              />
            </FormField>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Default Annual Leave Quotas (Days)" />
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
            {['annual', 'sick', 'casual'].map((key) => (
              <FormField key={key} label={`${key.charAt(0).toUpperCase() + key.slice(1)} Leave`}>
                <Input
                  type="number"
                  min={0}
                  value={form.defaultLeaveQuotas?.[key] ?? 0}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      defaultLeaveQuotas: { ...form.defaultLeaveQuotas, [key]: e.target.value },
                    })
                  }
                />
              </FormField>
            ))}
          </div>
        </Panel>

        <Panel>
          <PanelHeader
            title="Performance Formula Weights"
            description="Must total exactly 100%."
            action={
              <Badge tone={weightSum === 100 ? 'success' : 'danger'}>Total: {weightSum}%</Badge>
            }
          />
          <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-5">
            {[
              { key: 'taskCompletion', label: 'Task Completion' },
              { key: 'onTimeCompletion', label: 'On-Time Rate' },
              { key: 'approvalRate', label: 'Approval Rate' },
              { key: 'attendanceRate', label: 'Attendance' },
              { key: 'feedbackRating', label: 'Feedback' },
            ].map((item) => (
              <FormField key={item.key} label={`${item.label} (%)`}>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={weights[item.key] ?? 0}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      performanceWeights: { ...weights, [item.key]: Number(e.target.value) },
                    })
                  }
                />
              </FormField>
            ))}
          </div>
        </Panel>

        <div className="flex justify-end">
          <Button type="submit" loading={mutation.isPending}>
            Save Organization Settings
          </Button>
        </div>
      </form>
    </div>
  );
}

export function AdminActivityLogsPage() {
  const [search, setSearch] = useState('');
  const [actorRole, setActorRole] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 250);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['activity-logs', { debouncedSearch, actorRole, page }],
    queryFn: () =>
      activityLogApi.list({
        search: debouncedSearch || undefined,
        actorRole: actorRole || undefined,
        page,
        limit: 25,
      }),
  });

  const columns = [
    { key: 'createdAt', header: 'Timestamp', render: (r) => <span className="text-[12px] text-[#747B87]">{formatDateTime(r.createdAt)}</span> },
    {
      key: 'actor',
      header: 'Actor',
      render: (r) => (
        <span className="font-medium text-[#202124]">
          {r.actorEmployeeId ? `${r.actorEmployeeId.firstName} ${r.actorEmployeeId.lastName}` : 'System'}
        </span>
      ),
    },
    { key: 'actorRole', header: 'Role', render: (r) => <StatusBadge map={ROLE_META} value={r.actorRole} /> },
    { key: 'action', header: 'Action', render: (r) => <span className="font-mono text-[12px] text-[#5F6672]">{r.action}</span> },
    { key: 'summary', header: 'Summary', render: (r) => r.summary },
  ];

  return (
    <div>
      <PageHeader
        title="Activity Logs"
        subtitle="Audit trail of authentication, employee management, task lifecycle, and approval events."
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
        searchPlaceholder="Search action or summary..."
        filters={
          <Select className="h-8 w-36 text-[12px]" value={actorRole} onChange={(e) => { setActorRole(e.target.value); setPage(1); }}>
            <option value="">All roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="employee">Employee</option>
          </Select>
        }
        meta={data?.meta}
        onPageChange={setPage}
        emptyTitle="No activity logs recorded"
        emptyDescription="System audit entries will populate automatically."
      />
    </div>
  );
}
