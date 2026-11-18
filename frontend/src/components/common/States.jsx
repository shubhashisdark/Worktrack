import React from 'react';
import { AlertCircle, Inbox, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Overlays';
import { cn } from '@/lib/utils';

export function LoadingSkeleton({ rows = 4, className }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-11 w-full animate-pulse rounded-[8px] bg-[#ECEEF2]" />
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-7 w-48 animate-pulse rounded bg-[#ECEEF2]" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="h-20 animate-pulse rounded-[10px] border border-[#E8EAED] bg-white p-4">
            <div className="h-3 w-20 rounded bg-[#ECEEF2]" />
            <div className="mt-3 h-6 w-12 rounded bg-[#ECEEF2]" />
          </div>
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-[10px] border border-[#E8EAED] bg-white" />
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-[8px] border border-[#E8EAED] bg-[#F8F9FB] text-[#747B87]">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-[14px] font-semibold text-[#202124]">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-[13px] text-[#747B87]">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = 'Unable to load data', message, onRetry, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-[10px] border border-[#F5CFCB] bg-[#FDEEEC]/40 px-6 py-10 text-center',
        className
      )}
    >
      <AlertCircle className="mb-2.5 h-6 w-6 text-[#C0392B]" />
      <h3 className="text-[14px] font-semibold text-[#202124]">{title}</h3>
      {message && <p className="mt-1 max-w-md text-[13px] text-[#747B87]">{message}</p>}
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} className="mt-4">
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </Button>
      )}
    </div>
  );
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  variant = 'primary',
  loading = false,
  onConfirm,
}) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-[13px] text-[#5F6672]">{description}</p>
    </Modal>
  );
}
