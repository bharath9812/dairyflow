'use client';

import { useState, useEffect } from 'react';
import { Save, Download, Trash2, Mail, Database, HardDrive, Loader2, CheckCircle2, AlertCircle, Play } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

type FrequencyConfig = {
  enabled: boolean;
  email: string;
  exportTime: string;
  subjectPrefix: string;
  exportFormat: string;
  tables: string;
};

const DEFAULT_CONFIGS: Record<string, FrequencyConfig> = {
  Daily: {
    enabled: true,
    email: "admin@lumina.com",
    exportTime: "22:00",
    subjectPrefix: "Daily Transactions Backup",
    exportFormat: "xlsx",
    tables: "transactions_only"
  },
  Weekly: {
    enabled: false,
    email: "admin@lumina.com",
    exportTime: "08:00",
    subjectPrefix: "Weekly Full Backup",
    exportFormat: "xlsx",
    tables: "all"
  },
  Monthly: {
    enabled: false,
    email: "admin@lumina.com",
    exportTime: "00:00",
    subjectPrefix: "Monthly Full Archive",
    exportFormat: "csv",
    tables: "all"
  }
};

const DEFAULT_STATUSES: Record<string, string> = {
  Daily: "Never run",
  Weekly: "Never run",
  Monthly: "Never run"
};

export default function BackupsSettings() {
  const [activeTab, setActiveTab] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');
  const [configs, setConfigs] = useState<Record<string, FrequencyConfig>>(DEFAULT_CONFIGS);
  const [statuses, setStatuses] = useState<Record<string, string>>(DEFAULT_STATUSES);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testingFreq, setTestingFreq] = useState<'Daily' | 'Weekly' | 'Monthly' | null>(null);
  const [testMessage, setTestMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase.from('app_settings').select('value').eq('id', 'backup_config').maybeSingle();
        if (data?.value) {
          const v = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
          if (v.configs) {
            // Merge with defaults to ensure all keys are present
            const merged = { ...DEFAULT_CONFIGS };
            Object.keys(v.configs).forEach(k => {
              merged[k] = { ...DEFAULT_CONFIGS[k], ...v.configs[k] };
            });
            setConfigs(merged);
          }
          if (v.lastBackupStatuses) {
            setStatuses({ ...DEFAULT_STATUSES, ...v.lastBackupStatuses });
          }
        }
      } catch (err) {
        console.error("Error loading backup settings:", err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [supabase]);

  const updateActiveConfig = (key: keyof FrequencyConfig, value: any) => {
    setConfigs(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [key]: value
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      const payload = {
        configs,
        lastBackupStatuses: statuses
      };

      await supabase.from('app_settings').upsert({
        id: 'backup_config',
        value: payload,
        updated_at: new Date().toISOString()
      });
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving backup settings:", err);
      alert("Failed to save configuration.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestBackupFor = async (frequency: 'Daily' | 'Weekly' | 'Monthly') => {
    setTestingFreq(frequency);
    setTestMessage(null);
    const activeConfig = configs[frequency];

    try {
      const res = await fetch('/api/backup/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: activeConfig.email,
          tables: activeConfig.tables,
          subjectPrefix: activeConfig.subjectPrefix,
          exportFormat: activeConfig.exportFormat,
          frequency: frequency,
          enabled: activeConfig.enabled
        })
      });
      const data = await res.json();
      if (res.ok) {
        setTestMessage({ type: 'success', text: `Manual ${frequency} backup email sent successfully!` });
      } else {
        setTestMessage({ type: 'error', text: `Failed: ${data.error || 'Unknown error'}` });
      }
    } catch (e: any) {
      setTestMessage({ type: 'error', text: `Error: ${e.message}` });
    } finally {
      setTestingFreq(null);
      setTimeout(() => setTestMessage(null), 6000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const currentConfig = configs[activeTab];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Main Backup Panel */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        <section className="bg-white/80 backdrop-blur-2xl border border-white/40 shadow-sm rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-slate-200 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10">
            {/* Frequency Selection Tabs */}
            <div className="mb-6 border-b border-slate-100 pb-4">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">Backup Frequency Schedule</label>
              <div className="flex bg-slate-100 p-1 rounded-lg w-fit">
                {(['Daily', 'Weekly', 'Monthly'] as const).map(tab => (
                  <button 
                    key={tab}
                    type="button" 
                    onClick={() => setActiveTab(tab)} 
                    className={`px-5 py-2 rounded-md text-xs font-bold transition-all ${activeTab === tab ? 'text-black bg-white shadow-sm' : 'text-slate-500 hover:text-black'}`}
                  >
                    {tab} Backup {configs[tab].enabled ? '🟢' : '⚪'}
                  </button>
                ))}
              </div>
            </div>

            {/* Automated Daily/Weekly/Monthly Export Config */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="font-bold text-lg text-onyx">Automated {activeTab} Export</h4>
                  <p className="text-sm font-medium text-slate-500">Configure parameters for the automated {activeTab.toLowerCase()} email schedule.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={currentConfig.enabled} 
                    onChange={(e) => updateActiveConfig('enabled', e.target.checked)} 
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                </label>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Destination Email</label>
                  <input 
                    type="email" 
                    value={currentConfig.email} 
                    onChange={(e) => updateActiveConfig('email', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm font-semibold text-onyx focus:ring-1 focus:ring-onyx focus:border-onyx outline-none" 
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Export Time</label>
                  <input 
                    type="time" 
                    value={currentConfig.exportTime} 
                    onChange={(e) => updateActiveConfig('exportTime', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm font-semibold text-onyx focus:ring-1 focus:ring-onyx focus:border-onyx outline-none" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Email Subject Prefix</label>
                  <input 
                    type="text" 
                    value={currentConfig.subjectPrefix} 
                    onChange={(e) => updateActiveConfig('subjectPrefix', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm font-semibold text-onyx focus:ring-1 focus:ring-onyx focus:border-onyx outline-none" 
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">File Format</label>
                  <select 
                    value={currentConfig.exportFormat} 
                    onChange={(e) => updateActiveConfig('exportFormat', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-semibold text-onyx focus:ring-1 focus:ring-onyx focus:border-onyx outline-none appearance-none cursor-pointer"
                  >
                    <option value="xlsx">Excel Spreadsheet (.xlsx)</option>
                    <option value="csv">Comma Separated Values (.csv)</option>
                  </select>
                </div>
              </div>
              
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3">Backup Scope</label>
                <div className="space-y-3">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm font-semibold text-onyx">All Tables</span>
                    <input 
                      type="radio" 
                      name="backupScope"
                      checked={currentConfig.tables === 'all'} 
                      onChange={() => updateActiveConfig('tables', 'all')}
                      className="rounded-full border-slate-300 text-black focus:ring-black checked:bg-black accent-black" 
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm font-semibold text-onyx">Transaction Table Only</span>
                    <input 
                      type="radio" 
                      name="backupScope"
                      checked={currentConfig.tables === 'transactions_only'} 
                      onChange={() => updateActiveConfig('tables', 'transactions_only')}
                      className="rounded-full border-slate-300 text-black focus:ring-black checked:bg-black accent-black" 
                    />
                  </label>
                </div>
                <p className="mt-4 text-xs font-medium text-slate-400 italic">
                  {currentConfig.tables === 'all' 
                    ? 'All critical database tables (Transactions, Loans, and Payments) will be structured and exported.' 
                    : activeTab === 'Daily' 
                      ? "Only today's transactions will be formatted and exported."
                      : activeTab === 'Weekly'
                        ? "Only the past 7 days' transactions will be formatted and exported."
                        : "Only the past 30 days' transactions will be formatted and exported."}
                </p>
              </div>
            </div>

            <div className="h-px w-full bg-slate-200 mb-8"></div>
 
            {/* Full System Backup */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-bold text-lg text-onyx">Full System Backup</h4>
                <span className="bg-slate-200 text-onyx px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase">Manual</span>
              </div>
              <p className="text-sm font-medium text-slate-500 mb-6">Exports a full relational mapping backup (.sql) including all user settings, operational parameters, and backend data.</p>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3">Cloud Backup Sync Targets</label>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/60 transition-colors">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-onyx flex items-center gap-2"><Mail className="w-4 h-4 text-slate-400" /> Email Delivery</span>
                        <span className="text-xs font-medium text-slate-500 pl-6 mt-0.5">Sends SQL dump to {currentConfig.email || 'configured email'}</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked disabled className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200/70 rounded-full after:translate-x-full after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black/40"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/60 transition-colors">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-onyx flex items-center gap-2"><HardDrive className="w-4 h-4 text-slate-400" /> Google Drive</span>
                        <span className="text-xs font-medium text-slate-500 pl-6 mt-0.5">Cloud Storage Sync (Requires Integration)</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-not-allowed">
                        <input type="checkbox" disabled className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-100 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-200 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/60 transition-colors">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-onyx flex items-center gap-2"><Database className="w-4 h-4 text-slate-400" /> Supabase Storage</span>
                        <span className="text-xs font-medium text-slate-500 pl-6 mt-0.5">Direct DB schema storage bucket</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-not-allowed">
                        <input type="checkbox" disabled className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-100 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-200 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 mt-8 border-t border-slate-200 flex justify-between items-center gap-3">
              <div className="flex items-center gap-2 text-xs">
                {isSaving && (
                  <span className="text-slate-400 flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</span>
                )}
                {saveSuccess && (
                  <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Saved!</span>
                )}
              </div>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="bg-onyx text-white font-bold text-sm px-8 py-3 rounded-xl hover:opacity-90 transition-all active:scale-[0.98] flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {!isSaving && <Save className="w-4 h-4" />}
                {isSaving ? 'Saving...' : 'Save Configuration'}
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
            {(['Daily', 'Weekly', 'Monthly'] as const).map(tab => (
              <button 
                key={tab}
                onClick={() => handleTestBackupFor(tab)}
                disabled={testingFreq !== null}
                className="w-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {testingFreq === tab ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : <Play className="w-4 h-4 text-sky-500" />}
                Run Manual {tab}
              </button>
            ))}
          </div>
          
          {testMessage && (
            <div className={`mt-4 p-3 rounded-lg text-xs font-semibold flex items-start gap-2 animate-in fade-in slide-in-from-top-2 ${testMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-rose-50 text-rose-800 border border-rose-100'}`}>
              {testMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{testMessage.text}</span>
            </div>
          )}
          
          <div className="mt-6 border-t border-slate-200 pt-6">
            <h6 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Backup Status</h6>
            <div className="flex flex-col gap-2.5">
              {(['Daily', 'Weekly', 'Monthly'] as const).map(tab => (
                <div key={tab} className="flex justify-between items-start text-xs border-b border-slate-100/50 pb-1.5">
                  <span className="text-slate-500 font-semibold">{tab}:</span>
                  <span className="font-mono font-bold text-slate-700 text-right max-w-[140px] truncate" title={statuses[tab]}>
                    {statuses[tab]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
