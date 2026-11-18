import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { dailyReportApi } from '@/services/api';
import { getApiErrorMessage } from '@/services/apiClient';
import { dailyReportFormSchema } from '@/schemas/forms';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { ErrorState, PageSkeleton } from '@/components/common/States';
import { Badge, Panel, PanelHeader } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Textarea } from '@/components/ui/FormControls';

export function EmployeeDailyReportsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['daily-reports', 'employee', page, search],
    queryFn: () => dailyReportApi.list({ mine: 'true', page, limit: 15, search: search || undefined }),
  });

  const columns = [
    { key: 'date', header: 'Date', sortable: true, render: (r) => <span className="font-medium">{r.date}</span> },
    {
      key: 'completedWork',
      header: 'Completed Work',
      render: (r) => <p className="max-w-md truncate text-[#202124]">{r.completedWork}</p>,
    },
    {
      key: 'blockers',
      header: 'Blockers',
      render: (r) =>
        r.blockers ? <Badge tone="warning">Has blockers</Badge> : <span className="text-[#9AA0A6]">None</span>,
    },
    { key: 'hoursWorked', header: 'Hours', render: (r) => `${r.hoursWorked}h` },
    {
      key: 'managerNote',
      header: 'Review',
      render: (r) =>
        r.managerNote ? <Badge tone="success">Reviewed</Badge> : <Badge tone="neutral">Logged</Badge>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Daily Reports"
        subtitle="Log completed work, ongoing items, blockers, and next-day priorities."
        actions={
          <Link to="/employee/daily-reports/new">
            <Button size="sm">
              <Plus className="h-3.5 w-3.5" />
              New Daily Report
            </Button>
          </Link>
        }
      />

      <DataTable
        columns={columns}
        data={data?.data || []}
        loading={isLoading}
        error={error ? getApiErrorMessage(error) : null}
        onRetry={refetch}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search report entries..."
        meta={data?.meta}
        onPageChange={setPage}
        onRowClick={(r) => navigate(`/employee/daily-reports/${r._id}`)}
        emptyTitle="No daily reports yet"
        emptyDescription="Submit your first end-of-day work summary."
        emptyAction={
          <Link to="/employee/daily-reports/new">
            <Button size="sm">Create Daily Report</Button>
          </Link>
        }
      />
    </div>
  );
}

export function CreateDailyReportPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(dailyReportFormSchema),
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      completedWork: '',
      ongoingWork: '',
      blockers: '',
      nextDayPlan: '',
      hoursWorked: 8,
    },
  });

  const mutation = useMutation({
    mutationFn: (values) => dailyReportApi.create(values),
    onSuccess: (res) => {
      toast.success('Daily report saved');
      queryClient.invalidateQueries({ queryKey: ['daily-reports'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      navigate(`/employee/daily-reports/${res.data._id}`);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Create Daily Report"
        breadcrumbs={[
          { label: 'Daily Reports', to: '/employee/daily-reports' },
          { label: 'New Report' },
        ]}
      />

      <Panel className="p-5">
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Report Date" required error={errors.date?.message}>
              <Input type="date" {...register('date')} error={errors.date} />
            </FormField>
            <FormField label="Hours Worked" required error={errors.hoursWorked?.message}>
              <Input type="number" step="0.5" min="0" max="24" {...register('hoursWorked')} error={errors.hoursWorked} />
            </FormField>
          </div>

          <FormField label="Completed Work" required error={errors.completedWork?.message}>
            <Textarea rows={4} placeholder="What tasks or milestones did you complete today?" {...register('completedWork')} />
          </FormField>

          <FormField label="Ongoing Work" error={errors.ongoingWork?.message}>
            <Textarea rows={3} placeholder="What is currently in progress?" {...register('ongoingWork')} />
          </FormField>

          <FormField label="Blockers or Dependencies" error={errors.blockers?.message}>
            <Textarea rows={2} placeholder="Any risks, questions, or dependencies needing manager support?" {...register('blockers')} />
          </FormField>

          <FormField label="Next-Day Plan" error={errors.nextDayPlan?.message}>
            <Textarea rows={3} placeholder="Key priorities planned for tomorrow..." {...register('nextDayPlan')} />
          </FormField>

          <div className="flex items-center justify-end gap-2 border-t border-[#E8EAED] pt-4">
            <Button variant="secondary" onClick={() => navigate('/employee/daily-reports')}>
              Cancel
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              Submit Report
            </Button>
          </div>
        </form>
      </Panel>
    </div>
  );
}

export function DailyReportDetailPage({ backPath = '/employee/daily-reports' }) {
  const { id } = useParams();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['daily-report', id],
    queryFn: () => dailyReportApi.getById(id),
  });

  if (isLoading) return <PageSkeleton />;
  if (error || !data?.data) return <ErrorState message={getApiErrorMessage(error)} onRetry={refetch} />;

  const r = data.data;

  return (
    <div className="max-w-3xl space-y-5">
      <PageHeader
        title={`Daily Report — ${r.date}`}
        breadcrumbs={[
          { label: 'Daily Reports', to: backPath },
          { label: r.date },
        ]}
      />

      <Panel>
        <PanelHeader
          title={r.employeeId ? `${r.employeeId.firstName} ${r.employeeId.lastName}` : 'Report Details'}
          description={`${r.hoursWorked} hours logged`}
        />
        <div className="space-y-4 p-5 text-[13px]">
          <div>
            <div className="text-[12px] font-medium text-[#747B87]">Completed Work</div>
            <p className="mt-1 whitespace-pre-wrap text-[#202124]">{r.completedWork}</p>
          </div>
          {r.ongoingWork && (
            <div className="border-t border-[#E8EAED] pt-3">
              <div className="text-[12px] font-medium text-[#747B87]">Ongoing Work</div>
              <p className="mt-1 whitespace-pre-wrap text-[#202124]">{r.ongoingWork}</p>
            </div>
          )}
          <div className="border-t border-[#E8EAED] pt-3">
            <div className="text-[12px] font-medium text-[#747B87]">Blockers</div>
            <p className="mt-1 whitespace-pre-wrap text-[#202124]">{r.blockers || 'No blockers reported.'}</p>
          </div>
          {r.nextDayPlan && (
            <div className="border-t border-[#E8EAED] pt-3">
              <div className="text-[12px] font-medium text-[#747B87]">Next-Day Plan</div>
              <p className="mt-1 whitespace-pre-wrap text-[#202124]">{r.nextDayPlan}</p>
            </div>
          )}
          {r.managerNote && (
            <div className="rounded-[8px] border border-[#CDEADC] bg-[#ECF7F2] p-3">
              <div className="text-[12px] font-semibold text-[#1E7E5A]">
                Manager Note {r.reviewedBy ? `· ${r.reviewedBy.firstName} ${r.reviewedBy.lastName}` : ''}
              </div>
              <p className="mt-1 text-[#202124]">{r.managerNote}</p>
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}
