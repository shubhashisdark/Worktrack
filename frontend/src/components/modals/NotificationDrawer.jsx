import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { Drawer } from '@/components/ui/Overlays';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/common/States';
import { notificationApi } from '@/services/api';
import { formatRelative } from '@/utils/formatters';
import { cn } from '@/lib/utils';

export function NotificationPanelDrawer({ open, onOpenChange, notificationsPath }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', 'drawer'],
    queryFn: () => notificationApi.list({ limit: 25 }),
    enabled: open,
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => notificationApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const items = data?.data?.items || [];
  const unreadCount = data?.data?.unreadCount || 0;

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title="Notifications"
      subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
      width="max-w-[420px]"
      footer={
        <div className="flex w-full items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            disabled={unreadCount === 0}
            loading={markAllMutation.isPending}
            onClick={() => markAllMutation.mutate()}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              onOpenChange(false);
              navigate(notificationsPath);
            }}
          >
            View all
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="space-y-2.5">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-16 animate-pulse rounded-[8px] bg-[#ECEEF2]" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="Updates on tasks, approvals, and leave requests will appear here."
        />
      ) : (
        <div className="divide-y divide-[#E8EAED] -mx-5">
          {items.map((item) => (
            <button
              key={item._id}
              type="button"
              onClick={() => {
                if (!item.isRead) markReadMutation.mutate(item._id);
                if (item.actionUrl) {
                  onOpenChange(false);
                  navigate(item.actionUrl);
                }
              }}
              className={cn(
                'flex w-full items-start gap-3 px-5 py-3.5 text-left transition-colors hover:bg-[#F8F9FB]',
                !item.isRead && 'bg-[#EEF2FC]/45'
              )}
            >
              <span
                className={cn(
                  'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                  item.isRead ? 'bg-transparent' : 'bg-[#3867D6]'
                )}
              />
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium text-[#202124]">{item.title}</div>
                <p className="mt-0.5 text-[12px] text-[#747B87] line-clamp-2">{item.message}</p>
                <div className="mt-1 text-[11px] text-[#9AA0A6]">{formatRelative(item.createdAt)}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </Drawer>
  );
}
