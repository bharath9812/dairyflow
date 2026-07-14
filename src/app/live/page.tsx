'use client'
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */

import React, { useState, useEffect } from 'react'
import { Activity, Clock, Droplets, Banknote, Sun, Moon, History, Search } from 'lucide-react'
import Link from 'next/link'
import TopBar from '@/components/TopBar'
import Wrapper from '@/components/Wrapper'
import { createClient } from '@/utils/supabase/client'

import { fetchCycleConfig, getCurrentCycle, getCycleLabel } from '@/utils/cycle'

export default function LiveTrackerPage() {
  const [supabase] = useState(() => createClient())
  const [cycleConfig, setCycleConfig] = useState<any>({ c1StartDay: 1, c1EndDay: 14 })
  const [currentCycle, setCurrentCycle] = useState('')
  const [aggregates, setAggregates] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const config = await fetchCycleConfig(supabase)
      setCycleConfig(config)
      setCurrentCycle(getCurrentCycle(config))
    }
    init()
  }, [])

  const fetchLiveAggregates = async () => {
    if (!currentCycle) return
    setIsLoading(true)
    const { data, error } = await supabase
      .from('live_cycle_aggregates')
      .select(`
        *,
        customers (
          name,
          seller_id,
          contact,
          location
        )
      `)
      .eq('cycle_identifier', currentCycle)
      .order('total_earnings', { ascending: false })

    if (error) {
      console.error('Error fetching live aggregates:', error)
    } else {
      setAggregates(data || [])
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchLiveAggregates()

    // Real-time subscription to the aggregates table
    const channel = supabase.channel('live-cycle-aggregates-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'live_cycle_aggregates' },
        (payload: any) => {
          // Whenever an aggregate changes, refetch everything to get the joined customer name 
          // and ensure proper sorting. Since this is a specialized dashboard, this is acceptable.
          fetchLiveAggregates()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentCycle])

  // Compute total aggregates for the top stats bar
  const totalEarnings = aggregates.reduce((sum, item) => sum + (Number(item.total_earnings) || 0), 0)
  const totalLitres = aggregates.reduce((sum, item) => sum + (Number(item.total_litres) || 0), 0)
  const totalCow = aggregates.reduce((sum, item) => sum + (Number(item.total_cow_litres) || 0), 0)
  const totalBuffalo = aggregates.reduce((sum, item) => sum + (Number(item.total_buffalo_litres) || 0), 0)

  const filteredAggregates = aggregates.filter(agg => {
    const searchLower = searchTerm.toLowerCase()
    return (
      agg.customers?.name?.toLowerCase().includes(searchLower) ||
      agg.customers?.seller_id?.toString().includes(searchLower) ||
      agg.customers?.contact?.toLowerCase().includes(searchLower) ||
      agg.customers?.location?.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      <TopBar
        leftPillLabel="Live Tracker"
        leftPillHref="/live"
        leftPillActive={true}
        rightPillLabel="History"
        rightPillHref="/live/history"
        rightPillActive={false}
        dateString={new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
      />

      <main className="flex-1 flex flex-col bg-surface overflow-hidden relative -mt-6">
        <div className="w-full max-w-[1440px] mx-auto px-6 pb-3 pt-3 flex-1 flex flex-col min-h-0">
          <Wrapper
            statsBar={
              <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-[0px_4px_20px_rgba(0,0,0,0.03)] relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 tracking-wider uppercase">
                      <Activity className="w-4 h-4" /> CURRENT CYCLE
                    </div>
                  </div>
                  <div className="mt-2 text-lg font-semibold text-onyx leading-tight">
                    {currentCycle ? getCycleLabel(currentCycle, cycleConfig) : 'Loading...'}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-[0px_4px_20px_rgba(0,0,0,0.03)] relative overflow-hidden min-w-[200px]">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 tracking-wider uppercase">
                    <Banknote className="w-4 h-4" /> TOTAL CYCLE EARNINGS
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-onyx font-mono">
                    ₹{totalEarnings.toFixed(2)}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-[0px_4px_20px_rgba(0,0,0,0.03)] relative overflow-hidden min-w-[200px]">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 tracking-wider uppercase">
                    <Droplets className="w-4 h-4" /> TOTAL VOLUME
                  </div>
                  <div className="flex flex-col mt-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-semibold text-onyx">{totalLitres.toFixed(1)}</span>
                      <span className="text-sm font-semibold text-slate-500">L</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs font-medium text-slate-500">
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-amber-400" /> Cow: {totalCow.toFixed(1)}L
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-slate-800" /> Buffalo: {totalBuffalo.toFixed(1)}L
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            }
            headerLeft={
              <div className="flex items-center gap-4 w-full">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                  <Activity className="w-5 h-5 animate-pulse" />
                </div>
                <div className="shrink-0 hidden md:block">
                  <h2 className="text-lg font-semibold text-onyx leading-tight">Live Board</h2>
                  <p className="text-sm font-medium text-slate-500">Real-time tracking of C1/C2 cycle data</p>
                </div>
                <div className="ml-auto flex items-center bg-surface border border-slate-200 rounded-lg px-3 py-2 w-full max-w-sm focus-within:border-onyx transition-colors">
                  <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search sellers by name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm text-onyx font-medium w-full placeholder:text-slate-400"
                  />
                </div>
              </div>
            }
          >
            <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden bg-white">
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead className="sticky top-0 z-10 bg-white border-b border-slate-100 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 border-b border-slate-100">Rank</th>
                      <th className="px-6 py-4 border-b border-slate-100">Seller Entity</th>
                      <th className="px-6 py-4 border-b border-slate-100 text-right">Cycle Earnings</th>
                      <th className="px-6 py-4 border-b border-slate-100 text-right">Total Vol</th>
                      <th className="px-6 py-4 border-b border-slate-100 text-right">Shifts (M/E)</th>
                      <th className="px-6 py-4 border-b border-slate-100 text-right">Last Sync</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 bg-white">
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                          Loading live aggregates...
                        </td>
                      </tr>
                    ) : filteredAggregates.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                          No transactions recorded for this cycle yet.
                        </td>
                      </tr>
                    ) : (
                      filteredAggregates.map((row, index) => (
                        <tr key={row.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-400">
                            #{index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link href={`/customers/${row.customer_id}`} className="flex items-center gap-3 group/link">
                              <div className="w-auto px-2 h-8 rounded bg-slate-100 border border-slate-200/50 flex items-center justify-center text-[10px] font-mono font-bold tracking-widest text-slate-500">
                                [{row.customers?.location ? row.customers.location.substring(0, 3).toUpperCase() : 'UNK'}] #{row.customers?.seller_id}
                              </div>
                              <span className="font-medium text-onyx group-hover/link:text-slate-600 transition-colors">
                                {row.customers?.name || `Seller ${String(row.customers?.seller_id || '')}`}
                              </span>
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span className="font-mono font-bold text-emerald-600 text-sm bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                              ₹{(Number(row.total_earnings) || 0).toFixed(2)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="font-medium text-onyx">{(Number(row.total_litres) || 0).toFixed(1)} L</div>
                            <div className="text-xs font-medium text-slate-400 flex justify-end gap-2 mt-0.5">
                              <span className="flex items-center gap-0.5"><div className="w-1.5 h-1.5 rounded-full bg-amber-400" /> {Number(row.total_cow_litres || 0).toFixed(1)}</span>
                              <span className="flex items-center gap-0.5"><div className="w-1.5 h-1.5 rounded-full bg-slate-800" /> {Number(row.total_buffalo_litres || 0).toFixed(1)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="flex items-center gap-1.5 min-w-[32px] justify-center text-xs font-bold bg-orange-50 text-orange-600 px-2 py-1 rounded-md border border-orange-100">
                                <Sun className="w-3 h-3 text-orange-500" /> {row.am_shifts_count || 0}
                              </div>
                              <div className="flex items-center gap-1.5 min-w-[32px] justify-center text-xs font-bold bg-purple-50 text-purple-600 px-2 py-1 rounded-md border border-purple-100">
                                <Moon className="w-3 h-3 text-purple-500" /> {row.pm_shifts_count || 0}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-500 font-medium">
                            {row.last_transaction_date ? new Date(row.last_transaction_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Wrapper>
        </div>
      </main>
    </div>
  )
}
