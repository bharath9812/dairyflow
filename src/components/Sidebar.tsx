'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, UserCircle, ChevronLeft, ChevronRight, Droplets, Settings, PlusCircle, BarChart3, Activity, Landmark, Receipt, Users } from 'lucide-react';
import { useSidebar } from '@/components/SidebarContext';

export type SidebarLink = {
  label: string;
  href: string;
  icon: React.ReactNode;
  isActive?: boolean;
};

interface SidebarProps {
  title?: string;
  subtitle?: string;
  links?: SidebarLink[];
  onLogout?: () => void;
}

const DEFAULT_LINKS: SidebarLink[] = [
  { label: 'Daily Milk Entry', href: '/', icon: <PlusCircle className="w-5 h-5" /> },
  { label: 'Customers', href: '/customers', icon: <Users className="w-5 h-5" /> },
  { label: 'Register Customer', href: '/customers/new', icon: <UserCircle className="w-5 h-5" /> },
  { label: 'Reports', href: '/admin', icon: <BarChart3 className="w-5 h-5" /> },
  { label: 'Live Tracker', href: '/live', icon: <Activity className="w-5 h-5" /> },
  { label: 'Loans', href: '/loan', icon: <Landmark className="w-5 h-5" /> },
  { label: 'Payouts', href: '/payout', icon: <Receipt className="w-5 h-5" /> },
];

export default function Sidebar({
  title = "Lumina",
  subtitle = "DAIRY TERMINAL",
  links = DEFAULT_LINKS,
  onLogout
}: SidebarProps) {
  const { isCollapsed, toggleSidebar, isMounted } = useSidebar();

  // Hide entirely during SSR to prevent layout flicker, or render collapsed state based on mount
  const effectiveCollapsed = isMounted ? isCollapsed : false;

  return (
    <aside
      className={`relative hidden lg:flex flex-col bg-surface border-r border-slate-200 transition-all duration-300 z-30 shrink-0
        ${effectiveCollapsed ? 'w-[80px]' : 'w-[240px]'}`}
    >
      {/* Collapse Toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-6 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 shadow-sm z-40 transition-transform hover:scale-110"
      >
        {effectiveCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Brand Header */}
      <div className={`p-6 flex items-center ${effectiveCollapsed ? 'justify-center' : 'gap-3'} h-[88px] box-border`}>
        <div className="w-10 h-10 shrink-0 bg-onyx text-white rounded-xl flex items-center justify-center shadow-sm">
          <Droplets className="w-5 h-5" />
        </div>
        {!effectiveCollapsed && (
          <div className="flex flex-col overflow-hidden animate-in fade-in duration-300">
            <span className="font-bold text-lg leading-tight text-onyx whitespace-nowrap">{title}</span>
            <span className="text-[10px] font-mono font-medium tracking-widest text-slate-400 whitespace-nowrap">{subtitle}</span>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 flex flex-col gap-2 overflow-y-auto no-scrollbar">
        {links.map((link, i) => {
          const pathname = usePathname();
          const active = link.isActive !== undefined ? link.isActive : (pathname === link.href);
          return (
            <Link
              key={i}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group
                ${active 
                  ? 'bg-onyx text-white shadow-md shadow-slate-200/50' 
                  : 'text-slate-600 hover:bg-white hover:shadow-sm hover:text-onyx border border-transparent hover:border-slate-200'
                }
                ${effectiveCollapsed ? 'justify-center' : ''}
              `}
              title={effectiveCollapsed ? link.label : undefined}
            >
              <div className="shrink-0">{link.icon}</div>
              {!effectiveCollapsed && <span className="font-semibold text-sm whitespace-nowrap animate-in fade-in duration-300">{link.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer Actions */}
      <div className="p-4 flex flex-col gap-2 border-t border-slate-200">
        <Link
          href="/admin/settings"
          className={`flex items-center gap-3 px-3 py-3 rounded-xl text-slate-600 hover:bg-white hover:shadow-sm hover:text-onyx border border-transparent hover:border-slate-200 transition-all group
            ${effectiveCollapsed ? 'justify-center' : ''}`}
          title={effectiveCollapsed ? "Settings" : undefined}
        >
          <Settings className="w-5 h-5 shrink-0" />
          {!effectiveCollapsed && <span className="font-semibold text-sm whitespace-nowrap animate-in fade-in duration-300">Settings</span>}
        </Link>
        <Link
          href="/admin/profile"
          className={`flex items-center gap-3 px-3 py-3 rounded-xl text-slate-600 hover:bg-white hover:shadow-sm hover:text-onyx border border-transparent hover:border-slate-200 transition-all group
            ${effectiveCollapsed ? 'justify-center' : ''}`}
          title={effectiveCollapsed ? "My Profile" : undefined}
        >
          <UserCircle className="w-5 h-5 shrink-0" />
          {!effectiveCollapsed && <span className="font-semibold text-sm whitespace-nowrap animate-in fade-in duration-300">My Profile</span>}
        </Link>
        <button
          onClick={onLogout}
          className={`flex items-center gap-3 px-3 py-3 rounded-xl text-slate-600 hover:bg-white hover:shadow-sm hover:text-onyx border border-transparent hover:border-slate-200 transition-all w-full text-left group
            ${effectiveCollapsed ? 'justify-center' : ''}`}
          title={effectiveCollapsed ? "Log Out" : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!effectiveCollapsed && <span className="font-semibold text-sm whitespace-nowrap animate-in fade-in duration-300">Log Out</span>}
        </button>
      </div>
    </aside>
  );
}
