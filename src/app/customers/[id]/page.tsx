import React, { Suspense } from 'react'
import { ArrowLeft, Droplets, LogOut, Sun, Moon, Database, ChevronLeft, ChevronRight, User, TrendingUp, Activity, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { fetchAdminTransactions, fetchAdminAggregates } from '@/app/admin/actions'
import AdminFilters from '@/app/admin/AdminFilters'
import ExportButtons from '@/app/admin/ExportButtons'
import TransactionActionCell from '@/components/TransactionActionCell'
import CustomerProfileForm from './CustomerProfileForm'

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
  const limit = 10
  const offset = (page - 1) * limit
  const currentYear = new Date().getFullYear()

  const supabase = await createClient()

  // 1. Fetch Profile
  const { data: profile } = await supabase.from('customers').select('*').eq('id', id).single()

  // 2. Fetch Analytics (Scoped to this customer)
  const [aggregates, txData] = await Promise.all([
    fetchAdminAggregates({ timeframe, shift, milkType, minQty, qtyOp, search, exactDate, exactMonth, startDate, endDate, customerId: id }),
    fetchAdminTransactions({ timeframe, shift, milkType, minQty, qtyOp, search, exactDate, exactMonth, startDate, endDate, customerId: id, limit, offset })
  ])

  // Compute Scoped Summary Stats
  const totalVol = aggregates.total_bought
  const totalPrice = aggregates.total_spent
  const morningVol = aggregates.morning_bought
  const eveningVol = aggregates.evening_bought
  const avgPrice = totalVol > 0 ? totalPrice / totalVol : 0

  const totalPages = Math.ceil((txData.count ?? 0) / limit)

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-red-50 text-red-600 p-6 rounded-3xl border border-red-100 max-w-md">
          <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h1 className="text-xl font-black mb-2">Customer Not Found</h1>
          <p className="text-sm font-bold opacity-75 mb-6">The seller record you are looking for does not exist or has been removed.</p>
          <Link href="/customers" className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-xl font-black shadow-lg shadow-red-200">
            <ArrowLeft className="w-4 h-4" /> Back to Directory
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-blue-100">

      {/* Header Overlay */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-6 lg:px-12 py-5 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-200 ring-4 ring-blue-50">
            <Droplets className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tight leading-none text-slate-900">
              Customer<span className="text-blue-600 font-black">Portal</span>
            </h1>
            <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase mt-1">DairyFlow.Admin / Scoped</span>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <Link href="/customers" className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold transition-all text-sm group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
            <span className="hidden sm:inline italic text-xs">Exit to Directory</span>
          </Link>
          <div className="w-px h-6 bg-slate-200 hidden md:block"></div>
          <button className="flex items-center gap-2 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl transition-all font-black text-sm ring-4 ring-red-50/50">
            <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col xl:flex-row w-full max-w-[1700px] mx-auto p-6 lg:p-10 gap-8 items-start">

        {/* LEFT COLUMN: IDENTITY & KPIS */}
        <div className="w-full xl:w-[400px] flex flex-col gap-6 sticky xl:top-28">
          
          <div className="flex items-center gap-3 mb-2 px-1">
            <div className="w-1.5 h-10 bg-blue-600 rounded-full shadow-sm"></div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">{profile.name}</h2>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">{profile.location || 'Central Region'}</p>
            </div>
          </div>

          <CustomerProfileForm 
            id={id}
            initialSellerId={String(profile.seller_id)}
            initialName={profile.name}
            initialContact={profile.contact || ''}
            initialLocation={profile.location || ''}
          />

          {/* SCOPED ANALYTICS TILES */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group/tile">
              <div className="absolute -right-4 -top-4 w-20 h-20 bg-blue-50 rounded-full blur-2xl opacity-60 group-hover/tile:scale-110 transition-transform"></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 relative z-10">Total Volume</p>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight relative z-10">{totalVol.toFixed(1)} <span className="text-sm text-slate-400">L</span></h2>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group/tile">
              <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-50 rounded-full blur-2xl opacity-60 group-hover/tile:scale-110 transition-transform"></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 relative z-10">Capital flow</p>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight relative z-10"><span className="text-emerald-500 mr-0.5">₹</span>{totalPrice.toLocaleString()}</h2>
            </div>
            
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-center relative overflow-hidden group/m">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                  <Sun className="w-3.5 h-3.5" /> Morning
                </div>
              </div>
              <div className="flex items-end justify-between relative z-10">
                <p className="text-base font-black text-slate-800">{morningVol.toFixed(1)}<span className="text-[10px] text-slate-400 ml-0.5">L</span></p>
                <div className="w-1 h-1 rounded-full bg-amber-200 group-hover/m:scale-150 transition-transform"></div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-center relative overflow-hidden group/e">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  <Moon className="w-3.5 h-3.5" /> Evening
                </div>
              </div>
              <div className="flex items-end justify-between relative z-10">
                <p className="text-base font-black text-slate-800">{eveningVol.toFixed(1)}<span className="text-[10px] text-slate-400 ml-0.5">L</span></p>
                <div className="w-1 h-1 rounded-full bg-indigo-200 group-hover/e:scale-150 transition-transform"></div>
              </div>
            </div>
          </div>

          <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-xl shadow-blue-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-1000"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100/60 mb-1">Average Rate Scoped</p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black tabular-nums tracking-tighter">₹{avgPrice.toFixed(2)}</span>
              <span className="text-xs font-bold text-blue-200">/per kg</span>
            </div>
            <Activity className="absolute bottom-4 right-4 w-12 h-12 text-blue-400/20 group-hover:rotate-12 transition-transform" />
          </div>
        </div>

        {/* RIGHT COLUMN: ANALYTICS WORKSPACE */}
        <div className="flex-1 flex flex-col gap-6 w-full min-w-0">
          
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between bg-white/50 p-2 rounded-3xl border border-dashed border-slate-200">
            <div className="flex-1 w-full lg:w-auto">
              <Suspense fallback={
                <div className="bg-white p-6 rounded-3xl border border-slate-200 animate-pulse flex items-center justify-center min-h-[100px]">
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin mr-2" />
                  <span className="text-xs font-black text-slate-400 tracking-widest uppercase">Initializing Analysis Engine...</span>
                </div>
              }>
                <AdminFilters currentYear={currentYear} isCustomerScope={true} />
              </Suspense>
            </div>
            
            <div className="flex items-center gap-2 shrink-0 pr-2">
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
            </div>
          </div>

          <div className="flex items-center justify-between px-2">
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                Transaction Archive
                <span className="bg-blue-600 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg shadow-blue-200 ring-2 ring-blue-50">
                  {txData.count} Records
                </span>
              </h2>
            </div>
          </div>

          {!hideTable && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group/table">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Scoped Records</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter italic">Historical logs for {profile.name}</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr className="divide-x divide-slate-100">
                      {!hiddenCols.includes('col_sno') && <th className="px-5 py-4 text-center w-16">S.No</th>}
                      {!hiddenCols.includes('col_tx_id') && <th className="px-6 py-4">Tx ID</th>}
                      {!hiddenCols.includes('col_date') && <th className="px-6 py-4">Date & Temp</th>}
                      {!hiddenCols.includes('col_type') && <th className="px-6 py-4">Commodity</th>}
                      {!hiddenCols.includes('col_volume') && <th className="px-6 py-4 text-right">Volume</th>}
                      {!hiddenCols.includes('col_capital') && <th className="px-6 py-4 text-right">Capital Out</th>}
                      {!hiddenCols.includes('col_audit') && <th className="px-6 py-4 text-left">Audit Footprint</th>}
                      <th className="px-4 py-4 text-right w-20">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {txData.data.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-8 py-24 text-center text-slate-400 font-medium bg-slate-50/30">
                          No transaction metrics found for this scope.
                        </td>
                      </tr>
                    ) : txData.data.map((tx, idx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                        {!hiddenCols.includes('col_sno') && (
                          <td className="px-5 py-5 text-center text-slate-300 font-mono text-xs tabular-nums">
                            {offset + idx + 1}
                          </td>
                        )}
                        {!hiddenCols.includes('col_tx_id') && (
                          <td className="px-6 py-5">
                            <span className="font-mono text-slate-400 text-xs tracking-tight">#{tx.id.split('-')[0]}</span>
                          </td>
                        )}
                        {!hiddenCols.includes('col_date') && (
                          <td className="px-6 py-5">
                            <div className="font-bold text-slate-800">
                              {(() => {
                                const [yy, mm, dd] = tx.transaction_date.split('-')
                                const mNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
                                return `${parseInt(dd)} ${mNames[parseInt(mm) - 1]}`
                              })()}
                            </div>
                            <div className="text-[10px] font-black mt-0.5 uppercase tracking-tighter">
                              {tx.shift === 'Morning' ? <span className="text-amber-500">Morn-Shift</span> : <span className="text-indigo-500">Even-Shift</span>}
                            </div>
                          </td>
                        )}
                        {!hiddenCols.includes('col_type') && (
                          <td className="px-6 py-5">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                              tx.milk_type === 'Cow' 
                                ? 'bg-amber-50 text-amber-700 border-amber-100' 
                                : 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}>
                              {tx.milk_type === 'Cow' ? '🐄 Cow' : '🐃 Buffalo'}
                            </span>
                          </td>
                        )}
                        {!hiddenCols.includes('col_volume') && (
                          <td className="px-6 py-5 text-right">
                            <div className="font-black text-slate-800 tabular-nums text-base">{Number(tx.quantity_litres).toFixed(1)}L</div>
                            <div className="text-[10px] font-black text-slate-400 mt-0.5 tracking-tighter uppercase">{Number(tx.fat_percentage).toFixed(1)}% FAT CONTENT</div>
                          </td>
                        )}
                        {!hiddenCols.includes('col_capital') && (
                          <td className="px-6 py-5 text-right">
                            <div className="font-black text-emerald-600 tabular-nums text-base">₹{Number(tx.total_price).toFixed(2)}</div>
                            <div className="text-[10px] font-black text-slate-400 mt-0.5 tracking-tighter uppercase leading-none">@ RS.{Number(tx.price_per_litre)}/KG</div>
                          </td>
                        )}
                        {!hiddenCols.includes('col_audit') && (
                          <td className="px-6 py-5">
                            <div className="space-y-1">
                              <div className="text-[10px] text-slate-500 font-black tracking-tighter flex items-center gap-1 uppercase">
                                <span className="bg-slate-100 px-1 rounded text-[8px] border border-slate-200">C</span>
                                {tx.created_by_name || 'Admin'} <span className="text-slate-300 font-normal">({new Date(tx.created_at).toLocaleDateString()})</span>
                              </div>
                              {tx.updated_at && (
                                <div className="text-[10px] text-blue-500 font-black tracking-tighter flex items-center gap-1 uppercase">
                                  <span className="bg-blue-50 px-1 rounded text-[8px] border border-blue-100">U</span>
                                  {tx.updated_by_name || 'Admin'} <span className="text-blue-300 font-normal">({new Date(tx.updated_at).toLocaleDateString()})</span>
                                </div>
                              )}
                            </div>
                          </td>
                        )}
                        <td className="px-4 py-5 text-right">
                          <TransactionActionCell tx={tx} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table Pagination */}
              <div className="bg-white border-t border-slate-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Analysis Archive: {offset + 1}—{Math.min(offset + limit, txData.count || 0)} <span className="text-slate-200 mx-2">|</span> Total {txData.count} entries
                </span>
                
                <div className="flex items-center gap-2">
                  <Link 
                    href={`/customers/${id}?${new URLSearchParams({...Object.fromEntries(Array.from(new URLSearchParams(Object.entries(searchParams || {})))), page: String(Math.max(1, page - 1))}).toString()}`}
                    className={`p-2.5 rounded-xl border transition-all ${page === 1 ? 'pointer-events-none opacity-20 bg-slate-50 border-slate-200' : 'bg-white border-slate-200 hover:border-blue-500 hover:text-blue-600 active:scale-95 shadow-sm'}`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Link>
                  <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm shadow-slate-100">
                    <span className="bg-blue-600 text-white w-6 h-6 flex items-center justify-center rounded-lg text-xs font-black">{page}</span>
                    <span className="text-slate-300 font-black">/</span>
                    <span className="text-xs font-black text-slate-500">{totalPages || 1}</span>
                  </div>
                  <Link 
                    href={`/customers/${id}?${new URLSearchParams({...Object.fromEntries(Array.from(new URLSearchParams(Object.entries(searchParams || {})))), page: String(Math.min(totalPages, page + 1))}).toString()}`}
                    className={`p-2.5 rounded-xl border transition-all ${page >= totalPages || totalPages === 0 ? 'pointer-events-none opacity-20 bg-slate-50 border-slate-200' : 'bg-white border-slate-200 hover:border-blue-500 hover:text-blue-600 active:scale-95 shadow-sm'}`}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          )}

        </div>

      </main>

    </div>
  )
}
