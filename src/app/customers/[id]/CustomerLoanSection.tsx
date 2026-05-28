'use client'

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

  const supabase = createClient()

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
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl text-white shadow-lg ${isHealthy ? 'bg-emerald-500 shadow-emerald-200' : 'bg-rose-500 shadow-rose-200'}`}>
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight leading-none">Advance / Loans</h3>
            <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase mt-1">Financial State</span>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 px-3 py-1.5 rounded-lg transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> Issue Funds
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Balance</span>
          <span className={`text-2xl font-black ${isHealthy ? 'text-emerald-500' : 'text-rose-600'}`}>
            ₹{activeBalance.toLocaleString()}
          </span>
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Recovery Progress</span>
          <span className="text-xl font-black text-slate-800">
            {totalBorrowed > 0 ? Math.round((totalRecovered / totalBorrowed) * 100) : 0}%
          </span>
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-blue-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${totalBorrowed > 0 ? (totalRecovered / totalBorrowed) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="flex-1 min-h-[100px] border border-slate-100 rounded-2xl overflow-hidden flex flex-col bg-white">
        <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest">
          Recent Issuances
        </div>
        <div className="flex-1 overflow-y-auto max-h-48 custom-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center h-full p-6 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : loans.length === 0 ? (
            <div className="flex items-center justify-center h-full p-6 text-xs font-bold text-slate-400">
              No loan history found.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {loans.map(loan => (
                <div key={loan.id} className="p-3 hover:bg-slate-50 transition-colors flex items-center justify-between text-sm">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-800">₹{Number(loan.amount).toLocaleString()}</span>
                    <span className="text-[10px] font-bold text-slate-400">{new Date(loan.issued_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                      loan.status === 'CLEARED' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {loan.status}
                    </span>
                    {loan.status === 'ACTIVE' && (
                      <span className="text-[10px] font-bold text-slate-500 mt-1">
                        Bal: ₹{Number(loan.remaining_balance).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-3">
                    <button 
                      onClick={() => {
                        setEditingLoan(loan)
                        setEditAmount(loan.amount)
                      }}
                      disabled={deletingLoanId === loan.id}
                      className="p-1.5 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors group disabled:opacity-50"
                      title="Edit Loan"
                    >
                      <Pencil className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                    </button>
                    <button 
                      onClick={() => handleDeleteLoan(loan.id)}
                      disabled={deletingLoanId === loan.id}
                      className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors group disabled:opacity-50"
                      title="Delete Loan"
                    >
                      {deletingLoanId === loan.id ? <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" /> : <Trash2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Issue Modal */}
      {isModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-black text-slate-800 flex items-center gap-2">
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
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white font-black text-slate-800 text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                  placeholder="5000"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Note (Optional)</label>
                <input 
                  type="text" 
                  value={note} onChange={e => setNote(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                  placeholder="e.g. Festival advance"
                />
              </div>
              <button 
                type="submit" disabled={isSubmitting}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-black py-3.5 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 mt-2"
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
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-black text-slate-800 flex items-center gap-2">
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
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white font-black text-slate-800 text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                  placeholder={editingLoan.amount}
                />
                <p className="text-[10px] font-bold text-slate-400 mt-2">
                  If the new amount is less than the already recovered amount (₹{editingLoan.recovered_amount}), the excess will be automatically refunded to linked transactions!
                </p>
              </div>
              <button 
                onClick={handleSaveEdit} 
                disabled={isSavingEdit || !editAmount}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-black py-3.5 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 mt-2"
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
