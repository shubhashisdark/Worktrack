import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { MessageSquare, Star } from 'lucide-react';
import { feedbackApi, performanceApi } from '@/services/api';
import { getApiErrorMessage } from '@/services/apiClient';
import { PageHeader } from '@/components/common/PageHeader';
import { MetricStrip } from '@/components/common/MetricStrip';
import { EmptyState, ErrorState, LoadingSkeleton, PageSkeleton } from '@/components/common/States';
import { Avatar, Badge, Panel, PanelHeader, ProgressBar } from '@/components/ui/Primitives';
import { formatDate } from '@/utils/formatters';

export function EmployeeFeedbackPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['feedback', 'employee'],
    queryFn: () => feedbackApi.list({ limit: 50 }),
  });

  const items = data?.data || [];

  return (
    <div>
      <PageHeader
        title="Manager Feedback"
        subtitle="Constructive reviews and recognition from your manager."
      />

      <Panel>
        {isLoading ? (
          <div className="p-4">
            <LoadingSkeleton rows={4} />
          </div>
        ) : error ? (
          <div className="p-4">
            <ErrorState message={getApiErrorMessage(error)} onRetry={refetch} />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No feedback yet"
            description="Reviews and recognition shared by your manager will appear here."
          />
        ) : (
          <div className="divide-y divide-[#E8EAED]">
            {items.map((fb) => (
              <div key={fb._id} className="p-5 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <Avatar
                      name={fb.managerId ? `${fb.managerId.firstName} ${fb.managerId.lastName}` : 'Manager'}
                      src={fb.managerId?.avatarUrl}
                      size="sm"
                    />
                    <div>
                      <div className="text-[13px] font-medium text-[#202124]">
                        {fb.managerId ? `${fb.managerId.firstName} ${fb.managerId.lastName}` : 'Manager'}
                      </div>
                      <div className="text-[11px] text-[#747B87]">{formatDate(fb.createdAt)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone="neutral" className="capitalize">
                      {fb.category.replace('_', ' ')}
                    </Badge>
                    <Badge tone="warning">
                      <Star className="mr-1 h-3 w-3 fill-current" />
                      {fb.rating} / 5
                    </Badge>
                  </div>
                </div>
                <p className="text-[13px] leading-relaxed text-[#202124]">{fb.comment}</p>
                {fb.taskId && (
                  <div className="text-[12px] text-[#747B87]">
                    Related task: <span className="font-medium text-[#202124]">{fb.taskId.taskCode} · {fb.taskId.title}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

export function EmployeePerformancePage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['performance', 'me'],
    queryFn: () => performanceApi.me(),
  });

  if (isLoading) return <PageSkeleton />;
  if (error) return <ErrorState message={getApiErrorMessage(error)} onRetry={refetch} />;

  const perf = data?.data;
  const m = perf?.metrics || {};
  const w = perf?.weights || {};

  return (
    <div className="space-y-5">
      <PageHeader
        title="My Performance"
        subtitle="Transparent multi-factor breakdown of your task execution, timeliness, approvals, attendance, and feedback."
      />

      <MetricStrip
        items={[
          { label: 'Composite Index', value: `${perf?.compositeScore ?? 0}%`, tone: 'success' },
          { label: 'Task Completion', value: `${m.taskCompletionRate ?? 0}%`, meta: `${w.taskCompletion}% wt` },
          { label: 'On-Time Delivery', value: `${m.onTimeCompletionRate ?? 0}%`, meta: `${w.onTimeCompletion}% wt` },
          { label: 'Approval Rate', value: `${m.approvalRate ?? 0}%`, meta: `${w.approvalRate}% wt` },
          { label: 'Avg Feedback', value: m.avgFeedbackRating ? `${m.avgFeedbackRating}/5` : '—', meta: `${w.feedbackRating}% wt` },
        ]}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHeader title="6-Month Task Delivery Trend" description="Assigned vs. approved deliverables by month." />
          <div className="h-64 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perf?.trend || []} barGap={4}>
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
          <PanelHeader title="Metric Breakdown" description="Exact formula weights configured by your organization." />
          <div className="space-y-4 p-4 text-[13px]">
            {[
              { label: 'Task Completion Rate', val: m.taskCompletionRate, weight: w.taskCompletion },
              { label: 'On-Time Completion', val: m.onTimeCompletionRate, weight: w.onTimeCompletion },
              { label: 'First-Pass Approval Rate', val: m.approvalRate, weight: w.approvalRate },
              { label: '30-Day Attendance Rate', val: m.attendanceRate, weight: w.attendanceRate },
              { label: 'Manager Feedback Score', val: m.feedbackPercent, weight: w.feedbackRating },
            ].map((row) => (
              <div key={row.label} className="space-y-1">
                <div className="flex justify-between text-[12px]">
                  <span className="font-medium text-[#202124]">{row.label}</span>
                  <span className="text-[#747B87]">Weight: {row.weight}%</span>
                </div>
                <ProgressBar value={row.val} />
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
