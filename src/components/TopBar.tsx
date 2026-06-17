'use client';

import React from 'react';
import Link from 'next/link';

interface TopBarProps {
  leftPillLabel: string;
  leftPillHref: string;
  leftPillActive?: boolean;
  rightPillLabel: string;
  rightPillHref: string;
  rightPillActive?: boolean;
  dateString?: string;
}

export default function TopBar({
  leftPillLabel,
  leftPillHref,
  leftPillActive = true,
  rightPillLabel,
  rightPillHref,
  rightPillActive = false,
  dateString
}: TopBarProps) {
  return (
    <header className="h-[88px] flex items-center justify-between px-8 shrink-0 bg-transparent relative z-20">
      {/* Spacer for left alignment balancing */}
      <div className="w-[200px] hidden lg:block"></div>

      {/* Centered Switcher */}
      <div className="flex-1 flex justify-center">
        <div className="bg-surface-container-low p-1 rounded-full flex items-center shadow-sm border border-slate-200/50">
          <Link
            href={leftPillHref}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
              leftPillActive
                ? 'bg-white text-onyx shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {leftPillLabel}
          </Link>
          <Link
            href={rightPillHref}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
              rightPillActive
                ? 'bg-white text-onyx shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {rightPillLabel}
          </Link>
        </div>
      </div>

      {/* Right Aligned Date */}
      <div className="w-[200px] hidden lg:flex justify-end">
        {dateString && (
          <span className="font-mono text-sm font-medium text-slate-600">
            {dateString}
          </span>
        )}
      </div>
    </header>
  );
}
