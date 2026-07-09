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
      status: 'ACTIVE'
    }).select().single()

    setIsSubmitting(false)

    if (error) {
      setError('Failed to create loan. ' + error.message)
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
    <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-slate-50/50">
      <TopBar
        leftPillLabel="Cancel"
        leftPillHref="/loan"
        leftPillActive={false}
        rightPillLabel="Register New Loan"
        rightPillHref="/loan/new"
        rightPillActive={true}
        dateString={new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
      />

      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <Landmark className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-onyx">Open New Loan</h1>
                <p className="text-slate-500 font-medium">Issue capital to a registered seller</p>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl text-sm font-bold border border-red-200">
                {error}
              </div>
            )}

            <div className="space-y-6">
              
              {/* Customer Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-700">Select Seller</label>
                {selectedCustomer ? (
                  <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 p-4 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center font-bold text-indigo-700 shadow-sm">
                        {selectedCustomer.seller_id}
                      </div>
                      <div className="font-bold text-indigo-900 text-lg">{selectedCustomer.name}</div>
                    </div>
                    <button 
                      onClick={() => setSelectedCustomerId('')}
                      className="text-sm font-bold text-indigo-600 hover:text-indigo-800"
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
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 ring-indigo-500 outline-none text-onyx font-medium"
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl custom-scrollbar">
                      {filteredCustomers.length === 0 ? (
                        <div className="p-4 text-center text-slate-500 text-sm font-medium">No sellers found.</div>
                      ) : (
                        filteredCustomers.map(c => (
                          <button
                            key={c.id}
                            onClick={() => setSelectedCustomerId(c.id)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 text-left"
                          >
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">
                              {c.seller_id}
                            </div>
                            <span className="font-semibold text-onyx">{c.name}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Loan Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-slate-700">Principal Amount (₹)</label>
                  <div className="relative">
                    <IndianRupee className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      value={principal}
                      onChange={(e) => setPrincipal(Number(e.target.value) || '')}
                      placeholder="50000"
                      className="w-full bg-white border border-slate-300 rounded-xl pl-12 pr-4 py-3.5 text-xl font-bold font-mono text-onyx focus:ring-2 ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-bold text-slate-700">Interest Rate (₹ per 100/mo)</label>
                  <div className="relative">
                    <Percent className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      value={interestRate}
                      onChange={(e) => setInterestRate(Number(e.target.value) || '')}
                      placeholder="2"
                      className="w-full bg-white border border-slate-300 rounded-xl pl-12 pr-4 py-3.5 text-xl font-bold font-mono text-onyx focus:ring-2 ring-indigo-500 outline-none"
                    />
                  </div>
                  {interestRate !== '' && (
                    <div className="text-xs font-bold text-emerald-600 px-1">
                      {Number(interestRate) * 12}% Annual Interest Rate
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Action */}
              <div className="pt-8">
                <button
                  onClick={handleCreateLoan}
                  disabled={isSubmitting || !selectedCustomerId || !principal || !interestRate}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-md shadow-indigo-600/20 transition-all flex justify-center items-center gap-2 text-lg"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Save className="w-6 h-6" /> Open Loan Account
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
