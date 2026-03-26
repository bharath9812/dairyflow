import { fetchAdminTransactions, fetchAdminAggregates } from './actions'
import AdminFilters from './AdminFilters'
import ExportButtons from './ExportButtons'
import Link from 'next/link'
import { ArrowLeft, Download, ShieldCheck, Users, Sun, Moon, Database, ChevronLeft, ChevronRight } from 'lucide-react'

export default async function AdminDashboardPage(props: { searchParams: Promise<{ timeframe?: string, shift?: string, milkType?: string, minQty?: string, search?: string, exactDate?: string, exactMonth?: string, hideTable?: string, hiddenCols?: string, page?: string }> }) {
  const searchParams = await props.searchParams
  const timeframe = searchParams?.timeframe || 'TODAY'
  const exactDate = searchParams?.exactDate || ''
  const exactMonth = searchParams?.exactMonth || ''
  const shift = searchParams?.shift || 'ALL'
  const milkType = searchParams?.milkType || 'ALL'
  const minQty = searchParams?.minQty || ''
  const search = searchParams?.search || ''
  const hideTable = searchParams?.hideTable === 'true'
  const hiddenCols = searchParams?.hiddenCols?.split(',') || []
  
  const page = parseInt(searchParams?.page || '1', 10)
  const limit = 50
  const offset = (page - 1) * limit

  // Fire parallel queries to Supabase
  const [aggregates, txData] = await Promise.all([
    fetchAdminAggregates({ timeframe, shift, milkType, minQty, search, exactDate, exactMonth }),
    fetchAdminTransactions({ timeframe, shift, milkType, minQty, search, exactDate, exactMonth, limit, offset })
  ])

  const totalPages = Math.ceil((txData.count ?? 0) / limit)

  return (
    <div className="font-sans space-y-8 pb-12">
      
      {/* Dynamic Analytics Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full blur-2xl opacity-60 pointer-events-none"></div>
            <p className="text-sm font-bold text-slate-500 mb-1">Total Milk Bought</p>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">{aggregates.total_bought.toFixed(1)} <span className="text-lg text-slate-400">L</span></h2>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 rounded-full blur-2xl opacity-60 pointer-events-none"></div>
            <p className="text-sm font-bold text-slate-500 mb-1">Capital Deployed</p>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight"><span className="text-emerald-500 mr-1">₹</span>{aggregates.total_spent.toFixed(2)}</h2>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-center">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-1 rounded">
                <Sun className="w-3.5 h-3.5" /> Morning
              </div>
            </div>
            <div className="flex items-end justify-between">
              <p className="text-lg font-black text-slate-800">{aggregates.morning_bought.toFixed(1)}<span className="text-xs text-slate-400 ml-0.5">L</span></p>
              <p className="text-sm font-bold text-emerald-600">₹{aggregates.morning_spent.toFixed(0)}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-center">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                <Moon className="w-3.5 h-3.5" /> Evening
              </div>
            </div>
            <div className="flex items-end justify-between">
              <p className="text-lg font-black text-slate-800">{aggregates.evening_bought.toFixed(1)}<span className="text-xs text-slate-400 ml-0.5">L</span></p>
              <p className="text-sm font-bold text-emerald-600">₹{aggregates.evening_spent.toFixed(0)}</p>
            </div>
          </div>
        </div>

        {/* Master Control Bar */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <AdminFilters />
          <div className="flex items-center gap-3 w-full lg:w-auto mt-4 lg:mt-0">
            <ExportButtons 
              timeframe={timeframe} 
              exactDate={exactDate}
              exactMonth={exactMonth}
              shift={shift} 
              milkType={milkType} 
              minQty={minQty} 
              search={search}
              hiddenCols={hiddenCols}
            />
          </div>
        </div>

        {/* Dense Data Grid */}
        {!hideTable && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 tracking-tight">System Records</h2>
                <p className="text-xs font-semibold text-slate-400">{txData.count} entries found for current scope</p>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10">
                  <tr>
                    {!hiddenCols.includes('col_tx_id') && <th className="px-6 py-4 border-b border-slate-200">Tx ID</th>}
                    {!hiddenCols.includes('col_date') && <th className="px-6 py-4 border-b border-slate-200">Date & Temp</th>}
                    {!hiddenCols.includes('col_seller') && <th className="px-6 py-4 border-b border-slate-200">Seller Entity</th>}
                    {!hiddenCols.includes('col_type') && <th className="px-6 py-4 border-b border-slate-200">Commodity</th>}
                    {!hiddenCols.includes('col_volume') && <th className="px-6 py-4 border-b border-slate-200 text-right">Volume</th>}
                    {!hiddenCols.includes('col_capital') && <th className="px-6 py-4 border-b border-slate-200 text-right">Capital Out</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {txData.data?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium bg-slate-50/30">
                        No transaction metrics found for this scope.
                      </td>
                    </tr>
                  ) : (
                    txData.data?.map(tx => (
                      <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
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
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border 
                              {tx.milk_type === 'Cow' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-700 border-slate-200'}">
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
                          <td className="px-6 py-4 text-right">
                            <div className="font-black text-emerald-600">₹{Number(tx.total_price).toFixed(2)}</div>
                            <div className="text-[10px] font-bold text-slate-400 mt-0.5">@ ₹{Number(tx.price_per_litre)}/L</div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Pagination Bounds */}
            {totalPages > 1 && (
              <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex items-center justify-between">
                <div className="text-xs font-bold text-slate-500">
                  Viewing Output {page} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Link 
                    href={`/admin?timeframe=${timeframe}&exactDate=${exactDate}&exactMonth=${exactMonth}&shift=${shift}&milkType=${milkType}&minQty=${minQty}&search=${encodeURIComponent(search)}&hideTable=${hideTable}&hiddenCols=${hiddenCols.join(',')}&page=${Math.max(1, page - 1)}`}
                    className={`p-2 rounded-lg border ${page === 1 ? 'border-slate-200 text-slate-300 pointer-events-none' : 'border-slate-300 text-slate-600 hover:bg-white bg-slate-100 transition-colors'}`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Link>
                  <Link 
                    href={`/admin?timeframe=${timeframe}&exactDate=${exactDate}&exactMonth=${exactMonth}&shift=${shift}&milkType=${milkType}&minQty=${minQty}&search=${encodeURIComponent(search)}&hideTable=${hideTable}&hiddenCols=${hiddenCols.join(',')}&page=${Math.min(totalPages, page + 1)}`}
                    className={`p-2 rounded-lg border ${page === totalPages ? 'border-slate-200 text-slate-300 pointer-events-none' : 'border-slate-300 text-slate-600 hover:bg-white bg-slate-100 transition-colors'}`}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
    </div>
  )
}
