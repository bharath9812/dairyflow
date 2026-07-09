'use client';

import { Save } from 'lucide-react';

export default function OperationalSpeedSettings() {
  return (
    <div className="grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Card 1: Smart Shift Auto-Select */}
      <div className="bg-white/80 backdrop-blur-2xl border border-white/40 shadow-sm rounded-2xl p-6 flex flex-col sm:flex-row sm:items-start justify-between gap-6">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-bold text-lg text-onyx">Smart Shift Auto-Select</h3>

          </div>
          <p className="text-sm text-slate-500 font-medium">Enable automatic shift selection based on time of day (Before 2PM = Morning). Reduces manual entry clicks during peak collection hours.</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1 sm:mt-0">
          <input type="checkbox" defaultChecked className="sr-only peer" />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
        </label>
      </div>

      {/* Card 2: Offline Sync & Cache Mode */}
      <div className="bg-white/80 backdrop-blur-2xl border border-white/40 shadow-sm rounded-2xl p-6 flex flex-col sm:flex-row sm:items-start justify-between gap-6">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-bold text-lg text-onyx">Offline Sync & Cache Mode</h3>

          </div>
          <p className="text-sm text-slate-500 font-medium">Activate background caching for low-connectivity environments. Entries are stored locally in IndexedDB and synchronized automatically when network is restored.</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1 sm:mt-0">
          <input type="checkbox" defaultChecked className="sr-only peer" />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
        </label>
      </div>

      {/* Card 3: Input Strictness */}
      <div className="bg-white/80 backdrop-blur-2xl border border-white/40 shadow-sm rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-bold text-lg text-onyx">Input Strictness</h3>

        </div>
        <p className="text-sm text-slate-500 font-medium mb-6 max-w-2xl">Configure system behavior when handling duplicate entries for the same seller within the same operational shift.</p>
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          <label className="flex items-center gap-3 cursor-pointer p-3 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
            <input type="radio" name="strictness" defaultChecked className="text-black focus:ring-black checked:bg-black accent-black h-4 w-4" />
            <span className="font-semibold text-sm text-onyx">Warn Only (Allow with Confirmation)</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer p-3 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-colors">
            <input type="radio" name="strictness" className="text-black focus:ring-black checked:bg-black accent-black h-4 w-4" />
            <span className="font-semibold text-sm text-onyx">Strictly Block Duplicates</span>
          </label>
        </div>
      </div>

      {/* Card 4: Data Archiving */}
      <div className="bg-white/80 backdrop-blur-2xl border border-white/40 shadow-sm rounded-2xl p-6 flex flex-col sm:flex-row sm:items-start justify-between gap-6">
        <div className="max-w-2xl w-full">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-bold text-lg text-onyx">Data Archiving Policy</h3>

          </div>
          <p className="text-sm text-slate-500 font-medium mb-4">Set the threshold for moving historical ledger data to cold storage. This improves active query performance.</p>
          <div className="relative max-w-xs mt-2">
            <select className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-semibold text-onyx focus:ring-1 focus:ring-onyx focus:border-onyx outline-none appearance-none cursor-pointer">
              <option>Move older than 12 months</option>
              <option defaultValue="Move older than 24 months">Move older than 24 months</option>
              <option>Move older than 36 months</option>
              <option>Never move (Not recommended)</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
              {/* Custom arrow down could go here, or let default appear since appearance-none might remove it. Lucide ChevronDown: */}
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 mb-12 flex justify-end">
        <button className="bg-onyx text-white font-bold text-sm py-3 px-8 rounded-xl shadow-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2">
          <Save className="w-4 h-4" />
          Save Configurations
        </button>
      </div>
    </div>
  );
}
