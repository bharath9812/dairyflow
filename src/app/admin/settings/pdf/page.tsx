'use client';

import { Image as ImageIcon, Upload, Receipt, FileText as FileTextIcon, Save } from 'lucide-react';

export default function PdfBrandingSettings() {
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
                defaultValue="Sunrise Dairy Cooperative" 
                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-semibold text-onyx focus:ring-1 focus:ring-onyx focus:border-onyx outline-none transition-colors" 
              />
            </div>
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Farm Address / Location</label>
              <input 
                type="text" 
                defaultValue="Plot 42, Industrial Area, Phase II" 
                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-semibold text-onyx focus:ring-1 focus:ring-onyx focus:border-onyx outline-none transition-colors" 
              />
            </div>
            <div className="md:col-span-2 pt-2 flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg border border-dashed border-slate-300 flex items-center justify-center bg-slate-50 text-slate-400 overflow-hidden shrink-0">
                <ImageIcon className="w-6 h-6" />
              </div>
              <button className="px-6 py-2 rounded-lg border border-slate-200 text-onyx font-bold text-sm hover:bg-slate-50 transition-colors flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload Farm Logo
              </button>
              <span className="text-slate-400 font-bold text-[10px] uppercase ml-2 tracking-widest hidden sm:inline">PNG or JPG, max 2MB</span>
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
                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm font-semibold text-onyx focus:ring-1 focus:ring-onyx focus:border-onyx outline-none transition-colors resize-none"
                defaultValue="Next payout will be distributed on the 1st of the month. Thank you for your continued partnership with Sunrise Dairy!"
              />
            </div>
            <div className="mt-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Receipt Format Preference</label>
              <div className="grid grid-cols-2 gap-4">
                <label className="relative flex flex-col items-center justify-center p-6 border-2 border-onyx bg-slate-50 rounded-xl cursor-pointer transition-all">
                  <input type="radio" name="receipt_format" value="thermal" defaultChecked className="sr-only" />
                  <Receipt className="w-8 h-8 text-onyx mb-2" />
                  <span className="font-bold text-sm text-onyx">3-inch Thermal</span>
                  <div className="absolute top-3 right-3 w-4 h-4 rounded-full border-[5px] border-onyx bg-white"></div>
                </label>
                <label className="relative flex flex-col items-center justify-center p-6 border border-slate-200 bg-white rounded-xl cursor-pointer transition-all hover:border-slate-300 opacity-70 hover:opacity-100">
                  <input type="radio" name="receipt_format" value="a4" className="sr-only" />
                  <FileTextIcon className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="font-bold text-sm text-slate-500">Standard A4</span>
                  <div className="absolute top-3 right-3 w-4 h-4 rounded-full border-2 border-slate-200"></div>
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
          <p className="text-sm font-medium text-slate-500 mb-4 text-center">Unsaved changes to branding and rules.</p>
          <button className="w-full bg-onyx text-white rounded-xl py-3 font-bold text-sm shadow-sm hover:opacity-90 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
            <Save className="w-4 h-4" />
            Save Configuration
          </button>
        </section>

      </div>
    </div>
  );
}
