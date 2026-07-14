'use client'
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */

import React, { useState, useEffect } from 'react'
import { Clock, History } from 'lucide-react'
import Link from 'next/link'
import TopBar from '@/components/TopBar'
import Wrapper from '@/components/Wrapper'
import { createClient } from '@/utils/supabase/client'
import { fetchCycleConfig, getCycleLabel } from '@/utils/cycle'

export default function LiveHistoryPage() {
  const [supabase] = useState(() => createClient())
  const [cycleConfig, setCycleConfig] = useState<any>({ c1StartDay: 1, c1EndDay: 14 })
  
  const [availableCycles, setAvailableCycles] = useState<string[]>([])
  const [selectedCycle, setSelectedCycle] = useState<string>('')
  const [aggregates, setAggregates] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const config = await fetchCycleConfig(supabase)
      setCycleConfig(config)
      fetchAvailableCycles()
    }
    init()
  }, [])

  const fetchAvailableCycles = async () => {
    const { data, error } = await supabase
      .from('live_cycle_aggregates')
      .select('cycle_identifier')
    
    if (data && data.length > 0) {
      // Get unique cycles and sort descending
      const uniqueCycles = Array.from(new Set(data.map((d: { cycle_identifier: string | null }) => d.cycle_identifier))).filter((cycle): cycle is string => cycle !== null)
      uniqueCycles.sort().reverse()
      setAvailableCycles(uniqueCycles)
      if (uniqueCycles.length > 0) {
        setSelectedCycle(uniqueCycles[0])
      } else {
        setIsLoading(false)
      }
    } else {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (selectedCycle) {
      fetchAggregatesForCycle(selectedCycle)
    }
  }, [selectedCycle])

  const fetchAggregatesForCycle = async (cycle: string) => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('live_cycle_aggregates')
      .select(`
        *,
        customers (
          name,
          seller_id
        )
      `)
      .eq('cycle_identifier', cycle)
      .order('total_earnings', { ascending: false })

    if (!error) {
      setAggregates(data || [])
    }
    setIsLoading(false)
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      <TopBar
        leftPillLabel="Back to Live"
        leftPillHref="/live"
        leftPillActive={false}
        rightPillLabel="Cycle History"
        rightPillHref="/live/history"
        rightPillActive={true}
        dateString={new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
      />

      <main className="flex-1 flex flex-col bg-surface overflow-hidden relative -mt-6">
        <div className="w-full max-w-[1440px] mx-auto px-6 pb-3 pt-3 flex-1 flex flex-col min-h-0">
          <Wrapper
            statsBar={
              <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-[0px_4px_20px_rgba(0,0,0,0.03)] relative overflow-hidden min-w-[250px]">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 tracking-wider uppercase">
                    <Clock className="w-4 h-4 text-onyx" /> SELECT PAST CYCLE
                  </div>
                  <div className="mt-2 text-xl font-semibold text-onyx">
                    <select 
                      value={selectedCycle}
                      onChange={(e) => setSelectedCycle(e.target.value)}
                      className="bg-transparent border-none outline-none focus:ring-0 p-0 text-lg font-semibold text-onyx cursor-pointer w-full"
                    >
                      {availableCycles.length === 0 && <option value="">No history available</option>}
                      {availableCycles.map(c => (
                        <option key={c} value={c}>{getCycleLabel(c, cycleConfig)}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            }
            headerLeft={
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 text-onyx rounded-lg">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-onyx leading-tight">Aggregate History</h2>
                  <p className="text-sm font-medium text-slate-500">View performance data of past cycles</p>
                </div>
              </div>
            }
          >
            <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden bg-white">
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead className="sticky top-0 z-10 bg-white border-b border-slate-100 text-slate-500 font-medium text-xs">
                    <tr>
                      <th className="px-6 py-4 font-medium border-b border-slate-100">Rank</th>
                      <th className="px-6 py-4 font-medium border-b border-slate-100">Seller Entity</th>
                      <th className="px-6 py-4 font-medium border-b border-slate-100 text-right">Cycle Earnings</th>
                      <th className="px-6 py-4 font-medium border-b border-slate-100 text-right">Total Vol</th>
                      <th className="px-6 py-4 font-medium border-b border-slate-100 text-right">Shifts (M/E)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 bg-white">
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                          Loading...
                        </td>
                      </tr>
                    ) : aggregates.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                          No aggregates found for the selected cycle.
                        </td>
                      </tr>
                    ) : (
                      aggregates.map((row, index) => (
                        <tr key={row.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-400">
                            #{index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link href={`/customers/${row.customer_id}`} className="flex items-center gap-3 group/link">
                              <div className="w-8 h-8 rounded-full bg-surface border border-slate-100 flex items-center justify-center text-xs font-medium text-slate-600">
                                {row.customers?.seller_id}
                              </div>
                              <span className="font-medium text-onyx group-hover/link:text-slate-600 transition-colors">
                                {row.customers?.name || `Seller ${String(row.customers?.seller_id || '')}`}
                              </span>
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span className="font-mono font-medium text-onyx text-sm bg-surface px-3 py-1 rounded-full border border-slate-100">
                              ₹{(Number(row.total_earnings) || 0).toFixed(2)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="font-medium text-onyx">{(Number(row.total_litres) || 0).toFixed(1)} L</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className="flex items-center gap-1 text-sm font-medium text-slate-600 bg-surface px-2 py-0.5 rounded-md border border-slate-100">
                                AM: {row.am_shifts_count || 0} / PM: {row.pm_shifts_count || 0}
                              </span>
                            </div>
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
