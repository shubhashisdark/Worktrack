import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Modal({ open, onOpenChange, title, description, children, footer, size = 'md' }) {
  const widths = {
    sm: 'max-w-[440px]',
    md: 'max-w-[560px]',
    lg: 'max-w-[720px]',
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#202124]/35 backdrop-blur-[1px] data-[state=open]:animate-in data-[state=closed]:animate-out" />
        <DialogPrimitive.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-[10px] border border-[#E8EAED] bg-white shadow-modal focus:outline-none',
            widths[size] || widths.md
          )}
        >
          <div className="flex items-start justify-between border-b border-[#E8EAED] px-5 py-4">
            <div>
              <DialogPrimitive.Title className="text-[15px] font-semibold text-[#202124]">
                {title}
              </DialogPrimitive.Title>
              {description && (
                <DialogPrimitive.Description className="mt-0.5 text-[13px] text-[#747B87]">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close
              aria-label="Close"
              className="rounded-md p-1 text-[#747B87] hover:bg-[#F1F3F6] hover:text-[#202124]"
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>
          <div className="max-h-[75vh] overflow-y-auto px-5 py-4">{children}</div>
          {footer && (
            <div className="flex items-center justify-end gap-2 border-t border-[#E8EAED] bg-[#F8F9FB] px-5 py-3 rounded-b-[10px]">
              {footer}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function Drawer({ open, onOpenChange, title, subtitle, children, footer, width = 'max-w-[540px]' }) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#202124]/30 backdrop-blur-[1px]" />
        <DialogPrimitive.Content
          className={cn(
            'fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-[#E8EAED] bg-white shadow-modal focus:outline-none',
            width
          )}
        >
          <div className="flex items-start justify-between border-b border-[#E8EAED] px-5 py-4">
            <div className="min-w-0 pr-3">
              <DialogPrimitive.Title className="truncate text-[15px] font-semibold text-[#202124]">
                {title}
              </DialogPrimitive.Title>
              {subtitle && (
                <DialogPrimitive.Description className="mt-0.5 truncate text-[12px] text-[#747B87]">
                  {subtitle}
                </DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close
              aria-label="Close panel"
              className="rounded-md p-1 text-[#747B87] hover:bg-[#F1F3F6] hover:text-[#202124]"
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer && (
            <div className="flex items-center justify-end gap-2 border-t border-[#E8EAED] bg-[#F8F9FB] px-5 py-3">
              {footer}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
