'use client';

import { useState, useEffect } from 'react';
import { Image as ImageIcon, Upload, Receipt, FileText as FileTextIcon, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function PdfBrandingSettings() {
  const [farmName, setFarmName] = useState("SRI LAKSHMI DAIRY FARM - MAIN BRANCH");
  const [farmAddress, setFarmAddress] = useState("GSTIN: 37XXXXX1234X1ZX | Plot 42, Industrial Area");
  const [footerMessage, setFooterMessage] = useState("This is a computer generated receipt. Please report any discrepancies within 24 hours.");
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('app_settings').select('value').eq('id', 'pdf_branding').maybeSingle();
      if (data?.value) {
         const v = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
         if (v.farmName) setFarmName(v.farmName);
         if (v.farmAddress) setFarmAddress(v.farmAddress);
         if (v.footerMessage) setFooterMessage(v.footerMessage);
      }
      setIsLoading(false);
    }
    load();
  }, [supabase]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    const value = { farmName, farmAddress, footerMessage };
    
    await supabase.from('app_settings').upsert({
      id: 'pdf_branding',
      value: value,
      updated_at: new Date().toISOString()
    });
    
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Left Column (Branding & Receipts) */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        
        {/* Section 1: Farm Branding / White-labeling */}
        <section className="bg-white/80 backdrop-blur-2xl border border-white/40 shadow-sm rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <h3 className="font-bold text-lg text-onyx">Farm Branding</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Farm Name</label>
              <input 
                type="text" 
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-semibold text-onyx focus:ring-1 focus:ring-onyx focus:border-onyx outline-none transition-colors" 
              />
            </div>
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Farm Address / GSTIN / Location</label>
              <input 
                type="text" 
                value={farmAddress}
                onChange={(e) => setFarmAddress(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-semibold text-onyx focus:ring-1 focus:ring-onyx focus:border-onyx outline-none transition-colors" 
              />
            </div>
            <div className="md:col-span-2 pt-2 flex items-center gap-4 opacity-50 cursor-not-allowed">
              <div className="w-16 h-16 rounded-lg border border-dashed border-slate-300 flex items-center justify-center bg-slate-50 text-slate-400 overflow-hidden shrink-0">
                <ImageIcon className="w-6 h-6" />
              </div>
              <button disabled className="px-6 py-2 rounded-lg border border-slate-200 text-onyx font-bold text-sm hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-not-allowed">
                <Upload className="w-4 h-4" />
                Upload Farm Logo (Coming Soon)
              </button>
            </div>
          </div>
        </section>

        {/* Section 2: Receipt Customization */}
        <section className="bg-white/80 backdrop-blur-2xl border border-white/40 shadow-sm rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <h3 className="font-bold text-lg text-onyx">Receipt Customization</h3>
          </div>
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex justify-between">
                <span>Statement Footer Message</span>
                <span className="text-slate-400">Max 150 chars</span>
              </label>
              <textarea 
                rows={3} 
                value={footerMessage}
                onChange={(e) => setFooterMessage(e.target.value)}
                maxLength={150}
                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm font-semibold text-onyx focus:ring-1 focus:ring-onyx focus:border-onyx outline-none transition-colors resize-none"
              />
            </div>
            <div className="mt-2 opacity-50 cursor-not-allowed">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Receipt Format Preference</label>
              <div className="grid grid-cols-2 gap-4">
                <label className="relative flex flex-col items-center justify-center p-6 border-2 border-slate-200 bg-slate-50 rounded-xl transition-all">
                  <Receipt className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="font-bold text-sm text-slate-400">3-inch Thermal</span>
                </label>
                <label className="relative flex flex-col items-center justify-center p-6 border-2 border-onyx bg-white rounded-xl transition-all">
                  <FileTextIcon className="w-8 h-8 text-onyx mb-2" />
                  <span className="font-bold text-sm text-onyx">Standard A4</span>
                  <div className="absolute top-3 right-3 w-4 h-4 rounded-full border-[5px] border-onyx bg-white"></div>
                </label>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* Right Column (Rules & Actions) */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        
        {/* Save Action Panel */}
        <section className="bg-white/80 backdrop-blur-2xl border border-white/40 shadow-sm rounded-2xl p-6 flex flex-col justify-center sticky top-24">
          <p className="text-sm font-medium text-slate-500 mb-4 text-center">
            {saveSuccess ? "Configuration saved successfully!" : "Update your receipt branding."}
          </p>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className={`w-full text-white rounded-xl py-3 font-bold text-sm shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${saveSuccess ? 'bg-emerald-600' : 'bg-onyx hover:opacity-90'}`}
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : (saveSuccess ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />)}
            {isSaving ? 'Saving...' : (saveSuccess ? 'Saved' : 'Save Configuration')}
          </button>
        </section>

      </div>
    </div>
  );
}
