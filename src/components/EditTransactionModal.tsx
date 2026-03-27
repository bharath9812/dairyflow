'use client'

import React, { useState } from 'react'
import { X, Save, Calendar, Droplets, Thermometer, Calculator } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export default function EditTransactionModal({ transaction, onClose, onSuccess }: any) {
  const supabase = createClient()
  const [date, setDate] = useState(transaction?.transaction_date || '')
  const [milkType, setMilkType] = useState(transaction?.milk_type || 'Cow')
  const [shift, setShift] = useState(transaction?.shift || 'Morning')
  const [quantity, setQuantity] = useState<number | ''>(transaction?.quantity_litres || '')
  const [fatPercentage, setFatPercentage] = useState<number | ''>(transaction?.fat_percentage || '')
  const [price, setPrice] = useState<number | ''>(transaction?.price_per_litre || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const qNum = Number(quantity) || 0
    const fNum = Number(fatPercentage) || 0
    const pNum = Number(price) || 0
    const total = (qNum * fNum * pNum) / 100

    const { data: { user } } = await supabase.auth.getUser()
    const updatedName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Admin'

    const { error } = await supabase.from('transactions')
      .update({
        transaction_date: date,
        milk_type: milkType,
        shift: shift,
        quantity_litres: qNum,
        fat_percentage: fNum,
        price_per_litre: pNum,
        total_price: total,
        updated_by: user?.id,
        updated_by_name: updatedName
      })
      .eq('id', transaction.id)

    setIsSubmitting(false)
    
    if (error) {
      alert("Failed to update transaction: " + error.message)
    } else {
      onSuccess()
    }
  }

  // Auto-calculated gross price on form updates
  const previewTotal = ((Number(quantity) || 0) * (Number(fatPercentage) || 0) * (Number(price) || 0)) / 100

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Edit Transaction</h2>
            <p className="text-xs text-slate-500 font-medium">Record ID: {transaction.id.split('-')[0]}...</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6">
          <div className="space-y-6">
            
            {/* Row 1 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-slate-900" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase">Shift</label>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button type="button" onClick={() => setShift('Morning')} className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all ${shift === 'Morning' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>Morning</button>
                  <button type="button" onClick={() => setShift('Evening')} className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all ${shift === 'Evening' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>Evening</button>
                </div>
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase">Commodity</label>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button type="button" onClick={() => setMilkType('Cow')} className={`flex-1 text-xs flex items-center justify-center gap-1.5 font-bold py-2 rounded-lg transition-all ${milkType === 'Cow' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>Cow</button>
                  <button type="button" onClick={() => setMilkType('Buffalo')} className={`flex-1 text-xs flex items-center justify-center gap-1.5 font-bold py-2 rounded-lg transition-all ${milkType === 'Buffalo' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>Buffalo</button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase">Volume (L)</label>
                <div className="relative">
                  <Droplets className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                  <input type="number" step="0.1" required value={quantity} onChange={e => setQuantity(e.target.value === '' ? '' : Number(e.target.value))} className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-slate-900" />
                </div>
              </div>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase">Fat (%)</label>
                <div className="relative">
                  <Thermometer className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-400" />
                  <input type="number" step="0.1" required value={fatPercentage} onChange={e => setFatPercentage(e.target.value === '' ? '' : Number(e.target.value))} className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-slate-900" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase">Base Rate / L</label>
                <div className="relative">
                  <Calculator className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                  <input type="number" step="0.1" required value={price} onChange={e => setPrice(e.target.value === '' ? '' : Number(e.target.value))} className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-slate-900" />
                </div>
              </div>
            </div>

          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
            <div>
               <p className="text-xs font-bold text-slate-400 uppercase">Calculated Total</p>
               <p className="text-2xl font-black text-emerald-600">Rs. {previewTotal.toFixed(2)}</p>
            </div>
            
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                Cancel
              </button>
              <button disabled={isSubmitting} type="submit" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm">
                <Save className="w-4 h-4" />
                {isSubmitting ? 'Saving...' : 'Save Edits'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
