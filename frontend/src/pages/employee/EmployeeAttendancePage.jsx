import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Calendar as CalendarIcon, Clock, LogIn, LogOut } from 'lucide-react';
import { attendanceApi } from '@/services/api';
import { getApiErrorMessage } from '@/services/apiClient';
import { PageHeader } from '@/components/common/PageHeader';
import { MetricStrip } from '@/components/common/MetricStrip';
import { DataTable } from '@/components/common/DataTable';
import { Panel, PanelHeader, StatusBadge } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/FormControls';
import { formatMinutes, formatTime } from '@/utils/formatters';
import { ATTENDANCE_STATUS_META } from '@/utils/statusMaps';

export function EmployeeAttendancePage({ calendarView = false }) {
  const queryClient = useQueryClient();
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['attendance', 'history', month],
    queryFn: () => attendanceApi.history({ month }),
  });

  const checkInMutation = useMutation({
    mutationFn: () => attendanceApi.checkIn(),
    onSuccess: () => {
      toast.success('Checked in successfully');
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const checkOutMutation = useMutation({
    mutationFn: () => attendanceApi.checkOut(),
    onSuccess: () => {
      toast.success('Checked out successfully');
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const payload = data?.data;
  const today = payload?.today;
  const records = payload?.records || [];
  const summary = payload?.summary || {};

  const recordMap = new Map(records.map((r) => [r.date, r]));
  const [yearNum, monthNum] = month.split('-').map(Number);
  const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
  const firstWeekday = new Date(yearNum, monthNum - 1, 1).getDay();

  const columns = [
    { key: 'date', header: 'Date', render: (r) => <span className="font-medium">{r.date}</span> },
    { key: 'checkInAt', header: 'Check In', render: (r) => formatTime(r.checkInAt) },
    { key: 'checkOutAt', header: 'Check Out', render: (r) => (r.checkOutAt ? formatTime(r.checkOutAt) : '—') },
    { key: 'workingMinutes', header: 'Duration', render: (r) => formatMinutes(r.workingMinutes) },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge map={ATTENDANCE_STATUS_META} value={r.status} /> },
    { key: 'notes', header: 'Notes', render: (r) => <span className="text-[#747B87]">{r.notes || '—'}</span> },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title={calendarView ? 'Attendance Calendar' : 'Attendance'}
        subtitle="Check in/out daily and track your monthly working hours."
        actions={
          <div className="flex items-center gap-2">
            <Input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="h-8 w-40 text-[12px]"
            />
            {calendarView ? (
              <Link to="/employee/attendance">
                <Button variant="secondary" size="sm">
                  <Clock className="h-3.5 w-3.5" />
                  List View
                </Button>
              </Link>
            ) : (
              <Link to="/employee/attendance/calendar">
                <Button variant="secondary" size="sm">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  Calendar View
                </Button>
              </Link>
            )}
          </div>
        }
      />

      {/* Check-In / Check-Out Action Panel */}
      <Panel className="flex flex-wrap items-center justify-between gap-4 p-4">
        <div>
          <div className="text-[14px] font-semibold text-[#202124]">Today's Shift</div>
          <p className="mt-0.5 text-[13px] text-[#747B87]">
            {!today
              ? 'You have not checked in yet today.'
              : today.checkOutAt
              ? `Checked in at ${formatTime(today.checkInAt)} · Checked out at ${formatTime(today.checkOutAt)} (${formatMinutes(today.workingMinutes)})`
              : `Checked in at ${formatTime(today.checkInAt)} · ${formatMinutes(Math.max(1, Math.round((Date.now() - new Date(today.checkInAt).getTime()) / 60000)))} elapsed`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {today && <StatusBadge map={ATTENDANCE_STATUS_META} value={today.status} />}
          {!today && (
            <Button size="sm" onClick={() => checkInMutation.mutate()} loading={checkInMutation.isPending}>
              <LogIn className="h-3.5 w-3.5" />
              Check In Now
            </Button>
          )}
          {today && !today.checkOutAt && (
            <Button variant="secondary" size="sm" onClick={() => checkOutMutation.mutate()} loading={checkOutMutation.isPending}>
              <LogOut className="h-3.5 w-3.5" />
              Check Out
            </Button>
          )}
        </div>
      </Panel>

      <MetricStrip
        items={[
          { label: 'Days Logged', value: summary.daysLogged ?? 0 },
          { label: 'Present On Time', value: summary.presentDays ?? 0, tone: 'success' },
          { label: 'Late Check-Ins', value: summary.lateDays ?? 0, tone: summary.lateDays > 0 ? 'warning' : 'default' },
          { label: 'Total Hours', value: `${summary.totalHours ?? 0}h` },
          { label: 'Avg Hours / Day', value: `${summary.avgHoursPerDay ?? 0}h` },
        ]}
      />

      {calendarView ? (
        <Panel>
          <PanelHeader title={`Monthly Calendar (${month})`} />
          <div className="p-4">
            <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-medium text-[#747B87] mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: firstWeekday }).map((_, i) => (
                <div key={`pad-${i}`} className="h-20 rounded-[8px] bg-[#F8F9FB]" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const day = idx + 1;
                const dateKey = `${month}-${String(day).padStart(2, '0')}`;
                const rec = recordMap.get(dateKey);
                return (
                  <div
                    key={dateKey}
                    className="flex h-20 flex-col justify-between rounded-[8px] border border-[#E8EAED] bg-white p-2 text-left"
                  >
                    <span className="text-[12px] font-medium text-[#202124]">{day}</span>
                    {rec ? (
                      <div className="space-y-1">
                        <StatusBadge map={ATTENDANCE_STATUS_META} value={rec.status} className="text-[10px] px-1.5" />
                        <div className="text-[10px] text-[#747B87]">{formatMinutes(rec.workingMinutes)}</div>
                      </div>
                    ) : (
                      <span className="text-[10px] text-[#B4BAC4]">—</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Panel>
      ) : (
        <DataTable
          columns={columns}
          data={records}
          loading={isLoading}
          error={error ? getApiErrorMessage(error) : null}
          onRetry={refetch}
          emptyTitle="No attendance entries for this month"
          emptyDescription="Your check-in and check-out records will appear here."
        />
      )}
    </div>
  );
}
