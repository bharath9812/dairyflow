/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps, prefer-const, react/no-unescaped-entities, react-hooks/set-state-in-effect */
import React, { Suspense } from 'react'
import { ArrowLeft, Droplets, LogOut, Sun, Moon, Database, ChevronLeft, ChevronRight, User, TrendingUp, Activity, Loader2, Landmark, IndianRupee, Clock, Calendar, CheckCircle2, AlertCircle, History } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { fetchAdminTransactions, fetchAdminAggregates } from '@/app/admin/actions'
import AdminFilters from '@/app/admin/AdminFilters'
import ExportButtons from '@/app/admin/ExportButtons'
import { MultiSelectProvider, MultiSelectHeader, MultiSelectCheckbox } from '@/components/MultiSelect'
import TransactionActionCell from '@/components/TransactionActionCell'
import CustomerProfileForm from './CustomerProfileForm'

import { TransactionViewModeWrapper } from '@/components/TransactionViewModeWrapper'

export default async function CustomerAnalyticsPage(props: {
  params: Promise<{ id: string }>,
  searchParams: Promise<{
    timeframe?: string,
    shift?: string,
    milkType?: string,
    minQty?: string,
    qtyOp?: string,
    search?: string,
    exactDate?: string,
    exactMonth?: string,
    startDate?: string,
    endDate?: string,
    hideTable?: string,
    hiddenCols?: string,
    page?: string,
    sortBy?: string
  }>
}) {
  const params = await props.params
  const searchParams = await props.searchParams
  const id = params.id

  const timeframe = searchParams?.timeframe || 'MONTH_FIRST_HALF'
  const exactDate = searchParams?.exactDate || ''
  const exactMonth = searchParams?.exactMonth || ''
  const startDate = searchParams?.startDate || ''
  const endDate = searchParams?.endDate || ''
  const shift = searchParams?.shift || 'ALL'
  const milkType = searchParams?.milkType || 'ALL'
  const minQty = searchParams?.minQty || ''
  const qtyOp = searchParams?.qtyOp || 'gt'
  const search = searchParams?.search || ''
  const hideTable = searchParams?.hideTable === 'true'
  const hiddenCols = (searchParams?.hiddenCols || '').split(',').filter(Boolean)
  const sortBy = searchParams?.sortBy || 'DATE_ASC'
  const page = parseInt(searchParams?.page || '1', 10)
  const limit = 20
  const offset = (page - 1) * limit
  const currentYear = new Date().getFullYear()

  const supabase = await createClient()

  // Fire parallel queries to Supabase
  const [profileRes, aggregates, txData, locationsRes] = await Promise.all([
    supabase.from('customers').select('*').eq('id', id).single(),
    fetchAdminAggregates({ timeframe, shift, milkType, minQty, qtyOp, search, exactDate, exactMonth, startDate, endDate, customerId: id }),
    fetchAdminTransactions({ timeframe, shift, milkType, minQty, qtyOp, search, exactDate, exactMonth, startDate, endDate, customerId: id, limit, offset, sortBy }),
    supabase.from('locations').select('*').order('name', { ascending: true })
  ])

  const profile = profileRes.data
  const locations = locationsRes.data || []

  // 1. Determine cycle string based on timeframe
  let cycleYear = new Date().getFullYear();
  let cycleMonth = new Date().getMonth() + 1;
  if (exactMonth) {
    const [yy, mm] = exactMonth.split('-');
    cycleYear = parseInt(yy);
    cycleMonth = parseInt(mm);
  }
  const cycleSuffix = timeframe === 'MONTH_SECOND_HALF' ? 'C2' : 'C1';
  const selectedCycle = `${cycleYear}-${String(cycleMonth).padStart(2, '0')}-${cycleSuffix}`;

  // Fetch payout for this cycle
  const payoutRes = await supabase
    .from('payouts')
    .select('*')
    .eq('customer_id', id)
    .eq('cycle_identifier', selectedCycle)
    .limit(1)
    .single();
  const payout = payoutRes.data;

  // Fetch active loan ID
  const lpRes = await supabase
    .from('loan_payments')
    .select('loan_id, loans!inner(customer_id)')
    .eq('loans.customer_id', id)
    .eq('cycle_identifier', selectedCycle)
    .limit(1)
    .single();
    
  let targetLoanId = lpRes.data?.loan_id;
  if (!targetLoanId) {
    const activeLoanRes = await supabase
      .from('v_loan_current_state')
      .select('loan_id')
      .eq('customer_id', id)
      .eq('status', 'ACTIVE')
      .limit(1)
      .single();
    targetLoanId = activeLoanRes.data?.loan_id;
  }

  let loanInfo = null;
  let allLoanPayments: any[] = [];
  let currentCyclePayment = null;
  if (targetLoanId) {
    const loanRes = await supabase
      .from('v_loan_current_state')
      .select('*')
      .eq('loan_id', targetLoanId)
      .single();
    loanInfo = loanRes.data;
    
    const payRes = await supabase
      .from('loan_payments')
      .select('*')
      .eq('loan_id', targetLoanId)
      .order('created_at', { ascending: false });
    allLoanPayments = payRes.data || [];
    currentCyclePayment = allLoanPayments.find((p: any) => p.cycle_identifier === selectedCycle);
  }

  // Compute Scoped Summary Stats
  const totalVol = aggregates.total_bought ?? 0
  const totalPrice = aggregates.total_spent ?? 0
  const amVol = aggregates.am_bought ?? 0
  const amPrice = aggregates.am_spent ?? 0
  const pmVol = aggregates.pm_bought ?? 0
  const pmPrice = aggregates.pm_spent ?? 0
  const avgPrice = totalVol > 0 ? totalPrice / totalVol : 0

  const totalPages = Math.ceil((txData.count ?? 0) / limit)

  if (!profile) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 max-w-md">
          <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h1 className="text-xl font-black mb-2">Customer Not Found</h1>
          <p className="text-sm font-bold opacity-75 mb-6">The seller record you are looking for does not exist or has been removed.</p>
          <Link href="/customers" className="inline-flex items-center gap-2 bg-onyx text-white px-6 py-3 rounded-lg font-black shadow-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Directory
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-surface flex flex-col font-sans text-on-surface overflow-hidden antialiased">

      {/* Top NavBar */}
      <header className="bg-white border-b border-slate-200 flex justify-between items-center w-full px-4 shrink-0 h-12 z-20 relative shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-6 h-6 rounded bg-onyx text-white">
            <Droplets className="w-3.5 h-3.5" />
          </div>
          <div>
            <h1 className="text-sm font-black text-onyx leading-tight">CustomerPortal</h1>
            <p className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest leading-none">DairyFlow.Admin / Scoped</p>
          </div>
        </div>

        {/* Center Pill Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/30">
          <Link href="/" className="px-4 py-1 text-slate-500 hover:text-onyx transition-colors text-xs font-bold">Standard Dashboard</Link>
          <Link href="/admin" className="px-4 py-1 bg-white text-onyx rounded-lg text-xs font-bold shadow-sm">Admin Terminal</Link>
        </div>

        {/* Right Nav */}
        <div className="flex items-center gap-4">
          <Link href="/customers" className="text-slate-500 hover:text-onyx transition-colors flex items-center gap-1.5 text-xs font-medium">
            <ArrowLeft className="w-3.5 h-3.5" />
            Exit to Directory
          </Link>
          <div className="h-5 w-px bg-slate-200"></div>
          <button className="text-red-600 hover:bg-red-50 px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 text-xs font-medium border border-red-200/30">
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </header>

      {/* Main Layout: Left Panel + Right Content */}
      <main className="flex-1 flex overflow-hidden">

        {/* Left Panel: Profile & Identity */}
        <aside className="w-80 h-full overflow-y-auto no-scrollbar border-r border-slate-200 bg-white p-4 flex flex-col gap-4 shrink-0 relative z-10">

          {/* Customer Name Header */}
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-1.5 h-6 bg-teal-600 rounded-full"></div>
              <h2 className="text-2xl font-black text-onyx">{profile.name}</h2>
            </div>
            <p className="text-sm font-mono font-bold text-teal-600 uppercase tracking-wider ml-[18px]">{profile.location || 'Central Region'}</p>
          </div>

          {/* Account Identity Card */}
          <CustomerProfileForm
            id={id}
            initialSellerId={String(profile.seller_id)}
            initialName={profile.name}
            initialContact={profile.contact || ''}
            initialLocationId={profile.location_id || ''}
            locations={locations}
          />

          {/* Loan Information Panel */}
          {loanInfo && (
            <div className="flex flex-col gap-3 animate-in fade-in duration-300">
              <div className="flex items-center gap-2 mt-0">
                <Landmark className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-onyx leading-none">Loan Information</h3>
              </div>
              
              {/* Loan Overview Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</span>
                  {loanInfo.status === 'ACTIVE' ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">ACTIVE</span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">CLOSED</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cycle</span>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">{selectedCycle}</span>
                </div>
                <div className="h-px bg-slate-100 w-full my-0.5"></div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-600">Outstanding</span>
                  <span className="text-sm font-bold text-onyx">₹{Number(loanInfo.outstanding_principal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-600">Forecast Interest</span>
                  <span className="text-sm font-bold text-amber-600">₹{Number(loanInfo.forecasted_interest).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-700">Total Debt</span>
                  <span className="text-sm font-black text-red-600">
                    ₹{(Number(loanInfo.outstanding_principal) + Number(loanInfo.forecasted_interest)).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Cycle Repayment Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-col gap-1.5">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cycle Repayment</h4>
                {currentCyclePayment ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-600">Principal Paid</span>
                      <span className="text-sm font-bold text-emerald-600">₹{currentCyclePayment.principal_paid}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-600">Interest Paid</span>
                      <span className="text-sm font-bold text-emerald-600">₹{currentCyclePayment.interest_paid}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                      <span className="text-xs font-bold text-slate-700">Total Paid</span>
                      <span className="text-sm font-black text-onyx">₹{Number(currentCyclePayment.principal_paid) + Number(currentCyclePayment.interest_paid)}</span>
                    </div>
                    <div className="h-px bg-slate-100 w-full my-0.5"></div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Source</span>
                      <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                        {currentCyclePayment.source.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date</span>
                      <span className="text-[10px] font-semibold text-slate-600">
                        {new Date(currentCyclePayment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {payout && (
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cycle Earnings</span>
                        <span className="text-xs font-bold text-onyx">₹{payout.total_earnings || 0}</span>
                      </div>
                    )}
                    
                    {currentCyclePayment.source === 'CYCLE_EARNINGS_AND_CASH' && (
                      <div className="flex justify-between items-center text-amber-700 bg-amber-50 p-1.5 -mx-1.5 rounded-md mt-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider">Cash Paid Extra</span>
                        <span className="text-xs font-bold">
                          ₹{Math.max(0, (Number(currentCyclePayment.principal_paid) + Number(currentCyclePayment.interest_paid)) - Number(currentCyclePayment.available_cycle_earnings || payout?.total_earnings || 0)).toFixed(0)}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center text-xs text-slate-400 font-medium py-3 border border-dashed border-slate-200 rounded-lg bg-slate-50">
                    No payment recorded for this cycle yet.
                  </div>
                )}
              </div>
              
              {/* Repayment History (Scrollable) */}
              <div className="bg-white border border-slate-200 rounded-xl flex flex-col shadow-sm max-h-[160px] overflow-hidden">
                <div className="p-2 border-b border-slate-100 bg-slate-50 shrink-0 flex items-center justify-between">
                  <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" /> History
                  </h4>
                  <span className="text-[9px] font-bold bg-white border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded-full">{allLoanPayments.length}</span>
                </div>
                <div className="overflow-y-auto custom-scrollbar p-2 flex flex-col gap-2">
                  {allLoanPayments.length > 0 ? (
                    allLoanPayments.map((p: any) => (
                      <div key={p.id} className="bg-white p-2.5 rounded-xl border border-slate-100 text-xs shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                        <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-50">
                          <span className="font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{p.cycle_identifier}</span>
                          <span className="text-[10px] text-slate-400 font-medium">{new Date(p.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-500">Prin: <span className="font-bold text-emerald-600">₹{p.principal_paid}</span></span>
                          <span className="text-slate-500">Int: <span className="font-bold text-emerald-600">₹{p.interest_paid}</span></span>
                        </div>
                        <div className="mt-1.5 flex justify-between items-center text-[10px]">
                          <span className="text-slate-400">Src: {p.source.replace(/_/g, ' ')}</span>
                          <span className="text-slate-500 font-semibold">Left: ₹{p.principal_remaining !== undefined && p.principal_remaining !== null ? p.principal_remaining : '-'}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-xs text-slate-400 font-medium p-4">No history available</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Right Content Area: Transactions */}
        <section className="flex-1 bg-slate-50 flex flex-col relative overflow-hidden min-h-0">
          <div className="flex-1 px-6 py-3 flex flex-col gap-3 overflow-hidden min-h-0">

            {!hideTable && (
              <TransactionViewModeWrapper
                compact={true}
                topSection={
                  <Suspense key="top-section" fallback={
                    <div className="bg-white p-3 rounded-2xl border border-slate-200 w-full flex items-center justify-center animate-pulse min-h-[80px]">
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin mr-2" />
                      <span className="text-sm font-bold text-slate-400">Loading Filters...</span>
                    </div>
                  }>
                    <AdminFilters
                      currentYear={currentYear}
                      isCustomerScope={true}
                      exportButtons={
                        <ExportButtons
                          timeframe={timeframe}
                          exactDate={exactDate}
                          exactMonth={exactMonth}
                          startDate={startDate}
                          endDate={endDate}
                          shift={shift}
                          milkType={milkType}
                          minQty={minQty}
                          qtyOp={qtyOp}
                          search={search}
                          hiddenCols={hiddenCols}
                          customerId={id}
                          sortBy={sortBy}
                        />
                      }
                    />
                  </Suspense>
                }
                bottomSection={
                  <div key="bottom-section" className="grid grid-cols-1 md:grid-cols-4 gap-2 shrink-0 w-full">
                    <div className="bg-white/80 backdrop-blur-2xl border border-white/40 rounded-lg px-3 py-1.5 flex items-center justify-between shadow-sm relative overflow-hidden group">
                      <div className="text-xs font-semibold text-slate-500 z-10">Total Milk Bought</div>
                      <div className="flex items-baseline gap-0.5 z-10">
                        <span className="text-lg font-bold text-onyx tracking-tight">{totalVol.toFixed(1)}</span>
                        <span className="text-xs font-bold text-slate-500">L</span>
                      </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-2xl border border-white/40 rounded-lg px-3 py-1.5 flex items-center justify-between shadow-sm relative overflow-hidden group">
                      <div className="text-xs font-semibold text-slate-500 z-10">Capital Deployed</div>
                      <div className="flex items-baseline gap-0.5 z-10">
                        <span className="text-lg font-bold text-emerald-600 tracking-tight">₹{totalPrice.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-2xl border border-white/40 rounded-lg px-3 py-1.5 flex items-center justify-between shadow-sm relative overflow-hidden group">
                      <div className="flex items-center gap-1 text-xs font-semibold text-amber-500 z-10 uppercase tracking-wide">
                        <Sun className="w-3.5 h-3.5" />
                        AM
                      </div>
                      <div className="flex items-baseline gap-2 z-10">
                        <div className="flex items-baseline gap-0.5">
                          <span className="text-lg font-bold text-onyx tracking-tight">{amVol.toFixed(1)}</span>
                          <span className="text-xs font-bold text-slate-500">L</span>
                        </div>
                        <span className="text-slate-300 text-xs">|</span>
                        <div className="text-xs font-bold text-emerald-600">
                          ₹{amPrice.toFixed(0)}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-2xl border border-white/40 rounded-lg px-3 py-1.5 flex items-center justify-between shadow-sm relative overflow-hidden group">
                      <div className="flex items-center gap-1 text-xs font-semibold text-indigo-500 z-10 uppercase tracking-wide">
                        <Moon className="w-3.5 h-3.5" />
                        PM
                      </div>
                      <div className="flex items-baseline gap-2 z-10">
                        <div className="flex items-baseline gap-0.5">
                          <span className="text-lg font-bold text-onyx tracking-tight">{pmVol.toFixed(1)}</span>
                          <span className="text-xs font-bold text-slate-500">L</span>
                        </div>
                        <span className="text-slate-300 text-xs">|</span>
                        <div className="text-xs font-bold text-emerald-600">
                          ₹{pmPrice.toFixed(0)}
                        </div>
                      </div>
                    </div>
                  </div>
                }
                headerLeft={
                  <div key="header-left" className="flex items-center gap-2">
                    <div className="p-1.5 bg-sky-100 text-sky-700 rounded-md">
                      <Database className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-onyx leading-tight">Transaction Archive</h2>
                      <p className="text-[11px] font-medium text-slate-500">{txData.count} entries found for {profile.name}</p>
                    </div>
                  </div>
                }
              >
                <div className="contents" key="wrapper-content">
                  <MultiSelectProvider allIds={txData.data?.map((tx: any) => tx.id) || []}>
                    <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden">
                      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                          <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                            <tr>
                              <th className="px-4 py-2 text-center"><MultiSelectHeader /></th>
                              {!hiddenCols.includes('col_sno') && <th className="px-4 py-2 border-b border-slate-200 text-center">S.No</th>}
                              {!hiddenCols.includes('col_tx_id') && <th className="px-4 py-2 border-b border-slate-200">Tx ID</th>}
                              {!hiddenCols.includes('col_date') && <th className="px-4 py-2 border-b border-slate-200">Date & Shift</th>}
                              {!hiddenCols.includes('col_seller') && <th className="px-4 py-2 border-b border-slate-200">Seller Entity</th>}
                              {!hiddenCols.includes('col_type') && <th className="px-4 py-2 border-b border-slate-200">Commodity</th>}
                              {!hiddenCols.includes('col_volume') && <th className="px-4 py-2 border-b border-slate-200 text-right">Volume</th>}
                              {!hiddenCols.includes('col_rate') && <th className="px-4 py-2 border-b border-slate-200 text-right">Rate</th>}
                              {!hiddenCols.includes('col_capital') && <th className="px-4 py-2 border-b border-slate-200 text-right">Capital Out</th>}
                              {!hiddenCols.includes('col_audit') && <th className="px-4 py-2 border-b border-slate-200 text-left">Audit Footprint</th>}
                              <th className="px-4 py-2 border-b border-slate-200 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200/50 bg-white/40">
                            {txData.data.length === 0 ? (
                              <tr>
                                <td colSpan={10} className="px-6 py-12 text-center text-slate-500 font-medium">
                                  No transaction metrics found for this scope.
                                </td>
                              </tr>
                            ) : txData.data.map((tx, idx) => (
                              <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors group">
                                <td className="px-4 py-2.5 text-center align-middle">
                                  <MultiSelectCheckbox id={tx.id} />
                                </td>
                                {!hiddenCols.includes('col_sno') && (
                                  <td className="px-4 py-2.5 text-center text-slate-400 font-mono text-xs">
                                    {offset + idx + 1}
                                  </td>
                                )}
                                {!hiddenCols.includes('col_tx_id') && (
                                  <td className="px-6 py-2.5">
                                    <span className="font-mono text-slate-400 text-xs">{tx.id.split('-')[0]}</span>
                                  </td>
                                )}
                                {!hiddenCols.includes('col_date') && (
                                  <td className="px-6 py-2.5">
                                    <div className="font-bold text-slate-800">
                                      {(() => {
                                        const [yy, mm, dd] = tx.transaction_date.split('-')
                                        const mNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
                                        return `${parseInt(dd)} ${mNames[parseInt(mm) - 1]}`
                                      })()}
                                    </div>
                                    <div className="text-xs text-slate-500 font-semibold mt-0.5">
                                      {tx.shift === 'AM' ? <span className="text-amber-500">AM</span> : <span className="text-indigo-500">PM</span>}
                                    </div>
                                  </td>
                                )}
                                {!hiddenCols.includes('col_seller') && (
                                  <td className="px-6 py-2.5 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                      <div className="w-auto px-2 h-8 rounded bg-slate-100 border border-slate-200/50 flex items-center justify-center text-[10px] font-mono font-bold tracking-widest text-slate-500">
                                        [{tx.customers?.location ? tx.customers.location.substring(0, 3).toUpperCase() : 'UNK'}] #{tx.customers?.seller_id}
                                      </div>
                                      <span className="font-bold text-slate-700">
                                        {tx.customers?.name || `Seller ${String(tx.customers?.seller_id || '')}`}
                                      </span>
                                    </div>
                                  </td>
                                )}
                                {!hiddenCols.includes('col_type') && (
                                  <td className="px-6 py-2.5">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${tx.milk_type === 'Cow' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                                      {tx.milk_type === 'Cow' ? '🐄 Cow' : '🐃 Buffalo'}
                                    </span>
                                  </td>
                                )}
                                {!hiddenCols.includes('col_volume') && (
                                  <td className="px-6 py-2.5 text-right">
                                    <div className="font-black text-slate-800">{Number(tx.quantity_litres).toFixed(1)}L</div>
                                    <div className="text-[10px] font-bold text-slate-400 mt-0.5">{Number(tx.fat_percentage).toFixed(1)}% FAT</div>
                                  </td>
                                )}
                                {!hiddenCols.includes('col_rate') && (
                                  <td className="px-6 py-2.5 text-right align-top">
                                    <div className="font-bold text-slate-700">₹{Number(tx.price_per_litre).toFixed(2)}</div>
                                    <div className="text-[10px] font-bold text-slate-400 mt-0.5">/ Ltr</div>
                                  </td>
                                )}
                                {!hiddenCols.includes('col_capital') && (
                                  <td className="px-6 py-2.5 text-right align-top">
                                    <div className="font-black text-emerald-600">₹{Number(tx.net_payable ?? tx.total_price).toFixed(2)}</div>
                                  </td>
                                )}
                                {!hiddenCols.includes('col_audit') && (
                                  <td className="px-6 py-2.5">
                                    <div className="text-[11px] text-slate-500 leading-tight font-medium">
                                      C: {tx.created_by_name || 'Admin'} ({new Date(tx.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })})
                                      {tx.updated_at && (
                                        <><br /><span className="text-sky-600">U: {tx.updated_by_name || 'Admin'} ({new Date(tx.updated_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })})</span></>
                                      )}
                                    </div>
                                  </td>
                                )}
                                <td className="px-4 py-2.5 text-right">
                                  <TransactionActionCell tx={tx} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Table Pagination Bounds */}
                      {totalPages > 1 && (
                        <div className="sticky bottom-0 z-10 bg-white/95 backdrop-blur-sm border-t border-slate-200 p-4 shrink-0 flex items-center justify-between min-w-[800px] w-full">
                          <span className="text-xs font-semibold text-slate-500">
                            Showing {offset + 1}-{Math.min(offset + limit, txData.count || 0)} of {txData.count}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/customers/${id}?${new URLSearchParams({ ...Object.fromEntries(Array.from(new URLSearchParams(Object.entries(searchParams || {})))), page: String(Math.max(1, page - 1)) }).toString()}`}
                              scroll={false}
                              className={`p-1.5 rounded-md border ${page === 1 ? 'border-slate-200 text-slate-300 pointer-events-none' : 'border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors'}`}
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </Link>
                            <div className="text-xs font-medium text-slate-600 px-2">
                              {page} <span className="text-slate-300 mx-0.5">/</span> {totalPages}
                            </div>
                            <Link
                              href={`/customers/${id}?${new URLSearchParams({ ...Object.fromEntries(Array.from(new URLSearchParams(Object.entries(searchParams || {})))), page: String(Math.min(totalPages, page + 1)) }).toString()}`}
                              scroll={false}
                              className={`p-1.5 rounded-md border ${page === totalPages || totalPages === 0 ? 'border-slate-200 text-slate-300 pointer-events-none' : 'border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors'}`}
                            >
                              <ChevronRight className="w-4 h-4" />
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  </MultiSelectProvider>
                </div>
              </TransactionViewModeWrapper>
            )}

          </div>
        </section>
      </main>

    </div>
  )
}
