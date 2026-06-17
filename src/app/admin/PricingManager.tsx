'use client'
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps, prefer-const, react/no-unescaped-entities, react-hooks/set-state-in-effect */

import React, { useState } from 'react'
import { Activity, Save, Loader2, Zap, Globe } from 'lucide-react'
import { updatePricing } from './pricing-actions'

export default function PricingManager({ initialCow, initialBuffalo }: { initialCow: number, initialBuffalo: number }) {
  const [cowPrice, setCowPrice] = useState(initialCow.toString())
  const [buffaloPrice, setBuffaloPrice] = useState(initialBuffalo.toString())
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null)

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setMessage(null)

    const formData = new FormData()
    formData.append('cow_price', cowPrice)
    formData.append('buffalo_price', buffaloPrice)

    const result = await updatePricing(formData)
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else if (result.success) {
      setMessage({ type: 'success', text: result.success })
      setTimeout(() => setMessage(null), 3000)
    }

    setIsSaving(false)
  }

  return (
    <div className="bg-white/80 backdrop-blur-2xl border border-white/40 shadow-[0_4px_24px_-1px_rgba(0,0,0,0.05)] rounded-2xl flex flex-col justify-between p-6 w-full relative z-20">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-onyx flex items-center justify-center shrink-0">
            <Activity className="text-white w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-xl text-onyx tracking-tight leading-none mb-1.5">Live Rate Configuration</h3>
            <p className="text-xs font-mono text-slate-500 font-semibold tracking-wide">UTC: {new Date().toISOString().replace('T', ' ').substring(0, 19)}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {message && (
            <span className={`text-[10px] font-bold px-2 py-1 rounded ${message.type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {message.text}
            </span>
          )}
          <div className="bg-slate-100 px-4 py-1.5 rounded-full flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-accent animate-pulse"></span>
            <span className="text-xs font-bold text-onyx tracking-widest">SYSTEM ARMED</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleUpdate} className="flex flex-col gap-8 w-full">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Cow Milk */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Cow Milk Rate (₹/KG)</label>
              <span className="text-[10px] bg-slate-100 text-onyx px-2 py-0.5 rounded font-mono font-bold">+0.5% Volatility</span>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xl">₹</span>
              <input
                type="number"
                step="0.1"
                required
                value={cowPrice}
                onChange={e => setCowPrice(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-black/5 bg-black/[0.03] text-onyx font-black text-2xl focus:bg-white focus:border-sky-accent focus:ring-4 focus:ring-sky-accent/20 transition-all outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setCowPrice(initialCow.toString())} className="px-3 py-1 bg-slate-100 text-[11px] font-bold text-slate-500 rounded-lg hover:bg-slate-200 transition-colors">Reset</button>
            </div>
          </div>

          {/* Buffalo Milk */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Buffalo Milk Rate (₹/KG)</label>
              <span className="text-[10px] bg-slate-100 text-onyx px-2 py-0.5 rounded font-mono font-bold">Stable Market</span>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xl">₹</span>
              <input
                type="number"
                step="0.1"
                required
                value={buffaloPrice}
                onChange={e => setBuffaloPrice(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-black/5 bg-black/[0.03] text-onyx font-black text-2xl focus:bg-white focus:border-sky-accent focus:ring-4 focus:ring-sky-accent/20 transition-all outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setBuffaloPrice(initialBuffalo.toString())} className="px-3 py-1 bg-slate-100 text-[11px] font-bold text-slate-500 rounded-lg hover:bg-slate-200 transition-colors">Reset</button>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200/50">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-onyx text-white rounded-xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-onyx/20 hover:scale-[1.01] transition-all active:scale-[0.98] py-3 text-base disabled:opacity-70 disabled:hover:scale-100"
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Zap className="w-5 h-5 fill-white" />
                Enforce New Rates
              </>
            )}
          </button>
        </div>
        
      </form>
    </div>
  )
}
