'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { InputHTMLAttributes, forwardRef } from 'react';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  description?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, description, id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="w-full">
        <label
          htmlFor={inputId}
          className="flex items-start gap-3 cursor-pointer"
        >
          <div className="relative flex items-center justify-center mt-0.5">
            <input
              ref={ref}
              type="checkbox"
              id={inputId}
              className={cn(
                'peer h-5 w-5 rounded border-2 border-gray-300 appearance-none',
                'checked:bg-[var(--primary)] checked:border-[var(--primary)]',
                'focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-colors',
                error && 'border-red-500',
                className
              )}
              {...props}
            />
            <Check className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
          </div>
          <div className="flex-1">
            {label && (
              <span className={cn(
                'text-sm font-medium text-gray-700',
                props.disabled && 'text-gray-400'
              )}>
                {label}
              </span>
            )}
            {description && (
              <p className="text-sm text-gray-500 mt-0.5">{description}</p>
            )}
          </div>
        </label>
        {error && (
          <p className="mt-1 text-sm text-red-600 ml-8">{error}</p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };
