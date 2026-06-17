'use client'
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps, prefer-const, react/no-unescaped-entities, react-hooks/set-state-in-effect */

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Wallet, Plus, Loader2, ArrowRight, X, Trash2, Pencil } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { deleteLoan, updateLoanAmount } from '@/app/transaction-actions'

export default function CustomerLoanSection({ customerId }: { customerId: string }) {
  const [loans, setLoans] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Form State
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingLoanId, setDeletingLoanId] = useState<string | null>(null)
  
  // Edit State
  const [editingLoan, setEditingLoan] = useState<any>(null)
  const [editAmount, setEditAmount] = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  const [supabase] = useState(() => createClient())

  const fetchLoans = async () => {
    setIsLoading(true)
    const { data } = await supabase
      .from('customer_loans')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
    if (data) setLoans(data)
    setIsLoading(false)
  }

  useEffect(() => {
    fetchLoans()
  }, [customerId])

  // Scroll lock effect for Modals
  useEffect(() => {
    if (isModalOpen || editingLoan) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isModalOpen, editingLoan])

  const activeLoans = loans.filter(l => l.status === 'ACTIVE')
  const totalBorrowed = activeLoans.reduce((sum, l) => sum + Number(l.amount), 0)
  const totalRecovered = activeLoans.reduce((sum, l) => sum + Number(l.recovered_amount), 0)
  const activeBalance = activeLoans.reduce((sum, l) => sum + Number(l.remaining_balance), 0)
  const isHealthy = activeBalance === 0

  const handleIssueLoan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) return

    setIsSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('customer_loans').insert([{
      customer_id: customerId,
      amount: Number(amount),
      note: note.trim(),
      created_by: user?.id
    }])

    if (error) {
      alert("Failed to issue loan: " + error.message)
    } else {
      setIsModalOpen(false)
      setAmount('')
      setNote('')
      await fetchLoans()
    }
    setIsSubmitting(false)
  }

  const handleDeleteLoan = async (loanId: string) => {
    if (!confirm('Are you sure you want to delete this loan? This will revert any loan deductions on transactions tied to this loan and restore their net payables.')) return
    setDeletingLoanId(loanId)
    const res = await deleteLoan(loanId)
    if (res?.error) {
      alert("Failed to delete loan: " + res.error)
    } else {
      await fetchLoans()
    }
    setDeletingLoanId(null)
  }

  const handleSaveEdit = async () => {
    if (!editingLoan || !editAmount) return
    setIsSavingEdit(true)
    const res = await updateLoanAmount(editingLoan.id, Number(editAmount))
    if (res?.error) {
      alert("Failed to update loan: " + res.error)
    } else {
      setEditingLoan(null)
      setEditAmount('')
      await fetchLoans()
    }
    setIsSavingEdit(false)
  }

  return (
    <div className="bg-white/70 backdrop-blur-2xl border border-white/40 rounded-xl p-5 shadow-sm flex flex-col gap-4">
      
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-onyx">Advance / Loans</h3>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Financial State</p>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-onyx text-white text-xs font-medium px-3 py-1.5 rounded-md flex items-center gap-1 hover:opacity-90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Issue Funds
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-4">
        <div className="flex-1 bg-slate-100 rounded-lg p-3 text-center">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Active Balance</p>
          <p className={`text-lg font-bold font-mono ${isHealthy ? 'text-emerald-600' : 'text-emerald-600'}`}>
            ₹{activeBalance.toLocaleString()}
          </p>
        </div>
        <div className="flex-1 bg-slate-100 rounded-lg p-3 text-center flex flex-col justify-center">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Recovery Progress</p>
          <p className="text-sm font-bold text-onyx font-mono mb-1">
            {totalBorrowed > 0 ? Math.round((totalRecovered / totalBorrowed) * 100) : 0}%
          </p>
          <div className="w-full bg-slate-200/50 h-1 rounded-full overflow-hidden">
            <div 
              className="bg-onyx h-full rounded-full transition-all duration-500" 
              style={{ width: `${totalBorrowed > 0 ? (totalRecovered / totalBorrowed) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Recent Issuances */}
      <div className="bg-slate-100 rounded-lg p-3 text-center border border-dashed border-slate-200/50">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Recent Issuances</p>
        {isLoading ? (
          <div className="flex items-center justify-center py-2">
            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
          </div>
        ) : loans.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No loan history found.</p>
        ) : (
          <div className="flex flex-col divide-y divide-slate-200/50 text-left mt-2 max-h-32 overflow-y-auto custom-scrollbar">
            {loans.map(loan => (
              <div key={loan.id} className="py-2 flex items-center justify-between text-sm">
                <div className="flex flex-col">
                  <span className="font-bold text-onyx text-xs">₹{Number(loan.amount).toLocaleString()}</span>
                  <span className="text-[10px] text-slate-400">{new Date(loan.issued_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                    loan.status === 'CLEARED' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                  }`}>
                    {loan.status}
                  </span>
                  <button 
                    onClick={() => { setEditingLoan(loan); setEditAmount(loan.amount) }}
                    disabled={deletingLoanId === loan.id}
                    className="p-1 text-slate-300 hover:text-teal-500 hover:bg-teal-50 rounded transition-colors disabled:opacity-50"
                    title="Edit Loan"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={() => handleDeleteLoan(loan.id)}
                    disabled={deletingLoanId === loan.id}
                    className="p-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors disabled:opacity-50"
                    title="Delete Loan"
                  >
                    {deletingLoanId === loan.id ? <Loader2 className="w-3 h-3 animate-spin text-rose-500" /> : <Trash2 className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Issue Modal */}
      {isModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-black text-onyx flex items-center gap-2">
                <Wallet className="w-4 h-4 text-slate-500" /> Issue Advance
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleIssueLoan} className="p-6 flex flex-col gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Amount (₹)</label>
                <input 
                  type="number" min="1" step="1" required autoFocus
                  value={amount} onChange={e => setAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white font-black text-onyx text-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all outline-none"
                  placeholder="5000"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Note (Optional)</label>
                <input 
                  type="text" 
                  value={note} onChange={e => setNote(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white font-semibold text-onyx text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all outline-none"
                  placeholder="e.g. Festival advance"
                />
              </div>
              <button 
                type="submit" disabled={isSubmitting}
                className="w-full bg-onyx hover:opacity-90 disabled:opacity-50 text-white font-black py-3.5 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2 mt-2"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Disbursal'}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Modal */}
      {editingLoan && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-black text-onyx flex items-center gap-2">
                <Pencil className="w-4 h-4 text-slate-500" /> Edit Loan Amount
              </h3>
              <button onClick={() => setEditingLoan(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">New Amount (₹)</label>
                <input 
                  type="number" min="1" step="1" required autoFocus
                  value={editAmount} onChange={e => setEditAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white font-black text-onyx text-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all outline-none"
                  placeholder={editingLoan.amount}
                />
                <p className="text-[10px] font-bold text-slate-400 mt-2">
                  If the new amount is less than the already recovered amount (₹{editingLoan.recovered_amount}), the excess will be automatically refunded to linked transactions!
                </p>
              </div>
              <button 
                onClick={handleSaveEdit} 
                disabled={isSavingEdit || !editAmount}
                className="w-full bg-onyx hover:opacity-90 disabled:opacity-50 text-white font-black py-3.5 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2 mt-2"
              >
                {isSavingEdit ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  )
}
