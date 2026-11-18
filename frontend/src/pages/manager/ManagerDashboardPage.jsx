import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, CheckCircle2, ClipboardCheck, Plus } from 'lucide-react';
import { dashboardApi } from '@/services/api';
import { getApiErrorMessage } from '@/services/apiClient';
import { PageHeader } from '@/components/common/PageHeader';
import { MetricStrip } from '@/components/common/MetricStrip';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/common/States';
import { Avatar, Badge, Panel, PanelHeader, StatusBadge } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';
import { TaskFormModal } from '@/components/modals/TaskModals';
import { ReviewSubmissionDrawer } from '@/components/modals/ApprovalModals';
import { formatDate, formatRelative, formatTime } from '@/utils/formatters';
import { ATTENDANCE_STATUS_META, PRIORITY_META } from '@/utils/statusMaps';

export function ManagerDashboardPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [reviewApprovalId, setReviewApprovalId] = useState(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard', 'manager'],
    queryFn: () => dashboardApi.manager(),
  });

  if (isLoading) return <PageSkeleton />;
  if (error) return <ErrorState message={getApiErrorMessage(error)} onRetry={refetch} />;

  const dash = data?.data;
  const m = dash?.metrics || {};
  const att = dash?.attendanceOverview || {};

  return (
    <div className="space-y-5">
      <PageHeader
        title="Team Overview"
        subtitle={`${formatDate(new Date(), 'EEEE, MMMM d, yyyy')} · Monitor workload, approvals, and team attendance`}
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Create Task
          </Button>
        }
      />

      <MetricStrip
        items={[
          { label: 'Team Members', value: m.teamSize ?? 0 },
          { label: 'Active Tasks', value: m.activeTasks ?? 0 },
          { label: 'Pending Approvals', value: m.pendingApprovals ?? 0, tone: m.pendingApprovals > 0 ? 'warning' : 'default' },
          { label: 'Overdue Tasks', value: m.overdueTasks ?? 0, tone: m.overdueTasks > 0 ? 'danger' : 'default' },
          { label: 'Completed Tasks', value: m.completedTasks ?? 0, tone: 'success' },
        ]}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Pending Approvals Queue */}
        <Panel className="lg:col-span-2">
          <PanelHeader
            title="Submissions Awaiting Review"
            description="Review deliverables to keep your team unblocked."
            action={
              <Link to="/manager/approvals" className="inline-flex items-center gap-1 text-[12px] font-medium text-[#3867D6] hover:underline">
                Approval queue <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          {dash?.recentSubmissions?.length ? (
            <div className="divide-y divide-[#E8EAED]">
              {dash.recentSubmissions.map((item) => (
                <div key={item._id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-[#F8F9FB]">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-[#747B87]">{item.taskId?.taskCode}</span>
                      <span className="truncate text-[13px] font-medium text-[#202124]">{item.taskId?.title}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[12px] text-[#747B87]">
                      <span>
                        {item.submittedBy ? `${item.submittedBy.firstName} ${item.submittedBy.lastName}` : 'Employee'}
                      </span>
                      <span>· v{item.deliverableId?.version || 1}</span>
                      <span>· {formatRelative(item.createdAt)}</span>
                      <StatusBadge map={PRIORITY_META} value={item.taskId?.priority} />
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => setReviewApprovalId(item._id)}>
                    <ClipboardCheck className="h-3.5 w-3.5" />
                    Review
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CheckCircle2}
              title="No pending approvals"
              description="All submitted deliverables have been reviewed."
            />
          )}
        </Panel>

        {/* Team Attendance Today */}
        <Panel>
          <PanelHeader
            title="Today's Attendance"
            description={`${att.present + att.late} of ${m.teamSize || 0} checked in`}
            action={
              <Link to="/manager/attendance" className="text-[12px] font-medium text-[#3867D6] hover:underline">
                Details
              </Link>
            }
          />
          <div className="grid grid-cols-3 border-b border-[#E8EAED] text-center divide-x divide-[#E8EAED] py-2.5 text-[12px]">
            <div>
              <div className="text-[#747B87]">Present</div>
              <div className="font-semibold text-[#1E7E5A]">{att.present ?? 0}</div>
            </div>
            <div>
              <div className="text-[#747B87]">Late</div>
              <div className="font-semibold text-[#B26B00]">{att.late ?? 0}</div>
            </div>
            <div>
              <div className="text-[#747B87]">Not In</div>
              <div className="font-semibold text-[#5F6672]">{att.notCheckedIn ?? 0}</div>
            </div>
          </div>
          <div className="divide-y divide-[#E8EAED]">
            {(att.records || []).slice(0, 6).map((rec) => (
              <div key={rec._id} className="flex items-center justify-between px-4 py-2.5 text-[13px]">
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar
                    name={rec.employeeId ? `${rec.employeeId.firstName} ${rec.employeeId.lastName}` : ''}
                    src={rec.employeeId?.avatarUrl}
                    size="xs"
                  />
                  <span className="truncate font-medium">
                    {rec.employeeId ? `${rec.employeeId.firstName} ${rec.employeeId.lastName}` : '—'}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[12px] text-[#747B87]">{formatTime(rec.checkInAt)}</span>
                  <StatusBadge map={ATTENDANCE_STATUS_META} value={rec.status} />
                </div>
              </div>
            ))}
            {(!att.records || att.records.length === 0) && (
              <div className="px-4 py-6 text-center text-[12px] text-[#747B87]">No check-ins recorded yet today.</div>
            )}
          </div>
        </Panel>
      </div>

      {/* Team Workload & Recent Activity */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel>
          <PanelHeader
            title="Team Workload"
            description="Active task distribution across your direct reports."
            action={
              <Link to="/manager/team" className="text-[12px] font-medium text-[#3867D6] hover:underline">
                Team directory
              </Link>
            }
          />
          <div className="divide-y divide-[#E8EAED]">
            {(dash?.workload || []).map((row) => (
              <Link
                key={row.employeeId}
                to={`/manager/team/${row.employeeId}`}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-[#F8F9FB]"
              >
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-medium text-[#202124]">{row.name}</div>
                  <div className="truncate text-[11px] text-[#747B87]">{row.jobTitle}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0 text-[12px]">
                  <Badge tone="info">{row.active} active</Badge>
                  {row.submitted > 0 && <Badge tone="warning">{row.submitted} review</Badge>}
                  {row.overdue > 0 && <Badge tone="danger">{row.overdue} overdue</Badge>}
                  <Badge tone="success">{row.completed} done</Badge>
                </div>
              </Link>
            ))}
            {(!dash?.workload || dash.workload.length === 0) && (
              <div className="px-4 py-8 text-center text-[12px] text-[#747B87]">No team members assigned yet.</div>
            )}
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Recent Team Activity" />
          <div className="divide-y divide-[#E8EAED]">
            {(dash?.recentActivity || []).slice(0, 7).map((act) => (
              <div key={act._id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[13px]">
                <div className="min-w-0">
                  <span className="font-medium text-[#202124]">
                    {act.actorEmployeeId ? `${act.actorEmployeeId.firstName} ${act.actorEmployeeId.lastName}` : 'Member'}:{' '}
                  </span>
                  <span className="text-[#5F6672]">{act.summary}</span>
                </div>
                <span className="shrink-0 text-[11px] text-[#9AA0A6]">{formatRelative(act.createdAt)}</span>
              </div>
            ))}
            {(!dash?.recentActivity || dash.recentActivity.length === 0) && (
              <div className="px-4 py-8 text-center text-[12px] text-[#747B87]">No recent team activity.</div>
            )}
          </div>
        </Panel>
      </div>

      <TaskFormModal open={createOpen} onOpenChange={setCreateOpen} />
      <ReviewSubmissionDrawer
        open={Boolean(reviewApprovalId)}
        onOpenChange={(o) => !o && setReviewApprovalId(null)}
        approvalId={reviewApprovalId}
        onReviewed={() => queryClient.invalidateQueries({ queryKey: ['dashboard', 'manager'] })}
      />
    </div>
  );
}
