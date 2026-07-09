'use client';

import { MessageSquare, CalendarClock, Hammer } from 'lucide-react';

export default function IntegrationsSettings() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Card 1: Automated SMS Integration */}
      <div className="bg-white/80 backdrop-blur-2xl border border-white/40 shadow-sm rounded-2xl p-8 flex flex-col gap-6 group">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-black group-hover:text-white transition-colors duration-300">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-onyx">Automated SMS</h3>
              <p className="text-sm font-medium text-slate-500 mt-1">Twilio receipts & notifications.</p>
            </div>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold tracking-widest uppercase border border-slate-200">
            Planned
          </span>
        </div>
        <div className="flex-1 bg-slate-50 border border-slate-200/50 rounded-xl p-6 flex flex-col justify-center items-center text-center">
          <Hammer className="w-8 h-8 text-slate-300 mb-4" />
          <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-sm">This feature is currently under development. It will allow automatic SMS dispatch upon ledger entry completion.</p>
        </div>
      </div>

      {/* Card 2: Automated Settlement Cycles */}
      <div className="bg-white/80 backdrop-blur-2xl border border-white/40 shadow-sm rounded-2xl p-8 flex flex-col gap-6 group">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-black group-hover:text-white transition-colors duration-300">
              <CalendarClock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-onyx">Settlement Cycles</h3>
              <p className="text-sm font-medium text-slate-500 mt-1">Weekly/Bi-weekly grouping.</p>
            </div>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold tracking-widest uppercase border border-slate-200">
            Pending
          </span>
        </div>
        <div className="flex-1 bg-slate-50 border border-slate-200/50 rounded-xl p-6 flex flex-col justify-center items-center text-center">
          <CalendarClock className="w-8 h-8 text-slate-300 mb-4" />
          <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-sm">Configure automatic ledger roll-overs and settlement calculation periods. Pending future update.</p>
        </div>
      </div>

    </div>
  );
}
