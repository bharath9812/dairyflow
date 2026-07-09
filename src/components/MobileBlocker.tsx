'use client';

import { Monitor, Smartphone } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function MobileBlocker() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkSize = () => {
      // Trigger blocker on anything smaller than a standard iPad landscape (1024px)
      // or standard desktop (1024px). Feel free to adjust to 768px if you want to allow portrait tablets.
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      
      if (mobile) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'unset';
      }
    };
    
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => {
      window.removeEventListener('resize', checkSize);
      document.body.style.overflow = 'unset';
    };
  }, []);

  if (!isMobile) return null;

  return (
    <div className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl flex flex-col items-center border border-slate-100 animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6 text-red-500 shadow-sm border border-red-100">
          <Monitor className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-onyx mb-3 tracking-tight">Bigger Screen Required</h2>
        <p className="text-slate-500 text-sm leading-relaxed mb-6 font-medium">
          The DairyFlow Administrator Dashboard is highly data-dense. To manage loans, payouts, and complex financial ledgers, please switch to a Desktop, Laptop, or Tablet.
        </p>
        <div className="flex items-center gap-3 text-[11px] uppercase tracking-wider font-bold text-slate-400 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 w-full justify-center">
          <Smartphone className="w-4 h-4" />
          <span>Mobile UI currently in development</span>
        </div>
      </div>
    </div>
  );
}
