/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps, prefer-const, react/no-unescaped-entities, react-hooks/set-state-in-effect */
import React, { Suspense } from 'react'
import { ArrowLeft, Droplets, LogOut, Sun, Moon, Database, ChevronLeft, ChevronRight, User, TrendingUp, Activity, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { fetchAdminTransactions, fetchAdminAggregates } from '@/app/admin/actions'
import AdminFilters from '@/app/admin/AdminFilters'
import ExportButtons from '@/app/admin/ExportButtons'
import { MultiSelectProvider, MultiSelectHeader, MultiSelectCheckbox } from '@/components/MultiSelect'
import TransactionActionCell from '@/components/TransactionActionCell'
import CustomerProfileForm from './CustomerProfileForm'
import CustomerLoanSection from './CustomerLoanSection'
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
    page?: string 
  }> 
}) {
  const params = await props.params
  const searchParams = await props.searchParams
  const id = params.id

  const timeframe = searchParams?.timeframe || 'TODAY'
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
  const page = parseInt(searchParams?.page || '1', 10)
  const limit = 20
  const offset = (page - 1) * limit
  const currentYear = new Date().getFullYear()

  const supabase = await createClient()

  // Fire parallel queries to Supabase
  const [profileRes, aggregates, txData] = await Promise.all([
    supabase.from('customers').select('*').eq('id', id).single(),
    fetchAdminAggregates({ timeframe, shift, milkType, minQty, qtyOp, search, exactDate, exactMonth, startDate, endDate, customerId: id }),
    fetchAdminTransactions({ timeframe, shift, milkType, minQty, qtyOp, search, exactDate, exactMonth, startDate, endDate, customerId: id, limit, offset })
  ])

  const profile = profileRes.data

  // Compute Scoped Summary Stats
  const totalVol = aggregates.total_bought ?? 0
  const totalPrice = aggregates.total_spent ?? 0
  const morningVol = aggregates.morning_bought ?? 0
  const morningPrice = aggregates.morning_spent ?? 0
  const eveningVol = aggregates.evening_bought ?? 0
  const eveningPrice = aggregates.evening_spent ?? 0
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
      <header className="bg-white border-b border-slate-200 flex justify-between items-center w-full px-8 py-2 shrink-0 h-16 z-20 relative shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-onyx text-white">
            <Droplets className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-black text-onyx leading-tight">CustomerPortal</h1>
            <p className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-widest">DairyFlow.Admin / Scoped</p>
          </div>
        </div>

        {/* Center Pill Tabs */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/30">
          <Link href="/" className="px-6 py-2 text-slate-500 hover:text-onyx transition-colors text-sm font-bold">Standard Dashboard</Link>
          <Link href="/admin" className="px-6 py-2 bg-white text-onyx rounded-xl text-sm font-bold shadow-sm">Admin Terminal</Link>
        </div>

        {/* Right Nav */}
        <div className="flex items-center gap-6">
          <Link href="/customers" className="text-slate-500 hover:text-onyx transition-colors flex items-center gap-2 text-sm font-medium">
            <ArrowLeft className="w-4 h-4" />
            Exit to Directory
          </Link>
          <div className="h-6 w-px bg-slate-200"></div>
          <button className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-md transition-colors flex items-center gap-2 text-sm font-medium border border-red-200/50">
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      {/* Main Layout: Left Panel + Right Content */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Left Panel: Profile & Identity */}
        <aside className="w-80 h-full overflow-y-auto no-scrollbar border-r border-slate-200 bg-white p-6 flex flex-col gap-6 shrink-0 relative z-10">
          
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
            initialLocation={profile.location || ''}
          />

          {/* Advance / Loans */}
          <CustomerLoanSection customerId={id} />

        </aside>

        {/* Right Content Area: Transactions */}
        <section className="flex-1 bg-slate-50 flex flex-col relative overflow-hidden min-h-0">
          <div className="flex-1 p-6 flex flex-col gap-6 overflow-hidden min-h-0">
          
            {!hideTable && (
              <TransactionViewModeWrapper
                topSection={
                  <Suspense key="top-section" fallback={
                    <div className="bg-white p-4 rounded-3xl border border-slate-200 w-full flex items-center justify-center animate-pulse min-h-[100px]">
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
                        />
                      }
                    />
                  </Suspense>
                }
                bottomSection={
                  <div key="bottom-section" className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0 w-full">
                    <div className="bg-white/80 backdrop-blur-2xl border border-white/40 rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden group">
                      <div className="text-sm font-semibold text-slate-500 z-10">Total Milk Bought</div>
                      <div className="flex items-baseline gap-1 mt-2 z-10">
                        <span className="text-3xl font-bold text-onyx tracking-tight">{totalVol.toFixed(1)}</span>
                        <span className="text-lg font-bold text-slate-500">L</span>
                      </div>
                      <div className="absolute -right-4 -bottom-4 opacity-[0.03] z-0 transition-transform group-hover:scale-110">
                        <Database className="w-32 h-32" />
                      </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-2xl border border-white/40 rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden group">
                      <div className="text-sm font-semibold text-slate-500 z-10">Capital Deployed</div>
                      <div className="flex items-baseline gap-1 mt-2 z-10">
                        <span className="text-3xl font-bold text-emerald-600 tracking-tight">₹{totalPrice.toFixed(2)}</span>
                      </div>
                      <div className="absolute -right-4 -bottom-4 opacity-[0.03] z-0 transition-transform group-hover:scale-110">
                        <Database className="w-32 h-32" />
                      </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-2xl border border-white/40 rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden group">
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-amber-500 z-10 uppercase tracking-wide">
                        <Sun className="w-4 h-4" />
                        Morning
                      </div>
                      <div className="flex items-end justify-between mt-2 z-10">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold text-onyx tracking-tight">{morningVol.toFixed(1)}</span>
                          <span className="text-lg font-bold text-slate-500">L</span>
                        </div>
                        <div className="text-sm font-bold text-emerald-600 mb-1">
                          ₹{morningPrice.toFixed(0)}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-2xl border border-white/40 rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden group">
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-indigo-500 z-10 uppercase tracking-wide">
                        <Moon className="w-4 h-4" />
                        Evening
                      </div>
                      <div className="flex items-end justify-between mt-2 z-10">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold text-onyx tracking-tight">{eveningVol.toFixed(1)}</span>
                          <span className="text-lg font-bold text-slate-500">L</span>
                        </div>
                        <div className="text-sm font-bold text-emerald-600 mb-1">
                          ₹{eveningPrice.toFixed(0)}
                        </div>
                      </div>
                    </div>
                  </div>
                }
                headerLeft={
                  <div key="header-left" className="flex items-center gap-3">
                    <div className="p-2 bg-sky-100 text-sky-700 rounded-lg">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-onyx leading-tight">Transaction Archive</h2>
                      <p className="text-sm font-medium text-slate-500">{txData.count} entries found for {profile.name}</p>
                    </div>
                  </div>
                }
              >
                <div className="contents" key="wrapper-content">
                <MultiSelectProvider allIds={txData.data?.map((tx: any) => tx.id) || []}>
                <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden">
                  <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-200 text-slate-500 font-semibold uppercase text-xs tracking-wider">
                      <tr>
                        <th className="px-4 py-4 w-10 text-center"><MultiSelectHeader /></th>
                        {!hiddenCols.includes('col_sno') && <th className="px-4 py-4 border-b border-slate-200 text-center">S.No</th>}
                        {!hiddenCols.includes('col_tx_id') && <th className="px-6 py-4 border-b border-slate-200">Tx ID</th>}
                        {!hiddenCols.includes('col_date') && <th className="px-6 py-4 border-b border-slate-200">Date & Temp</th>}
                        {!hiddenCols.includes('col_seller') && <th className="px-6 py-4 border-b border-slate-200">Seller Entity</th>}
                        {!hiddenCols.includes('col_type') && <th className="px-6 py-4 border-b border-slate-200">Commodity</th>}
                        {!hiddenCols.includes('col_volume') && <th className="px-6 py-4 border-b border-slate-200 text-right">Volume</th>}
                        {!hiddenCols.includes('col_capital') && <th className="px-6 py-4 border-b border-slate-200 text-right">Capital Out</th>}
                        {!hiddenCols.includes('col_audit') && <th className="px-6 py-4 border-b border-slate-200 text-left">Audit Footprint</th>}
                        <th className="px-4 py-4 border-b border-slate-200 text-right">Actions</th>
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
                          <td className="px-4 py-4 text-center align-middle">
                            <MultiSelectCheckbox id={tx.id} />
                          </td>
                          {!hiddenCols.includes('col_sno') && (
                            <td className="px-4 py-4 text-center text-slate-400 font-mono text-xs">
                              {offset + idx + 1}
                            </td>
                          )}
                          {!hiddenCols.includes('col_tx_id') && (
                            <td className="px-6 py-4">
                              <span className="font-mono text-slate-400 text-xs">{tx.id.split('-')[0]}</span>
                            </td>
                          )}
                          {!hiddenCols.includes('col_date') && (
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-800">
                                {(() => {
                                  const [yy, mm, dd] = tx.transaction_date.split('-')
                                  const mNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
                                  return `${parseInt(dd)} ${mNames[parseInt(mm) - 1]}`
                                })()}
                              </div>
                              <div className="text-xs text-slate-500 font-semibold mt-0.5">
                                {tx.shift === 'Morning' ? <span className="text-amber-500">Morn</span> : <span className="text-indigo-500">Even</span>}
                              </div>
                            </td>
                          )}
                          {!hiddenCols.includes('col_seller') && (
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">
                                  #{String(tx.customers?.seller_id || 0).padStart(3, '0')}
                                </span>
                                <span className="font-bold text-slate-700">{tx.customers?.name || `${String(tx.customers?.seller_id).padStart(3, '0')} Seller`}</span>
                              </div>
                            </td>
                          )}
                          {!hiddenCols.includes('col_type') && (
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${tx.milk_type === 'Cow' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                                {tx.milk_type === 'Cow' ? '🐄 Cow' : '🐃 Buffalo'}
                              </span>
                            </td>
                          )}
                          {!hiddenCols.includes('col_volume') && (
                            <td className="px-6 py-4 text-right">
                              <div className="font-black text-slate-800">{Number(tx.quantity_litres).toFixed(1)}L</div>
                              <div className="text-[10px] font-bold text-slate-400 mt-0.5">{Number(tx.fat_percentage).toFixed(1)}% FAT</div>
                            </td>
                          )}
                          {!hiddenCols.includes('col_capital') && (
                            <td className="px-6 py-4 text-right align-top">
                              <div className="font-black text-emerald-600">₹{Number(tx.net_payable ?? tx.total_price).toFixed(2)}</div>
                              <div className="text-[10px] font-bold text-slate-400 mt-0.5">@ ₹{Number(tx.price_per_litre)}/L</div>
                              
                              {tx.status && tx.status !== 'NORMAL' && (
                                <div className="mt-2 flex flex-col items-end gap-1">
                                  <div className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full inline-block
                                    ${tx.status === 'LOAN_CLEARED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/50' : 'bg-amber-50 text-amber-600 border border-amber-200/50'}`}>
                                    {tx.status === 'LOAN_CLEARED' ? 'Loan Cleared' : 'Loan Adjusted'}
                                  </div>
                                  <div className="text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-200 px-2 py-1 rounded shadow-sm flex flex-col items-end leading-tight mt-1">
                                    <span>Gross: ₹{Number(tx.total_price).toFixed(2)}</span>
                                    <span className="text-rose-500 font-bold">Deduct: -₹{Number(tx.loan_deduction).toFixed(2)}</span>
                                    {tx.loan_balance_after !== undefined && tx.loan_balance_after !== null && (
                                      <span className="text-amber-600 font-bold border-t border-slate-200 pt-0.5 mt-0.5 w-full text-right">
                                        Rem Bal: ₹{Number(tx.loan_balance_after).toFixed(2)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </td>
                          )}
                          {!hiddenCols.includes('col_audit') && (
                            <td className="px-6 py-4">
                              <div className="text-[11px] text-slate-500 leading-tight font-medium">
                                C: {tx.created_by_name || 'Admin'} ({new Date(tx.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })})
                                {tx.updated_at && (
                                  <><br/><span className="text-sky-600">U: {tx.updated_by_name || 'Admin'} ({new Date(tx.updated_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })})</span></>
                                )}
                              </div>
                            </td>
                          )}
                          <td className="px-4 py-4 text-right">
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
                        href={`/customers/${id}?${new URLSearchParams({...Object.fromEntries(Array.from(new URLSearchParams(Object.entries(searchParams || {})))), page: String(Math.max(1, page - 1))}).toString()}`}
                        scroll={false}
                        className={`p-1.5 rounded-md border ${page === 1 ? 'border-slate-200 text-slate-300 pointer-events-none' : 'border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors'}`}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Link>
                      <div className="text-xs font-medium text-slate-600 px-2">
                        {page} <span className="text-slate-300 mx-0.5">/</span> {totalPages}
                      </div>
                      <Link 
                        href={`/customers/${id}?${new URLSearchParams({...Object.fromEntries(Array.from(new URLSearchParams(Object.entries(searchParams || {})))), page: String(Math.min(totalPages, page + 1))}).toString()}`}
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
