'use client';

import { cn } from '@/lib/utils';
// Logo uses text-based display
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const sizes = {
    sm: { image: 32, text: 'text-lg' },
    md: { image: 40, text: 'text-xl' },
    lg: { image: 56, text: 'text-2xl' },
  };

  const config = sizes[size];

  return (
    <Link href="/" className={cn('flex items-center gap-2', className)}>
      {/* Brain Icon SVG matching the Neurosay logo */}
      <svg
        width={config.image}
        height={config.image}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-[var(--primary)]"
      >
        <path
          d="M50 10C35 10 25 20 25 35C25 40 26 44 28 48C20 52 15 60 15 70C15 82 25 90 38 90C42 90 45 89 48 87C48 88 49 89 50 90C51 89 52 88 52 87C55 89 58 90 62 90C75 90 85 82 85 70C85 60 80 52 72 48C74 44 75 40 75 35C75 20 65 10 50 10Z"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M35 35C35 35 40 45 50 45C60 45 65 35 65 35"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M30 55C30 55 38 65 50 65C62 65 70 55 70 55"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M50 45L50 90"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="38" cy="30" r="3" fill="currentColor" />
        <circle cx="62" cy="30" r="3" fill="currentColor" />
      </svg>
      {showText && (
        <div className="flex flex-col">
          <span className={cn('font-bold text-[var(--primary)]', config.text)}>
            Neurosay
          </span>
          <span className="text-xs text-gray-500 -mt-1">PrimariaMind</span>
        </div>
      )}
    </Link>
  );
}
