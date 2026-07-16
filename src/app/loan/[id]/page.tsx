'use client'
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Landmark, Calculator, AlertCircle, Calendar, IndianRupee, Save, Clock, History, Activity, User, Info } from 'lucide-react'
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
  const [paymentSourceOption, setPaymentSourceOption] = useState('CYCLE_EARNINGS_FULL')
  const [deductionMode, setDeductionMode] = useState<'FULL' | 'INTEREST_ONLY' | 'PARTIAL'>('FULL')

  // Edit Payment State
  const [editingPayment, setEditingPayment] = useState<any>(null)
  const [editPrin, setEditPrin] = useState<number | ''>('')
  const [editInt, setEditInt] = useState<number | ''>('')
  const [editSource, setEditSource] = useState('CYCLE_EARNINGS')
  const [editSourceOption, setEditSourceOption] = useState('CYCLE_EARNINGS_FULL')
  const [editDeductionMode, setEditDeductionMode] = useState<'FULL' | 'INTEREST_ONLY' | 'PARTIAL'>('FULL')

  // UI State
  const [showPaymentInfo, setShowPaymentInfo] = useState(false)
  
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
    
    const sourceStr = p.source || 'CYCLE_EARNINGS_FULL';
    
    // Set exact UI option
    setEditSourceOption(sourceStr);
    
    // Reverse map to base categories for UI logic
    if (sourceStr.startsWith('CYCLE_EARNINGS') && !sourceStr.includes('AND_CASH')) {
      setEditSource('CYCLE_EARNINGS');
      setEditDeductionMode(sourceStr === 'CYCLE_EARNINGS_INT' ? 'INTEREST_ONLY' : sourceStr === 'CYCLE_EARNINGS_PARTIAL' ? 'PARTIAL' : 'FULL');
    } else if (sourceStr.includes('AND_CASH')) {
      setEditSource('CYCLE_EARNINGS_AND_CASH');
      setEditDeductionMode('FULL');
    } else {
      setEditSource('MANUAL_CASH');
      setEditDeductionMode('FULL');
    }
  }

  const handlePaymentSourceOptionChange = (option: string) => {
    setPaymentSourceOption(option);
    if (option === 'CYCLE_EARNINGS_FULL') {
      setPaymentSource('CYCLE_EARNINGS');
      setDeductionMode('FULL');
    } else if (option === 'CYCLE_EARNINGS_INT') {
      setPaymentSource('CYCLE_EARNINGS');
      setDeductionMode('INTEREST_ONLY');
      setPrincipalPayment(0);
    } else if (option === 'CYCLE_EARNINGS_PARTIAL') {
      setPaymentSource('CYCLE_EARNINGS');
      setDeductionMode('PARTIAL');
      setPrincipalPayment('');
    } else if (option === 'MANUAL_CASH') {
      setPaymentSource('MANUAL_CASH');
      setDeductionMode('FULL');
      setPrincipalPayment('');
      setInterestPayment('');
    } else if (option === 'CYCLE_EARNINGS_AND_CASH_FULL') {
      setPaymentSource('CYCLE_EARNINGS_AND_CASH');
      setDeductionMode('FULL');
      setPrincipalPayment('');
    }
  }

  const handleEditSourceOptionChange = (option: string) => {
    setEditSourceOption(option);
    if (option === 'CYCLE_EARNINGS_FULL') {
      setEditSource('CYCLE_EARNINGS');
      setEditDeductionMode('FULL');
    } else if (option === 'CYCLE_EARNINGS_INT') {
      setEditSource('CYCLE_EARNINGS');
      setEditDeductionMode('INTEREST_ONLY');
      setEditPrin(0);
    } else if (option === 'CYCLE_EARNINGS_PARTIAL') {
      setEditSource('CYCLE_EARNINGS');
      setEditDeductionMode('PARTIAL');
      setEditPrin('');
    } else if (option === 'MANUAL_CASH') {
      setEditSource('MANUAL_CASH');
      setEditDeductionMode('FULL');
    } else if (option === 'CYCLE_EARNINGS_AND_CASH_FULL') {
      setEditSource('CYCLE_EARNINGS_AND_CASH');
      setEditDeductionMode('FULL');
      setEditPrin('');
    }
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
      source: editSourceOption
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
    setLoan(null)
    setLiveAggregate(null)
    setPrincipalPayment('')
    setInterestPayment('')
    setPaymentSource('CYCLE_EARNINGS')
    
    // 1. Fetch Loan & Config Concurrently
    await supabase.auth.getUser() // Prevent Supabase auth lock collision
    const [
      { data: loanData, error: loanError },
      config
    ] = await Promise.all([
      supabase.from('v_loan_current_state').select('*').eq('loan_id', loanId).single(),
      fetchCycleConfig(supabase)
    ])
      
    if (loanData) {
      loanData.id = loanData.loan_id;
      // Reconstruct customers object for UI backward compatibility
      loanData.customers = {
        name: loanData.customer_name,
        seller_id: loanData.customer_seller_id
      };
      setLoan(loanData)
      setInterestPayment(Number(loanData.forecasted_interest) || '')
      
      setCycleConfig(config)
      const cycle = getCycle(config)
      setCurrentCycleStr(cycle)
      const activeLoanCycle = loanData.active_cycle_identifier || cycle

      // 2. Fetch Payments, Aggregates, Audits, Mods Concurrently
      const [
        { data: paymentsData },
        { data: aggData },
        { data: auditData },
        { data: modsData }
      ] = await Promise.all([
        supabase.from('loan_payments').select('*').eq('loan_id', loanId).order('created_at', { ascending: false }),
        supabase.from('live_cycle_aggregates').select('*').eq('customer_id', loanData.customer_id).eq('cycle_identifier', activeLoanCycle).maybeSingle(),
        supabase.from('loan_state_history').select('*').eq('loan_id', loanId).order('created_at', { ascending: false }),
        supabase.from('loan_modifications').select('*').eq('loan_id', loanId).order('sequence_no', { ascending: false })
      ])

      setPayments(paymentsData || [])
      setLiveAggregate(aggData)
      setAuditLogs(auditData || [])
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
      setPaymentSourceOption('MANUAL_CASH');
    } else if (cycleEarnings > 0 && paymentSourceOption === 'MANUAL_CASH') {
      // Only auto-switch to cycle earnings if it was manual cash
      setPaymentSource('CYCLE_EARNINGS');
      setPaymentSourceOption('CYCLE_EARNINGS_FULL');
      setDeductionMode('FULL');
    }
  }, [cycleEarnings, loan?.active_cycle_identifier, loan?.state_version]);

  // Auto-fill and auto-calculate suggested payments to avoid manual math (Record Payment)
  useEffect(() => {
    if (cycleEarnings > 0) {
      if (paymentSource === 'CYCLE_EARNINGS') {
        const defaultInterest = Number(Math.min(accruedInterest, cycleEarnings).toFixed(2));
        const currentInterest = interestPayment !== '' ? Number(interestPayment) : defaultInterest;
        
        if (interestPayment === '') {
          setInterestPayment(defaultInterest);
        }
        
        if (deductionMode === 'INTEREST_ONLY') {
          setPrincipalPayment(0);
        } else if (deductionMode === 'PARTIAL') {
          // Leave principal payment empty for user to fill
          if (principalPayment === 0) setPrincipalPayment('');
        } else {
          const suggestedPrincipal = Number(Math.min(outstandingPrincipal, Math.max(0, cycleEarnings - currentInterest)).toFixed(2));
          setPrincipalPayment(suggestedPrincipal || '');
        }
      } else if (paymentSource === 'CYCLE_EARNINGS_AND_CASH') {
        const defaultInterest = Number(Math.min(accruedInterest, cycleEarnings).toFixed(2));
        if (interestPayment === '') {
          setInterestPayment(defaultInterest);
        }
        
        if (principalPayment === '') {
          const currentInterest = interestPayment !== '' ? Number(interestPayment) : defaultInterest;
          const suggestedPrincipal = Number(Math.min(outstandingPrincipal, Math.max(0, cycleEarnings - currentInterest)).toFixed(2));
          setPrincipalPayment(suggestedPrincipal || '');
        }
      }
    }
  }, [paymentSource, cycleEarnings, accruedInterest, deductionMode]);

  const pPaymentVal = Number(principalPayment) || 0;
  const iPaymentVal = Number(interestPayment) || 0;

  // Auto-switch to Mixed if amount exceeds earnings (Record Payment)
  useEffect(() => {
    const totalInput = pPaymentVal + iPaymentVal;
    if (cycleEarnings > 0 && totalInput > cycleEarnings && paymentSource === 'CYCLE_EARNINGS') {
      setPaymentSource('CYCLE_EARNINGS_AND_CASH');
      setPaymentSourceOption('CYCLE_EARNINGS_AND_CASH_FULL');
    }
  }, [pPaymentVal, iPaymentVal, cycleEarnings, paymentSource]);

  // Auto-fill and auto-calculate suggested payments to avoid manual math (Edit Repayment)
  useEffect(() => {
    const availableForEdit = Number(editingPayment?.available_cycle_earnings || cycleEarnings);
    if (editingPayment && availableForEdit > 0 && editSource === 'CYCLE_EARNINGS') {
      const currentInt = editInt !== '' ? Number(editInt) : Number(Math.min(accruedInterest, availableForEdit).toFixed(2));
      if (editDeductionMode === 'INTEREST_ONLY') {
        setEditPrin(0);
      } else if (editDeductionMode === 'PARTIAL') {
        if (editPrin === 0) setEditPrin('');
      } else {
        const suggestedPrin = Number(Math.min(outstandingPrincipal, Math.max(0, availableForEdit - currentInt)).toFixed(2));
        setEditPrin(suggestedPrin || '');
      }
    } else if (editingPayment && availableForEdit > 0 && editSource === 'CYCLE_EARNINGS_AND_CASH') {
      const currentInt = editInt !== '' ? Number(editInt) : Number(Math.min(accruedInterest, availableForEdit).toFixed(2));
      if (editPrin === '') {
        const suggestedPrin = Number(Math.min(outstandingPrincipal, Math.max(0, availableForEdit - currentInt)).toFixed(2));
        setEditPrin(suggestedPrin || '');
      }
    }
  }, [editSource, editingPayment, editDeductionMode, cycleEarnings, accruedInterest, outstandingPrincipal]);

  // Auto-switch to Mixed if amount exceeds earnings (Edit Repayment)
  useEffect(() => {
    const totalEditInput = (Number(editPrin) || 0) + (Number(editInt) || 0);
    const availableForEdit = Number(editingPayment?.available_cycle_earnings || cycleEarnings);
    if (availableForEdit > 0 && totalEditInput > availableForEdit && editSource === 'CYCLE_EARNINGS') {
      setEditSource('CYCLE_EARNINGS_AND_CASH');
      setEditSourceOption('CYCLE_EARNINGS_AND_CASH_FULL');
    }
  }, [editPrin, editInt, editingPayment, cycleEarnings, editSource]);

  // Clear inputs when payment source is switched to Manual Cash (Record Form)
  useEffect(() => {
    if (paymentSource === 'MANUAL_CASH') {
      setPrincipalPayment('');
      if (interestPayment === '') {
        setInterestPayment(Number(accruedInterest.toFixed(2)));
      }
    }
  }, [paymentSource, accruedInterest, interestPayment]);

  // Clear inputs when payment source is switched to Manual Cash (Edit Modal)
  useEffect(() => {
    if (editSource === 'MANUAL_CASH') {
      setEditPrin('');
      if (editInt === '') {
        setEditInt(Number(accruedInterest.toFixed(2)));
      }
    }
  }, [editSource, accruedInterest, editInt]);

  const isPrincipalExceeding = pPaymentVal > outstandingPrincipal;
  const isInterestExceeding = iPaymentVal > accruedInterest;

  const isEditPrincipalExceeding = (Number(editPrin) || 0) > outstandingPrincipal;
  const isEditInterestExceeding = (Number(editInt) || 0) > accruedInterest;

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
      source: paymentSourceOption,
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

      <main className="flex-1 overflow-y-auto px-6 py-3 -mt-6 custom-scrollbar">
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
                <div className="text-lg font-bold text-emerald-600 font-mono">₹{cycleEarnings.toFixed(2)}</div>
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
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-onyx">Record Payment</h3>
                    <button 
                      onClick={() => setShowPaymentInfo(!showPaymentInfo)} 
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${showPaymentInfo ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'}`}
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-sm text-slate-500">Process a customer&apos;s payment decision towards this loan.</p>
                </div>
                <div className="mt-4 md:mt-0 bg-surface border border-slate-200 px-4 py-2 rounded-xl flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Available Earnings</span>
                  <span className={`font-mono font-bold ${cycleEarnings > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                    ₹{cycleEarnings > 0 ? cycleEarnings.toFixed(2) : '0.00'}
                  </span>
                </div>
              </div>

              {/* Collapsible Info Panel */}
              <div className={`grid transition-all duration-300 ease-in-out mb-6 ${showPaymentInfo ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 mt-2 space-y-3">
                    <p className="font-semibold text-indigo-900 text-sm mb-2">How the math works for each option:</p>
                    
                    <div className="bg-white rounded-lg p-3 border border-indigo-100 shadow-[0px_2px_8px_rgba(0,0,0,0.02)]">
                      <strong className="text-indigo-900 block text-xs tracking-wide uppercase mb-1">1. Cycle Earnings (Full)</strong>
                      <p className="text-slate-600 text-sm">We take their <strong className="text-slate-800">ENTIRE</strong> milk check for this cycle and use it to pay off the loan. First we pay the interest, and whatever is left over automatically pays down the principal. <em className="text-indigo-600 font-medium">(Zero cash changes hands)</em>.</p>
                    </div>

                    <div className="bg-white rounded-lg p-3 border border-indigo-100 shadow-[0px_2px_8px_rgba(0,0,0,0.02)]">
                      <strong className="text-indigo-900 block text-xs tracking-wide uppercase mb-1">2. Cycle Earnings (Partial)</strong>
                      <p className="text-slate-600 text-sm">You choose a specific amount to deduct from their milk check (e.g. taking ₹500 from a ₹2000 check). They will receive the rest of their milk money as normal.</p>
                    </div>

                    <div className="bg-white rounded-lg p-3 border border-indigo-100 shadow-[0px_2px_8px_rgba(0,0,0,0.02)]">
                      <strong className="text-indigo-900 block text-xs tracking-wide uppercase mb-1">3. Cycle Earnings (Interest Only)</strong>
                      <p className="text-slate-600 text-sm">We only deduct the exact Interest amount from their milk check. Their Principal (main loan balance) stays exactly the same. They get the rest of their milk money.</p>
                    </div>

                    <div className="bg-white rounded-lg p-3 border border-indigo-100 shadow-[0px_2px_8px_rgba(0,0,0,0.02)]">
                      <strong className="text-indigo-900 block text-xs tracking-wide uppercase mb-1">4. Manual Cash Payment</strong>
                      <p className="text-slate-600 text-sm">The farmer hands you physical <strong className="text-emerald-600">CASH</strong> right now. We do <strong className="text-slate-800">NOT</strong> touch their milk check at all. Their full milk check will be given to them later.</p>
                    </div>

                    <div className="bg-white rounded-lg p-3 border border-indigo-100 shadow-[0px_2px_8px_rgba(0,0,0,0.02)]">
                      <strong className="text-indigo-900 block text-xs tracking-wide uppercase mb-1">5. Mixed (Full + Cash)</strong>
                      <p className="text-slate-600 text-sm">Their milk check is too small to cover what they want to pay. So, we take their ENTIRE milk check, <strong className="text-slate-800">AND</strong> they give you extra CASH out of their pocket to make up the difference.</p>
                    </div>
                  </div>
                </div>
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
                <div className="space-y-4">
                  {/* Inputs Row */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                    {/* Source Selection */}
                    <div>
                      <div className="flex flex-col gap-0.5 mb-2">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Payment Source</div>
                        <div className="text-[10px] font-medium text-slate-400">Select how to collect</div>
                      </div>
                      <select
                        value={paymentSourceOption}
                        onChange={(e) => handlePaymentSourceOptionChange(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-onyx focus:ring-1 focus:border-onyx ring-onyx outline-none shadow-sm transition-all h-[52px]"
                      >
                        {cycleEarnings > 0 && <option value="CYCLE_EARNINGS_FULL">Cycle Earnings (Full)</option>}
                        {cycleEarnings > 0 && <option value="CYCLE_EARNINGS_PARTIAL">Cycle Earnings (Partial)</option>}
                        {cycleEarnings > 0 && <option value="CYCLE_EARNINGS_INT">Cycle Earnings (Interest Only)</option>}
                        <option value="MANUAL_CASH">Manual Cash</option>
                        {cycleEarnings > 0 && <option value="CYCLE_EARNINGS_AND_CASH_FULL">Mixed (Full + Cash)</option>}
                      </select>
                    </div>

                    {/* Interest Input */}
                    <div className="relative">
                      <div className="flex flex-col gap-0.5 mb-2">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Interest</div>
                        <div className="text-[10px] font-medium text-slate-400">
                          Accrued: <span className="font-bold text-amber-500">₹{accruedInterest.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
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
                        <div className="text-[10px] font-semibold text-red-500 mt-1">
                          Max: ₹{accruedInterest.toLocaleString('en-IN')}
                        </div>
                      )}
                    </div>

                    {/* Principal Input */}
                    <div className="relative">
                      <div className="flex flex-col gap-0.5 mb-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Principal</div>
                          {paymentSource !== 'MANUAL_CASH' && cycleEarnings > 0 && (
                            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded whitespace-nowrap">
                              ₹{Math.max(0, cycleEarnings - iPaymentVal).toLocaleString('en-IN', { minimumFractionDigits: 2 })} avail.
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-medium text-slate-400">
                          Outstanding: <span className="font-bold text-red-500">₹{outstandingPrincipal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                      <div className="relative">
                        <IndianRupee className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                          type="number"
                          value={principalPayment}
                          onChange={(e) => setPrincipalPayment(Number(e.target.value) || '')}
                          readOnly={deductionMode === 'INTEREST_ONLY'}
                          placeholder="0.00"
                          className={`w-full bg-white border ${isPrincipalExceeding ? 'border-red-300 focus:ring-1 focus:border-red-500 ring-red-500' : 'border-slate-200 focus:ring-1 focus:border-onyx ring-onyx'} rounded-xl pl-12 pr-4 text-lg font-medium font-mono text-onyx outline-none shadow-sm transition-all h-[52px] ${deductionMode === 'INTEREST_ONLY' ? 'opacity-80 bg-slate-50 cursor-not-allowed' : ''}`}
                        />
                      </div>
                      {isPrincipalExceeding && (
                        <div className="text-[10px] font-semibold text-red-500 mt-1">
                          Max: ₹{outstandingPrincipal.toLocaleString('en-IN')}
                        </div>
                      )}
                    </div>

                    {/* Record Button */}
                    <div className="h-[52px] mt-[30px]">
                      <button
                        onClick={handleRecordPayment}
                        disabled={isSubmitting || (!principalPayment && !interestPayment) || isPrincipalExceeding || isInterestExceeding}
                        className="w-full h-full bg-onyx hover:bg-black disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-sm transition-all flex justify-center items-center gap-2"
                      >
                        {isSubmitting ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : (
                          <><Save className="w-4 h-4" /> Record Payment</>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Live Breakdown Panel — milk-based sources */}
                  {paymentSource !== 'MANUAL_CASH' && cycleEarnings > 0 && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                      <div className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Live Milk Deduction Breakdown</span>
                        <span className="text-[10px] font-semibold text-slate-400">Updates in real time</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                        <div className="px-4 py-3">
                          <div className="text-[9px] uppercase tracking-wider font-bold text-slate-400 mb-1">Total Cycle Earnings</div>
                          <div className="font-mono font-bold text-slate-700 text-base">₹{cycleEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                        </div>
                        <div className="px-4 py-3 bg-amber-50/60">
                          <div className="text-[9px] uppercase tracking-wider font-bold text-amber-500 mb-1">— Interest from Milk</div>
                          <div className="font-mono font-bold text-amber-600 text-base">₹{iPaymentVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                        </div>
                        <div className="px-4 py-3 bg-indigo-50/60">
                          <div className="text-[9px] uppercase tracking-wider font-bold text-indigo-400 mb-1">— Principal from Milk</div>
                          <div className="font-mono font-bold text-indigo-600 text-base">
                            ₹{Math.min(pPaymentVal, Math.max(0, cycleEarnings - iPaymentVal)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                        <div className={`px-4 py-3 ${Math.max(0, cycleEarnings - iPaymentVal - pPaymentVal) > 0 ? 'bg-emerald-50/60' : 'bg-red-50/60'}`}>
                          <div className={`text-[9px] uppercase tracking-wider font-bold mb-1 ${Math.max(0, cycleEarnings - iPaymentVal - pPaymentVal) > 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                            Remaining to Farmer
                          </div>
                          <div className={`font-mono font-bold text-base ${Math.max(0, cycleEarnings - iPaymentVal - pPaymentVal) > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            ₹{Math.max(0, cycleEarnings - iPaymentVal - pPaymentVal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>
                      {paymentSource === 'CYCLE_EARNINGS_AND_CASH' && (pPaymentVal + iPaymentVal) > cycleEarnings && (
                        <div className="border-t border-slate-200 bg-emerald-50 px-4 py-3 flex items-center justify-between">
                          <div>
                            <div className="text-[9px] uppercase tracking-wider font-bold text-emerald-600 mb-0.5">💵 Collect as Physical CASH</div>
                            <div className="text-[10px] text-emerald-700 font-medium">Milk earnings exhausted — additional amount must be collected directly from farmer</div>
                          </div>
                          <div className="text-xl font-bold font-mono text-emerald-600 whitespace-nowrap ml-4">
                            ₹{Math.max(0, pPaymentVal + iPaymentVal - cycleEarnings).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Manual Cash Breakdown Panel */}
                  {paymentSource === 'MANUAL_CASH' && (pPaymentVal > 0 || iPaymentVal > 0) && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                      <div className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Cash Payment Summary</span>
                        <span className="text-[10px] font-semibold text-slate-400">No milk deduction</span>
                      </div>
                      <div className="grid grid-cols-3 divide-x divide-slate-200">
                        <div className="px-4 py-3 bg-slate-100/60">
                          <div className="text-[9px] uppercase tracking-wider font-bold text-slate-400 mb-1">Milk Deducted</div>
                          <div className="font-mono font-bold text-slate-400 text-base">₹0.00</div>
                          <div className="text-[9px] text-slate-400 mt-0.5">Milk check untouched</div>
                        </div>
                        <div className="px-4 py-3 bg-amber-50/60">
                          <div className="text-[9px] uppercase tracking-wider font-bold text-amber-500 mb-1">Interest (Cash)</div>
                          <div className="font-mono font-bold text-amber-600 text-base">₹{iPaymentVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                        </div>
                        <div className="px-4 py-3 bg-indigo-50/60">
                          <div className="text-[9px] uppercase tracking-wider font-bold text-indigo-400 mb-1">Principal (Cash)</div>
                          <div className="font-mono font-bold text-indigo-600 text-base">₹{pPaymentVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                        </div>
                      </div>
                      <div className="border-t border-slate-200 bg-emerald-50 px-4 py-3 flex items-center justify-between">
                        <div>
                          <div className="text-[9px] uppercase tracking-wider font-bold text-emerald-600 mb-0.5">💵 Total Cash to Collect from Farmer</div>
                          <div className="text-[10px] text-emerald-700 font-medium">Farmer's full milk check will be paid to them separately as usual</div>
                        </div>
                        <div className="text-xl font-bold font-mono text-emerald-600 whitespace-nowrap ml-4">
                          ₹{(pPaymentVal + iPaymentVal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  )}
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
      {editingPayment && (() => {
        const editAvail = Number(editingPayment?.available_cycle_earnings || cycleEarnings)
        const ePrin = Number(editPrin) || 0
        const eInt = Number(editInt) || 0
        const ePrinFromMilk = Math.min(ePrin, Math.max(0, editAvail - eInt))
        const eRemaining = Math.max(0, editAvail - eInt - ePrin)
        const eCashNeeded = Math.max(0, ePrin + eInt - editAvail)
        const isMilkBased = editSourceOption !== 'MANUAL_CASH'
        const isMixed = editSourceOption === 'CYCLE_EARNINGS_AND_CASH_FULL'
        return (
          <div className="fixed inset-0 bg-slate-900/60 z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-onyx">Edit Repayment</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Modify the recorded payment for this cycle</p>
                </div>
                <span className="text-xs font-bold font-mono text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">{editingPayment.cycle_identifier}</span>
              </div>

              <div className="px-6 py-5 space-y-5">
                {/* Inputs Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Source */}
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Payment Source</div>
                    <select value={editSourceOption} onChange={e => handleEditSourceOptionChange(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-onyx focus:ring-1 focus:border-onyx ring-onyx outline-none shadow-sm transition-all h-[48px]">
                      <option value="CYCLE_EARNINGS_FULL">Cycle Earnings (Full)</option>
                      <option value="CYCLE_EARNINGS_PARTIAL">Cycle Earnings (Partial)</option>
                      <option value="CYCLE_EARNINGS_INT">Cycle Earnings (Interest Only)</option>
                      <option value="MANUAL_CASH">Manual Cash Payment</option>
                      <option value="CYCLE_EARNINGS_AND_CASH_FULL">Mixed (Full + Cash)</option>
                    </select>
                  </div>
                  {/* Interest */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Interest Paid</div>
                      <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">Originally: ₹{Number(editingPayment?.interest_paid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <input type="number" value={editInt} onChange={e => setEditInt(Number(e.target.value) || '')} className="w-full bg-white border border-slate-200 focus:ring-1 focus:border-onyx ring-onyx rounded-xl px-4 py-3 text-sm font-medium font-mono text-onyx outline-none shadow-sm transition-all h-[48px]" />
                  </div>
                  {/* Principal */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Principal Paid</div>
                      {isMilkBased && editAvail > 0 && (
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded whitespace-nowrap">
                          ₹{Math.max(0, editAvail - eInt).toLocaleString('en-IN', { minimumFractionDigits: 2 })} avail.
                        </span>
                      )}
                    </div>
                    <input type="number" value={editPrin} onChange={e => setEditPrin(Number(e.target.value) || '')} readOnly={editDeductionMode === 'INTEREST_ONLY'} className={`w-full bg-white border ${isEditPrincipalExceeding ? 'border-red-300 focus:ring-1 focus:border-red-500 ring-red-500' : 'border-slate-200 focus:ring-1 focus:border-onyx ring-onyx'} rounded-xl px-4 py-3 text-sm font-medium font-mono text-onyx outline-none shadow-sm transition-all h-[48px] ${editDeductionMode === 'INTEREST_ONLY' ? 'opacity-70 bg-slate-50 cursor-not-allowed' : ''}`} />
                    {isEditPrincipalExceeding ? (
                      <div className="text-[10px] font-semibold text-red-500 mt-1">Max: ₹{outstandingPrincipal.toLocaleString('en-IN')}</div>
                    ) : (
                      <div className="text-[9px] font-medium text-slate-400 mt-1">Outstanding: <span className="font-bold text-red-500">₹{outstandingPrincipal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                    )}
                  </div>
                </div>

                {/* Live Breakdown — Milk-based */}
                {isMilkBased && editAvail > 0 && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                    {/* Available Cycle Earnings Row */}
                    <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-white">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Available Cycle Earnings</span>
                      <span className="font-mono font-bold text-onyx text-base">₹{editAvail.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Live Milk Deduction Breakdown</span>
                      <span className="text-[10px] font-semibold text-slate-400">Updates in real time</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                      <div className="px-4 py-3">
                        <div className="text-[9px] uppercase tracking-wider font-bold text-slate-400 mb-1">Cycle Earnings</div>
                        <div className="font-mono font-bold text-slate-700 text-base">₹{editAvail.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                      </div>
                      <div className="px-4 py-3 bg-amber-50/60">
                        <div className="text-[9px] uppercase tracking-wider font-bold text-amber-500 mb-1">— Interest from Milk</div>
                        <div className="font-mono font-bold text-amber-600 text-base">₹{eInt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                      </div>
                      <div className="px-4 py-3 bg-indigo-50/60">
                        <div className="text-[9px] uppercase tracking-wider font-bold text-indigo-400 mb-1">— Principal from Milk</div>
                        <div className="font-mono font-bold text-indigo-600 text-base">₹{ePrinFromMilk.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                      </div>
                      <div className={`px-4 py-3 ${eRemaining > 0 ? 'bg-emerald-50/60' : 'bg-red-50/60'}`}>
                        <div className={`text-[9px] uppercase tracking-wider font-bold mb-1 ${eRemaining > 0 ? 'text-emerald-500' : 'text-red-400'}`}>Remaining to Farmer</div>
                        <div className={`font-mono font-bold text-base ${eRemaining > 0 ? 'text-emerald-600' : 'text-red-500'}`}>₹{eRemaining.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                      </div>
                    </div>
                    {isMixed && eCashNeeded > 0 && (
                      <div className="border-t border-slate-200 bg-emerald-50 px-4 py-3 flex items-center justify-between">
                        <div>
                          <div className="text-[9px] uppercase tracking-wider font-bold text-emerald-600 mb-0.5">💵 Collect as Physical CASH</div>
                          <div className="text-[10px] text-emerald-700 font-medium">Milk earnings exhausted — additional amount must be collected directly from farmer</div>
                        </div>
                        <div className="text-xl font-bold font-mono text-emerald-600 whitespace-nowrap ml-4">₹{eCashNeeded.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Manual Cash Summary */}
                {!isMilkBased && (ePrin > 0 || eInt > 0) && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Cash Payment Summary</span>
                      <span className="text-[10px] font-semibold text-slate-400">No milk deduction</span>
                    </div>
                    <div className="grid grid-cols-3 divide-x divide-slate-200">
                      <div className="px-4 py-3 bg-slate-100/60">
                        <div className="text-[9px] uppercase tracking-wider font-bold text-slate-400 mb-1">Milk Deducted</div>
                        <div className="font-mono font-bold text-slate-400 text-base">₹0.00</div>
                        <div className="text-[9px] text-slate-400 mt-0.5">Milk check untouched</div>
                      </div>
                      <div className="px-4 py-3 bg-amber-50/60">
                        <div className="text-[9px] uppercase tracking-wider font-bold text-amber-500 mb-1">Interest (Cash)</div>
                        <div className="font-mono font-bold text-amber-600 text-base">₹{eInt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                      </div>
                      <div className="px-4 py-3 bg-indigo-50/60">
                        <div className="text-[9px] uppercase tracking-wider font-bold text-indigo-400 mb-1">Principal (Cash)</div>
                        <div className="font-mono font-bold text-indigo-600 text-base">₹{ePrin.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                      </div>
                    </div>
                    <div className="border-t border-slate-200 bg-emerald-50 px-4 py-3 flex items-center justify-between">
                      <div>
                        <div className="text-[9px] uppercase tracking-wider font-bold text-emerald-600 mb-0.5">💵 Total Cash to Collect from Farmer</div>
                        <div className="text-[10px] text-emerald-700 font-medium">Farmer's full milk check will be paid to them separately as usual</div>
                      </div>
                      <div className="text-xl font-bold font-mono text-emerald-600 whitespace-nowrap ml-4">₹{(ePrin + eInt).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
                  <button onClick={() => setEditingPayment(null)} className="px-5 py-2.5 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors border border-slate-200">Cancel</button>
                  <button onClick={savePaymentEdit} disabled={isEditPrincipalExceeding} className="px-5 py-2.5 bg-onyx text-white font-semibold rounded-xl hover:bg-black disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed shadow-sm transition-colors">Save Updates</button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

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
