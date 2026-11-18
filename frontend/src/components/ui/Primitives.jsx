import React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';
import { getInitials } from '@/utils/formatters';
import { TONE_CLASSES } from '@/utils/statusMaps';

export function Badge({ tone = 'neutral', className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[6px] border px-2 py-0.5 text-[12px] font-medium leading-4 whitespace-nowrap',
        TONE_CLASSES[tone] || TONE_CLASSES.neutral,
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ map, value, className }) {
  const meta = map?.[value] || { label: value || 'Unknown', tone: 'neutral' };
  return (
    <Badge tone={meta.tone} className={className}>
      {meta.label}
    </Badge>
  );
}

export function Avatar({ name, src, size = 'sm', className }) {
  const sizes = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-7 w-7 text-[11px]',
    md: 'h-9 w-9 text-[12px]',
    lg: 'h-12 w-12 text-[14px]',
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={cn('rounded-full border border-[#E8EAED] object-cover shrink-0', sizes[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full border border-[#DDE2EC] bg-[#EEF2FC] font-medium text-[#3867D6]',
        sizes[size],
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
}

export function Panel({ className, children }) {
  return (
    <div className={cn('rounded-[10px] border border-[#E8EAED] bg-white', className)}>
      {children}
    </div>
  );
}

export function PanelHeader({ title, description, action, className }) {
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-2 border-b border-[#E8EAED] px-4 py-3', className)}>
      <div>
        <h2 className="text-[14px] font-semibold text-[#202124]">{title}</h2>
        {description && <p className="text-[12px] text-[#747B87]">{description}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}

export function Switch({ checked, onCheckedChange, disabled, id }) {
  return (
    <SwitchPrimitive.Root
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={cn(
        'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3867D6]/30',
        'disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-[#3867D6]' : 'bg-[#D5D9E0]'
      )}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          'pointer-events-none block h-4 w-4 rounded-full bg-white shadow-xs transition-transform',
          checked ? 'translate-x-4' : 'translate-x-0.5'
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export function TabsBar({ tabs, activeTab, onChange, className }) {
  return (
    <div className={cn('flex items-center gap-1 overflow-x-auto border-b border-[#E8EAED]', className)}>
      {tabs.map((tab) => {
        const active = tab.value === activeTab;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={cn(
              'relative whitespace-nowrap px-3 py-2 text-[13px] font-medium transition-colors',
              active ? 'text-[#3867D6]' : 'text-[#747B87] hover:text-[#202124]'
            )}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  'ml-1.5 rounded-full px-1.5 py-0.5 text-[11px]',
                  active ? 'bg-[#EEF2FC] text-[#3867D6]' : 'bg-[#F1F3F6] text-[#747B87]'
                )}
              >
                {tab.count}
              </span>
            )}
            {active && <span className="absolute inset-x-0 bottom-0 h-[2px] bg-[#3867D6]" />}
          </button>
        );
      })}
    </div>
  );
}

export function ProgressBar({ value = 0, className }) {
  const clamped = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#ECEEF2]">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            clamped === 100 ? 'bg-[#1E7E5A]' : 'bg-[#3867D6]'
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="w-8 text-right text-[12px] tabular-nums text-[#747B87]">{clamped}%</span>
    </div>
  );
}
