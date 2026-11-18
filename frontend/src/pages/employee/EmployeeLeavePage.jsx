import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { leaveApi } from '@/services/api';
import { getApiErrorMessage } from '@/services/apiClient';
import { PageHeader } from '@/components/common/PageHeader';
import { MetricStrip } from '@/components/common/MetricStrip';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/FormControls';
import { ApplyLeaveModal } from '@/components/modals/OrgModals';
import { formatDate } from '@/utils/formatters';
import { LEAVE_STATUS_META } from '@/utils/statusMaps';

export function EmployeeLeavePage({ historyOnly = false }) {
  const { employee } = useAuth();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['leave', 'employee', statusFilter, page],
    queryFn: () => leaveApi.list({ mine: 'true', status: statusFilter || undefined, page, limit: 15 }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => leaveApi.cancel(id),
    onSuccess: () => {
      toast.success('Leave request cancelled');
      queryClient.invalidateQueries({ queryKey: ['leave'] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const balances = employee?.leaveBalances || { annual: 18, sick: 10, casual: 6 };

  const columns = [
    {
      key: 'leaveType',
      header: 'Type',
      render: (r) => <span className="capitalize font-medium">{r.leaveType}</span>,
    },
    {
      key: 'dates',
      header: 'Dates',
      render: (r) => `${formatDate(r.startDate)} – ${formatDate(r.endDate)}`,
    },
    { key: 'totalDays', header: 'Days', render: (r) => `${r.totalDays}d` },
    { key: 'reason', header: 'Reason', render: (r) => <p className="max-w-xs truncate text-[#5F6672]">{r.reason}</p> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge map={LEAVE_STATUS_META} value={r.status} /> },
    {
      key: 'decisionNotes',
      header: 'Reviewer Note',
      render: (r) => <span className="text-[12px] text-[#747B87]">{r.decisionNotes || '—'}</span>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) =>
        r.status === 'pending' ? (
          <Button
            variant="ghost"
            size="sm"
            loading={cancelMutation.isPending}
            onClick={() => cancelMutation.mutate(r._id)}
          >
            Cancel
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title={historyOnly ? 'Leave History' : 'Leave Requests'}
        subtitle="Track your leave balances, submit requests, and view approval decisions."
        actions={
          <div className="flex items-center gap-2">
            {!historyOnly ? (
              <Link to="/employee/leave/history">
                <Button variant="secondary" size="sm">
                  Leave History
                </Button>
              </Link>
            ) : (
              <Link to="/employee/leave">
                <Button variant="secondary" size="sm">
                  Active Requests
                </Button>
              </Link>
            )}
            <Button size="sm" onClick={() => setModalOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              Apply for Leave
            </Button>
          </div>
        }
      />

      <MetricStrip
        items={[
          { label: 'Annual Leave Balance', value: `${balances.annual ?? 0}d` },
          { label: 'Sick Leave Balance', value: `${balances.sick ?? 0}d` },
          { label: 'Casual Leave Balance', value: `${balances.casual ?? 0}d` },
        ]}
      />

      <DataTable
        columns={columns}
        data={data?.data || []}
        loading={isLoading}
        error={error ? getApiErrorMessage(error) : null}
        onRetry={refetch}
        filters={
          <Select className="h-8 w-40 text-[12px]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        }
        meta={data?.meta}
        onPageChange={setPage}
        emptyTitle="No leave requests found"
        emptyDescription="Submit a request when you need time away from work."
        emptyAction={
          <Button size="sm" onClick={() => setModalOpen(true)}>
            Apply for Leave
          </Button>
        }
      />

      <ApplyLeaveModal open={modalOpen} onOpenChange={setModalOpen} leaveBalances={balances} />
    </div>
  );
}
