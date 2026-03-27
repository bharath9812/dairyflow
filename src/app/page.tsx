'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, Droplets, User, DollarSign, Calculator, Percent, ChevronLeft, ChevronRight, Loader2, LogOut, Users, ShieldCheck, Pencil } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import TransactionActionCell from '@/components/TransactionActionCell'

export default function TransactionDashboard() {
  const router = useRouter()
  const supabase = createClient()
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [milkType, setMilkType] = useState('Cow')
  const [shift, setShift] = useState('Morning')
  const [quantity, setQuantity] = useState<number | ''>('')
  const [fatPercentage, setFatPercentage] = useState<number | ''>('')
  const [price, setPrice] = useState<number | ''>('')
  
  const [customersList, setCustomersList] = useState<{id: string, seller_id: number, name: string, location: string, contact: string}[]>([])
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const [transactionsList, setTransactionsList] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sessionUser, setSessionUser] = useState<{ id: string, email?: string, name?: string } | null>(null)

  const itemsPerPage = 8
  const totalPages = Math.ceil(transactionsList.length / itemsPerPage) || 1
  const paginatedTx = transactionsList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const filteredCustomers = customersList.filter(c => {
    const term = (customerSearch || '').trim().toLowerCase()
    if (!term) return true
    return (
      (c.name && c.name.toLowerCase().includes(term)) || 
      (c.location && c.location.toLowerCase().includes(term)) ||
      (c.contact && c.contact.includes(term)) ||
      (String(c.seller_id).padStart(3, '0').includes(term)) ||
      (String(c.seller_id) === term)
    )
  })

  useEffect(() => {
    async function fetchData() {
      const today = new Date().toISOString().split('T')[0]
      const [custRes, txRes] = await Promise.all([
        supabase.from('customers').select('id, seller_id, name, location, contact').order('seller_id', { ascending: true }),
        supabase
          .from('transactions')
          .select('*, customers(seller_id, name)')
          .eq('transaction_date', today)
          .order('created_at', { ascending: false })
      ])
      if (custRes.data) setCustomersList(custRes.data)
      if (txRes.data) setTransactionsList(txRes.data)
    }
    fetchData()

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const metaName = data.user.user_metadata?.full_name || data.user.user_metadata?.name || data.user.email?.split('@')[0]
        setSessionUser({ id: data.user.id, email: data.user.email, name: metaName })
      }
    })
  }, [])

  const quantityNum = Number(quantity) || 0
  const fatNum = Number(fatPercentage) || 0
  const priceNum = Number(price) || 0
  
  const totalPrice = (quantityNum * fatNum * priceNum) / 100

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerId) return alert('Please select a valid registered seller.')
    if (!quantity || !fatPercentage || !price) return alert('Please fill out all quantity and rate fields.')

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

    const { data, error } = await supabase.from('transactions').insert([newTx]).select('*, customers(name)').single()

    if (error) {
      console.error(error)
      alert('Failed to save transaction: ' + error.message)
    } else if (data) {
      setTransactionsList(prev => [data, ...prev])
      setQuantity('')
      setFatPercentage('')
      setCustomerSearch('')
      setCustomerId('')
      setCurrentPage(1)
    }

    setIsSubmitting(false)
  }

  return (
    <div className="min-h-[100dvh] bg-slate-50 flex flex-col font-sans text-slate-800">
      
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 px-6 lg:px-10 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
           <div className="bg-blue-600 p-2 rounded-lg text-white shadow-sm">
             <Droplets className="w-5 h-5" />
           </div>
           <div className="text-xl font-bold tracking-tight text-slate-800 hidden sm:block">
             DairyFlow<span className="text-blue-600 text-2xl leading-none">.</span>
           </div>
        </Link>
        <div className="flex items-center gap-6 text-sm font-semibold">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Desktop links */}
              <Link href="/customers" className="hidden sm:flex items-center gap-2 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl transition-all shadow-sm">
                <Users className="w-4 h-4 text-blue-500" /> Sellers Directory
              </Link>
              <Link href="/admin" className="hidden sm:flex items-center gap-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 px-4 py-2 rounded-xl transition-all shadow-sm">
                <ShieldCheck className="w-4 h-4" /> Admin Page
              </Link>
              
              {/* Mobile icon links */}
              <Link href="/customers" className="sm:hidden flex items-center justify-center bg-white border border-slate-200 w-10 h-10 rounded-lg text-slate-600 shadow-sm active:bg-slate-50 transition-colors">
                <Users className="w-5 h-5 text-blue-500" />
              </Link>
              <Link href="/admin" className="sm:hidden flex items-center justify-center bg-slate-900 w-10 h-10 rounded-lg text-white shadow-sm active:bg-slate-800 transition-colors">
                <ShieldCheck className="w-5 h-5" />
              </Link>
            </div>
           <span suppressHydrationWarning className="text-slate-500 hidden md:block">
             {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
           </span>
           <div className="w-px h-6 bg-slate-200 hidden md:block"></div>
            <button 
              onClick={async () => { await supabase.auth.signOut(); router.push('/login') }}
              className="flex items-center justify-center gap-2 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 sm:px-3 sm:py-1.5 h-10 sm:h-auto rounded-lg transition-colors font-bold"
            >
              <LogOut className="w-4 h-4 hidden sm:block" />
              <LogOut className="w-5 h-5 sm:hidden" />
              <span className="hidden sm:block">Log Out</span>
            </button>
        </div>
      </header>

      {/* Main Dashboard Workspace */}
      <main className="flex-1 flex flex-col xl:flex-row w-full max-w-[1700px] mx-auto p-4 lg:p-8 gap-6 xl:gap-10 items-stretch">
        
        {/* =========================================================
            LEFT COLUMN: FORM ENTRY
            ========================================================= */}
        <div className="w-full xl:w-[55%] flex flex-col">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg lg:text-xl font-bold text-slate-800 tracking-tight">Daily Milk Entry</h2>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-[0_2px_10px_rgba(0,0,0,0.03)] flex flex-col overflow-hidden h-full">
            <form id="entry-form" onSubmit={handleSubmit} className="p-6 lg:p-8 flex-1 flex flex-col space-y-6 lg:space-y-8">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                
                {/* Seller Selection */}
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex justify-between">
                    Seller / Customer Name
                    <Link href="/customers/new" className="text-blue-600 hover:text-blue-800 normal-case tracking-normal border-b border-transparent hover:border-blue-600 font-bold transition-all">
                      + Register New
                    </Link>
                  </label>
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="Type Name or Location to search..."
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm lg:text-base text-slate-800 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-none shadow-sm"
                      value={customerSearch}
                      onFocus={() => setIsDropdownOpen(true)}
                      onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value)
                        setIsDropdownOpen(true)
                        setCustomerId('') // Reset ID since text changed
                      }}
                      autoComplete="off"
                    />
                    
                    {isDropdownOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.1)] max-h-60 overflow-y-auto custom-scrollbar">
                        {filteredCustomers.length > 0 ? (
                          filteredCustomers.map(c => (
                            <div 
                              key={c.id} 
                              className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors"
                              onClick={() => {
                                setCustomerId(c.id)
                                setCustomerSearch(c.name || `#${String(c.seller_id).padStart(3, '0')} Seller`)
                                setIsDropdownOpen(false)
                              }}
                            >
                              <div className="font-bold text-slate-800 flex items-center gap-2">
                                <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-mono">#{String(c.seller_id).padStart(3, '0')}</span>
                                {c.name ? c.name : `${String(c.seller_id).padStart(3, '0')} Seller`}
                              </div>
                              <div className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> {c.location || 'Unknown Location'}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="px-5 py-6 text-sm text-slate-500 text-center font-medium bg-slate-50/50">
                            No sellers found by Name or Location. 
                            <span className="block mt-1 text-xs text-slate-400">Click '+ Register New' to add them.</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                  {/* Date */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Transaction Date</label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input 
                        type="date" 
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 py-3 text-sm lg:text-base text-slate-800 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-none shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Milk Type */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Milk Type</label>
                    <select 
                      value={milkType}
                      onChange={(e) => setMilkType(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm lg:text-base text-slate-800 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-none shadow-sm cursor-pointer"
                    >
                      <option value="Cow">🐄 Cow Milk</option>
                      <option value="Buffalo">🐃 Buffalo Milk</option>
                    </select>
                  </div>

                  {/* Shift */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Shift</label>
                    <select 
                      value={shift}
                      onChange={(e) => setShift(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm lg:text-base text-slate-800 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-none shadow-sm cursor-pointer"
                    >
                      <option value="Morning">☀️ Morning</option>
                      <option value="Evening">🌙 Evening</option>
                    </select>
                  </div>
                </div>
                
                {/* 3 Metric Inputs Row */}
                <div className="md:col-span-2 grid grid-cols-3 gap-4 lg:gap-6 mt-2">
                  
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quantity <span className="text-slate-400 lowercase">(litres)</span></label>
                    <div className="relative">
                      <Calculator className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:block" />
                      <input 
                        type="number" min="0" step="0.1" placeholder="0.0"
                        value={quantity} onChange={(e) => setQuantity(Number(e.target.value) || '')}
                        className="w-full rounded-lg border border-slate-300 bg-white sm:pl-10 px-3 sm:pr-4 py-3 text-sm lg:text-base text-slate-800 font-bold focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-none shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fat <span className="text-slate-400 lowercase">(%)</span></label>
                    <div className="relative">
                      <Percent className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:block" />
                      <input 
                        type="number" min="0" step="0.1" placeholder="4.0"
                        value={fatPercentage} onChange={(e) => setFatPercentage(Number(e.target.value) || '')}
                        className="w-full rounded-lg border border-slate-300 bg-white sm:pl-10 px-3 sm:pr-4 py-3 text-sm lg:text-base text-slate-800 font-bold focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-none shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rate <span className="text-slate-400 lowercase">(/kg)</span></label>
                    <div className="relative">
                      <span className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none font-bold hidden sm:block pl-0.5">₹</span>
                      <input 
                        type="number" min="0" step="0.5" placeholder="0.00"
                        value={price} onChange={(e) => setPrice(Number(e.target.value) || '')}
                        className="w-full rounded-lg border border-slate-300 bg-white sm:pl-9 px-3 sm:pr-4 py-3 text-sm lg:text-base text-slate-800 font-bold focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-none shadow-sm"
                      />
                    </div>
                  </div>

                </div>

              </div>
            </form>

            {/* Entry Summary & Submit Footer */}
            <div className="bg-slate-50 border-t border-slate-200 p-6 lg:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shrink-0">
              <div className="flex flex-col items-center sm:items-start w-full sm:w-auto">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Calculated Total</span>
                <span className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight">₹{totalPrice.toFixed(2)}</span>
              </div>
              
              <button 
                type="submit" 
                form="entry-form"
                disabled={isSubmitting}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 text-white font-bold text-sm lg:text-base px-10 py-4 rounded-lg shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Confirm & Save'}
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================
            RIGHT COLUMN: DATA TABLE
            ========================================================= */}
        <div className="w-full xl:w-[45%] flex flex-col h-[500px] xl:h-auto">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg lg:text-xl font-bold text-slate-800 tracking-tight">Recent Logs</h2>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-md border border-blue-100">
              Today's View
            </span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-[0_2px_10px_rgba(0,0,0,0.03)] flex flex-col overflow-hidden h-full">
            
            <div className="flex-1 overflow-x-auto overflow-y-auto">
               <table className="w-full text-left text-sm whitespace-nowrap">
                 <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 z-10">
                   <tr>
                     <th className="px-3 py-4 font-bold text-slate-600 uppercase tracking-wider text-[11px] text-center">S.No</th>
                      <th className="px-5 py-4 font-bold text-slate-600 uppercase tracking-wider text-[11px]">Time</th>
                     <th className="px-4 py-4 font-bold text-slate-600 uppercase tracking-wider text-[11px]">Seller Name</th>
                     <th className="px-4 py-4 font-bold text-slate-600 uppercase tracking-wider text-[11px] text-right">Data</th>
                     <th className="px-5 py-4 font-bold text-slate-600 uppercase tracking-wider text-[11px] text-right">Total (₹)</th>
                     <th className="px-4 py-4 border-b border-slate-200"></th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {paginatedTx.length === 0 ? (
                     <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">No transactions recorded yet today.</td>
                     </tr>
                   ) : paginatedTx.map((tx, index) => (
                     <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                       <td className="px-3 py-4 text-center text-slate-400 font-mono text-[11px]">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </td>
                        <td className="px-5 py-4 text-slate-500 text-xs">
                          {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </td>
                       <td className="px-4 py-4 font-medium text-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 tracking-wider">
                              #{String(tx.customers?.seller_id || 0).padStart(3, '0')}
                            </span>
                            {tx.customers?.name ? tx.customers.name : `${String(tx.customers?.seller_id || 0).padStart(3, '0')} Seller`}
                          </div>
                       </td>
                       <td className="px-4 py-4 text-right">
                          <div className="text-slate-800 font-semibold">{Number(tx.quantity_litres)}L <span className="text-slate-300 mx-1">|</span> {Number(tx.fat_percentage)}%</div>
                          <div className="text-[10px] text-slate-400 font-medium">{tx.milk_type === 'Cow' ? '🐄 Cow' : '🐃 Buffalo'} • {tx.shift}</div>
                       </td>
                       <td className="px-5 py-4 text-right font-black text-slate-800">
                          ₹{Number(tx.total_price).toFixed(2)}
                       </td>
                       <td className="px-4 py-4 text-right">
                         <TransactionActionCell tx={tx} onUpdate={() => {
                            supabase.from('transactions').select('*, customers(seller_id, name)')
                              .eq('transaction_date', new Date().toISOString().split('T')[0])
                              .order('created_at', { ascending: false })
                              .then(res => res.data && setTransactionsList(res.data))
                         }} />
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>

            {/* Pagination Banner */}
            <div className="bg-white border-t border-slate-200 p-4 shrink-0 flex items-center justify-between">
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

      </main>
    </div>
  )
}
