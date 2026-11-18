import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef(function Input({ className, error, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        'flex h-9 w-full rounded-md border bg-white px-3 py-1.5 text-[13px] text-[#202124] placeholder:text-[#9AA0A6] transition-colors',
        'focus:outline-none focus:border-[#3867D6] focus:ring-2 focus:ring-[#3867D6]/15',
        'disabled:cursor-not-allowed disabled:bg-[#F8F9FB] disabled:text-[#747B87]',
        error ? 'border-[#C0392B] focus:border-[#C0392B] focus:ring-[#C0392B]/15' : 'border-[#E8EAED]',
        className
      )}
      {...props}
    />
  );
});

export const PasswordInput = React.forwardRef(function PasswordInput(
  { className, error, disabled, ...props },
  ref
) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        ref={ref}
        type={visible ? 'text' : 'password'}
        disabled={disabled}
        className={cn(
          'flex h-9 w-full rounded-md border bg-white pl-3 pr-9 py-1.5 text-[13px] text-[#202124] placeholder:text-[#9AA0A6] transition-colors',
          'focus:outline-none focus:border-[#3867D6] focus:ring-2 focus:ring-[#3867D6]/15',
          'disabled:cursor-not-allowed disabled:bg-[#F8F9FB] disabled:text-[#747B87]',
          error ? 'border-[#C0392B] focus:border-[#C0392B] focus:ring-[#C0392B]/15' : 'border-[#E8EAED]',
          className
        )}
        {...props}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        title={visible ? 'Hide password' : 'Show password'}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded text-[#747B87] transition-colors hover:bg-[#F1F3F6] hover:text-[#202124] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3867D6]/30 disabled:pointer-events-none disabled:opacity-40"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
});

export const Textarea = React.forwardRef(function Textarea({ className, error, rows = 3, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        'flex w-full rounded-md border bg-white px-3 py-2 text-[13px] text-[#202124] placeholder:text-[#9AA0A6] transition-colors',
        'focus:outline-none focus:border-[#3867D6] focus:ring-2 focus:ring-[#3867D6]/15',
        'disabled:cursor-not-allowed disabled:bg-[#F8F9FB] disabled:text-[#747B87]',
        error ? 'border-[#C0392B] focus:border-[#C0392B] focus:ring-[#C0392B]/15' : 'border-[#E8EAED]',
        className
      )}
      {...props}
    />
  );
});

export const Select = React.forwardRef(function Select({ className, error, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        'flex h-9 w-full rounded-md border bg-white px-2.5 py-1.5 text-[13px] text-[#202124] transition-colors',
        'focus:outline-none focus:border-[#3867D6] focus:ring-2 focus:ring-[#3867D6]/15',
        'disabled:cursor-not-allowed disabled:bg-[#F8F9FB] disabled:text-[#747B87]',
        error ? 'border-[#C0392B]' : 'border-[#E8EAED]',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
});

export function FormField({ label, htmlFor, required, helper, error, className, children }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="block text-[13px] font-medium text-[#202124]">
          {label}
          {required && <span className="ml-0.5 text-[#C0392B]">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-[12px] text-[#C0392B]">{error}</p>
      ) : helper ? (
        <p className="text-[12px] text-[#747B87]">{helper}</p>
      ) : null}
    </div>
  );
}
