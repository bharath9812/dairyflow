'use client'
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps, prefer-const, react/no-unescaped-entities, react-hooks/set-state-in-effect */

import React, { useState } from 'react'
import { DollarSign, Save, Loader2, BadgePercent } from 'lucide-react'
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
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col mb-4">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
            <BadgePercent className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Global Commodity Pricing</h2>
            <p className="text-xs font-semibold text-slate-400">Manage base rates per kg. Updates apply globally.</p>
          </div>
        </div>
        {message && (
          <span className={`text-xs font-bold px-3 py-1.5 rounded-md ${message.type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
            {message.text}
          </span>
        )}
      </div>

      <div className="p-6">
        <form onSubmit={handleUpdate} className="flex flex-col md:flex-row items-end gap-6 w-full">
          
          <div className="flex-1 w-full space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span> Cow Milk Rate (₹/kg)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">₹</span>
              <input
                type="number"
                step="0.1"
                required
                value={cowPrice}
                onChange={e => setCowPrice(e.target.value)}
                className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-black focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex-1 w-full space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span> Buffalo Milk Rate (₹/kg)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">₹</span>
              <input
                type="number"
                step="0.1"
                required
                value={buffaloPrice}
                onChange={e => setBuffaloPrice(e.target.value)}
                className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-black focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
              />
            </div>
          </div>

          <div className="w-full md:w-auto">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4" /> Enforce New Rates</>}
            </button>
          </div>
          
        </form>
      </div>
    </div>
  )
}
