'use client';

import { cn } from '@/lib/utils';
import { CheckCircle, Info, XCircle, AlertTriangle } from 'lucide-react';
import { HTMLAttributes, forwardRef } from 'react';

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
}

const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'info', title, children, ...props }, ref) => {
    const variants = {
      info: {
        container: 'bg-blue-50 border-blue-200 text-blue-800',
        icon: <Info className="h-5 w-5 text-blue-500" />,
      },
      success: {
        container: 'bg-green-50 border-green-200 text-green-800',
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      },
      warning: {
        container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
      },
      error: {
        container: 'bg-red-50 border-red-200 text-red-800',
        icon: <XCircle className="h-5 w-5 text-red-500" />,
      },
    };

    const config = variants[variant];

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          'rounded-lg border p-4',
          config.container,
          className
        )}
        {...props}
      >
        <div className="flex gap-3">
          <div className="flex-shrink-0">{config.icon}</div>
          <div className="flex-1">
            {title && (
              <h4 className="font-medium mb-1">{title}</h4>
            )}
            <div className="text-sm">{children}</div>
          </div>
        </div>
      </div>
    );
  }
);

Alert.displayName = 'Alert';

export { Alert };
