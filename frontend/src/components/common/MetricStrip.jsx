import React from 'react';
import { cn } from '@/lib/utils';

export function MetricStrip({ items = [], className }) {
  const cols =
    items.length <= 3
      ? 'grid-cols-1 sm:grid-cols-3'
      : items.length === 4
      ? 'grid-cols-2 lg:grid-cols-4'
      : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5';

  return (
    <div
      className={cn(
        'grid overflow-hidden rounded-[10px] border border-[#E8EAED] bg-white divide-y sm:divide-y-0 sm:divide-x divide-[#E8EAED]',
        cols,
        className
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="px-4 py-3.5">
          <div className="text-[12px] font-medium text-[#747B87]">{item.label}</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span
              className={cn(
                'text-[22px] font-semibold tracking-[-0.02em] tabular-nums leading-7',
                item.tone === 'danger'
                  ? 'text-[#C0392B]'
                  : item.tone === 'success'
                  ? 'text-[#1E7E5A]'
                  : item.tone === 'warning'
                  ? 'text-[#B26B00]'
                  : 'text-[#202124]'
              )}
            >
              {item.value}
            </span>
            {item.meta && <span className="text-[12px] text-[#747B87]">{item.meta}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
