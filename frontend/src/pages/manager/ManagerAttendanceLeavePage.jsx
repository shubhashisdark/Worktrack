import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, MessageSquare, X } from 'lucide-react';
import { attendanceApi, dailyReportApi, leaveApi } from '@/services/api';
import { getApiErrorMessage } from '@/services/apiClient';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { Modal } from '@/components/ui/Overlays';
import { Avatar, Badge, StatusBadge, TabsBar } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Select, Textarea } from '@/components/ui/FormControls';
import { formatDate, formatMinutes, formatTime } from '@/utils/formatters';
import { ATTENDANCE_STATUS_META, LEAVE_STATUS_META } from '@/utils/statusMaps';

export function TeamAttendancePage({ title = 'Team Attendance', subtitle = 'Monitor daily attendance, late arrivals, and missing check-outs.' }) {
  const queryClient = useQueryClient();
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [missingOnly, setMissingOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [adjustRecord, setAdjustRecord] = useState(null);
  const [adjustNotes, setAdjustNotes] = useState('');
  const [adjustCheckout, setAdjustCheckout] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['attendance', 'team', { dateFilter, statusFilter, missingOnly, page }],
    queryFn: () =>
      attendanceApi.list({
        date: dateFilter || undefined,
        status: statusFilter || undefined,
        missingCheckout: missingOnly ? 'true' : undefined,
        page,
        limit: 20,
      }),
  });

  const adjustMutation = useMutation({
    mutationFn: () =>
      attendanceApi.adjust(adjustRecord._id, {
        checkOutAt: adjustCheckout ? new Date(`${adjustRecord.date}T${adjustCheckout}:00.000Z`).toISOString() : undefined,
        notes: adjustNotes,
      }),
    onSuccess: () => {
      toast.success('Attendance record updated');
      setAdjustRecord(null);
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const columns = [
    {
      key: 'employee',
      header: 'Employee',
      render: (r) => (
        <div className="flex items-center gap-2">
          <Avatar
            name={r.employeeId ? `${r.employeeId.firstName} ${r.employeeId.lastName}` : ''}
            src={r.employeeId?.avatarUrl}
            size="xs"
          />
          <div>
            <div className="font-medium text-[#202124]">
              {r.employeeId ? `${r.employeeId.firstName} ${r.employeeId.lastName}` : '—'}
            </div>
            <div className="text-[11px] text-[#747B87]">{r.employeeId?.departmentId?.name || r.employeeId?.jobTitle}</div>
          </div>
        </div>
      ),
    },
    { key: 'date', header: 'Date', render: (r) => r.date },
    { key: 'checkInAt', header: 'Check In', render: (r) => formatTime(r.checkInAt) },
    {
      key: 'checkOutAt',
      header: 'Check Out',
      render: (r) =>
        r.checkOutAt ? (
          formatTime(r.checkOutAt)
        ) : r.isMissingCheckout ? (
          <Badge tone="danger">Missing</Badge>
        ) : (
          <span className="text-[#747B87]">Active</span>
        ),
    },
    { key: 'workingMinutes', header: 'Duration', render: (r) => formatMinutes(r.workingMinutes) },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge map={ATTENDANCE_STATUS_META} value={r.status} /> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setAdjustRecord(r);
            setAdjustNotes(r.notes || '');
            setAdjustCheckout('17:30');
          }}
        >
          Adjust
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} />

      <DataTable
        columns={columns}
        data={data?.data || []}
        loading={isLoading}
        error={error ? getApiErrorMessage(error) : null}
        onRetry={refetch}
        filters={
          <>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setPage(1);
              }}
              className="h-8 w-40 text-[12px]"
            />
            <Select
              className="h-8 w-36 text-[12px]"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All statuses</option>
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="half_day">Half Day</option>
            </Select>
            <label className="inline-flex items-center gap-1.5 text-[12px] text-[#5F6672]">
              <input
                type="checkbox"
                checked={missingOnly}
                onChange={(e) => setMissingOnly(e.target.checked)}
                className="accent-[#3867D6]"
              />
              Missing check-outs
            </label>
          </>
        }
        meta={data?.meta}
        onPageChange={setPage}
        emptyTitle="No attendance records found"
        emptyDescription="Attendance logs will populate as employees check in."
      />

      <Modal
        open={Boolean(adjustRecord)}
        onOpenChange={(o) => !o && setAdjustRecord(null)}
        title="Adjust Attendance Record"
        description={adjustRecord ? `${adjustRecord.date} · ${adjustRecord.employeeId?.firstName} ${adjustRecord.employeeId?.lastName}` : ''}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAdjustRecord(null)}>
              Cancel
            </Button>
            <Button onClick={() => adjustMutation.mutate()} loading={adjustMutation.isPending}>
              Save Adjustment
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Check-out Time (UTC HH:mm)">
            <Input type="time" value={adjustCheckout} onChange={(e) => setAdjustCheckout(e.target.value)} />
          </FormField>
          <FormField label="Adjustment Note">
            <Textarea rows={3} value={adjustNotes} onChange={(e) => setAdjustNotes(e.target.value)} />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}

export function LeaveApprovalsPage({ title = 'Leave Approvals', subtitle = 'Review team leave requests and communicate decisions clearly.' }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const [rejectItem, setRejectItem] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['leave', 'approvals', status, page],
    queryFn: () => leaveApi.list({ status: status === 'all' ? undefined : status, page, limit: 20 }),
  });

  const approveMutation = useMutation({
    mutationFn: (id) => leaveApi.approve(id, 'Approved'),
    onSuccess: () => {
      toast.success('Leave request approved');
      queryClient.invalidateQueries({ queryKey: ['leave'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const rejectMutation = useMutation({
    mutationFn: () => leaveApi.reject(rejectItem._id, rejectReason),
    onSuccess: () => {
      toast.success('Leave request rejected');
      setRejectItem(null);
      setRejectReason('');
      queryClient.invalidateQueries({ queryKey: ['leave'] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const columns = [
    {
      key: 'employee',
      header: 'Employee',
      render: (r) => (
        <div className="flex items-center gap-2">
          <Avatar
            name={r.employeeId ? `${r.employeeId.firstName} ${r.employeeId.lastName}` : ''}
            src={r.employeeId?.avatarUrl}
            size="xs"
          />
          <div>
            <div className="font-medium text-[#202124]">
              {r.employeeId ? `${r.employeeId.firstName} ${r.employeeId.lastName}` : '—'}
            </div>
            <div className="text-[11px] text-[#747B87]">{r.employeeId?.jobTitle}</div>
          </div>
        </div>
      ),
    },
    { key: 'leaveType', header: 'Type', render: (r) => <span className="capitalize">{r.leaveType}</span> },
    { key: 'dates', header: 'Dates', render: (r) => `${formatDate(r.startDate)} – ${formatDate(r.endDate)}` },
    { key: 'totalDays', header: 'Days', render: (r) => `${r.totalDays}d` },
    { key: 'reason', header: 'Reason', render: (r) => <p className="max-w-xs truncate text-[#5F6672]">{r.reason}</p> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge map={LEAVE_STATUS_META} value={r.status} /> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) =>
        r.status === 'pending' ? (
          <div className="flex justify-end gap-1.5">
            <Button size="sm" onClick={() => approveMutation.mutate(r._id)} loading={approveMutation.isPending}>
              <Check className="h-3.5 w-3.5" />
              Approve
            </Button>
            <Button
              variant="danger-outline"
              size="sm"
              onClick={() => {
                setRejectItem(r);
                setRejectReason('');
              }}
            >
              <X className="h-3.5 w-3.5" />
              Reject
            </Button>
          </div>
        ) : (
          <span className="text-[12px] text-[#747B87]">{r.decisionNotes || '—'}</span>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title={title} subtitle={subtitle} />

      <TabsBar
        activeTab={status}
        onChange={(v) => {
          setStatus(v);
          setPage(1);
        }}
        tabs={[
          { value: 'pending', label: 'Pending' },
          { value: 'approved', label: 'Approved' },
          { value: 'rejected', label: 'Rejected' },
          { value: 'all', label: 'All Requests' },
        ]}
      />

      <DataTable
        columns={columns}
        data={data?.data || []}
        loading={isLoading}
        error={error ? getApiErrorMessage(error) : null}
        onRetry={refetch}
        meta={data?.meta}
        onPageChange={setPage}
        emptyTitle="No leave requests"
        emptyDescription="Leave applications requiring review will appear here."
      />

      <Modal
        open={Boolean(rejectItem)}
        onOpenChange={(o) => !o && setRejectItem(null)}
        title="Reject Leave Request"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejectItem(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={rejectReason.trim().length < 3}
              onClick={() => rejectMutation.mutate()}
              loading={rejectMutation.isPending}
            >
              Confirm Rejection
            </Button>
          </>
        }
      >
        <FormField label="Reason for Rejection" required>
          <Textarea
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Explain coverage constraints or scheduling conflicts..."
          />
        </FormField>
      </Modal>
    </div>
  );
}

export function ManagerDailyReportsPage() {
  const queryClient = useQueryClient();
  const [dateFilter, setDateFilter] = useState('');
  const [hasBlockers, setHasBlockers] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState(null);
  const [noteText, setNoteText] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['daily-reports', 'team', { dateFilter, hasBlockers, page }],
    queryFn: () =>
      dailyReportApi.list({
        date: dateFilter || undefined,
        hasBlockers: hasBlockers ? 'true' : undefined,
        page,
        limit: 20,
      }),
  });

  const noteMutation = useMutation({
    mutationFn: () => dailyReportApi.addNote(selectedReport._id, noteText),
    onSuccess: () => {
      toast.success('Manager note saved');
      setSelectedReport(null);
      setNoteText('');
      queryClient.invalidateQueries({ queryKey: ['daily-reports'] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const columns = [
    {
      key: 'employee',
      header: 'Employee',
      render: (r) => (
        <div className="font-medium text-[#202124]">
          {r.employeeId ? `${r.employeeId.firstName} ${r.employeeId.lastName}` : '—'}
        </div>
      ),
    },
    { key: 'date', header: 'Date', render: (r) => r.date },
    { key: 'completedWork', header: 'Completed Work', render: (r) => <p className="max-w-sm truncate">{r.completedWork}</p> },
    {
      key: 'blockers',
      header: 'Blockers',
      render: (r) => (r.blockers ? <Badge tone="warning">Blocker</Badge> : <span className="text-[#9AA0A6]">None</span>),
    },
    { key: 'hoursWorked', header: 'Hours', render: (r) => `${r.hoursWorked}h` },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setSelectedReport(r);
            setNoteText(r.managerNote || '');
          }}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          {r.managerNote ? 'View' : 'Review'}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Team Daily Reports"
        subtitle="Review daily progress logs and resolve team blockers early."
      />

      <DataTable
        columns={columns}
        data={data?.data || []}
        loading={isLoading}
        error={error ? getApiErrorMessage(error) : null}
        onRetry={refetch}
        filters={
          <>
            <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="h-8 w-40 text-[12px]" />
            <label className="inline-flex items-center gap-1.5 text-[12px] text-[#5F6672]">
              <input
                type="checkbox"
                checked={hasBlockers}
                onChange={(e) => setHasBlockers(e.target.checked)}
                className="accent-[#3867D6]"
              />
              With blockers only
            </label>
          </>
        }
        meta={data?.meta}
        onPageChange={setPage}
        emptyTitle="No daily reports submitted"
        emptyDescription="Team end-of-day updates will appear here."
      />

      <Modal
        open={Boolean(selectedReport)}
        onOpenChange={(o) => !o && setSelectedReport(null)}
        title={`Daily Report · ${selectedReport?.date || ''}`}
        description={selectedReport?.employeeId ? `${selectedReport.employeeId.firstName} ${selectedReport.employeeId.lastName}` : ''}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelectedReport(null)}>
              Close
            </Button>
            <Button disabled={noteText.trim().length < 2} onClick={() => noteMutation.mutate()} loading={noteMutation.isPending}>
              Save Manager Note
            </Button>
          </>
        }
      >
        {selectedReport && (
          <div className="space-y-4 text-[13px]">
            <div>
              <div className="text-[12px] font-medium text-[#747B87]">Completed Work</div>
              <p className="mt-1 whitespace-pre-wrap">{selectedReport.completedWork}</p>
            </div>
            {selectedReport.ongoingWork && (
              <div>
                <div className="text-[12px] font-medium text-[#747B87]">Ongoing Work</div>
                <p className="mt-1 whitespace-pre-wrap">{selectedReport.ongoingWork}</p>
              </div>
            )}
            <div>
              <div className="text-[12px] font-medium text-[#747B87]">Blockers</div>
              <p className="mt-1 whitespace-pre-wrap">{selectedReport.blockers || 'None reported.'}</p>
            </div>
            {selectedReport.nextDayPlan && (
              <div>
                <div className="text-[12px] font-medium text-[#747B87]">Next-Day Plan</div>
                <p className="mt-1 whitespace-pre-wrap">{selectedReport.nextDayPlan}</p>
              </div>
            )}
            <FormField label="Manager Review Note">
              <Textarea rows={3} value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add guidance or acknowledgement..." />
            </FormField>
          </div>
        )}
      </Modal>
    </div>
  );
}
