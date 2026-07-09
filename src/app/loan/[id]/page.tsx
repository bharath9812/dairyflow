'use client'
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Landmark, Calculator, AlertCircle, Calendar, IndianRupee, Save, Clock, History, Activity, User } from 'lucide-react'
import Link from 'next/link'
import TopBar from '@/components/TopBar'
import { createClient } from '@/utils/supabase/client'

import { fetchCycleConfig, getCurrentCycle as getCycle, getCycleLabel, getCycleDates, getCyclesActive } from '@/utils/cycle'

export default function LoanDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const loanId = params.id as string
  
  const [supabase] = useState(() => createClient())
  const [loan, setLoan] = useState<any>(null)
  const [payments, setPayments] = useState<any[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [liveAggregate, setLiveAggregate] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [cycleConfig, setCycleConfig] = useState<any>(null)
  const [currentCycleStr, setCurrentCycleStr] = useState<string | null>(null)

  // Payment form state
  const [principalPayment, setPrincipalPayment] = useState<number | ''>('')
  const [interestPayment, setInterestPayment] = useState<number | ''>('')
  const [paymentSource, setPaymentSource] = useState('CYCLE_EARNINGS')

  // Edit Payment State
  const [editingPayment, setEditingPayment] = useState<any>(null)
  const [editPrin, setEditPrin] = useState<number | ''>('')
  const [editInt, setEditInt] = useState<number | ''>('')
  const [editSource, setEditSource] = useState('CYCLE_EARNINGS')
  
  // Edit Loan State
  const [isEditingLoan, setIsEditingLoan] = useState(false)
  const [editLoanPrin, setEditLoanPrin] = useState<number | ''>('')
  const [editLoanInt, setEditLoanInt] = useState<number | ''>('')

  const startEditPayment = (p: any) => {
    setEditingPayment(p)
    setEditPrin(p.principal_paid)
    setEditInt(p.interest_paid)
    setEditSource(p.source || 'CYCLE_EARNINGS')
  }

  const savePaymentEdit = async () => {
    const pPaid = Number(editPrin) || 0
    const iPaid = Number(editInt) || 0
    if (iPaid <= 0) {
      alert("Interest Paid must be greater than ₹0.")
      return
    }
    const { error } = await supabase.from('loan_payments').update({
      principal_paid: pPaid,
      interest_paid: iPaid,
      source: editSource
    }).eq('id', editingPayment.id)
    if (!error) {
      setEditingPayment(null)
      fetchLoanDetails()
    } else alert(error.message)
  }

  const startEditLoan = () => {
    if (payments.length > 0) {
      alert("Cannot edit loan. Repayment records exist. Reverse repayments first.")
      return
    }
    setEditLoanPrin(loan.principal_amount)
    setEditLoanInt(loan.interest_rate_rupees)
    setIsEditingLoan(true)
  }

  const saveLoanEdit = async () => {
    const { error } = await supabase.from('loans').update({
      principal_amount: Number(editLoanPrin) || 0,
      interest_rate_rupees: Number(editLoanInt) || 0
    }).eq('id', loanId)
    if (!error) {
      setIsEditingLoan(false)
      fetchLoanDetails()
    } else alert(error.message)
  }

  useEffect(() => {
    fetchLoanDetails()
  }, [loanId])

  const fetchLoanDetails = async () => {
    setIsLoading(true)
    
    // 1. Fetch Loan
    const { data: loanData, error: loanError } = await supabase
      .from('loans')
      .select('*, customers(name, seller_id)')
      .eq('id', loanId)
      .single()
      
    if (loanData) {
      setLoan(loanData)
      setInterestPayment(Number(loanData.forecasted_interest) || '')
      
      // 2. Fetch Payments
      const { data: paymentsData } = await supabase
        .from('loan_payments')
        .select('*')
        .eq('loan_id', loanId)
        .order('created_at', { ascending: false })
      setPayments(paymentsData || [])

      // 3. Fetch Live Aggregate for this cycle
      const config = await fetchCycleConfig(supabase)
      setCycleConfig(config)
      const cycle = getCycle(config)
      setCurrentCycleStr(cycle)
      
      const activeLoanCycle = loanData.active_cycle_identifier || cycle
      
      const { data: aggData } = await supabase
        .from('live_cycle_aggregates')
        .select('*')
        .eq('customer_id', loanData.customer_id)
        .eq('cycle_identifier', activeLoanCycle)
        .single()
      
      setLiveAggregate(aggData)

      // 4. Fetch Audit Logs
      const { data: auditData } = await supabase
        .from('loan_state_history')
        .select('*')
        .eq('loan_id', loanId)
        .order('created_at', { ascending: false })
      setAuditLogs(auditData || [])
    }
    
    setIsLoading(false)
  }

  const accruedInterest = Number(loan?.forecasted_interest) || 0
  const outstandingPrincipal = Number(loan?.outstanding_principal ?? loan?.principal_amount) || 0
  const totalDebt = outstandingPrincipal + accruedInterest
  const cycleEarnings = Number(liveAggregate?.total_earnings) || 0
  const maxPossibleDeduction = cycleEarnings

  // Synchronize Payment Source State with Cycle and Earnings Changes
  useEffect(() => {
    if (cycleEarnings === 0) {
      setPaymentSource('MANUAL_CASH');
    } else if (cycleEarnings > 0) {
      setPaymentSource('CYCLE_EARNINGS');
    }
  }, [cycleEarnings, loan?.active_cycle_identifier, loan?.state_version]);

  const pPaymentVal = Number(principalPayment) || 0;
  const iPaymentVal = Number(interestPayment) || 0;
  const isPrincipalExceeding = pPaymentVal > outstandingPrincipal;
  const isInterestExceeding = iPaymentVal > accruedInterest;

  const activeCycleStr = loan?.active_cycle_identifier || currentCycleStr
  const activeStartDate = loan?.active_cycle_start_date
  const activeEndDate = loan?.active_cycle_end_date
  const activeDays = activeStartDate && activeEndDate ? Math.round((new Date(activeEndDate).getTime() - new Date(activeStartDate).getTime()) / (1000 * 3600 * 24)) + 1 : 0
  const hasRepaymentThisCycle = payments.some(p => p.cycle_identifier === activeCycleStr)

  const handleRecordPayment = async () => {
    const pPaid = Number(principalPayment) || 0
    const iPaid = Number(interestPayment) || 0
    if (pPaid === 0 && iPaid === 0) return
    if (iPaid <= 0) {
      alert("Interest Paid must be greater than ₹0.")
      return
    }

    setIsSubmitting(true)
    
    // 1. Insert Payment (Trigger handles all loan aggregations automatically)
    const { error } = await supabase.from('loan_payments').insert({
      loan_id: loanId,
      principal_paid: pPaid,
      interest_paid: iPaid,
      source: paymentSource,
      cycle_identifier: activeCycleStr,
      available_cycle_earnings: cycleEarnings
    })

    if (error) {
      alert("Error recording payment: " + error.message)
    } else {
      setPrincipalPayment('')
      setInterestPayment('')
      fetchLoanDetails()
    }
    setIsSubmitting(false)
  }

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm("Are you sure you want to reverse this payment record? This will automatically rollback the loan state.")) return
    
    const { error } = await supabase.from('loan_payments').delete().eq('id', paymentId)
    if (error) alert("Error deleting payment: " + error.message)
    else fetchLoanDetails()
  }

  const handleDeleteLoan = async () => {
    if (payments.length > 0) {
      alert("Cannot delete loan. Repayment records exist. Reverse repayments first.")
      return
    }
    if (!confirm("Are you sure you want to delete this loan? This action cannot be undone.")) return
    
    const { error } = await supabase.from('loans').delete().eq('id', loanId)
    if (error) alert("Error deleting loan: " + error.message)
    else router.push('/loan')
  }

  if (isLoading) return (
    <div className="flex-1 flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  )

  if (!loan) return <div className="p-8">Loan not found.</div>

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      <TopBar
        leftPillLabel="Back to Loans"
        leftPillHref="/loan"
        leftPillActive={false}
        rightPillLabel="Loan Details"
        rightPillHref={`/loan/${loanId}`}
        rightPillActive={true}
        dateString={new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
      />

      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          
          {/* Header Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center font-bold text-xl shadow-sm">
                {loan.customers?.seller_id}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-onyx">{loan.customers?.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  {loan.status === 'ACTIVE' ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"/> ACTIVE
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                      CLOSED
                    </span>
                  )}
                  <span className="text-sm font-medium text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> 
                    Active since: {new Date(loan.loan_date).toLocaleDateString()}
                  </span>
                  {cycleConfig && (
                    <span className="text-sm font-medium text-slate-500 flex items-center gap-1 border-l border-slate-300 pl-2">
                      <Clock className="w-3.5 h-3.5" /> 
                      {getCyclesActive(loan.loan_date, cycleConfig)} cycles active
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Quick Stats Summary */}
            <div className="flex gap-6 text-right items-center">
              {activeCycleStr && cycleConfig && (
                <div className="text-left bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-200 shadow-sm hidden md:block animate-fade-in-up">
                  <div className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                    Loan Billing Cycle
                  </div>
                  <div className="text-sm font-bold text-onyx">{activeCycleStr}</div>
                  <div className="text-xs text-slate-500 font-medium">{getCycleLabel(activeCycleStr, cycleConfig)}</div>
                </div>
              )}
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Interest Rate</div>
                <div className="text-lg font-bold text-onyx">₹{loan.interest_rate_rupees} <span className="text-sm text-slate-500 font-medium">/100/mo</span></div>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cycle Earnings</div>
                <div className="text-lg font-bold text-emerald-600 font-mono">₹{cycleEarnings.toFixed(0)}</div>
              </div>
              {payments.length === 0 && (
                <div className="flex gap-2 ml-4">
                  <button onClick={startEditLoan} className="px-4 py-2 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors shadow-sm">
                    Edit Loan
                  </button>
                  <button onClick={handleDeleteLoan} className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors shadow-sm">
                    Delete Loan
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Debt Breakdown */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Debt Calculator Card */}
              <div className="bg-gradient-to-br from-white to-red-50/30 border border-red-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 text-red-700 font-bold tracking-wider text-sm uppercase mb-6">
                  <Calculator className="w-5 h-5" /> Current Debt Calculation
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                    <div className="text-xs font-bold text-slate-500 uppercase">Outstanding Principal</div>
                    <div className="text-3xl font-bold text-onyx font-mono mt-1">₹{outstandingPrincipal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                  </div>
                  
                  <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div className="text-xs font-bold text-amber-600 uppercase">Forecasted Interest</div>
                      <span className="text-[10px] font-bold bg-amber-50 text-amber-600 px-2 py-0.5 rounded border border-amber-100 uppercase">Breakdown</span>
                    </div>
                    <div className="text-3xl font-bold text-amber-600 font-mono mt-1 mb-3">₹{accruedInterest.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                    <div className="text-[10px] text-slate-500 space-y-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <div className="flex justify-between"><span>Cycle:</span> <span className="font-semibold text-onyx">{activeCycleStr} ({activeStartDate} → {activeEndDate})</span></div>
                      <div className="flex justify-between"><span>Days:</span> <span className="font-semibold text-onyx">{activeDays}</span></div>
                      <div className="flex justify-between"><span>Principal:</span> <span className="font-semibold text-onyx">₹{outstandingPrincipal.toLocaleString('en-IN')}</span></div>
                      <div className="flex justify-between"><span>Rate:</span> <span className="font-semibold text-onyx">₹{loan.interest_rate_rupees}/100/mo</span></div>
                      <div className="flex justify-between mt-1 pt-1 border-t border-slate-200"><span>Valid Until:</span> <span className="font-semibold text-onyx">{activeEndDate}</span></div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 bg-red-600 text-white rounded-xl p-5 shadow-md flex justify-between items-center">
                  <div className="font-bold uppercase tracking-widest text-sm opacity-90">Total Debt</div>
                  <div className="text-4xl font-bold font-mono">₹{totalDebt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                </div>
              </div>

              {/* Payment History */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 text-onyx font-bold text-lg mb-4">
                  <History className="w-5 h-5 text-indigo-500" /> Payment History
                </div>
                
                {payments.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 font-medium">No payments recorded yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                          <th className="pb-3 pr-4">Cycle</th>
                          <th className="pb-3 pr-4 text-right">Prin Paid</th>
                          <th className="pb-3 pr-4 text-right">Int Paid</th>
                          <th className="pb-3 pr-4 text-right">Prin Left</th>
                          <th className="pb-3 pr-4 text-right">Source</th>
                          <th className="pb-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {payments.map((p, index) => (
                          <tr key={p.id}>
                            <td className="py-3 pr-4 text-sm font-medium text-slate-600">
                              {p.cycle_identifier}
                            </td>
                            <td className="py-3 pr-4 text-sm font-bold font-mono text-emerald-600 text-right">
                              ₹{Number(p.principal_paid).toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 pr-4 text-sm font-bold font-mono text-amber-600 text-right">
                              ₹{Number(p.interest_paid).toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 pr-4 text-sm font-bold font-mono text-slate-600 text-right">
                              ₹{Number(p.principal_remaining).toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 pr-4 text-sm font-medium text-slate-500 text-right">
                              <span className="bg-slate-50 text-slate-700 border border-slate-200 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                                {p.source.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="py-3 text-right space-x-3">
                              {index === 0 ? (
                                <>
                                  <button onClick={() => startEditPayment(p)} className="text-indigo-500 hover:text-indigo-700 text-xs font-bold underline decoration-indigo-200 hover:decoration-indigo-500 underline-offset-4 transition-colors">
                                    Edit
                                  </button>
                                  <button onClick={() => handleDeletePayment(p.id)} className="text-red-500 hover:text-red-700 text-xs font-bold underline decoration-red-200 hover:decoration-red-500 underline-offset-4 transition-colors">
                                    Reverse
                                  </button>
                                </>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Locked</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Enterprise Audit Log */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-onyx font-bold text-lg">
                    <Activity className="w-5 h-5 text-indigo-500" /> Enterprise Audit Log
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-1 rounded">
                    Immutable
                  </div>
                </div>
                
                {auditLogs.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 font-medium">No audit logs found.</div>
                ) : (
                  <div className="space-y-0 max-h-[400px] overflow-y-auto pr-2 pl-3 pt-2 custom-scrollbar">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="relative pl-6 pb-6 border-l-2 border-indigo-100 last:border-transparent last:pb-0">
                        <div className="absolute w-3 h-3 bg-indigo-500 rounded-full -left-[7px] top-1.5 ring-4 ring-white" />
                        <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-4">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <span className="font-bold text-onyx text-sm">{log.event_type.replace(/_/g, ' ')}</span>
                              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                                Version {log.state_version}
                              </div>
                            </div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-right">
                              {new Date(log.created_at).toLocaleString('en-IN', {
                                day: 'numeric', month: 'short', year: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                              })}
                            </div>
                          </div>
                          
                          {/* Payment Metadata Display */}
                          {log.event_meta && (log.event_type === 'PAYMENT_RECORDED' || log.event_type === 'PAYMENT_REVERSED') && (
                            <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-3 flex justify-between items-center mb-3">
                              <div>
                                <span className="text-indigo-800 font-bold uppercase text-[10px] tracking-wider block">Payment Amount</span>
                                <div className="font-mono font-bold text-indigo-700 text-sm mt-0.5">
                                  ₹{Number(log.event_meta.principal).toLocaleString('en-IN')} Prin + ₹{Number(log.event_meta.interest).toLocaleString('en-IN')} Int
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-indigo-600 font-bold uppercase text-[10px] tracking-wider block mb-1">Source</span>
                                <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">{log.event_meta.source.replace(/_/g, ' ')}</span>
                              </div>
                            </div>
                          )}

                          {log.event_meta && log.event_type === 'PAYMENT_MODIFIED' && (
                            <div className="bg-amber-50/50 border border-amber-100 rounded-lg p-3 mb-3 space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-amber-800 font-bold uppercase text-[10px] tracking-wider">Modified Principal</span>
                                <div className="font-mono font-bold flex items-center gap-2 text-xs">
                                  <span className="text-amber-600/60 line-through">₹{Number(log.event_meta.old_principal).toLocaleString('en-IN')}</span>
                                  <ArrowLeft className="w-3 h-3 rotate-180 text-amber-400" />
                                  <span className="text-amber-700">₹{Number(log.event_meta.new_principal).toLocaleString('en-IN')}</span>
                                </div>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-amber-800 font-bold uppercase text-[10px] tracking-wider">Modified Interest</span>
                                <div className="font-mono font-bold flex items-center gap-2 text-xs">
                                  <span className="text-amber-600/60 line-through">₹{Number(log.event_meta.old_interest).toLocaleString('en-IN')}</span>
                                  <ArrowLeft className="w-3 h-3 rotate-180 text-amber-400" />
                                  <span className="text-amber-700">₹{Number(log.event_meta.new_interest).toLocaleString('en-IN')}</span>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {log.event_meta && log.event_type === 'LOAN_CREATED' && (
                            <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-3 flex justify-between items-center mb-3">
                              <div>
                                <span className="text-emerald-800 font-bold uppercase text-[10px] tracking-wider block">Initial Principal</span>
                                <div className="font-mono font-bold text-emerald-700 text-sm mt-0.5">
                                  ₹{Number(log.event_meta.principal).toLocaleString('en-IN')}
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-emerald-600 font-bold uppercase text-[10px] tracking-wider block mb-1">Interest Rate</span>
                                <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">₹{log.event_meta.interest_rate}/100/mo</span>
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-1 gap-2 text-xs">
                            {log.previous_principal !== log.new_principal && (
                              <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 flex justify-between items-center">
                                <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">Principal</span>
                                <div className="font-mono font-bold flex items-center gap-2">
                                  <span className="text-slate-400 line-through">₹{Number(log.previous_principal).toLocaleString('en-IN')}</span>
                                  <ArrowLeft className="w-3 h-3 rotate-180 text-slate-300" />
                                  <span className="text-indigo-600">₹{Number(log.new_principal).toLocaleString('en-IN')}</span>
                                </div>
                              </div>
                            )}
                            
                            {log.previous_cycle !== log.new_cycle && (
                              <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 flex justify-between items-center">
                                <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">Active Cycle</span>
                                <div className="font-bold flex items-center gap-2">
                                  <span className="text-slate-400">{log.previous_cycle}</span>
                                  <ArrowLeft className="w-3 h-3 rotate-180 text-slate-300" />
                                  <span className="text-indigo-600">{log.new_cycle}</span>
                                </div>
                              </div>
                            )}
                            
                            {log.previous_status !== log.new_status && (
                              <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 flex justify-between items-center">
                                <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">Status</span>
                                <div className="font-bold flex items-center gap-2">
                                  <span className="text-slate-400">{log.previous_status}</span>
                                  <ArrowLeft className="w-3 h-3 rotate-180 text-slate-300" />
                                  <span className="text-indigo-600">{log.new_status}</span>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {(log.triggered_by_name || log.triggered_by_email || log.triggered_by) && (
                            <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-400 font-medium border-t border-slate-100 pt-2">
                              <User className="w-3 h-3 text-slate-300" />
                              <span className="truncate">
                                Auth: {log.triggered_by_name ? `${log.triggered_by_name} (${log.triggered_by_email})` : (log.triggered_by_email || log.triggered_by)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Record Payment Form */}
            <div className="space-y-6">
              <div className="bg-white border border-indigo-100 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
                <h3 className="text-lg font-bold text-onyx mb-1">Record Payment</h3>
                <p className="text-sm text-slate-500 mb-6">Process a customer&apos;s payment decision towards this loan.</p>
                
                {loan.status === 'CLOSED' ? (
                  <div className="bg-slate-50 p-4 rounded-xl text-center text-slate-500 font-medium border border-slate-200">
                    This loan is fully closed. No further payments can be recorded.
                  </div>
                ) : hasRepaymentThisCycle ? (
                  <div className="bg-slate-50 p-4 rounded-xl text-center text-slate-500 font-medium border border-slate-200">
                    <div className="text-sm font-bold text-slate-600 mb-1">Repayment Already Recorded</div>
                    <div className="text-xs text-slate-400">A repayment for the loan&apos;s active billing cycle ({activeCycleStr}) has already been recorded. Please edit the existing repayment below instead.</div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Source Selection */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Payment Source</label>
                      <select
                        value={paymentSource}
                        onChange={(e) => setPaymentSource(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-onyx focus:ring-2 ring-indigo-500 outline-none"
                      >
                        {cycleEarnings > 0 && <option value="CYCLE_EARNINGS">Payout Deduction (From Cycle Earnings)</option>}
                        <option value="MANUAL_CASH">Manual Cash Payment</option>
                        {cycleEarnings > 0 && <option value="CYCLE_EARNINGS_AND_CASH">Mixed (Earnings + Cash)</option>}
                      </select>
                    </div>

                    {paymentSource === 'CYCLE_EARNINGS' && (
                      <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-800 uppercase">Available Cycle Earnings</span>
                        <span className="font-mono font-bold text-emerald-700">₹{cycleEarnings.toFixed(0)}</span>
                      </div>
                    )}

                    {/* Interest Input */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Interest Amount Paid <span className="text-amber-500">(Accrued: ₹{accruedInterest.toFixed(0)})</span>
                      </label>
                      <div className="relative">
                        <IndianRupee className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                          type="number"
                          value={interestPayment}
                          onChange={(e) => setInterestPayment(Number(e.target.value) || '')}
                          placeholder="0.00"
                          className={`w-full bg-white border ${isInterestExceeding ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-indigo-500'} rounded-xl pl-12 pr-4 py-3 text-lg font-bold font-mono text-onyx focus:ring-2 outline-none`}
                        />
                      </div>
                      {isInterestExceeding && (
                        <div className="text-xs font-bold text-red-500 mt-1.5 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Maximum payable interest: ₹{accruedInterest.toLocaleString('en-IN')}
                        </div>
                      )}
                    </div>

                    {/* Principal Input */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Principal Amount Paid <span className="text-red-500">(Left: ₹{outstandingPrincipal})</span>
                      </label>
                      <div className="relative">
                        <IndianRupee className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                          type="number"
                          value={principalPayment}
                          onChange={(e) => setPrincipalPayment(Number(e.target.value) || '')}
                          placeholder="0.00"
                          className={`w-full bg-white border ${isPrincipalExceeding ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-indigo-500'} rounded-xl pl-12 pr-4 py-3 text-lg font-bold font-mono text-onyx focus:ring-2 outline-none`}
                        />
                      </div>
                      {isPrincipalExceeding && (
                        <div className="text-xs font-bold text-red-500 mt-1.5 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Principal exceeds outstanding amount. Maximum allowed: ₹{outstandingPrincipal.toLocaleString('en-IN')}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleRecordPayment}
                      disabled={isSubmitting || (!principalPayment && !interestPayment) || isPrincipalExceeding || isInterestExceeding}
                      className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-md shadow-indigo-600/20 transition-all flex justify-center items-center gap-2"
                    >
                      {isSubmitting ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <Save className="w-5 h-5" /> Record Payment
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Edit Payment Modal */}
      {editingPayment && (
        <div className="fixed inset-0 bg-slate-900/60 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-onyx mb-4">Edit Repayment</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Principal Paid</label>
                <input type="number" value={editPrin} onChange={e => setEditPrin(Number(e.target.value) || '')} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-onyx focus:ring-2 ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Interest Paid</label>
                <input type="number" value={editInt} onChange={e => setEditInt(Number(e.target.value) || '')} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-onyx focus:ring-2 ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Payment Source</label>
                <select value={editSource} onChange={e => setEditSource(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-onyx focus:ring-2 ring-indigo-500 outline-none">
                  <option value="CYCLE_EARNINGS">Payout Deduction (From Cycle Earnings)</option>
                  <option value="MANUAL_CASH">Manual Cash Payment</option>
                  <option value="CYCLE_EARNINGS_AND_CASH">Mixed (Earnings + Cash)</option>
                </select>
              </div>
              {editSource === 'CYCLE_EARNINGS' && (
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center justify-between mt-2">
                  <span className="text-xs font-bold text-emerald-800 uppercase">Available Cycle Earnings</span>
                  <span className="font-mono font-bold text-emerald-700">₹{cycleEarnings.toFixed(0)}</span>
                </div>
              )}
              <div className="flex gap-3 justify-end mt-6">
                <button onClick={() => setEditingPayment(null)} className="px-5 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                <button onClick={savePaymentEdit} className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-sm transition-colors">Save Updates</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Loan Modal */}
      {isEditingLoan && (
        <div className="fixed inset-0 bg-slate-900/60 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-onyx mb-4">Edit Loan Terms</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Principal Amount</label>
                <input type="number" value={editLoanPrin} onChange={e => setEditLoanPrin(Number(e.target.value) || '')} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-onyx focus:ring-2 ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Interest Rate (₹/100/mo)</label>
                <input type="number" value={editLoanInt} onChange={e => setEditLoanInt(Number(e.target.value) || '')} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-onyx focus:ring-2 ring-indigo-500 outline-none" />
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button onClick={() => setIsEditingLoan(false)} className="px-5 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                <button onClick={saveLoanEdit} className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-sm transition-colors">Save Updates</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
