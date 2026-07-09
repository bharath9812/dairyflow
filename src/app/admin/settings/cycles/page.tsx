'use client'
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */

import React, { useState, useEffect } from 'react'
import { Calendar, Save, AlertTriangle, Loader2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { CycleConfig } from '@/utils/cycle'

export default function CyclesSettings() {
  const [supabase] = useState(() => createClient())
  
  const [c1StartDay, setC1StartDay] = useState<number>(1)
  const [c1EndDay, setC1EndDay] = useState<number>(14)
  const [isSaving, setIsSaving] = useState(false)
  const [isRebuilding, setIsRebuilding] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchCycleConfig()
  }, [])

  const fetchCycleConfig = async () => {
    setIsLoading(true)
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('id', 'cycle_config')
      .single()
      
    if (data?.value) {
      if (data.value.c1StartDay) setC1StartDay(data.value.c1StartDay)
      if (data.value.c1EndDay || data.value.c1_end_day) setC1EndDay(data.value.c1EndDay || data.value.c1_end_day)
    }
    setIsLoading(false)
  }

  const handleSave = async () => {
    if (c1StartDay >= c1EndDay) {
      alert("Cycle 1 Start Day must be before Cycle 1 End Day.")
      return
    }

    setIsSaving(true)
    
    const configValue: CycleConfig = { c1StartDay, c1EndDay }
    
    try {
      // Try updating first
      const { data, error: updateError } = await supabase
        .from('app_settings')
        .update({ value: configValue, updated_at: new Date().toISOString() })
        .eq('id', 'cycle_config')
        .select()
        
      if (updateError || !data || data.length === 0) {
        // If update fails or row doesn't exist, insert
        const { error: insertError } = await supabase
          .from('app_settings')
          .insert({ 
            id: 'cycle_config', 
            value: configValue, 
            updated_at: new Date().toISOString() 
          })
          
        if (insertError) {
          throw new Error(insertError.message)
        }
      }
      
      alert("Billing cycle saved successfully. If you have existing records, please rebuild the aggregates.")
    } catch (e: any) {
      alert("Failed to save config: " + e.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleRebuild = async () => {
    if (!confirm("This will erase all current live cycle aggregates and rebuild them from raw transactions. It might take a moment. Are you sure?")) {
      return
    }

    setIsRebuilding(true)
    
    const { error } = await supabase.rpc('recalculate_all_live_aggregates')
    
    if (error) {
      alert("Failed to rebuild: " + error.message)
    } else {
      alert("Live aggregates rebuilt successfully!")
    }
    
    setIsRebuilding(false)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Configuration Box */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm h-min">
        <h3 className="text-xl font-bold text-onyx mb-2 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-600" />
          Cycle Definition
        </h3>
        <p className="text-sm text-slate-500 mb-6">
          Define the custom range for Cycle 1 (C1). Cycle 2 (C2) will automatically start on the following day and run until the day before the next C1 begins.
        </p>
        
        {isLoading ? (
          <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">C1 Start Day</label>
                <select 
                  value={c1StartDay} 
                  onChange={(e) => setC1StartDay(parseInt(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-onyx font-semibold focus:ring-2 ring-indigo-500 outline-none"
                >
                  {[...Array(28)].map((_, i) => (
                    <option key={i+1} value={i+1}>Day {i+1}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">C1 End Day</label>
                <select 
                  value={c1EndDay} 
                  onChange={(e) => setC1EndDay(parseInt(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-onyx font-semibold focus:ring-2 ring-indigo-500 outline-none"
                >
                  {[...Array(28)].map((_, i) => (
                    <option key={i+1} value={i+1}>Day {i+1}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
              <div className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-2">Resulting Cycles</div>
              <div className="space-y-1">
                <div className="text-sm text-indigo-900">
                  <span className="font-semibold">C1:</span> {c1StartDay}{c1StartDay === 1 ? 'st' : c1StartDay === 2 ? 'nd' : c1StartDay === 3 ? 'rd' : 'th'} to {c1EndDay}{c1EndDay === 1 ? 'st' : c1EndDay === 2 ? 'nd' : c1EndDay === 3 ? 'rd' : 'th'}
                </div>
                <div className="text-sm text-indigo-900">
                  <span className="font-semibold">C2:</span> {c1EndDay + 1}{c1EndDay + 1 === 21 ? 'st' : c1EndDay + 1 === 22 ? 'nd' : c1EndDay + 1 === 23 ? 'rd' : 'th'} to {c1StartDay === 1 ? 'End of Month' : (c1StartDay - 1) + (c1StartDay - 1 === 1 ? 'st' : c1StartDay - 1 === 2 ? 'nd' : c1StartDay - 1 === 3 ? 'rd' : 'th') + ' (Next Month)'}
                </div>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Configuration
            </button>
          </div>
        )}
      </div>

      {/* Rebuild Data Box */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 shadow-sm h-min">
        <h3 className="text-xl font-bold text-red-900 mb-2 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          Rebuild Aggregates
        </h3>
        <p className="text-sm text-red-700 mb-6 font-medium">
          If you change the cycle definition while there are active transactions in the database, the live tracker dashboard will show incorrect groupings. You must rebuild the aggregates to redistribute the records into the correct C1/C2 cycles.
        </p>

        <button
          onClick={handleRebuild}
          disabled={isRebuilding}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
        >
          {isRebuilding ? <Loader2 className="w-5 h-5 animate-spin" /> : "Rebuild Cycle Aggregates"}
        </button>
      </div>
    </div>
  )
}
