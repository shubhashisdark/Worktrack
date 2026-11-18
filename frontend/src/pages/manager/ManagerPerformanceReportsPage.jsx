import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Download, MessageSquare, Star } from 'lucide-react';
import { departmentApi, performanceApi, reportsApi } from '@/services/api';
import { getApiErrorMessage } from '@/services/apiClient';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { MetricStrip } from '@/components/common/MetricStrip';
import { DataTable } from '@/components/common/DataTable';
import { ErrorState, PageSkeleton } from '@/components/common/States';
import { Avatar, Badge, Panel, PanelHeader, ProgressBar } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/FormControls';
import { GiveFeedbackModal } from '@/components/modals/OrgModals';
import { exportToCsv, formatDate } from '@/utils/formatters';

export function TeamPerformancePage({ rolePrefix = 'manager', title = 'Team Performance' }) {
  const { user } = useAuth();
  const [departmentId, setDepartmentId] = useState('');
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const { data: deptsRes } = useQuery({
    queryKey: ['departments', 'perf-filter'],
    queryFn: () => departmentApi.list({ limit: 100 }),
    enabled: user?.role === 'admin',
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['performance', 'team', departmentId],
    queryFn: () => performanceApi.team({ departmentId: departmentId || undefined }),
  });

  const payload = data?.data;
  const members = payload?.members || [];
  const summary = payload?.summary || {};

  const handleExport = () => {
    exportToCsv(
      `worktrack-performance-${new Date().toISOString().slice(0, 10)}.csv`,
      members.map((m) => ({
        Employee: m.employee.fullName,
        Code: m.employee.employeeCode,
        Title: m.employee.jobTitle,
        CompositeScore: `${m.compositeScore}%`,
        TaskCompletion: `${m.metrics.taskCompletionRate}%`,
        OnTimeRate: `${m.metrics.onTimeCompletionRate}%`,
        ApprovalRate: `${m.metrics.approvalRate}%`,
        AttendanceRate: `${m.metrics.attendanceRate}%`,
        AvgFeedback: m.metrics.avgFeedbackRating || 0,
      }))
    );
  };

  const columns = [
    {
      key: 'employee',
      header: 'Employee',
      render: (m) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={m.employee.fullName} src={m.employee.avatarUrl} size="sm" />
          <div>
            <Link
              to={`/${rolePrefix}/performance/${m.employee._id}`}
              className="font-medium text-[#202124] hover:text-[#3867D6]"
            >
              {m.employee.fullName}
            </Link>
            <div className="text-[11px] text-[#747B87]">{m.employee.jobTitle}</div>
          </div>
        </div>
      ),
    },
    { key: 'completion', header: 'Completion', render: (m) => `${m.metrics.taskCompletionRate}%` },
    { key: 'onTime', header: 'On-Time', render: (m) => `${m.metrics.onTimeCompletionRate}%` },
    { key: 'approval', header: 'Approval Rate', render: (m) => `${m.metrics.approvalRate}%` },
    { key: 'attendance', header: 'Attendance', render: (m) => `${m.metrics.attendanceRate}%` },
    {
      key: 'feedback',
      header: 'Feedback',
      render: (m) => (m.metrics.avgFeedbackRating ? `${m.metrics.avgFeedbackRating} / 5` : '—'),
    },
    {
      key: 'compositeScore',
      header: 'Composite',
      render: (m) => (
        <div className="w-28">
          <ProgressBar value={m.compositeScore} />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title={title}
        subtitle="Multi-factor performance evaluation based on task completion, timeliness, approvals, attendance, and feedback."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleExport} disabled={members.length === 0}>
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
            <Button size="sm" onClick={() => setFeedbackOpen(true)}>
              <MessageSquare className="h-3.5 w-3.5" />
              Give Feedback
            </Button>
          </div>
        }
      />

      <MetricStrip
        items={[
          { label: 'Avg Composite', value: `${summary.avgCompositeScore ?? 0}%`, tone: 'success' },
          { label: 'Avg Completion', value: `${summary.avgTaskCompletionRate ?? 0}%` },
          { label: 'Avg On-Time', value: `${summary.avgOnTimeRate ?? 0}%` },
          { label: 'Avg Approval Rate', value: `${summary.avgApprovalRate ?? 0}%` },
          { label: 'Avg Attendance', value: `${summary.avgAttendanceRate ?? 0}%` },
        ]}
      />

      <DataTable
        columns={columns}
        data={members}
        rowKey={(m) => m.employee._id}
        loading={isLoading}
        error={error ? getApiErrorMessage(error) : null}
        onRetry={refetch}
        filters={
          user?.role === 'admin' && (
            <Select className="h-8 w-44 text-[12px]" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
              <option value="">All departments</option>
              {(deptsRes?.data || []).map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </Select>
          )
        }
        emptyTitle="No performance data available"
        emptyDescription="Performance metrics populate automatically from tasks, approvals, attendance, and feedback."
      />

      <GiveFeedbackModal
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
        employees={members.map((m) => m.employee)}
      />
    </div>
  );
}

export function EmployeePerformanceDetailPage({ rolePrefix = 'manager' }) {
  const { id } = useParams();
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['performance', 'employee', id],
    queryFn: () => performanceApi.employee(id),
  });

  if (isLoading) return <PageSkeleton />;
  if (error || !data?.data) return <ErrorState message={getApiErrorMessage(error)} onRetry={refetch} />;

  const perf = data.data;
  const m = perf.metrics || {};

  return (
    <div className="space-y-5">
      <PageHeader
        title={`${perf.employee?.fullName} — Performance`}
        subtitle={`${perf.employee?.jobTitle} · ${perf.employee?.departmentId?.name || 'General'}`}
        breadcrumbs={[
          { label: 'Performance', to: `/${rolePrefix}/performance` },
          { label: perf.employee?.fullName || 'Employee' },
        ]}
        actions={
          <Button size="sm" onClick={() => setFeedbackOpen(true)}>
            <MessageSquare className="h-3.5 w-3.5" />
            Add Feedback
          </Button>
        }
      />

      <MetricStrip
        items={[
          { label: 'Composite Index', value: `${perf.compositeScore}%`, tone: 'success' },
          { label: 'Task Completion', value: `${m.taskCompletionRate}%` },
          { label: 'On-Time Rate', value: `${m.onTimeCompletionRate}%` },
          { label: 'Approval Rate', value: `${m.approvalRate}%` },
          { label: 'Attendance (30d)', value: `${m.attendanceRate}%` },
        ]}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="6-Month Delivery Trend" />
          <div className="h-64 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perf.trend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8EAED" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#747B87' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#747B87' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="assigned" name="Assigned" fill="#D3DFF9" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" name="Approved" fill="#3867D6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Recorded Feedback" />
          {perf.recentFeedback?.length ? (
            <div className="divide-y divide-[#E8EAED]">
              {perf.recentFeedback.map((fb) => (
                <div key={fb._id} className="p-4 text-[13px]">
                  <div className="flex items-center justify-between">
                    <Badge tone="neutral" className="capitalize">
                      {fb.category.replace('_', ' ')}
                    </Badge>
                    <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[#B26B00]">
                      <Star className="h-3 w-3 fill-current" /> {fb.rating}/5
                    </span>
                  </div>
                  <p className="mt-1.5 text-[#202124]">{fb.comment}</p>
                  <div className="mt-1 text-[11px] text-[#747B87]">{formatDate(fb.createdAt)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-10 text-center text-[13px] text-[#747B87]">No feedback recorded yet.</div>
          )}
        </Panel>
      </div>

      <GiveFeedbackModal open={feedbackOpen} onOpenChange={setFeedbackOpen} employeeId={id} />
    </div>
  );
}

export function ManagerReportsPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['reports', 'summary'],
    queryFn: () => reportsApi.get(),
  });

  if (isLoading) return <PageSkeleton />;
  if (error) return <ErrorState message={getApiErrorMessage(error)} onRetry={refetch} />;

  const rep = data?.data;
  const taskChart = Object.entries(rep?.tasksByStatus || {}).map(([name, count]) => ({
    name: name.replace('_', ' '),
    count,
  }));

  const handleExport = () => {
    exportToCsv(
      `worktrack-summary-${new Date().toISOString().slice(0, 10)}.csv`,
      taskChart.map((row) => ({ Metric: `Tasks (${row.name})`, Count: row.count }))
    );
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Team Reports"
        subtitle={`Reporting window: ${rep?.range?.from} to ${rep?.range?.to}`}
        actions={
          <Button variant="secondary" size="sm" onClick={handleExport}>
            <Download className="h-3.5 w-3.5" />
            Export Summary CSV
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="Tasks by Lifecycle Status" />
          <div className="h-64 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8EAED" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#747B87' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#747B87' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="count" name="Tasks" fill="#3867D6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Attendance & Leave Summary (Last 30 Days)" />
          <div className="divide-y divide-[#E8EAED] p-4 space-y-4">
            <div>
              <div className="mb-2 text-[12px] font-medium text-[#747B87]">Attendance Breakdown</div>
              <div className="space-y-2 text-[13px]">
                {(rep?.attendanceSummary || []).map((row) => (
                  <div key={row.status} className="flex justify-between">
                    <span className="capitalize text-[#202124]">{row.status.replace('_', ' ')}</span>
                    <span className="text-[#5F6672]">
                      {row.count} logs · {row.totalHours}h
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-4">
              <div className="mb-2 text-[12px] font-medium text-[#747B87]">Leave Requests</div>
              <div className="space-y-2 text-[13px]">
                {(rep?.leaveSummary || []).map((row) => (
                  <div key={row.status} className="flex justify-between">
                    <span className="capitalize text-[#202124]">{row.status}</span>
                    <span className="text-[#5F6672]">
                      {row.count} requests ({row.totalDays} days)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
