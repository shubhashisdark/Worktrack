import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Calendar, CheckCircle2, Edit3, ExternalLink, FileText, MessageSquare, Send, Upload } from 'lucide-react';
import { taskApi } from '@/services/api';
import { getApiErrorMessage } from '@/services/apiClient';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState, PageSkeleton } from '@/components/common/States';
import { Avatar, Panel, PanelHeader, ProgressBar, StatusBadge } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/FormControls';
import { SubmitDeliverableModal, TaskFormModal } from '@/components/modals/TaskModals';
import { ReviewSubmissionDrawer } from '@/components/modals/ApprovalModals';
import { formatDate, formatDateTime, formatRelative } from '@/utils/formatters';
import { APPROVAL_STATUS_META, PRIORITY_META, TASK_STATUS_META } from '@/utils/statusMaps';

export function TaskDetailPage({ rolePrefix = 'employee' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [progressInput, setProgressInput] = useState(null);
  const [progressNote, setProgressNote] = useState('');
  const [commentText, setCommentText] = useState('');
  const [submitOpen, setSubmitOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [reviewApprovalId, setReviewApprovalId] = useState(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['task', id],
    queryFn: () => taskApi.getById(id),
  });

  const task = data?.data;

  const progressMutation = useMutation({
    mutationFn: () =>
      taskApi.updateProgress(id, {
        progress: progressInput ?? task?.progress ?? 0,
        note: progressNote,
      }),
    onSuccess: () => {
      toast.success('Task progress updated');
      setProgressNote('');
      queryClient.invalidateQueries({ queryKey: ['task', id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const commentMutation = useMutation({
    mutationFn: () => taskApi.addComment(id, commentText),
    onSuccess: () => {
      setCommentText('');
      toast.success('Comment posted');
      queryClient.invalidateQueries({ queryKey: ['task', id] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  if (isLoading) return <PageSkeleton />;
  if (error || !task) {
    return <ErrorState message={getApiErrorMessage(error, 'Task could not be loaded.')} onRetry={refetch} />;
  }

  const canManage = user?.role === 'manager' || user?.role === 'admin';
  const isAssignedEmployee = Boolean(task.myAssignment);
  const effectiveProgress = progressInput ?? task.myAssignment?.progress ?? task.progress ?? 0;
  const pendingApproval = task.approvals?.find((a) => a.decision === 'pending');

  return (
    <div>
      <PageHeader
        title={`${task.taskCode} · ${task.title}`}
        breadcrumbs={[
          { label: rolePrefix === 'employee' ? 'My Tasks' : 'Tasks', to: `/${rolePrefix}/tasks` },
          { label: task.taskCode || 'Details' },
        ]}
        actions={
          <>
            {canManage && (
              <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
                <Edit3 className="h-3.5 w-3.5" />
                Edit Task
              </Button>
            )}
            {canManage && pendingApproval && (
              <Button size="sm" onClick={() => setReviewApprovalId(pendingApproval._id)}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Review Submission
              </Button>
            )}
            {isAssignedEmployee && task.myAssignment.status !== 'approved' && (
              <Button size="sm" onClick={() => setSubmitOpen(true)}>
                <Upload className="h-3.5 w-3.5" />
                Submit Deliverable
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Primary Column */}
        <div className="space-y-5 lg:col-span-2">
          <Panel className="p-5 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge map={TASK_STATUS_META} value={task.myAssignment?.status || task.status} />
              <StatusBadge map={PRIORITY_META} value={task.priority} />
              {task.isOverdue && (
                <span className="rounded bg-[#FDEEEC] px-2 py-0.5 text-[12px] font-medium text-[#C0392B]">
                  Overdue
                </span>
              )}
            </div>

            <div>
              <h2 className="text-[13px] font-semibold text-[#202124]">Description</h2>
              <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-relaxed text-[#5F6672]">
                {task.description || 'No description provided.'}
              </p>
            </div>

            {task.attachments?.length > 0 && (
              <div className="border-t border-[#E8EAED] pt-4">
                <h3 className="mb-2 text-[12px] font-medium text-[#747B87]">Reference Attachments</h3>
                <div className="flex flex-wrap gap-2">
                  {task.attachments.map((file, idx) => (
                    <a
                      key={idx}
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-[7px] border border-[#E8EAED] bg-[#F8F9FB] px-3 py-1.5 text-[12px] text-[#3867D6] hover:bg-[#EEF2FC]"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      {file.originalName}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </Panel>

          {/* Employee Progress Update Box */}
          {isAssignedEmployee && task.myAssignment.status !== 'approved' && (
            <Panel>
              <PanelHeader title="Update Progress" description="Move the slider and log a brief status note." />
              <div className="space-y-3 p-4">
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={effectiveProgress}
                    onChange={(e) => setProgressInput(Number(e.target.value))}
                    className="flex-1 accent-[#3867D6]"
                  />
                  <span className="w-12 text-right text-[14px] font-semibold tabular-nums text-[#202124]">
                    {effectiveProgress}%
                  </span>
                </div>
                <Textarea
                  rows={2}
                  value={progressNote}
                  onChange={(e) => setProgressNote(e.target.value)}
                  placeholder="Optional note about what changed..."
                />
                <div className="flex justify-end">
                  <Button size="sm" onClick={() => progressMutation.mutate()} loading={progressMutation.isPending}>
                    Save Progress
                  </Button>
                </div>
              </div>
            </Panel>
          )}

          {/* Deliverables */}
          <Panel>
            <PanelHeader
              title={`Deliverables (${task.deliverables?.length || 0})`}
              description="Versioned work submissions and approval status."
            />
            {task.deliverables?.length ? (
              <div className="divide-y divide-[#E8EAED]">
                {task.deliverables.map((d) => {
                  const matchingApproval = task.approvals?.find(
                    (a) => String(a.deliverableId) === String(d._id)
                  );
                  return (
                    <div key={d._id} className="p-4 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold text-[#202124]">Version {d.version}</span>
                          <StatusBadge map={APPROVAL_STATUS_META} value={d.status} />
                        </div>
                        <span className="text-[12px] text-[#747B87]">{formatDateTime(d.submittedAt)}</span>
                      </div>
                      {d.notes && <p className="text-[13px] text-[#5F6672] whitespace-pre-wrap">{d.notes}</p>}
                      <div className="flex flex-wrap gap-2">
                        {(d.files || []).map((f, i) => (
                          <a
                            key={i}
                            href={f.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded bg-[#F1F3F6] px-2.5 py-1 text-[12px] text-[#3867D6] hover:underline"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            {f.originalName}
                          </a>
                        ))}
                        {(d.externalLinks || []).map((l, i) => (
                          <a
                            key={i}
                            href={l.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded bg-[#EEF2FC] px-2.5 py-1 text-[12px] text-[#3867D6] hover:underline"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            {l.label || l.url}
                          </a>
                        ))}
                      </div>
                      {matchingApproval?.comments && (
                        <div className="mt-2 rounded-[7px] border border-[#E8EAED] bg-[#F8F9FB] p-2.5 text-[12px] text-[#202124]">
                          <span className="font-medium">Reviewer Feedback: </span>
                          {matchingApproval.comments}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-[13px] text-[#747B87]">
                No deliverables submitted yet.
              </div>
            )}
          </Panel>

          {/* Comments & Activity History */}
          <Panel>
            <PanelHeader title="Activity & Comments" />
            <div className="p-4 space-y-4">
              <div className="flex gap-2">
                <Textarea
                  rows={2}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && commentText.trim() && !commentMutation.isPending) {
                      e.preventDefault();
                      commentMutation.mutate();
                    }
                  }}
                  placeholder="Write a comment or update for the team... (Ctrl+Enter to post)"
                />
                <Button
                  size="sm"
                  className="self-end"
                  disabled={!commentText.trim()}
                  loading={commentMutation.isPending}
                  onClick={() => commentMutation.mutate()}
                >
                  <Send className="h-3.5 w-3.5" />
                  Post
                </Button>
              </div>

              <div className="divide-y divide-[#E8EAED]">
                {(task.updates || []).map((u) => (
                  <div key={u._id} className="flex items-start gap-3 py-3">
                    <Avatar
                      name={u.authorId ? `${u.authorId.firstName} ${u.authorId.lastName}` : 'System'}
                      src={u.authorId?.avatarUrl}
                      size="xs"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-[12px]">
                        <span className="font-medium text-[#202124]">
                          {u.authorId ? `${u.authorId.firstName} ${u.authorId.lastName}` : 'System'}
                        </span>
                        <span className="rounded bg-[#F1F3F6] px-1.5 py-0.5 text-[10px] uppercase text-[#747B87]">
                          {u.type.replace('_', ' ')}
                        </span>
                        <span className="text-[#9AA0A6]">{formatRelative(u.createdAt)}</span>
                      </div>
                      <p className="mt-1 text-[13px] text-[#5F6672]">{u.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        </div>

        {/* Metadata Sidebar */}
        <div className="space-y-4">
          <Panel className="p-4 space-y-3.5 text-[13px]">
            <div>
              <div className="text-[12px] text-[#747B87]">Overall Progress</div>
              <div className="mt-1.5">
                <ProgressBar value={task.progress} />
              </div>
            </div>
            <div className="border-t border-[#E8EAED] pt-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[#747B87]">Deadline</span>
                <span className="inline-flex items-center gap-1 font-medium text-[#202124]">
                  <Calendar className="h-3.5 w-3.5 text-[#747B87]" />
                  {formatDate(task.dueDate)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#747B87]">Department</span>
                <span className="font-medium text-[#202124]">{task.departmentId?.name || 'General'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#747B87]">Assigned By</span>
                <span className="font-medium text-[#202124]">
                  {task.createdBy ? `${task.createdBy.firstName} ${task.createdBy.lastName}` : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#747B87]">Created</span>
                <span className="text-[#5F6672]">{formatDate(task.createdAt)}</span>
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHeader title={`Assignees (${task.assignments?.length || 0})`} />
            <div className="divide-y divide-[#E8EAED]">
              {(task.assignments || []).map((a) => (
                <div key={a._id} className="flex items-center justify-between gap-2 px-4 py-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar
                      name={a.employeeId ? `${a.employeeId.firstName} ${a.employeeId.lastName}` : ''}
                      src={a.employeeId?.avatarUrl}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-medium text-[#202124]">
                        {a.employeeId ? `${a.employeeId.firstName} ${a.employeeId.lastName}` : '—'}
                      </div>
                      <div className="truncate text-[11px] text-[#747B87]">{a.employeeId?.jobTitle}</div>
                    </div>
                  </div>
                  <StatusBadge map={TASK_STATUS_META} value={a.status} />
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <SubmitDeliverableModal open={submitOpen} onOpenChange={setSubmitOpen} task={task} />
      <TaskFormModal open={editOpen} onOpenChange={setEditOpen} task={task} />
      <ReviewSubmissionDrawer
        open={Boolean(reviewApprovalId)}
        onOpenChange={(o) => !o && setReviewApprovalId(null)}
        approvalId={reviewApprovalId}
        onReviewed={() => queryClient.invalidateQueries({ queryKey: ['task', id] })}
      />
    </div>
  );
}
