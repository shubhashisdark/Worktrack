import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Bell, CheckCheck, ShieldAlert, Upload } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { authApi, employeeApi, notificationApi } from '@/services/api';
import { getApiErrorMessage } from '@/services/apiClient';
import { changePasswordFormSchema } from '@/schemas/forms';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState, LoadingSkeleton } from '@/components/common/States';
import { Avatar, Panel, PanelHeader, StatusBadge, Switch, TabsBar } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';
import { FormField, Input, PasswordInput } from '@/components/ui/FormControls';
import { formatDate, formatRelative } from '@/utils/formatters';
import { ROLE_META } from '@/utils/statusMaps';
import { cn } from '@/lib/utils';

export function ForbiddenPage() {
  const { getHomePath } = useAuth();
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-[10px] border border-[#F5CFCB] bg-[#FDEEEC] text-[#C0392B]">
        <ShieldAlert className="h-5 w-5" />
      </div>
      <h1 className="text-[18px] font-semibold text-[#202124]">Permission Denied (403)</h1>
      <p className="mt-1 max-w-md text-[13px] text-[#747B87]">
        Your current role does not have authorization to view this section. If you believe this is an error, contact your administrator.
      </p>
      <Link to={getHomePath()} className="mt-5">
        <Button>Return to my dashboard</Button>
      </Link>
    </div>
  );
}

export function NotFoundPage() {
  const { isAuthenticated, getHomePath } = useAuth();
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="text-[12px] font-semibold uppercase tracking-wider text-[#747B87]">404</div>
      <h1 className="mt-1 text-[20px] font-semibold text-[#202124]">Page not found</h1>
      <p className="mt-1 text-[13px] text-[#747B87]">The requested page does not exist or has been moved.</p>
      <Link to={isAuthenticated ? getHomePath() : '/login'} className="mt-5">
        <Button>Go back home</Button>
      </Link>
    </div>
  );
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', 'page', tab],
    queryFn: () => notificationApi.list({ limit: 50, unreadOnly: tab === 'unread' ? 'true' : undefined }),
  });

  const markRead = useMutation({
    mutationFn: (id) => notificationApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAll = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => {
      toast.success('All notifications marked as read');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const items = data?.data?.items || [];
  const unreadCount = data?.data?.unreadCount || 0;

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="Stay informed on task assignments, deliverable reviews, and leave decisions."
        actions={
          <Button variant="secondary" size="sm" disabled={unreadCount === 0} loading={markAll.isPending} onClick={() => markAll.mutate()}>
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all as read
          </Button>
        }
      />

      <Panel>
        <div className="px-4">
          <TabsBar
            activeTab={tab}
            onChange={setTab}
            tabs={[
              { value: 'all', label: 'All' },
              { value: 'unread', label: 'Unread', count: unreadCount },
            ]}
          />
        </div>

        {isLoading ? (
          <div className="p-4">
            <LoadingSkeleton rows={5} />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={tab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            description="Relevant workflow alerts will show up here as they happen."
          />
        ) : (
          <div className="divide-y divide-[#E8EAED]">
            {items.map((item) => (
              <div
                key={item._id}
                onClick={() => {
                  if (!item.isRead) markRead.mutate(item._id);
                  if (item.actionUrl) navigate(item.actionUrl);
                }}
                className={cn(
                  'flex cursor-pointer items-start justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-[#F8F9FB]',
                  !item.isRead && 'bg-[#EEF2FC]/35'
                )}
              >
                <div className="flex items-start gap-3">
                  <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', item.isRead ? 'bg-transparent' : 'bg-[#3867D6]')} />
                  <div>
                    <div className="text-[13px] font-medium text-[#202124]">{item.title}</div>
                    <p className="mt-0.5 text-[13px] text-[#747B87]">{item.message}</p>
                    <div className="mt-1 text-[11px] text-[#9AA0A6]">{formatRelative(item.createdAt)}</div>
                  </div>
                </div>
                {!item.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      markRead.mutate(item._id);
                    }}
                  >
                    Mark read
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

export function ProfilePage() {
  const { user, employee, refreshMe } = useAuth();
  const [phone, setPhone] = useState(employee?.phone || '');
  const [location, setLocation] = useState(employee?.location || '');
  const [firstName, setFirstName] = useState(employee?.firstName || '');
  const [lastName, setLastName] = useState(employee?.lastName || '');

  useEffect(() => {
    if (employee) {
      setFirstName(employee.firstName || '');
      setLastName(employee.lastName || '');
      setPhone(employee.phone || '');
      setLocation(employee.location || '');
    }
  }, [employee]);

  const saveMutation = useMutation({
    mutationFn: () => employeeApi.update(employee._id, { firstName, lastName, phone, location }),
    onSuccess: async () => {
      await refreshMe();
      toast.success('Profile updated');
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const avatarMutation = useMutation({
    mutationFn: (file) => employeeApi.uploadAvatar(employee._id, file),
    onSuccess: async () => {
      await refreshMe();
      toast.success('Profile photo updated');
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  if (!employee) return null;

  return (
    <div>
      <PageHeader title="My Profile" subtitle="Manage your personal details and view your organizational information." />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Panel className="p-5">
          <div className="flex items-center gap-3.5">
            <Avatar name={employee.fullName} src={employee.avatarUrl} size="lg" />
            <div className="min-w-0">
              <div className="truncate text-[15px] font-semibold text-[#202124]">{employee.fullName}</div>
              <div className="truncate text-[13px] text-[#747B87]">{employee.jobTitle}</div>
              <div className="mt-1">
                <StatusBadge map={ROLE_META} value={user?.role} />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-[#E8EAED] bg-white px-3 py-1.5 text-[12px] font-medium text-[#202124] hover:bg-[#F8F9FB]">
              <Upload className="h-3.5 w-3.5" />
              {avatarMutation.isPending ? 'Uploading...' : 'Change photo'}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && avatarMutation.mutate(e.target.files[0])}
              />
            </label>
          </div>

          <dl className="mt-5 space-y-2.5 border-t border-[#E8EAED] pt-4 text-[13px]">
            <div className="flex justify-between">
              <dt className="text-[#747B87]">Employee ID</dt>
              <dd className="font-medium text-[#202124]">{employee.employeeCode}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#747B87]">Department</dt>
              <dd className="font-medium text-[#202124]">{employee.departmentId?.name || 'Unassigned'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#747B87]">Manager</dt>
              <dd className="font-medium text-[#202124]">
                {employee.managerId ? `${employee.managerId.firstName} ${employee.managerId.lastName}` : '—'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#747B87]">Hire Date</dt>
              <dd className="font-medium text-[#202124]">{formatDate(employee.hireDate)}</dd>
            </div>
          </dl>
        </Panel>

        <Panel className="lg:col-span-2">
          <PanelHeader title="Contact & Personal Information" />
          <div className="space-y-4 p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="First Name">
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </FormField>
              <FormField label="Last Name">
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </FormField>
            </div>
            <FormField label="Work Email" helper="Managed by your organization administrator.">
              <Input value={employee.email} disabled />
            </FormField>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Phone">
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
              </FormField>
              <FormField label="Work Location">
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City or Remote" />
              </FormField>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
                Save Changes
              </Button>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

export function AccountSettingsPage({ title = 'Account Settings' }) {
  const { user, refreshMe } = useAuth();
  const [prefs, setPrefs] = useState(
    user?.notificationPrefs || {
      taskAssigned: true,
      taskApproved: true,
      revisionRequested: true,
      leaveUpdates: true,
      dailyReportReminders: true,
      feedbackReceived: true,
    }
  );

  useEffect(() => {
    if (user?.notificationPrefs) {
      setPrefs(user.notificationPrefs);
    }
  }, [user]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(changePasswordFormSchema),
  });

  const onPasswordSubmit = async (values) => {
    try {
      await authApi.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast.success('Password updated successfully');
      reset();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const togglePref = async (key, checked) => {
    const next = { ...prefs, [key]: checked };
    setPrefs(next);
    try {
      await authApi.updatePreferences({ notificationPrefs: next });
      await refreshMe();
      toast.success('Notification preference saved');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div>
      <PageHeader title={title} subtitle="Manage your account security and notification preferences." />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="Change Password" description="Use at least 8 characters for strong account security." />
          <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-4 p-5">
            <FormField label="Current Password" required error={errors.currentPassword?.message}>
              <PasswordInput autoComplete="current-password" placeholder="Enter current password" {...register('currentPassword')} error={errors.currentPassword} />
            </FormField>
            <FormField label="New Password" required error={errors.newPassword?.message}>
              <PasswordInput autoComplete="new-password" placeholder="Min 8 characters" {...register('newPassword')} error={errors.newPassword} />
            </FormField>
            <FormField label="Confirm New Password" required error={errors.confirmPassword?.message}>
              <PasswordInput autoComplete="new-password" placeholder="Re-enter new password" {...register('confirmPassword')} error={errors.confirmPassword} />
            </FormField>
            <Button type="submit" loading={isSubmitting}>
              Update Password
            </Button>
          </form>
        </Panel>

        <Panel>
          <PanelHeader title="Notification Preferences" description="Choose which workflow updates trigger alerts." />
          <div className="divide-y divide-[#E8EAED] px-5">
            {[
              { key: 'taskAssigned', label: 'Task assignments', desc: 'Notify when new tasks are assigned' },
              { key: 'taskApproved', label: 'Task approvals', desc: 'Notify when deliverables are approved' },
              { key: 'revisionRequested', label: 'Revision requests', desc: 'Notify when a manager requests changes' },
              { key: 'leaveUpdates', label: 'Leave decisions', desc: 'Notify when leave requests are updated' },
              { key: 'feedbackReceived', label: 'Manager feedback', desc: 'Notify when new performance feedback is posted' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between py-3.5">
                <div>
                  <div className="text-[13px] font-medium text-[#202124]">{item.label}</div>
                  <div className="text-[12px] text-[#747B87]">{item.desc}</div>
                </div>
                <Switch checked={Boolean(prefs[item.key])} onCheckedChange={(v) => togglePref(item.key, v)} />
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
