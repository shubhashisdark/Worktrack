import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3867D6]/30 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-[#3867D6] text-white hover:bg-[#2D55B8] shadow-xs',
        secondary: 'bg-white text-[#202124] border border-[#E8EAED] hover:bg-[#F8F9FB] shadow-xs',
        ghost: 'text-[#5F6672] hover:bg-[#F1F3F6] hover:text-[#202124]',
        subtle: 'bg-[#F1F3F6] text-[#202124] hover:bg-[#E8EAED]',
        danger: 'bg-[#C0392B] text-white hover:bg-[#A63024] shadow-xs',
        'danger-outline': 'bg-white text-[#C0392B] border border-[#F2C6C2] hover:bg-[#FDEEEC]',
      },
      size: {
        sm: 'h-8 px-2.5 text-[12px]',
        md: 'h-9 px-3.5',
        lg: 'h-10 px-4 text-[14px]',
        icon: 'h-8 w-8 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export const Button = React.forwardRef(function Button(
  { className, variant, size, type = 'button', loading = false, disabled, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {loading && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
});
