'use client'
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */

import React, { useState, useEffect } from 'react'
import { Landmark, Search, PlusCircle, AlertCircle, Calendar, Banknote } from 'lucide-react'
import Link from 'next/link'
import TopBar from '@/components/TopBar'
import Wrapper from '@/components/Wrapper'
import { createClient } from '@/utils/supabase/client'
import { fetchCycleConfig, getCurrentCycle, getCycleLabel } from '@/utils/cycle'

export default function LoanManagementPage() {
  const [supabase] = useState(() => createClient())
  const [loans, setLoans] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [cycleConfig, setCycleConfig] = useState<any>(null)
  const [currentCycleStr, setCurrentCycleStr] = useState<string | null>(null)

  const fetchLoans = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('loans')
      .select(`
        *,
        customers (
          name,
          seller_id
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching loans:', error)
    } else {
      setLoans(data || [])
    }
    
    const config = await fetchCycleConfig(supabase)
    setCycleConfig(config)
    setCurrentCycleStr(getCurrentCycle(config))
    
    setIsLoading(false)
  }

  useEffect(() => {
    fetchLoans()
  }, [])

  const activeLoans = loans.filter(l => l.status === 'ACTIVE')
  const totalPrincipalOut = activeLoans.reduce((sum, l) => sum + Number(l.outstanding_principal || l.principal_amount), 0)
  
  // Calculate total currently accrued interest across all active loans
  const totalAccruedInterest = activeLoans.reduce((sum, l) => sum + Number(l.forecasted_interest || 0), 0)

  const filteredLoans = loans.filter(l => {
    const search = searchTerm.toLowerCase()
    return (
      l.customers?.name?.toLowerCase().includes(search) ||
      l.customers?.seller_id?.toString().includes(search)
    )
  })

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      <TopBar
        leftPillLabel="Loan Directory"
        leftPillHref="/loan"
        leftPillActive={true}
        rightPillLabel="Register New Loan"
        rightPillHref="/loan/new"
        rightPillActive={false}
        dateString={new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
      />

      <main className="flex-1 flex flex-col w-full p-4 md:p-6 lg:p-8 overflow-hidden relative">
        <Wrapper
          statsBar={
            <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
              <div className="bg-gradient-to-br from-white/80 to-blue-50/50 backdrop-blur-2xl border border-white/40 rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden min-w-[220px]">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 tracking-wider uppercase">
                  <Landmark className="w-4 h-4" /> TOTAL ACTIVE LOANS
                </div>
                <div className="mt-2 text-2xl font-bold text-onyx">
                  {activeLoans.length}
                </div>
              </div>

              {currentCycleStr && cycleConfig && (
                <div className="bg-gradient-to-br from-white/80 to-purple-50/50 backdrop-blur-2xl border border-white/40 rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden min-w-[220px]">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700 tracking-wider uppercase">
                    <Calendar className="w-4 h-4" /> CURRENT CYCLE
                  </div>
                  <div className="mt-2 text-xl font-bold text-onyx">
                    {currentCycleStr}
                  </div>
                  <div className="text-xs text-slate-500 font-medium mt-1">
                    {getCycleLabel(currentCycleStr, cycleConfig)}
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-br from-white/80 to-red-50/50 backdrop-blur-2xl border border-white/40 rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden min-w-[220px]">
                <div className="flex items-center gap-1.5 text-xs font-bold text-red-700 tracking-wider uppercase">
                  <AlertCircle className="w-4 h-4" /> TOTAL PRINCIPAL OUT
                </div>
                <div className="mt-2 text-2xl font-bold text-red-600 font-mono">
                  ₹{totalPrincipalOut.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div className="bg-gradient-to-br from-white/80 to-amber-50/50 backdrop-blur-2xl border border-white/40 rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden min-w-[220px]">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 tracking-wider uppercase">
                  <Banknote className="w-4 h-4" /> TOTAL FORECASTED INT.
                </div>
                <div className="mt-2 text-2xl font-bold text-amber-600 font-mono">
                  ₹{totalAccruedInterest.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          }
          headerLeft={
            <div className="flex items-center gap-4">
              <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-onyx leading-tight">Loan Registry</h2>
                <p className="text-sm font-medium text-slate-500">Track and manage all customer loans</p>
              </div>
              <div className="ml-4 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 w-64 focus-within:ring-2 ring-indigo-500/20 transition-all">
                <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder="Search by ID or Name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm text-onyx font-semibold w-full placeholder:text-slate-400 placeholder:font-medium"
                />
              </div>
            </div>
          }
        >
          <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-200 text-slate-500 font-semibold uppercase text-xs tracking-wider">
                  <tr>
                    <th className="px-6 py-4 border-b border-slate-200">Status</th>
                    <th className="px-6 py-4 border-b border-slate-200">Customer</th>
                    <th className="px-6 py-4 border-b border-slate-200 text-right">Outstanding</th>
                    <th className="px-6 py-4 border-b border-slate-200 text-right">Interest Rate</th>
                    <th className="px-6 py-4 border-b border-slate-200 text-right">Forecasted Int.</th>
                    <th className="px-6 py-4 border-b border-slate-200 text-right">Loan Date</th>
                    <th className="px-6 py-4 border-b border-slate-200 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                        Loading loans...
                      </td>
                    </tr>
                  ) : filteredLoans.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                        No loans found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredLoans.map((row) => {
                      const forecasted = Number(row.forecasted_interest) || 0
                      const nextDate = row.next_cycle_date ? new Date(row.next_cycle_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'N/A'
                      return (
                        <tr key={row.id} className="hover:bg-slate-50/80 transition-colors group">
                          <td className="px-6 py-4 whitespace-nowrap">
                            {row.status === 'ACTIVE' ? (
                              <span className="flex items-center gap-1.5 w-max px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                ACTIVE
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 w-max px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                CLOSED
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                {row.customers?.seller_id}
                              </div>
                              <span className="font-semibold text-onyx">
                                {row.customers?.name || `Seller ${String(row.customers?.seller_id || '').padStart(3, '0')}`}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span className="font-mono font-bold text-red-600 text-base">
                              ₹{Number(row.outstanding_principal || row.principal_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span className="font-semibold text-onyx">
                              ₹{row.interest_rate_rupees} <span className="text-xs text-slate-400">/ 100 / mo</span>
                            </span>
                            <div className="text-xs font-medium text-slate-400 mt-0.5">
                              {(Number(row.interest_rate_rupees) * 12).toFixed(1)}% Annual
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span className="font-mono font-bold text-amber-600 text-base">
                              ₹{forecasted.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                            <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mt-1 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 inline-block">
                              Cycle: {row.active_cycle_identifier}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-500 font-medium">
                            <div className="flex items-center justify-end gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(row.loan_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <Link 
                              href={`/loan/${row.id}`}
                              className="inline-flex items-center justify-center px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors shadow-sm"
                            >
                              Manage
                            </Link>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Wrapper>
      </main>
    </div>
  )
}
