import React from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowRight, Calendar, CheckCircle2, Clock, FileText, LogIn, LogOut, Star } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { attendanceApi, dashboardApi } from '@/services/api';
import { getApiErrorMessage } from '@/services/apiClient';
import { PageHeader } from '@/components/common/PageHeader';
import { MetricStrip } from '@/components/common/MetricStrip';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/common/States';
import { Panel, PanelHeader, ProgressBar, StatusBadge } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';
import { formatDate, formatMinutes, formatRelative, formatTime } from '@/utils/formatters';
import { ATTENDANCE_STATUS_META, PRIORITY_META, TASK_STATUS_META } from '@/utils/statusMaps';

export function EmployeeDashboardPage() {
  const { employee } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard', 'employee'],
    queryFn: () => dashboardApi.employee(),
  });

  const checkInMutation = useMutation({
    mutationFn: () => attendanceApi.checkIn(),
    onSuccess: () => {
      toast.success('Checked in for today');
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'employee'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const checkOutMutation = useMutation({
    mutationFn: () => attendanceApi.checkOut(),
    onSuccess: () => {
      toast.success('Checked out for today');
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'employee'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  if (isLoading) return <PageSkeleton />;
  if (error) return <ErrorState message={getApiErrorMessage(error)} onRetry={refetch} />;

  const dash = data?.data;
  const att = dash?.todayAttendance;
  const m = dash?.metrics || {};

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Good day, ${employee?.firstName || 'there'}`}
        subtitle={`${formatDate(new Date(), 'EEEE, MMMM d, yyyy')} · Personal workspace overview`}
        actions={
          <div className="flex items-center gap-2">
            {!dash?.hasSubmittedDailyReportToday && (
              <Link to="/employee/daily-reports/new">
                <Button variant="secondary" size="sm">
                  <FileText className="h-3.5 w-3.5" />
                  Submit Daily Report
                </Button>
              </Link>
            )}
            {!att ? (
              <Button size="sm" onClick={() => checkInMutation.mutate()} loading={checkInMutation.isPending}>
                <LogIn className="h-3.5 w-3.5" />
                Check In
              </Button>
            ) : !att.checkOutAt ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => checkOutMutation.mutate()}
                loading={checkOutMutation.isPending}
              >
                <LogOut className="h-3.5 w-3.5" />
                Check Out
              </Button>
            ) : null}
          </div>
        }
      />

      {/* Today's Attendance Status Bar */}
      <Panel className="flex flex-wrap items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#EEF2FC] text-[#3867D6]">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[13px] font-medium text-[#202124]">Today's Attendance</div>
            <div className="text-[12px] text-[#747B87]">
              {!att
                ? 'Not checked in yet'
                : att.checkOutAt
                ? `Checked in at ${formatTime(att.checkInAt)} · Checked out at ${formatTime(att.checkOutAt)} (${formatMinutes(att.workingMinutes)})`
                : `Checked in at ${formatTime(att.checkInAt)} · ${formatMinutes(Math.max(1, Math.round((Date.now() - new Date(att.checkInAt).getTime()) / 60000)))} elapsed`}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {att && <StatusBadge map={ATTENDANCE_STATUS_META} value={att.status} />}
          <Link to="/employee/attendance" className="text-[12px] font-medium text-[#3867D6] hover:underline">
            Attendance log
          </Link>
        </div>
      </Panel>

      {/* Personal Metrics */}
      <MetricStrip
        items={[
          { label: 'Assigned', value: m.assignedTasks ?? 0 },
          { label: 'In Progress', value: m.inProgressTasks ?? 0 },
          { label: 'Pending Approval', value: m.pendingApprovalTasks ?? 0, tone: 'warning' },
          { label: 'Completed', value: m.completedTasks ?? 0, tone: 'success' },
          { label: 'Overdue', value: m.overdueTasks ?? 0, tone: m.overdueTasks > 0 ? 'danger' : 'default' },
        ]}
      />

      {/* Primary Two-Column Layout */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Assigned Tasks */}
        <Panel className="lg:col-span-2">
          <PanelHeader
            title="Active Assigned Tasks"
            description="Your current priorities sorted by due date."
            action={
              <Link to="/employee/tasks" className="inline-flex items-center gap-1 text-[12px] font-medium text-[#3867D6] hover:underline">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          {dash?.assignedTasks?.length ? (
            <div className="divide-y divide-[#E8EAED]">
              {dash.assignedTasks.map((item) => {
                const t = item.taskId;
                return (
                  <Link
                    key={item._id}
                    to={`/employee/tasks/${t._id}`}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-[#F8F9FB]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-[#747B87]">{t.taskCode}</span>
                        <span className="truncate text-[13px] font-medium text-[#202124]">{t.title}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-[12px] text-[#747B87]">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Due {formatDate(t.dueDate)}
                        </span>
                        <StatusBadge map={PRIORITY_META} value={t.priority} />
                        <StatusBadge map={TASK_STATUS_META} value={item.status} />
                      </div>
                    </div>
                    <div className="w-28 shrink-0">
                      <ProgressBar value={item.progress} />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={CheckCircle2}
              title="All caught up"
              description="You have no active pending tasks right now."
            />
          )}
        </Panel>

        {/* Right Rail: Upcoming Deadlines & Pending Approvals */}
        <div className="space-y-5">
          <Panel>
            <PanelHeader title="Upcoming Deadlines" description="Due within the next 7 days." />
            {dash?.upcomingDeadlines?.length ? (
              <div className="divide-y divide-[#E8EAED]">
                {dash.upcomingDeadlines.map((item) => (
                  <Link
                    key={item._id}
                    to={`/employee/tasks/${item.taskId._id}`}
                    className="flex items-center justify-between gap-2 px-4 py-2.5 text-[13px] hover:bg-[#F8F9FB]"
                  >
                    <span className="truncate font-medium text-[#202124]">{item.taskId.title}</span>
                    <span className="shrink-0 text-[12px] text-[#747B87]">{formatDate(item.taskId.dueDate, 'MMM d')}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-4 py-6 text-center text-[12px] text-[#747B87]">No deadlines in the next 7 days.</div>
            )}
          </Panel>

          <Panel>
            <PanelHeader title="Pending Approvals" description="Deliverables awaiting manager sign-off." />
            {dash?.pendingApprovals?.length ? (
              <div className="divide-y divide-[#E8EAED]">
                {dash.pendingApprovals.map((app) => (
                  <Link
                    key={app._id}
                    to={`/employee/tasks/${app.taskId?._id}`}
                    className="block px-4 py-2.5 hover:bg-[#F8F9FB]"
                  >
                    <div className="truncate text-[13px] font-medium text-[#202124]">{app.taskId?.title}</div>
                    <div className="mt-0.5 text-[11px] text-[#747B87]">Submitted {formatRelative(app.createdAt)}</div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-4 py-6 text-center text-[12px] text-[#747B87]">No submissions pending review.</div>
            )}
          </Panel>
        </div>
      </div>

      {/* Bottom Row: Manager Feedback & Recent Activity */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel>
          <PanelHeader
            title="Recent Manager Feedback"
            action={
              <Link to="/employee/feedback" className="text-[12px] font-medium text-[#3867D6] hover:underline">
                View all
              </Link>
            }
          />
          {dash?.recentFeedback?.length ? (
            <div className="divide-y divide-[#E8EAED]">
              {dash.recentFeedback.map((fb) => (
                <div key={fb._id} className="px-4 py-3">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-medium text-[#202124]">
                      {fb.managerId ? `${fb.managerId.firstName} ${fb.managerId.lastName}` : 'Manager'}
                    </span>
                    <span className="inline-flex items-center gap-1 font-medium text-[#B26B00]">
                      <Star className="h-3 w-3 fill-current" /> {fb.rating}/5
                    </span>
                  </div>
                  <p className="mt-1 text-[13px] text-[#5F6672]">{fb.comment}</p>
                  <div className="mt-1 text-[11px] text-[#9AA0A6]">{formatRelative(fb.createdAt)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-[12px] text-[#747B87]">No feedback recorded yet.</div>
          )}
        </Panel>

        <Panel>
          <PanelHeader title="Recent Activity" />
          {dash?.recentActivity?.length ? (
            <div className="divide-y divide-[#E8EAED]">
              {dash.recentActivity.map((act) => (
                <div key={act._id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[13px]">
                  <span className="truncate text-[#202124]">{act.summary}</span>
                  <span className="shrink-0 text-[11px] text-[#9AA0A6]">{formatRelative(act.createdAt)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-[12px] text-[#747B87]">No recent activity.</div>
          )}
        </Panel>
      </div>
    </div>
  );
}
