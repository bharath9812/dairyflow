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
  const [modifications, setModifications] = useState<any[]>([])
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
  
  // Adjust Loan State
  const [isAdjustingLoan, setIsAdjustingLoan] = useState(false)
  const [adjustType, setAdjustType] = useState('PRINCIPAL_INCREASE')
  const [adjustPrincipal, setAdjustPrincipal] = useState<number | ''>('')
  const [adjustRate, setAdjustRate] = useState<number | ''>('')
  const [adjustReason, setAdjustReason] = useState('')
  const [adjustRefType, setAdjustRefType] = useState('NOTE')
  const [adjustRefNo, setAdjustRefNo] = useState('')
  const [adjustDate, setAdjustDate] = useState(() => new Date().toISOString().split('T')[0])

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

  const startAdjustLoan = () => {
    setAdjustType('PRINCIPAL_INCREASE')
    setAdjustPrincipal('')
    setAdjustRate(loan.current_interest_rate)
    setAdjustReason('')
    setAdjustRefNo('')
    setAdjustDate(new Date().toISOString().split('T')[0])
    setIsAdjustingLoan(true)
  }

  const saveAdjustLoan = async () => {
    let delta = Number(adjustPrincipal) || 0
    if (['PRINCIPAL_DECREASE', 'WRITE_OFF'].includes(adjustType)) {
      delta = -Math.abs(delta)
    } else if (['RATE_CHANGE', 'INTEREST_RATE_CORRECTION', 'INTEREST_WAIVER', 'RESTRUCTURE'].includes(adjustType)) {
      delta = 0
    }

    const { error } = await supabase.rpc('modify_active_loan', {
      p_loan_id: loanId,
      p_modification_type: adjustType,
      p_reason_code: adjustType,
      p_reference_type: adjustRefType,
      p_reference_no: adjustRefNo,
      p_principal_delta: delta,
      p_new_interest_rate: Number(adjustRate) || 0,
      p_notes: adjustReason,
      p_effective_date: adjustDate,
    })

    if (!error) {
      setIsAdjustingLoan(false)
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
      .from('v_loan_current_state')
      .select('*')
      .eq('loan_id', loanId)
      .single()
      
    if (loanData) {
      loanData.id = loanData.loan_id;
      // Reconstruct customers object for UI backward compatibility
      loanData.customers = {
        name: loanData.customer_name,
        seller_id: loanData.customer_seller_id
      };
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

      // 5. Fetch Modifications
      const { data: modsData } = await supabase
        .from('loan_modifications')
        .select('*')
        .eq('loan_id', loanId)
        .order('sequence_no', { ascending: false })
      setModifications(modsData || [])
    }
    
    setIsLoading(false)
  }

  const accruedInterest = Number(loan?.forecasted_interest) || 0
  const outstandingPrincipal = Number(loan?.outstanding_principal ?? loan?.current_sanctioned_amount) || 0
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
    <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-surface">
      <TopBar
        leftPillLabel="Back to Loans"
        leftPillHref="/loan"
        leftPillActive={false}
        rightPillLabel="Loan Details"
        rightPillHref={`/loan/${loanId}`}
        rightPillActive={true}
        dateString={new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
      />

      <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 custom-scrollbar">
        <div className="w-full max-w-[1440px] mx-auto space-y-6">
          
          {/* Header Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
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
                <div className="text-lg font-bold text-onyx">₹{loan.current_interest_rate} <span className="text-sm text-slate-500 font-medium">/100/mo</span></div>
                {loan.current_interest_rate !== loan.original_interest_rate && (
                  <div className="text-[10px] text-amber-600 font-semibold mt-0.5">Originally: ₹{loan.original_interest_rate}</div>
                )}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sanctioned Amount</div>
                <div className="text-lg font-bold text-onyx">₹{loan.current_sanctioned_amount}</div>
                {loan.current_sanctioned_amount !== loan.original_principal && (
                  <div className="text-[10px] text-amber-600 font-semibold mt-0.5">Originally: ₹{loan.original_principal}</div>
                )}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cycle Earnings</div>
                <div className="text-lg font-bold text-emerald-600 font-mono">₹{cycleEarnings.toFixed(0)}</div>
              </div>
              <div className="flex gap-2 ml-4 mt-2 md:mt-0">
                <button onClick={startAdjustLoan} className="px-4 py-2 bg-surface text-slate-600 border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-100 hover:text-onyx transition-colors">
                  Adjust Loan
                </button>
                {payments.length === 0 && modifications.length === 0 && (
                  <button onClick={handleDeleteLoan} className="px-4 py-2 bg-white text-red-600 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-50 transition-colors">
                    Delete Loan
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6 w-full">
            
            {/* Debt Calculator Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] relative overflow-hidden">
              <div className="flex items-center gap-2 text-onyx font-bold text-lg mb-6">
                <Calculator className="w-5 h-5 text-indigo-500" /> Current Debt Calculation
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-surface border border-slate-100 rounded-xl p-6 flex flex-col justify-center">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Outstanding Principal</div>
                  <div className="text-4xl font-bold text-onyx font-mono">₹{outstandingPrincipal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                </div>
                
                <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-xs font-bold text-amber-600 uppercase tracking-wider">Forecasted Interest</div>
                    <span className="text-[9px] font-bold bg-amber-50 text-amber-600 px-2 py-0.5 rounded uppercase tracking-wider">Accruing</span>
                  </div>
                  <div className="text-3xl font-bold text-amber-600 font-mono mb-3">₹{accruedInterest.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                  <div className="text-[10px] text-slate-500 space-y-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <div className="flex justify-between"><span>Cycle:</span> <span className="font-semibold text-onyx">{activeCycleStr} ({activeStartDate} → {activeEndDate})</span></div>
                    <div className="flex justify-between"><span>Principal:</span> <span className="font-semibold text-onyx">₹{outstandingPrincipal.toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between"><span>Rate:</span> <span className="font-semibold text-onyx">₹{loan.current_interest_rate}/100/mo</span></div>
                    <div className="flex justify-between"><span>Days Active:</span> <span className="font-semibold text-onyx">{activeDays} days</span></div>
                    <div className="flex justify-between border-t border-slate-200 pt-1 mt-1"><span>Valid Until:</span> <span className="font-semibold text-onyx">{activeEndDate}</span></div>
                  </div>
                </div>

                <div className="bg-onyx text-white rounded-xl p-6 shadow-sm flex flex-col justify-center relative overflow-hidden">
                  <div className="font-semibold uppercase tracking-widest text-xs text-slate-300 mb-2 relative z-10">Total Estimated Debt</div>
                  <div className="text-4xl font-bold font-mono text-white relative z-10">₹{totalDebt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                  <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-4 translate-y-4">
                    <Calculator className="w-32 h-32" />
                  </div>
                </div>
              </div>
            </div>

            {/* Record Payment Form */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500" />
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-onyx mb-1">Record Payment</h3>
                  <p className="text-sm text-slate-500">Process a customer&apos;s payment decision towards this loan.</p>
                </div>
                {paymentSource === 'CYCLE_EARNINGS' && cycleEarnings > 0 && (
                  <div className="mt-4 md:mt-0 bg-surface border border-slate-200 px-4 py-2 rounded-xl flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Available Earnings</span>
                    <span className="font-mono font-bold text-emerald-600">₹{cycleEarnings.toFixed(0)}</span>
                  </div>
                )}
              </div>
              
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end relative pb-4 md:pb-0">
                  {/* Source Selection */}
                  <div className="md:col-span-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Payment Source</label>
                    <select
                      value={paymentSource}
                      onChange={(e) => setPaymentSource(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-onyx focus:ring-1 focus:border-onyx ring-onyx outline-none shadow-sm transition-all h-[52px]"
                    >
                      {cycleEarnings > 0 && <option value="CYCLE_EARNINGS">Cycle Earnings</option>}
                      <option value="MANUAL_CASH">Manual Cash</option>
                      {cycleEarnings > 0 && <option value="CYCLE_EARNINGS_AND_CASH">Mixed</option>}
                    </select>
                  </div>

                  {/* Interest Input */}
                  <div className="md:col-span-1 relative">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 truncate">
                      Interest <span className="text-amber-500 ml-1">(Max: ₹{accruedInterest.toFixed(0)})</span>
                    </label>
                    <div className="relative">
                      <IndianRupee className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="number"
                        value={interestPayment}
                        onChange={(e) => setInterestPayment(Number(e.target.value) || '')}
                        placeholder="0.00"
                        className={`w-full bg-white border ${isInterestExceeding ? 'border-red-300 focus:ring-1 focus:border-red-500 ring-red-500' : 'border-slate-200 focus:ring-1 focus:border-onyx ring-onyx'} rounded-xl pl-12 pr-4 text-lg font-medium font-mono text-onyx outline-none shadow-sm transition-all h-[52px]`}
                      />
                    </div>
                    {isInterestExceeding && (
                      <div className="text-[10px] font-semibold text-red-500 absolute -bottom-4 left-0">
                        Max allowed: ₹{accruedInterest.toLocaleString('en-IN')}
                      </div>
                    )}
                  </div>

                  {/* Principal Input */}
                  <div className="md:col-span-1 relative">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 truncate">
                      Principal <span className="text-red-500 ml-1">(Left: ₹{outstandingPrincipal})</span>
                    </label>
                    <div className="relative">
                      <IndianRupee className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="number"
                        value={principalPayment}
                        onChange={(e) => setPrincipalPayment(Number(e.target.value) || '')}
                        placeholder="0.00"
                        className={`w-full bg-white border ${isPrincipalExceeding ? 'border-red-300 focus:ring-1 focus:border-red-500 ring-red-500' : 'border-slate-200 focus:ring-1 focus:border-onyx ring-onyx'} rounded-xl pl-12 pr-4 text-lg font-medium font-mono text-onyx outline-none shadow-sm transition-all h-[52px]`}
                      />
                    </div>
                    {isPrincipalExceeding && (
                      <div className="text-[10px] font-semibold text-red-500 absolute -bottom-4 left-0">
                        Max allowed: ₹{outstandingPrincipal.toLocaleString('en-IN')}
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-1 h-[52px] mt-4 md:mt-0">
                    <button
                      onClick={handleRecordPayment}
                      disabled={isSubmitting || (!principalPayment && !interestPayment) || isPrincipalExceeding || isInterestExceeding}
                      className="w-full h-full bg-onyx hover:bg-black disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-sm transition-all flex justify-center items-center gap-2"
                    >
                      {isSubmitting ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <Save className="w-4 h-4" /> Record Payment
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Payment History */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] w-full">
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

            {/* Enterprise Modifications Ledger */}
            {modifications.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] w-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-onyx font-bold text-lg">
                    <Landmark className="w-5 h-5 text-indigo-500" /> Modifications Ledger
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-1 rounded">
                    Immutable
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                        <th className="pb-3 pr-4">Date</th>
                        <th className="pb-3 pr-4">Type</th>
                        <th className="pb-3 pr-4 text-right">Prin Change</th>
                        <th className="pb-3 pr-4 text-right">Sanctioned After</th>
                        <th className="pb-3 pr-4 text-right">Rate After</th>
                        <th className="pb-3">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {modifications.map((m: any) => (
                        <tr key={m.id}>
                          <td className="py-3 pr-4 text-sm font-medium text-slate-600">
                            {new Date(m.effective_date).toLocaleDateString()}
                          </td>
                          <td className="py-3 pr-4 text-sm font-bold text-slate-700">
                            <span className="bg-slate-50 text-slate-700 border border-slate-200 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                              {m.modification_type.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className={`py-3 pr-4 text-sm font-bold font-mono text-right ${Number(m.principal_delta) > 0 ? 'text-amber-600' : Number(m.principal_delta) < 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {Number(m.principal_delta) !== 0 ? (Number(m.principal_delta) > 0 ? '+' : '') + Number(m.principal_delta).toLocaleString('en-IN') : '-'}
                          </td>
                          <td className="py-3 pr-4 text-sm font-bold font-mono text-slate-600 text-right">
                            ₹{Number(m.sanctioned_amount_after).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 pr-4 text-sm font-bold font-mono text-indigo-600 text-right">
                            ₹{Number(m.new_rate)}
                          </td>
                          <td className="py-3 text-xs text-slate-500 max-w-[200px] truncate">
                            {m.notes || m.reason_code}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Enterprise Audit Log */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] w-full">
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
                  {auditLogs.map((log) => {
                    const meta = log.event_meta || {};
                    let changes: any[] = [];
                    if (meta.changes && Array.isArray(meta.changes)) {
                      changes = meta.changes;
                    }

                    let actionSentence = "System state updated.";
                    let detailsList: string[] = [];
                    const adminName = log.triggered_by_name || log.triggered_by_email || log.triggered_by || "System Admin";

                    // Helper to format currency
                    const formatInr = (val: any) => !isNaN(Number(val)) ? `₹${Number(val).toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : String(val);

                    switch(log.event_type) {
                      case 'LOAN_CREATED':
                        actionSentence = `Loan of ${formatInr(meta.principal || log.new_principal)} created at ₹${meta.interest_rate} rate by ${adminName}.`;
                        if (meta.loan_date) {
                          detailsList.push(`Started on ${new Date(meta.loan_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`);
                        }
                        if (log.new_cycle) {
                          detailsList.push(`Initial Cycle: ${log.new_cycle}`);
                        }
                        break;
                      case 'PAYMENT_RECORDED': {
                        const prin = Number(meta.principal || 0);
                        const int = Number(meta.interest || 0);
                        const totalPaid = prin + int;
                        actionSentence = `Payment of ${formatInr(totalPaid)} recorded by ${adminName}.`;
                        detailsList.push(`${formatInr(prin)} Principal • ${formatInr(int)} Interest`);
                        if (meta.source) detailsList.push(`Source: ${String(meta.source).replace(/_/g, ' ')}`);
                        if (meta.cycle) detailsList.push(`Cycle: ${meta.cycle}`);
                        break;
                      }
                      case 'PAYMENT_REVERSED':
                        actionSentence = `Payment for ${meta.cycle || log.previous_cycle} reversed by ${adminName}.`;
                        if (meta.reason) detailsList.push(`Reason: ${meta.reason}`);
                        break;
                      case 'LOAN_TERMS_EDITED':
                        if (changes.length === 0 && (meta.old_principal !== undefined || meta.old_rate !== undefined)) {
                          if (meta.old_principal !== meta.new_principal) changes.push({ field: 'Principal Amount', old: meta.old_principal, new: meta.new_principal });
                          if (meta.old_rate !== meta.new_rate) changes.push({ field: 'Interest Rate', old: meta.old_rate, new: meta.new_rate });
                        }

                        if (changes.length === 1) {
                          const c = changes[0];
                          const isCurrency = c.field.toLowerCase().includes('principal') || c.field.toLowerCase().includes('rate');
                          const oldVal = isCurrency ? formatInr(c.old) : String(c.old);
                          const newVal = isCurrency ? formatInr(c.new) : String(c.new);
                          actionSentence = `${c.field} adjusted from ${oldVal} to ${newVal} by ${adminName}.`;
                        } else if (changes.length > 1) {
                          actionSentence = `Loan terms updated (${changes.length} fields changed) by ${adminName}.`;
                          changes.forEach(c => {
                            const isCurrency = c.field.toLowerCase().includes('principal') || c.field.toLowerCase().includes('rate');
                            const oldVal = isCurrency ? formatInr(c.old) : String(c.old);
                            const newVal = isCurrency ? formatInr(c.new) : String(c.new);
                            detailsList.push(`${c.field}: ${oldVal} → ${newVal}`);
                          });
                        } else {
                          actionSentence = `Loan terms updated by ${adminName}.`;
                        }
                        break;
                      case 'PAYMENT_MODIFIED':
                        if (changes.length === 0 && (meta.old_principal !== undefined || meta.old_interest !== undefined)) {
                          if (meta.old_principal !== meta.new_principal) changes.push({ field: 'Principal Paid', old: meta.old_principal, new: meta.new_principal });
                          if (meta.old_interest !== meta.new_interest) changes.push({ field: 'Interest Paid', old: meta.old_interest, new: meta.new_interest });
                        }

                        if (changes.length === 1) {
                          const c = changes[0];
                          const isCurrency = c.field.toLowerCase().includes('principal') || c.field.toLowerCase().includes('interest');
                          const oldVal = isCurrency ? formatInr(c.old) : String(c.old);
                          const newVal = isCurrency ? formatInr(c.new) : String(c.new);
                          actionSentence = `Payment ${c.field} adjusted from ${oldVal} to ${newVal} by ${adminName}.`;
                        } else if (changes.length > 1) {
                          actionSentence = `Payment for ${meta.cycle || log.new_cycle} modified (${changes.length} fields changed) by ${adminName}.`;
                          changes.forEach(c => {
                            const isCurrency = c.field.toLowerCase().includes('principal') || c.field.toLowerCase().includes('interest');
                            const oldVal = isCurrency ? formatInr(c.old) : String(c.old);
                            const newVal = isCurrency ? formatInr(c.new) : String(c.new);
                            detailsList.push(`${c.field}: ${oldVal} → ${newVal}`);
                          });
                        } else {
                          actionSentence = `Payment modified by ${adminName}.`;
                        }
                        break;
                      default:
                        if (log.new_status === 'CLOSED' && log.previous_status === 'ACTIVE') {
                          actionSentence = `Final repayment received and loan closed by ${adminName}.`;
                        } else if (log.new_status === 'ACTIVE' && log.previous_status === 'CLOSED') {
                          actionSentence = `Loan reopened due to repayment reversal by ${adminName}.`;
                        } else {
                          actionSentence = `${log.event_type.replace(/_/g, ' ')} recorded by ${adminName}.`;
                        }
                        break;
                    }

                    if (log.event_type !== 'LOAN_CREATED' && log.event_type !== 'LOAN_TERMS_EDITED' && log.event_type !== 'PAYMENT_MODIFIED') {
                      if (log.previous_principal !== log.new_principal) {
                        detailsList.push(`Outstanding Principal: ${formatInr(log.previous_principal)} → ${formatInr(log.new_principal)}`);
                      }
                      if (log.previous_status !== log.new_status && log.event_type !== 'PAYMENT_REVERSED' && log.event_type !== 'PAYMENT_RECORDED') {
                        detailsList.push(`Status: ${log.previous_status} → ${log.new_status}`);
                      }
                      if (log.previous_cycle !== log.new_cycle && log.event_type !== 'PAYMENT_RECORDED') {
                        detailsList.push(`Advanced to Cycle: ${log.new_cycle}`);
                      }
                    }

                    const dateObj = new Date(log.created_at);
                    const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase();
                    const timeStr = dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                    return (
                      <div key={log.id} className="relative pl-6 pb-8 border-l-[1.5px] border-slate-100 last:border-transparent last:pb-0 ml-2">
                        <div className="absolute w-[11px] h-[11px] bg-[#d9d1d1] rounded-full -left-[6px] top-1" />
                        <div className="-mt-0.5">
                          <div className="text-[11px] text-slate-500 font-bold tracking-wide uppercase mb-1.5">
                            {dateStr} - {timeStr}
                          </div>
                          <div className="text-sm font-medium text-onyx leading-relaxed">
                            {actionSentence}
                          </div>
                          {detailsList.length > 0 && (
                            <div className="mt-1.5 flex flex-col gap-0.5">
                              {detailsList.map((detail, idx) => (
                                <div key={idx} className="text-[12px] text-slate-500 font-medium">
                                  {detail}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
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
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Principal Paid</label>
                <input type="number" value={editPrin} onChange={e => setEditPrin(Number(e.target.value) || '')} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-onyx focus:ring-1 focus:border-onyx ring-onyx outline-none shadow-sm transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Interest Paid</label>
                <input type="number" value={editInt} onChange={e => setEditInt(Number(e.target.value) || '')} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-onyx focus:ring-1 focus:border-onyx ring-onyx outline-none shadow-sm transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Payment Source</label>
                <select value={editSource} onChange={e => setEditSource(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-onyx focus:ring-1 focus:border-onyx ring-onyx outline-none shadow-sm transition-all">
                  <option value="CYCLE_EARNINGS">Payout Deduction (From Cycle Earnings)</option>
                  <option value="MANUAL_CASH">Manual Cash Payment</option>
                  <option value="CYCLE_EARNINGS_AND_CASH">Mixed (Earnings + Cash)</option>
                </select>
              </div>
              {editSource === 'CYCLE_EARNINGS' && (
                <div className="bg-surface border border-slate-200 p-3 rounded-xl flex items-center justify-between mt-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Available Cycle Earnings</span>
                  <span className="font-mono font-semibold text-onyx">₹{cycleEarnings.toFixed(0)}</span>
                </div>
              )}
              <div className="flex gap-3 justify-end mt-6">
                <button onClick={() => setEditingPayment(null)} className="px-5 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-lg transition-colors border border-transparent">Cancel</button>
                <button onClick={savePaymentEdit} className="px-5 py-2 bg-onyx text-white font-semibold rounded-lg hover:bg-black shadow-sm transition-colors">Save Updates</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Loan Modal */}
      {isAdjustingLoan && (
        <div className="fixed inset-0 bg-slate-900/60 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-onyx mb-1">Adjust Loan</h3>
            <p className="text-sm text-slate-500 mb-6">Modify the financial ledger for this loan.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Modification Type</label>
                <select value={adjustType} onChange={e => setAdjustType(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-onyx focus:ring-1 focus:border-onyx ring-onyx outline-none shadow-sm transition-all">
                  <option value="PRINCIPAL_INCREASE">Principal Increase (Top-Up)</option>
                  <option value="PRINCIPAL_DECREASE">Principal Decrease</option>
                  <option value="RATE_CHANGE">Interest Rate Change</option>
                  <option value="INTEREST_RATE_CORRECTION">Correction (Wrong Rate Entered)</option>
                  <option value="WRITE_OFF">Write Off Debt</option>
                  <option value="INTEREST_WAIVER">Interest Waiver</option>
                </select>
              </div>
              
              {['PRINCIPAL_INCREASE', 'PRINCIPAL_DECREASE', 'WRITE_OFF'].includes(adjustType) && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Principal Amount (₹)</label>
                  <input type="number" placeholder="Amount..." value={adjustPrincipal} onChange={e => setAdjustPrincipal(Number(e.target.value) || '')} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium font-mono text-onyx focus:ring-1 focus:border-onyx ring-onyx outline-none shadow-sm transition-all" />
                </div>
              )}
              
              {['RATE_CHANGE', 'INTEREST_RATE_CORRECTION'].includes(adjustType) && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">New Interest Rate (₹/100/mo)</label>
                  <input type="number" placeholder="Rate..." value={adjustRate} onChange={e => setAdjustRate(Number(e.target.value) || '')} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium font-mono text-onyx focus:ring-1 focus:border-onyx ring-onyx outline-none shadow-sm transition-all" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Effective Date</label>
                  <input type="date" value={adjustDate} onChange={e => setAdjustDate(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-onyx focus:ring-1 focus:border-onyx ring-onyx outline-none shadow-sm transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Reference / Note</label>
                  <input type="text" placeholder="Reason..." value={adjustReason} onChange={e => setAdjustReason(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-onyx focus:ring-1 focus:border-onyx ring-onyx outline-none shadow-sm transition-all" />
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-slate-100">
                <button onClick={() => setIsAdjustingLoan(false)} className="px-5 py-2.5 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors border border-transparent">Cancel</button>
                <button onClick={saveAdjustLoan} className="px-5 py-2.5 bg-onyx text-white font-semibold rounded-xl hover:bg-black shadow-sm transition-colors flex items-center gap-2">Confirm Adjustment</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
