import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PageHeader({ title, subtitle, breadcrumbs = [], actions, className }) {
  return (
    <div className={cn('mb-5 flex flex-wrap items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        {breadcrumbs.length > 0 && (
          <nav className="mb-1 flex items-center gap-1 text-[12px] text-[#747B87]">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.label}>
                {idx > 0 && <ChevronRight className="h-3 w-3 text-[#9AA0A6]" />}
                {crumb.to ? (
                  <Link to={crumb.to} className="hover:text-[#202124]">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-[#202124]">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
        <h1 className="text-[20px] font-semibold tracking-[-0.015em] text-[#202124] leading-7">{title}</h1>
        {subtitle && <p className="mt-0.5 text-[13px] text-[#747B87]">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
