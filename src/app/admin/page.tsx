/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps, prefer-const, react/no-unescaped-entities, react-hooks/set-state-in-effect */
import { fetchAdminTransactions, fetchAdminAggregates } from './actions'
import AdminFilters from './AdminFilters'
import ExportButtons from './ExportButtons'
import TransactionActionCell from '@/components/TransactionActionCell'
import PricingManager from './PricingManager'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Download, ShieldCheck, Users, Sun, Moon, Database, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { Suspense } from 'react'
import { MultiSelectProvider, MultiSelectHeader, MultiSelectCheckbox } from '@/components/MultiSelect'
import { TransactionViewModeWrapper } from '@/components/TransactionViewModeWrapper'

export default async function AdminDashboardPage(props: { searchParams: Promise<{ timeframe?: string, shift?: string, milkType?: string, minQty?: string, qtyOp?: string, search?: string, exactDate?: string, exactMonth?: string, startDate?: string, endDate?: string, hideTable?: string, hiddenCols?: string, page?: string }> }) {
  const searchParams = await props.searchParams
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
  const hiddenCols = searchParams?.hiddenCols?.split(',') || []
  
  const page = parseInt(searchParams?.page || '1', 10)
  const limit = 20
  const offset = (page - 1) * limit
  const currentYear = new Date().getFullYear()

  // Fire parallel queries to Supabase
  const supabase = await createClient()
  const [aggregates, txData, pricingRes] = await Promise.all([
    fetchAdminAggregates({ timeframe, shift, milkType, minQty, qtyOp, search, exactDate, exactMonth, startDate, endDate }),
    fetchAdminTransactions({ timeframe, shift, milkType, minQty, qtyOp, search, exactDate, exactMonth, startDate, endDate, limit, offset }),
    supabase.from('global_pricing').select('*').limit(1).single()
  ])

  const totalPages = Math.ceil((txData.count ?? 0) / limit)
  const pricingData = pricingRes.data || { cow_price: 40, buffalo_price: 50 }

  return (
    <div className="font-sans flex-1 flex flex-col min-h-0 gap-6 w-full pb-4">
      
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
                  />
                }
              />
            </Suspense>
          }
          bottomSection={
            <div key="bottom-section" className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white/80 backdrop-blur-2xl border border-white/40 rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden group">
                <div className="text-sm font-semibold text-slate-500 z-10">Total Milk Bought</div>
                <div className="flex items-baseline gap-1 mt-2 z-10">
                  <span className="text-3xl font-bold text-onyx tracking-tight">{(aggregates?.total_bought ?? 0).toFixed(1)}</span>
                  <span className="text-lg font-bold text-slate-500">L</span>
                </div>
                {/* Subtle background decoration */}
                <div className="absolute -right-4 -bottom-4 opacity-[0.03] z-0 transition-transform group-hover:scale-110">
                   <Database className="w-24 h-24 text-onyx" />
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-2xl border border-white/40 rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden group">
                <div className="text-sm font-semibold text-slate-500 z-10">Capital Deployed</div>
                <div className="flex items-baseline gap-1 mt-2 z-10">
                  <span className="text-2xl font-bold text-onyx tracking-tight">₹{(aggregates?.total_spent ?? 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-white/80 to-amber-50/50 backdrop-blur-2xl border border-white/40 rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 tracking-wider uppercase">
                  <Sun className="w-4 h-4" /> MORNING
                </div>
                <div className="flex items-baseline justify-between mt-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-onyx">{(aggregates?.morning_bought ?? 0).toFixed(1)}</span>
                    <span className="text-sm font-bold text-slate-500">L</span>
                  </div>
                  <div className="text-sm font-bold text-emerald-600 font-mono">₹{(aggregates?.morning_spent ?? 0).toFixed(0)}</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-white/80 to-purple-50/50 backdrop-blur-2xl border border-white/40 rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700 tracking-wider uppercase">
                  <Moon className="w-4 h-4" /> EVENING
                </div>
                <div className="flex items-baseline justify-between mt-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-onyx">{(aggregates?.evening_bought ?? 0).toFixed(1)}</span>
                    <span className="text-sm font-bold text-slate-500">L</span>
                  </div>
                  <div className="text-sm font-bold text-emerald-600 font-mono">₹{(aggregates?.evening_spent ?? 0).toFixed(0)}</div>
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
                <h2 className="text-lg font-bold text-onyx leading-tight">System Records</h2>
                <p className="text-sm font-medium text-slate-500">{txData.count} entries found for current scope</p>
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
                {txData.data?.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-slate-500 font-medium">
                      No transaction metrics found for this scope.
                    </td>
                  </tr>
                ) : (
                  txData.data?.map((tx, index) => (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-4 py-4 text-center align-middle">
                        <MultiSelectCheckbox id={tx.id} />
                      </td>
                      {!hiddenCols.includes('col_sno') && (
                        <td className="px-4 py-4 text-center text-slate-400 font-mono text-xs">
                          {offset + index + 1}
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
                  ))
                )}
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
                  href={`/admin?timeframe=${timeframe}&exactDate=${exactDate}&exactMonth=${exactMonth}&shift=${shift}&milkType=${milkType}&minQty=${minQty}&search=${encodeURIComponent(search)}&hideTable=${hideTable}&hiddenCols=${hiddenCols.join(',')}&page=${Math.max(1, page - 1)}`}
                  scroll={false}
                  className={`p-1.5 rounded-md border ${page === 1 ? 'border-slate-200 text-slate-300 pointer-events-none' : 'border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors'}`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Link>
                <div className="text-xs font-medium text-slate-600 px-2">
                  {page} <span className="text-slate-300 mx-0.5">/</span> {totalPages}
                </div>
                <Link 
                  href={`/admin?timeframe=${timeframe}&exactDate=${exactDate}&exactMonth=${exactMonth}&shift=${shift}&milkType=${milkType}&minQty=${minQty}&search=${encodeURIComponent(search)}&hideTable=${hideTable}&hiddenCols=${hiddenCols.join(',')}&page=${Math.min(totalPages, page + 1)}`}
                  scroll={false}
                  className={`p-1.5 rounded-md border ${page === totalPages ? 'border-slate-200 text-slate-300 pointer-events-none' : 'border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors'}`}
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
  )
}
