import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowRight, Building2, UserPlus } from 'lucide-react';
import { dashboardApi } from '@/services/api';
import { getApiErrorMessage } from '@/services/apiClient';
import { PageHeader } from '@/components/common/PageHeader';
import { MetricStrip } from '@/components/common/MetricStrip';
import { ErrorState, PageSkeleton } from '@/components/common/States';
import { Badge, Panel, PanelHeader } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';
import { DepartmentFormModal, EmployeeFormModal } from '@/components/modals/OrgModals';
import { formatDate, formatRelative } from '@/utils/formatters';

export function AdminDashboardPage() {
  const [addEmpOpen, setAddEmpOpen] = useState(false);
  const [addDeptOpen, setAddDeptOpen] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard', 'admin'],
    queryFn: () => dashboardApi.admin(),
  });

  if (isLoading) return <PageSkeleton />;
  if (error) return <ErrorState message={getApiErrorMessage(error)} onRetry={refetch} />;

  const dash = data?.data;
  const m = dash?.metrics || {};
  const att = dash?.attendanceOverview || {};

  return (
    <div className="space-y-5">
      <PageHeader
        title="Organization Overview"
        subtitle={`${formatDate(new Date(), 'EEEE, MMMM d, yyyy')} · Organization health, departments, and audit activity`}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => setAddDeptOpen(true)}>
              <Building2 className="h-3.5 w-3.5" />
              New Department
            </Button>
            <Button size="sm" onClick={() => setAddEmpOpen(true)}>
              <UserPlus className="h-3.5 w-3.5" />
              Add Employee
            </Button>
          </>
        }
      />

      <MetricStrip
        items={[
          { label: 'Total Employees', value: m.totalEmployees ?? 0, meta: `${m.activeEmployees ?? 0} active` },
          { label: 'Departments', value: m.activeDepartments ?? 0 },
          { label: 'Active Tasks', value: m.activeTasks ?? 0, meta: `${m.completedTasks ?? 0} done` },
          { label: 'Pending Approvals', value: m.pendingApprovals ?? 0, tone: m.pendingApprovals > 0 ? 'warning' : 'default' },
          { label: 'Attendance Today', value: `${att.attendanceRate ?? 0}%`, meta: `${att.checkedIn ?? 0} in` },
        ]}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Department Distribution */}
        <Panel className="lg:col-span-2">
          <PanelHeader
            title="Department Distribution"
            description="Active employees and tasks by department."
            action={
              <Link to="/admin/departments" className="inline-flex items-center gap-1 text-[12px] font-medium text-[#3867D6] hover:underline">
                Manage <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <div className="h-56 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dash?.departmentDistribution || []} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8EAED" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#747B87' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#747B87' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="employeeCount" name="Employees" fill="#3867D6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="activeTasks" name="Active Tasks" fill="#B8CCF5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="border-t border-[#E8EAED] divide-y divide-[#E8EAED]">
            {(dash?.departmentDistribution || []).map((dept) => (
              <Link
                key={dept._id}
                to={`/admin/departments/${dept._id}`}
                className="flex items-center justify-between px-4 py-2.5 text-[13px] hover:bg-[#F8F9FB]"
              >
                <div>
                  <span className="font-medium text-[#202124]">{dept.name}</span>
                  <span className="ml-2 text-[11px] text-[#747B87]">Lead: {dept.managerName}</span>
                </div>
                <div className="flex items-center gap-2 text-[12px]">
                  <Badge tone="neutral">{dept.employeeCount} members</Badge>
                  <Badge tone="info">{dept.activeTasks} active tasks</Badge>
                </div>
              </Link>
            ))}
          </div>
        </Panel>

        {/* Org Operations Snapshot */}
        <div className="space-y-5">
          <Panel>
            <PanelHeader title="Today's Attendance Snapshot" />
            <div className="space-y-3 p-4 text-[13px]">
              <div className="flex justify-between">
                <span className="text-[#747B87]">Checked In</span>
                <span className="font-semibold text-[#202124]">{att.checkedIn ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#747B87]">On Time (Present)</span>
                <span className="font-semibold text-[#1E7E5A]">{att.present ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#747B87]">Late Arrivals</span>
                <span className="font-semibold text-[#B26B00]">{att.late ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#747B87]">Checked Out</span>
                <span className="font-semibold text-[#5F6672]">{att.checkedOut ?? 0}</span>
              </div>
              <div className="border-t border-[#E8EAED] pt-3 flex justify-between">
                <span className="text-[#747B87]">Pending Leave Requests</span>
                <Link to="/admin/leave" className="font-semibold text-[#3867D6] hover:underline">
                  {m.pendingLeaves ?? 0}
                </Link>
              </div>
              <div className="flex justify-between">
                <span className="text-[#747B87]">Overdue Org Tasks</span>
                <Link to="/admin/tasks" className="font-semibold text-[#C0392B] hover:underline">
                  {m.overdueTasks ?? 0}
                </Link>
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title="Recent Activity Logs"
              action={
                <Link to="/admin/activity-logs" className="text-[12px] font-medium text-[#3867D6] hover:underline">
                  View all
                </Link>
              }
            />
            <div className="divide-y divide-[#E8EAED]">
              {(dash?.recentActivity || []).slice(0, 6).map((log) => (
                <div key={log._id} className="px-4 py-2.5 text-[12px]">
                  <div className="font-medium text-[#202124]">{log.summary}</div>
                  <div className="mt-0.5 flex items-center justify-between text-[11px] text-[#747B87]">
                    <span className="capitalize">{log.actorRole} · {log.action}</span>
                    <span>{formatRelative(log.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <EmployeeFormModal open={addEmpOpen} onOpenChange={setAddEmpOpen} />
      <DepartmentFormModal open={addDeptOpen} onOpenChange={setAddDeptOpen} />
    </div>
  );
}
