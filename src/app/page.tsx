'use client'
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps, prefer-const, react/no-unescaped-entities, react-hooks/set-state-in-effect */

import React, { useState, useEffect } from 'react'
import { Calendar, Droplets, User, DollarSign, Calculator, Percent, ChevronLeft, ChevronRight, ChevronDown, Loader2, LogOut, Users, ShieldCheck, Pencil, PlusCircle, BookText, Banknote, BarChart3, Maximize2, Minimize2, Filter } from 'lucide-react'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import TransactionActionCell from '@/components/TransactionActionCell'
import { useTransactionViewMode } from '@/components/TransactionViewModeContext'

export default function TransactionDashboard() {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const { mode, toggleMode } = useTransactionViewMode()
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [milkType, setMilkType] = useState('Buffalo')
  const [shift, setShift] = useState('AM')
  const [quantity, setQuantity] = useState<number | ''>('')
  const [fatPercentage, setFatPercentage] = useState<number | ''>('')
  const [globalPricing, setGlobalPricing] = useState({ cow_price: 40, buffalo_price: 50 })

  const [customersList, setCustomersList] = useState<{ id: string, seller_id: number, name: string, location: string, contact: string }[]>([])
  const [customerSearch, setCustomerSearch] = useState('')
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [customerId, setCustomerId] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [activeSearchIndex, setActiveSearchIndex] = useState(-1)
  const quantityInputRef = React.useRef<HTMLInputElement>(null)
  const fatInputRef = React.useRef<HTMLInputElement>(null)
  const submitBtnRef = React.useRef<HTMLButtonElement>(null)
  const searchInputRef = React.useRef<HTMLInputElement>(null)

  const [transactionsList, setTransactionsList] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [fetchLimit, setFetchLimit] = useState(20)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sessionUser, setSessionUser] = useState<{ id: string, email?: string, name?: string } | null>(null)

  const itemsPerPage = 10
  const totalPages = Math.ceil(transactionsList.length / itemsPerPage) || 1
  const paginatedTx = transactionsList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const filteredCustomers = customersList.filter(c => {
    const locMatch = selectedLocations.length === 0 || selectedLocations.includes(c.location || 'Unknown Location')
    if (!locMatch) return false
    
    const term = (customerSearch || '').trim().toLowerCase()
    if (!term) return true
    return (
      (c.name && c.name.toLowerCase().includes(term)) ||
      (c.location && c.location.toLowerCase().includes(term)) ||
      (c.contact && c.contact.includes(term)) ||
      (String(c.seller_id).includes(term)) ||
      (String(c.seller_id) === term)
    )
  })

  const uniqueLocations = Array.from(new Set(customersList.map(c => c.location || 'Unknown Location'))).sort()

  const fetchTransactions = async () => {
    const { data } = await supabase
      .from('transactions')
      .select('*, customers(seller_id, name, location)')
      .order('created_at', { ascending: false })
      .limit(fetchLimit)
    if (data) setTransactionsList(data)
  }

  useEffect(() => {
    async function fetchData() {
      const [custRes, pricingRes, userRes] = await Promise.all([
        supabase.from('customers').select('id, seller_id, name, location, contact').eq('is_active', true).order('seller_id', { ascending: true }),
        supabase.from('global_pricing').select('*').limit(1).single(),
        supabase.auth.getUser()
      ])
      if (custRes.data) setCustomersList(custRes.data)
      if (pricingRes.data) setGlobalPricing(pricingRes.data)

      const user = userRes.data?.user
      if (user) {
        const metaName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0]
        setSessionUser({ id: user.id, email: user.email, name: metaName })
      }
    }
    fetchData()
  }, []) // Empty dependency for initial mount

  useEffect(() => {
    fetchTransactions()
  }, [fetchLimit])

  const quantityNum = Number(quantity) || 0
  const fatNum = Number(fatPercentage) || 0
  const priceNum = milkType === 'Cow' ? Number(globalPricing.cow_price) : Number(globalPricing.buffalo_price)

  const totalPrice = (quantityNum * fatNum * priceNum) * 10 / 100

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerId) return alert('Please select a valid registered seller.')
    if (!quantity || !fatPercentage) return alert('Please fill out all quantity and fat fields.')

    setIsSubmitting(true)

    const newTx = {
      customer_id: customerId,
      transaction_date: date,
      milk_type: milkType,
      shift: shift,
      quantity_litres: quantityNum,
      fat_percentage: fatNum,
      price_per_litre: priceNum,
      total_price: totalPrice,
      created_by: sessionUser?.id,
      updated_by: sessionUser?.id,
      updated_by_name: sessionUser?.name || 'Admin',
      created_by_name: sessionUser?.name || 'Admin'
    }

    const { processMilkTransaction } = await import('@/app/transaction-actions')
    const { data, error } = await processMilkTransaction(newTx)

    if (error) {
      console.error(error)
      alert('Failed to save transaction: ' + error)
    } else if (data) {
      setQuantity('')
      setFatPercentage('')
      setCustomerSearch('')
      setCustomerId('')
      setCurrentPage(1)
      await fetchTransactions() // Smart refresh the limit list to ensure exact ordering
      setTimeout(() => searchInputRef.current?.focus(), 100) // Auto-focus back to search for the next entry
    }

    setIsSubmitting(false)
  }

  return (
    <div className="min-h-[100dvh] bg-surface flex flex-col font-sans text-on-surface">
      <div className="flex flex-1 h-[100dvh] overflow-hidden">
        {/* Persistent Sidebar (Desktop) */}
        <Sidebar
          onLogout={async () => { await supabase.auth.signOut(); router.push('/login'); }}
        />

        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          {/* TopBar Redesign */}
          <TopBar
            leftPillLabel="Sellers Directory"
            leftPillHref="/customers"
            leftPillActive={true}
            rightPillLabel="AdminPage"
            rightPillHref="/admin"
            rightPillActive={false}
            dateString={new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
          />

          {/* Main Dashboard Workspace */}
          <main className="flex-1 flex flex-col w-full px-6 pb-3 pt-3 -mt-6 overflow-hidden relative">

            {/* =========================================================
            FORM ENTRY SECTION
            ========================================================= */}
            <div className="w-full flex flex-col mb-3 shrink-0 hide-in-expand">
              <h1 className="text-lg font-bold mb-2 text-onyx tracking-tight">Daily Milk Entry</h1>

              <div className="bg-white/80 backdrop-blur-2xl border border-white/40 shadow-sm rounded-xl p-3 flex flex-col overflow-visible h-full relative z-20">
                <form id="entry-form" onSubmit={handleSubmit} className="flex flex-col gap-3">

                  <div className="flex flex-col gap-3">

                    {/* Row 1 */}
                    <div className="flex flex-wrap items-end gap-3">
                      {/* Seller Selection */}
                      <div className="min-w-[240px] flex flex-col gap-1.5 flex-1 w-[42%] relative z-50">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                          Seller / Customer Name
                        </label>
                        <div className="relative flex gap-2 items-center">
                          <div className="relative group shrink-0">
                            <button type="button" className="flex items-center gap-2 bg-slate-100 border border-slate-200/50 rounded-lg px-3 py-2.5 text-xs font-bold text-slate-500 hover:border-slate-300 transition-all">
                              <Filter className="w-3.5 h-3.5" />
                              {selectedLocations.length === 0 ? 'All Books' : `${selectedLocations.length} Books`}
                            </button>
                            <div className="absolute left-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-200/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[60] p-2 flex flex-col gap-1 max-h-60 overflow-y-auto custom-scrollbar">
                              <label className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                                <input type="checkbox" checked={selectedLocations.length === 0} onChange={() => setSelectedLocations([])} className="rounded text-sky-500 focus:ring-sky-500 w-4 h-4" />
                                <span className="text-sm font-bold text-slate-700">All Locations</span>
                              </label>
                              <div className="h-px bg-slate-100 my-1 mx-2"></div>
                              {uniqueLocations.map(loc => (
                                <label key={loc} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                                  <input type="checkbox" 
                                    checked={selectedLocations.includes(loc)} 
                                    onChange={(e) => {
                                      if (e.target.checked) setSelectedLocations([...selectedLocations, loc])
                                      else setSelectedLocations(selectedLocations.filter(l => l !== loc))
                                    }} 
                                    className="rounded text-sky-500 focus:ring-sky-500 w-4 h-4" 
                                  />
                                  <span className="text-sm font-bold text-slate-600 truncate">{loc}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Type Name to search..."
                            className="w-[70%] input-recessed focus:input-recessed-focus"
                            value={customerSearch}
                            onFocus={() => setIsDropdownOpen(true)}
                            onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                            onChange={(e) => {
                              setCustomerSearch(e.target.value)
                              setIsDropdownOpen(true)
                              setCustomerId('') // Reset ID since text changed
                              setActiveSearchIndex(-1)
                            }}
                            onKeyDown={(e) => {
                              if (isDropdownOpen && filteredCustomers.length > 0) {
                                if (e.key === 'ArrowDown') {
                                  e.preventDefault()
                                  setActiveSearchIndex(prev => Math.min(prev + 1, filteredCustomers.length - 1))
                                } else if (e.key === 'ArrowUp') {
                                  e.preventDefault()
                                  setActiveSearchIndex(prev => Math.max(prev - 1, -1))
                                } else if (e.key === 'Enter') {
                                  e.preventDefault()
                                  if (activeSearchIndex >= 0 && activeSearchIndex < filteredCustomers.length) {
                                    const c = filteredCustomers[activeSearchIndex]
                                    setCustomerId(c.id)
                                    setCustomerSearch(`[${c.location || 'UNK'}] - #${c.seller_id} - ${c.name || 'Seller'}`)
                                    setIsDropdownOpen(false)
                                    quantityInputRef.current?.focus()
                                  } else if (customerId) {
                                    setIsDropdownOpen(false)
                                    quantityInputRef.current?.focus()
                                  }
                                }
                              } else if (e.key === 'Enter') {
                                e.preventDefault()
                                if (customerId) {
                                  quantityInputRef.current?.focus()
                                }
                              }
                            }}
                            autoComplete="off"
                          />
                          <Link href="/customers/new" className="text-sky-accent text-xs font-bold hover:underline shrink-0 px-2 transition-all">
                            + Register
                          </Link>
                          {customerId && customersList.find(c => c.id === customerId) && (
                            <Link href={`/customers/${customerId}`} className="text-sky-accent text-xs font-bold hover:underline shrink-0 px-2 transition-all border-l border-slate-200 ml-1 pl-3">
                              View {customersList.find(c => c.id === customerId)?.name?.split(' ')[0] || `#${customersList.find(c => c.id === customerId)?.seller_id}`} Profile
                            </Link>
                          )}

                          {isDropdownOpen && (
                            <div className="absolute top-[100%] left-0 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl shadow-slate-200/50 max-h-60 overflow-y-auto custom-scrollbar z-50">
                              {filteredCustomers.length > 0 ? (
                                filteredCustomers.map((c, idx) => (
                                  <div
                                    key={c.id}
                                    className={`px-4 py-3 cursor-pointer border-b border-slate-100 last:border-0 transition-colors ${idx === activeSearchIndex ? 'bg-sky-50' : 'hover:bg-slate-50'}`}
                                    onMouseEnter={() => setActiveSearchIndex(idx)}
                                    onClick={() => {
                                      setCustomerId(c.id)
                                      setCustomerSearch(`[${c.location || 'UNK'}] - #${c.seller_id} - ${c.name || 'Seller'}`)
                                      setIsDropdownOpen(false)
                                      quantityInputRef.current?.focus()
                                    }}
                                  >
                                    <div className="font-bold text-onyx flex items-center gap-2">
                                      <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-mono tracking-widest">
                                        [{c.location ? c.location.substring(0, 3).toUpperCase() : 'UNK'}] #{c.seller_id}
                                      </span>
                                      {c.name ? c.name : 'Seller'}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-sky-accent"></span> {c.location || 'Unknown Location'}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="px-5 py-6 text-sm text-slate-500 text-center font-medium bg-slate-50/50">
                                  No sellers found.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-3 items-center flex-none md:-ml-4">
                        {/* Date */}
                        <div className="flex flex-col gap-1.5 flex-none">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Date</label>
                          <div className="relative flex items-center w-[160px] shrink-0">
                            <Calendar className="w-4 h-4 text-slate-400 absolute left-2 pointer-events-none" />
                            <input
                              type="date"
                              value={date}
                              onChange={(e) => setDate(e.target.value)}
                              className="w-full pl-8 input-recessed focus:input-recessed-focus font-mono"
                            />
                          </div>
                        </div>

                        {/* Shift */}
                        <div className="flex flex-col gap-1.5 flex-none">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Shift</label>
                          <div className="relative flex items-center w-[120px] shrink-0">
                            <select
                              value={shift}
                              onChange={(e) => setShift(e.target.value)}
                              className="w-full input-recessed focus:input-recessed-focus appearance-none cursor-pointer pr-8"
                            >
                              <option value="AM">AM</option>
                              <option value="PM">PM</option>
                            </select>
                            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 pointer-events-none" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Row 2 */}
                    <div className="flex flex-wrap items-end gap-3 z-10 relative">

                      {/* Milk Type */}
                      <div className="w-36 flex flex-col gap-1.5 flex-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Milk Type</label>
                        <div className="relative">
                          <select
                            value={milkType}
                            onChange={(e) => setMilkType(e.target.value)}
                            className="w-full input-recessed focus:input-recessed-focus appearance-none cursor-pointer pr-8"
                          >
                            <option value="Cow">Cow</option>
                            <option value="Buffalo">Buffalo</option>
                          </select>
                          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>

                      {/* Qty (L) */}
                      <div className="w-36 flex flex-col gap-1.5 flex-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Qty (L)</label>
                        <input
                          ref={quantityInputRef}
                          type="number" min="0" step="0.1" placeholder="0.0"
                          value={quantity} onChange={(e) => setQuantity(Number(e.target.value) || '')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              fatInputRef.current?.focus()
                            }
                          }}
                          className="w-full input-recessed focus:input-recessed-focus font-mono font-medium"
                        />
                      </div>

                      {/* Fat (%) */}
                      <div className="w-32 flex flex-col gap-1.5 flex-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Fat (%)</label>
                        <input
                          ref={fatInputRef}
                          type="number" min="0" step="0.1" placeholder="4.0"
                          value={fatPercentage} onChange={(e) => setFatPercentage(Number(e.target.value) || '')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              submitBtnRef.current?.focus()
                            }
                          }}
                          className="w-full input-recessed focus:input-recessed-focus font-mono font-medium"
                        />
                      </div>

                      <div className="flex-1 hidden md:block"></div> {/* Spacer */}

                      <div className="flex items-center gap-4 mt-3 md:mt-0 w-full md:w-auto">
                        <div className="flex-none text-right">
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-0.5">Total</div>
                          <div className="text-xl font-bold tracking-tight leading-none text-onyx">₹{totalPrice.toFixed(2)}</div>
                        </div>

                        <button
                          ref={submitBtnRef}
                          type="submit"
                          disabled={isSubmitting}
                          className="px-6 md:px-8 bg-onyx text-white rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-onyx/20 hover:shadow-xl hover:scale-[1.01] transition-all duration-150 active:scale-[0.98] active:opacity-80 py-2 text-sm disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed w-full md:w-auto"
                        >
                          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm & Save'}
                        </button>
                      </div>
                    </div>

                  </div>
                </form>
              </div>
            </div>

            {/* =========================================================
            TRANSACTIONS SECTION
            ========================================================= */}
            <div className="w-full flex flex-col flex-1 min-h-0 transition-all duration-300 ease-in-out">

              <div className={`bg-white/80 backdrop-blur-2xl border border-white/40 rounded-xl shadow-sm flex flex-col min-h-0 overflow-hidden transition-all duration-300 ease-in-out ${mode === 'expand' ? 'flex-1' : 'flex-1'}`}>

                <div className="mb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0 p-3 border-b border-slate-200/50 bg-white/50">
                  <h2 className="text-sm font-bold text-onyx tracking-tight">Recent Transactions</h2>

                  <div className="flex items-center gap-2 text-xs bg-white border border-slate-200 rounded-full px-2.5 py-1 shadow-sm">
                    <span className="text-slate-500 font-bold text-[9px] tracking-widest uppercase">FETCH:</span>
                    <div className="relative flex items-center">
                      <select
                        value={fetchLimit}
                        onChange={(e) => {
                          setFetchLimit(Number(e.target.value))
                          setCurrentPage(1)
                        }}
                        className="bg-transparent text-xs font-bold text-sky-accent outline-none cursor-pointer appearance-none pr-4 pl-0.5 z-10"
                      >
                        <option value={20}>20</option>
                        <option value={40}>40</option>
                        <option value={60}>60</option>
                        <option value={100}>100</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-sky-accent absolute right-0 pointer-events-none" />
                    </div>

                    <button
                      onClick={toggleMode}
                      className="ml-1.5 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                    >
                      {mode === 'expand' ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col flex-1 min-h-0 overflow-hidden relative z-20">

                  {/* Table Header */}
                  <div className="grid grid-cols-[3rem_4rem_1fr_1fr_8rem_4rem] gap-2 px-4 py-2 border-b border-slate-200 bg-white/95 backdrop-blur-sm text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono shrink-0 min-w-[600px] sticky top-0 z-10">
                    <div className="text-center">S.No</div>
                    <div>Time</div>
                    <div>Seller Name</div>
                    <div>Data</div>
                    <div className="text-right pr-4">Total (₹)</div>
                    <div></div>
                  </div>

                  {/* Table Body */}
                  <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto custom-scrollbar">
                    <div className="flex flex-col divide-y divide-slate-100 min-w-[600px] min-h-min">
                      {paginatedTx.length === 0 ? (
                        <div className="px-6 py-12 text-center text-slate-400 font-medium">No transactions recorded yet today.</div>
                      ) : paginatedTx.map((tx, index) => (
                        <div key={tx.id} className="grid grid-cols-[3rem_4rem_1fr_1fr_8rem_4rem] gap-2 px-4 py-2.5 items-start hover:bg-slate-50/80 transition-colors">

                          <div className="text-center text-sm text-slate-400 font-mono pt-1">
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </div>

                          <div className="text-sm font-mono text-slate-500 pt-1">
                            {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <div className="w-auto px-2 h-7 rounded bg-slate-100 border border-slate-200/50 flex items-center justify-center text-[10px] font-mono font-bold tracking-widest text-slate-500">
                              [{tx.customers?.location ? tx.customers.location.substring(0, 3).toUpperCase() : 'UNK'}] #{tx.customers?.seller_id}
                            </div>
                            <span className="font-medium text-sm text-onyx">
                              {tx.customers?.name ? tx.customers.name : 'Seller'}
                            </span>
                          </div>

                          <div className="flex flex-col pt-1">
                            <div className="text-sm font-bold text-onyx">
                              <span className="font-mono">{Number(tx.quantity_litres)}L</span>
                              <span className="text-slate-300 mx-1">|</span>
                              <span className="font-mono">{Number(tx.fat_percentage)}%</span>
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1 font-medium mt-0.5">
                              {tx.milk_type === 'Cow' ? 'Cow' : 'Buffalo'} • {tx.shift}
                            </div>
                          </div>

                          <div className="flex flex-col items-end pt-1 gap-1">
                            <div className="font-mono font-bold text-[15px] text-onyx">
                              ₹{Number(tx.net_payable ?? tx.total_price).toFixed(2)}
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium font-mono">
                              @ ₹{Number(tx.price_per_litre).toFixed(2)}/L
                            </div>
                          </div>

                          <div className="flex items-center justify-end pt-1">
                            <TransactionActionCell tx={tx} onUpdate={fetchTransactions} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pagination Banner */}
                  <div className="border-t border-slate-200 p-3 flex justify-between items-center bg-white/95 backdrop-blur-sm shrink-0 sticky bottom-0 z-10">
                    <span className="text-xs font-semibold text-slate-500">
                      {transactionsList.length > 0
                        ? `Showing ${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, transactionsList.length)} of ${transactionsList.length}`
                        : '0 logs'
                      }
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-40 transition-colors cursor-pointer">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <div className="text-xs font-medium text-slate-600 px-2">
                        {currentPage} <span className="text-slate-300 mx-0.5">/</span> {totalPages}
                      </div>
                      <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-40 transition-colors cursor-pointer">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
