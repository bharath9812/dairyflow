'use client';

import { useState } from 'react';
import { Save, Download, Trash2, Mail, Database, HardDrive } from 'lucide-react';

export default function BackupsSettings() {
  const [frequency, setFrequency] = useState('Daily');
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Main Backup Panel */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        <section className="bg-white/80 backdrop-blur-2xl border border-white/40 shadow-sm rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-slate-200 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10">
            {/* Automated Daily Export */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-bold text-lg text-onyx">Automated Daily Export</h4>
                  <p className="text-sm font-medium text-slate-500">Configure automated data delivery to your inbox.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                </label>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Destination Email</label>
                  <input type="email" defaultValue="admin@lumina.com" className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm font-semibold text-onyx focus:ring-1 focus:ring-onyx focus:border-onyx outline-none" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Export Time</label>
                  <input type="time" defaultValue="00:00" className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm font-semibold text-onyx focus:ring-1 focus:ring-onyx focus:border-onyx outline-none" />
                </div>
              </div>
              
              <div className="mb-6">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Frequency</label>
                <div className="flex bg-slate-100 p-1 rounded-lg w-fit">
                  <button type="button" onClick={() => setFrequency('Daily')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${frequency === 'Daily' ? 'text-black bg-white shadow-sm' : 'text-slate-500 hover:text-black'}`}>Daily</button>
                  <button type="button" onClick={() => setFrequency('Weekly')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${frequency === 'Weekly' ? 'text-black bg-white shadow-sm' : 'text-slate-500 hover:text-black'}`}>Weekly</button>
                  <button type="button" onClick={() => setFrequency('Monthly')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${frequency === 'Monthly' ? 'text-black bg-white shadow-sm' : 'text-slate-500 hover:text-black'}`}>Monthly</button>
                </div>
              </div>
              
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3">Tables to Include</label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-onyx">All Tables</span>
                    <input type="checkbox" defaultChecked className="rounded border-slate-300 text-black focus:ring-black checked:bg-black accent-black" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-onyx">Transaction Table Only</span>
                    <input type="checkbox" className="rounded border-slate-300 text-black focus:ring-black checked:bg-black accent-black" />
                  </div>
                </div>
                <p className="mt-4 text-xs font-medium text-slate-400 italic">Note: If All Tables is selected, data will be exported into separate CSV files.</p>
              </div>
            </div>

            <div className="h-px w-full bg-slate-200 mb-8"></div>

            {/* Full System Backup */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-bold text-lg text-onyx">Full System Backup</h4>
                <span className="bg-slate-200 text-onyx px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase">Mandatory</span>
              </div>
              <p className="text-sm font-medium text-slate-500 mb-6">Exports a full relational mapping backup (.sql/.dump) including all user settings, operational parameters, and backend data.</p>
              
              <div className="space-y-6">
                <div className="w-full sm:w-1/2 flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Frequency</label>
                  <select className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-semibold text-onyx focus:ring-1 focus:ring-onyx focus:border-onyx outline-none appearance-none cursor-pointer">
                    <option>Daily</option>
                    <option>Weekly</option>
                    <option>Monthly</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3">Backup Destinations</label>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/60 transition-colors">
                      <div className="flex flex-col w-full max-w-[200px] sm:max-w-xs">
                        <span className="text-sm font-bold text-onyx flex items-center gap-2"><Mail className="w-4 h-4 text-slate-400" /> Email Delivery</span>
                        <input type="email" placeholder="backup@example.com" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 mt-2 text-xs font-semibold text-onyx focus:ring-1 focus:ring-onyx outline-none" />
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/60 transition-colors">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-onyx flex items-center gap-2"><HardDrive className="w-4 h-4 text-slate-400" /> Google Drive</span>
                        <span className="text-xs font-medium text-slate-500 pl-6 mt-0.5">Cloud Storage Sync</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/60 transition-colors">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-onyx flex items-center gap-2"><Database className="w-4 h-4 text-slate-400" /> Supabase Storage</span>
                        <span className="text-xs font-medium text-slate-500 pl-6 mt-0.5">Relational DB Backup</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 mt-8 border-t border-slate-200 flex justify-end">
              <button className="bg-onyx text-white font-bold text-sm px-8 py-3 rounded-xl hover:opacity-90 transition-all active:scale-[0.98] flex items-center gap-2 shadow-sm">
                <Save className="w-4 h-4" />
                Save Configuration
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Secondary Info Panel */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        <div className="bg-slate-50/50 backdrop-blur-sm border border-slate-200 rounded-2xl p-6">
          <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Manual Operations</h5>
          <div className="space-y-3">
            <button className="w-full bg-white border border-slate-200 text-slate-400 transition-all px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 opacity-60 cursor-not-allowed">
              <Download className="w-4 h-4" />
              Export Current State
            </button>
            <button className="w-full bg-white border border-slate-200 text-slate-400 transition-all px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 opacity-60 cursor-not-allowed">
              <Trash2 className="w-4 h-4" />
              Purge Old Backups
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
