'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { fetchCycleConfig, getCurrentCycle, getCycleLabel } from '@/utils/cycle';

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
  const [globalCycle, setGlobalCycle] = useState<{ id: string, label: string } | null>(null);

  useEffect(() => {
    const fetchCycle = async () => {
      const supabase = createClient();
      const config = await fetchCycleConfig(supabase);
      const cycleId = getCurrentCycle(config);
      const label = getCycleLabel(cycleId, config);
      setGlobalCycle({ id: cycleId, label });
    };
    fetchCycle();
  }, []);

  return (
    <header className="h-[88px] flex items-center justify-between px-8 shrink-0 bg-transparent relative z-20">
      {/* Left Cycle Indicator */}
      <div className="w-[250px] hidden lg:flex items-center">
        {globalCycle && (
          <div className="flex flex-col animate-fade-in-up">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 ml-1">Calendar Cycle</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200 shadow-sm">
                {globalCycle.id}
              </span>
            </div>
          </div>
        )}
      </div>

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
      <div className="w-[250px] hidden lg:flex justify-end">
        {dateString && (
          <span className="font-mono text-sm font-medium text-slate-600">
            {dateString}
          </span>
        )}
      </div>
    </header>
  );
}
