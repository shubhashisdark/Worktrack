import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle2, ExternalLink, FileText, RotateCcw } from 'lucide-react';
import { Drawer, Modal } from '@/components/ui/Overlays';
import { Button } from '@/components/ui/Button';
import { FormField, Textarea } from '@/components/ui/FormControls';
import { Avatar, StatusBadge } from '@/components/ui/Primitives';
import { approvalApi } from '@/services/api';
import { getApiErrorMessage } from '@/services/apiClient';
import { formatDate, formatDateTime } from '@/utils/formatters';
import { APPROVAL_STATUS_META, PRIORITY_META } from '@/utils/statusMaps';

export function ApproveConfirmModal({ open, onOpenChange, approval, onSuccess }) {
  const queryClient = useQueryClient();
  const [comments, setComments] = useState('');

  const mutation = useMutation({
    mutationFn: () => approvalApi.approve(approval._id, comments),
    onSuccess: () => {
      toast.success('Submission approved');
      setComments('');
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Approve Deliverable"
      description={approval?.taskId ? `${approval.taskId.taskCode} — ${approval.taskId.title}` : ''}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate()} loading={mutation.isPending}>
            <CheckCircle2 className="h-4 w-4" />
            Confirm Approval
          </Button>
        </>
      }
    >
      <FormField label="Approval Note (optional)">
        <Textarea
          rows={3}
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Add brief feedback or acknowledgement for the employee..."
        />
      </FormField>
    </Modal>
  );
}

export function RequestRevisionModal({ open, onOpenChange, approval, onSuccess }) {
  const queryClient = useQueryClient();
  const [comments, setComments] = useState('');

  const mutation = useMutation({
    mutationFn: () => approvalApi.requestRevision(approval._id, comments),
    onSuccess: () => {
      toast.success('Revision requested and employee notified');
      setComments('');
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Request Revision"
      description={approval?.taskId ? `${approval.taskId.taskCode} — ${approval.taskId.title}` : ''}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            disabled={comments.trim().length < 5}
            onClick={() => mutation.mutate()}
            loading={mutation.isPending}
          >
            <RotateCcw className="h-4 w-4" />
            Request Revision
          </Button>
        </>
      }
    >
      <FormField label="Revision Feedback" required helper="Be specific about what changes are needed before approval.">
        <Textarea
          rows={4}
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Outline required adjustments, missing items, or fixes..."
        />
      </FormField>
    </Modal>
  );
}

export function ReviewSubmissionDrawer({ open, onOpenChange, approvalId, onReviewed }) {
  const [approveOpen, setApproveOpen] = useState(false);
  const [revisionOpen, setRevisionOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['approval', approvalId],
    queryFn: () => approvalApi.getById(approvalId),
    enabled: open && Boolean(approvalId),
  });

  const approval = data?.data;
  const deliverable = approval?.deliverableId;
  const submitter = approval?.submittedBy;

  return (
    <>
      <Drawer
        open={open}
        onOpenChange={onOpenChange}
        title="Review Submission"
        subtitle={approval?.taskId ? `${approval.taskId.taskCode} · ${approval.taskId.title}` : ''}
        footer={
          approval?.decision === 'pending' && (
            <>
              <Button variant="danger-outline" size="sm" onClick={() => setRevisionOpen(true)}>
                <RotateCcw className="h-3.5 w-3.5" />
                Request Revision
              </Button>
              <Button size="sm" onClick={() => setApproveOpen(true)}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Approve Submission
              </Button>
            </>
          )
        }
      >
        {isLoading || !approval ? (
          <div className="space-y-3">
            <div className="h-5 w-48 animate-pulse rounded bg-[#ECEEF2]" />
            <div className="h-32 w-full animate-pulse rounded bg-[#ECEEF2]" />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Avatar
                  name={submitter ? `${submitter.firstName} ${submitter.lastName}` : ''}
                  src={submitter?.avatarUrl}
                  size="md"
                />
                <div>
                  <div className="text-[13px] font-medium text-[#202124]">
                    {submitter ? `${submitter.firstName} ${submitter.lastName}` : '—'}
                  </div>
                  <div className="text-[12px] text-[#747B87]">{submitter?.jobTitle}</div>
                </div>
              </div>
              <StatusBadge map={APPROVAL_STATUS_META} value={approval.decision} />
            </div>

            <div className="grid grid-cols-3 gap-3 rounded-[8px] border border-[#E8EAED] bg-[#F8F9FB] p-3 text-[12px]">
              <div>
                <div className="text-[#747B87]">Version</div>
                <div className="mt-0.5 font-medium text-[#202124]">v{deliverable?.version || 1}</div>
              </div>
              <div>
                <div className="text-[#747B87]">Priority</div>
                <div className="mt-0.5">
                  <StatusBadge map={PRIORITY_META} value={approval.taskId?.priority} />
                </div>
              </div>
              <div>
                <div className="text-[#747B87]">Due Date</div>
                <div className="mt-0.5 font-medium text-[#202124]">{formatDate(approval.taskId?.dueDate)}</div>
              </div>
            </div>

            <div>
              <div className="mb-1 text-[12px] font-medium text-[#747B87]">Submission Notes</div>
              <div className="rounded-[8px] border border-[#E8EAED] bg-white p-3 text-[13px] text-[#202124] whitespace-pre-wrap">
                {deliverable?.notes || 'No notes included.'}
              </div>
            </div>

            {deliverable?.files?.length > 0 && (
              <div>
                <div className="mb-1.5 text-[12px] font-medium text-[#747B87]">Attached Files</div>
                <div className="space-y-1.5">
                  {deliverable.files.map((f, idx) => (
                    <a
                      key={idx}
                      href={f.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-[8px] border border-[#E8EAED] px-3 py-2 text-[13px] text-[#3867D6] hover:bg-[#F8F9FB]"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <FileText className="h-4 w-4 shrink-0" />
                        <span className="truncate">{f.originalName}</span>
                      </span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {deliverable?.externalLinks?.length > 0 && (
              <div>
                <div className="mb-1.5 text-[12px] font-medium text-[#747B87]">External Links</div>
                <div className="space-y-1.5">
                  {deliverable.externalLinks.map((l, idx) => (
                    <a
                      key={idx}
                      href={l.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-[8px] border border-[#E8EAED] px-3 py-2 text-[13px] text-[#3867D6] hover:bg-[#F8F9FB]"
                    >
                      <span className="truncate">{l.label || l.url}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {approval.comments && (
              <div>
                <div className="mb-1 text-[12px] font-medium text-[#747B87]">Review Decision Notes</div>
                <div className="rounded-[8px] border border-[#E8EAED] bg-[#F8F9FB] p-3 text-[13px] text-[#202124]">
                  {approval.comments}
                  <div className="mt-1 text-[11px] text-[#747B87]">
                    Reviewed {formatDateTime(approval.reviewedAt)}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      <ApproveConfirmModal
        open={approveOpen}
        onOpenChange={setApproveOpen}
        approval={approval}
        onSuccess={() => {
          onOpenChange(false);
          onReviewed?.();
        }}
      />
      <RequestRevisionModal
        open={revisionOpen}
        onOpenChange={setRevisionOpen}
        approval={approval}
        onSuccess={() => {
          onOpenChange(false);
          onReviewed?.();
        }}
      />
    </>
  );
}
