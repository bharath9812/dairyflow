'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Palette, FileText, Zap, Shield, Blocks } from 'lucide-react';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navLinks = [
    { href: '/admin/settings', label: 'Basic & Interface', icon: <Palette className="w-4 h-4" />, exact: true },
    { href: '/admin/settings/pdf', label: 'PDF & Branding', icon: <FileText className="w-4 h-4" />, exact: false },
    { href: '/admin/settings/cycles', label: 'Cycles & Payouts', icon: <FileText className="w-4 h-4" />, exact: false },
    { href: '/admin/settings/speed', label: 'Operational Speed Boosters', icon: <Zap className="w-4 h-4" />, exact: false },
    { href: '/admin/settings/backups', label: 'Data & Backups', icon: <Shield className="w-4 h-4" />, exact: false },
    { href: '/admin/settings/integrations', label: 'Integrations', icon: <Blocks className="w-4 h-4" />, exact: false },
  ];

  return (
    <div className="w-full h-full overflow-y-auto custom-scrollbar flex justify-center">
      <div className="w-full max-w-5xl flex flex-col gap-6 lg:gap-8 pb-12 pt-2">
        
        {/* Settings Header & Sub-Nav */}
        <div className="w-full mb-8">
          <h2 className="text-2xl font-bold text-onyx mb-6">Settings Configuration</h2>
          
          {/* Sub Navigation */}
          <div className="flex gap-6 mt-4 border-b border-slate-200 text-[10px] font-bold uppercase tracking-widest text-onyx overflow-x-auto no-scrollbar">
            {navLinks.map((link) => {
              const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`pb-4 whitespace-nowrap flex items-center gap-2 transition-opacity cursor-pointer
                    ${isActive ? 'text-onyx border-b-[3px] border-onyx' : 'text-slate-500 hover:text-onyx border-b-[3px] border-transparent'}`}
                >
                  {link.icon} {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1">
          {children}
        </div>

      </div>
    </div>
  );
}
