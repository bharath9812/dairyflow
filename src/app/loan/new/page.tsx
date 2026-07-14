'use client'
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Landmark, Save, Search, User, IndianRupee, Percent } from 'lucide-react'
import Link from 'next/link'
import TopBar from '@/components/TopBar'
import { createClient } from '@/utils/supabase/client'

export default function NewLoanPage() {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  
  const [customers, setCustomers] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  
  const [principal, setPrincipal] = useState<number | ''>('')
  const [interestRate, setInterestRate] = useState<number | ''>(2) // Default ₹2 interest
  const [loanDate, setLoanDate] = useState(() => new Date().toISOString().split('T')[0])
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('id, name, seller_id')
      .eq('is_active', true)
      .order('seller_id', { ascending: true })
      
    if (!error) {
      setCustomers(data || [])
    }
  }

  const handleCreateLoan = async () => {
    if (!selectedCustomerId || !principal || !interestRate) {
      setError('Please fill in all fields.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    const { data, error } = await supabase.from('loans').insert({
      customer_id: selectedCustomerId,
      principal_amount: principal,
      interest_rate_rupees: interestRate,
      loan_date: loanDate,
      status: 'ACTIVE'
    }).select().single()

    setIsSubmitting(false)

    if (error) {
      if (error.code === '23505') {
        setError('This customer already has an active loan. Please close or restructure the existing loan before creating a new one.')
      } else {
        setError(error.message)
      }
    } else {
      router.push(`/loan/${data.id}`)
    }
  }

  const filteredCustomers = customers.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.seller_id?.toString().includes(searchTerm)
  )
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId)

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-surface">
      <TopBar
        leftPillLabel="Cancel"
        leftPillHref="/loan"
        leftPillActive={false}
        rightPillLabel="Register New Loan"
        rightPillHref="/loan/new"
        rightPillActive={true}
        dateString={new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
      />

      <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 custom-scrollbar">
        <div className="w-full max-w-2xl mx-auto space-y-6">
          
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-[0px_12px_40px_rgba(0,0,0,0.04)] relative">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-slate-100 text-onyx rounded-xl">
                <Landmark className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-onyx tracking-tight">Open New Loan</h1>
                <p className="text-slate-500 font-medium text-sm">Issue capital to a registered seller</p>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm font-medium border border-red-200">
                {error}
              </div>
            )}

            <div className="space-y-6">
              
              {/* Customer Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-onyx">Select Seller</label>
                {selectedCustomer ? (
                  <div className="flex items-center justify-between bg-surface border border-slate-200 p-4 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center font-bold text-onyx shadow-sm">
                        {selectedCustomer.seller_id}
                      </div>
                      <div className="font-bold text-onyx text-lg">{selectedCustomer.name}</div>
                    </div>
                    <button 
                      onClick={() => setSelectedCustomerId('')}
                      className="text-sm font-semibold text-slate-500 hover:text-onyx transition-colors"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search by ID or Name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-1 focus:border-onyx ring-onyx outline-none text-onyx font-medium transition-all shadow-sm"
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl custom-scrollbar shadow-sm bg-white">
                      {filteredCustomers.length === 0 ? (
                        <div className="p-4 text-center text-slate-500 text-sm font-medium">No sellers found.</div>
                      ) : (
                        filteredCustomers.map(c => (
                          <button
                            key={c.id}
                            onClick={() => setSelectedCustomerId(c.id)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 text-left"
                          >
                            <div className="w-8 h-8 rounded-full bg-surface border border-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs">
                              {c.seller_id}
                            </div>
                            <span className="font-medium text-onyx">{c.name}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Loan Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 mt-6 border-t border-slate-100">
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-onyx">Principal Amount (₹)</label>
                  <div className="relative">
                    <IndianRupee className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      value={principal}
                      onChange={(e) => setPrincipal(Number(e.target.value) || '')}
                      placeholder="50000"
                      className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-xl font-medium font-mono text-onyx focus:ring-1 focus:border-onyx ring-onyx outline-none transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-onyx">Interest Rate (₹ per 100/mo)</label>
                  <div className="relative">
                    <Percent className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      value={interestRate}
                      onChange={(e) => setInterestRate(Number(e.target.value) || '')}
                      placeholder="2"
                      className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-xl font-medium font-mono text-onyx focus:ring-1 focus:border-onyx ring-onyx outline-none transition-all shadow-sm"
                    />
                  </div>
                  {interestRate !== '' && (
                    <div className="text-sm font-semibold text-emerald-600 px-1">
                      {Number(interestRate) * 12}% Annual Interest Rate
                    </div>
                  )}
                </div>
                <div className="space-y-3 md:col-span-2 border-t border-slate-100 pt-6 mt-2">
                  <label className="block text-sm font-semibold text-onyx">Loan Start Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={loanDate}
                      onChange={(e) => setLoanDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-base font-medium text-onyx focus:ring-1 focus:border-onyx ring-onyx outline-none transition-all shadow-sm"
                    />
                  </div>
                  <div className="text-xs text-slate-500 font-medium px-1">
                    This determines when the first interest cycle begins. Backdating is permitted.
                  </div>
                </div>
              </div>

              {/* Submit Action */}
              <div className="pt-8 mt-4">
                <button
                  onClick={handleCreateLoan}
                  disabled={isSubmitting || !selectedCustomerId || !principal || !interestRate}
                  className="w-full bg-onyx hover:bg-black disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-lg transition-all flex justify-center items-center gap-2 text-base shadow-sm"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Save className="w-5 h-5" /> Open Loan Account
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
