'use client'
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps, prefer-const, react/no-unescaped-entities, react-hooks/set-state-in-effect */

import React, { useState, useEffect } from 'react'
import { Users, Search, Plus, ArrowLeft, UserPlus, CirclePlus, ChevronLeft, ChevronRight, Droplets, MapPin, Phone, LogOut, Trash2, X, AlertTriangle, Filter } from 'lucide-react'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'


export default function CustomersDirectory() {
  const router = useRouter()
  const [customers, setCustomers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const [supabase] = useState(() => createClient())
  const tableContainerRef = React.useRef<HTMLDivElement>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [customerToDelete, setCustomerToDelete] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async (deleteMode: 'customer_only' | 'entire_data') => {
    if (!customerToDelete) return
    setIsDeleting(true)
    
    try {
      if (deleteMode === 'entire_data') {
        const { deleteCustomerComplete } = await import('./actions')
        const res = await deleteCustomerComplete(customerToDelete.id)
        if (res?.error) {
          alert(`Failed to delete: ${res.error}`)
        } else {
          setCustomers(prev => prev.filter(c => c.id !== customerToDelete.id))
        }
      } else {
        const { deleteCustomerOnly } = await import('./actions')
        const res = await deleteCustomerOnly(customerToDelete.id)
        if (res?.error) {
          alert(res.error)
        } else {
          setCustomers(prev => prev.filter(c => c.id !== customerToDelete.id))
        }
      }
    } catch (e: any) {
      alert(`Error: ${e.message}`)
    }
    
    setIsDeleting(false)
    setCustomerToDelete(null)
  }

  useEffect(() => {
    async function fetchSellers() {
      const { data } = await supabase.from('customers').select('*').eq('is_active', true).order('seller_id', { ascending: true })
      if (data) setCustomers(data)
      setLoading(false)
    }
    fetchSellers()
  }, [])

  const filtered = customers.filter(c => {
    const locMatch = selectedLocations.length === 0 || selectedLocations.includes(c.location || 'Unknown Location')
    if (!locMatch) return false
    
    return (
      (c.name && c.name.toLowerCase().includes(search.toLowerCase())) ||
      (c.location && c.location.toLowerCase().includes(search.toLowerCase())) ||
      (c.contact && c.contact.includes(search)) ||
      (String(c.seller_id).includes(search)) ||
      (String(c.seller_id) === search)
    )
  })

  const uniqueLocations = Array.from(new Set(customers.map(c => c.location || 'Unknown Location'))).sort()

  const totalPages = Math.ceil(filtered.length / pageSize) || 1
  
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [totalPages, currentPage])

  useEffect(() => {
    if (!tableContainerRef.current) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.contentRect.height
        const headerHeight = 56 // approx height of thead
        const rowHeight = 72    // approx height of tbody row
        const availableHeight = height - headerHeight
        const calculatedSize = Math.max(1, Math.floor(availableHeight / rowHeight))
        setPageSize(calculatedSize)
      }
    })
    observer.observe(tableContainerRef.current)
    return () => observer.disconnect()
  }, [])

  const slicedData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="min-h-[100dvh] bg-surface flex flex-col font-sans text-on-surface">
      <div className="flex flex-1 h-[100dvh] overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          onLogout={async () => { await supabase.auth.signOut(); router.push('/login'); }}
        />

        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          {/* TopBar Redesign */}
          <TopBar
            leftPillLabel="Sellers Directory"
            leftPillHref="/customers"
            leftPillActive={true}
            rightPillLabel="Register New"
            rightPillHref="/customers/new"
            rightPillActive={false}
            dateString={new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
          />

          <main className="flex-1 flex flex-col w-full px-6 pb-3 pt-3 -mt-6 overflow-hidden">

            <div className="w-full max-w-5xl mx-auto flex flex-col h-full min-h-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 shrink-0">
                <div>
                  <h2 className="text-3xl font-black text-onyx tracking-tight flex items-center gap-3">
                    <Users className="w-7 h-7 text-onyx" /> Sellers Directory
                  </h2>
                  <p className="text-slate-500 font-medium text-base mt-2">Manage all registered daily milk suppliers and view their analytics.</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {/* Location Filter Dropdown */}
                  <div className="relative group">
                    <button className="flex items-center gap-2 bg-white/80 backdrop-blur-xl border-2 border-slate-200 rounded-lg px-4 py-3 text-sm font-bold text-slate-500 hover:border-onyx transition-all shadow-sm">
                      <Filter className="w-4 h-4" />
                      {selectedLocations.length === 0 ? 'All Books' : `${selectedLocations.length} Books`}
                    </button>
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-[0px_10px_30px_rgba(0,0,0,0.05)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-2 flex flex-col gap-1 max-h-64 overflow-y-auto custom-scrollbar">
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

                  {/* Search Bar */}
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search Name or ID..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full rounded-lg border-2 border-slate-200 bg-white/80 backdrop-blur-xl pl-11 pr-4 py-3 text-sm font-bold text-onyx placeholder:text-slate-400 focus:border-onyx focus:ring-0 transition-all outline-none shadow-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col flex-1 min-h-0 overflow-hidden relative z-20">
                <div className="overflow-x-auto flex-1 min-h-0 overflow-y-auto custom-scrollbar pb-6" ref={tableContainerRef}>
                  
                  {loading ? (
                    <div className="bg-white/80 backdrop-blur-2xl rounded-xl border border-white/40 shadow-sm p-12 text-center text-slate-400 font-bold animate-pulse">
                      Loading directory...
                    </div>
                  ) : slicedData.length === 0 ? (
                    <div className="bg-white/80 backdrop-blur-2xl rounded-xl border border-white/40 shadow-sm p-12 text-center text-slate-400 font-bold">
                      No sellers found on this page.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-6">
                      {(Object.entries(
                        slicedData.reduce((acc, curr) => {
                          const loc = curr.location || 'Unknown Location'
                          if (!acc[loc]) acc[loc] = []
                          acc[loc].push(curr)
                          return acc
                        }, {} as Record<string, typeof slicedData>)
                      ) as [string, typeof slicedData][]).map(([locationName, customers]) => (
                        <div key={locationName} className="bg-white/80 backdrop-blur-2xl rounded-xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col min-w-[600px]">
                          <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200/60 flex items-center justify-between">
                            <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                              <span className="text-rose-500">📍</span> BOOK: {locationName}
                            </h3>
                            <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200/60 shadow-sm">
                              {customers.length} SELLER{customers.length !== 1 ? 'S' : ''}
                            </span>
                          </div>
                          <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-white border-b border-slate-100">
                              <tr>
                                <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-widest text-[10px]">Seller Details</th>
                                <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-widest text-[10px]">Contact Info</th>
                                <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-widest text-[10px] text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 bg-white/50">
                              {customers.map((c) => (
                                <tr key={c.id} className="hover:bg-white transition-colors group">
                                  <td className="px-6 py-4">
                                    <div className="font-black text-onyx text-base flex items-center gap-3">
                                      <span className="text-xs font-mono font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md border border-slate-200/50">
                                        [{c.location ? c.location.substring(0, 3).toUpperCase() : 'UNK'}] #{c.seller_id}
                                      </span>
                                      {c.name ? c.name : 'Seller'}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="text-sm text-onyx font-bold flex items-center gap-2">
                                      <Phone className="w-4 h-4 text-slate-400" /> {c.contact || 'N/A'}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end items-center gap-3">
                                      <Link href={`/customers/${c.id}`} className="px-4 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-full text-xs font-bold transition-colors flex items-center gap-1.5">
                                        View Details
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                        </svg>
                                      </Link>
                                      <button 
                                        onClick={() => setCustomerToDelete(c)}
                                        className="w-8 h-8 flex items-center justify-center text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-full transition-colors"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {totalPages > 1 && (
                  <div className="sticky bottom-0 z-10 bg-white/95 backdrop-blur-sm border-t border-slate-200/60 p-4 shrink-0 flex items-center justify-between min-w-[600px] w-full rounded-b-xl">
                    <span className="text-xs font-semibold text-slate-500">
                      Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:text-onyx hover:bg-slate-50 disabled:opacity-50 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <div className="text-xs font-medium text-slate-600 px-2">
                        {currentPage} <span className="text-slate-300 mx-0.5">/</span> {totalPages}
                      </div>
                      <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:text-onyx hover:bg-slate-50 disabled:opacity-50 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>

          </main>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {customerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200/50 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="bg-rose-100 p-2 rounded-full">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg">Delete Seller</h3>
              </div>
              <button 
                onClick={() => !isDeleting && setCustomerToDelete(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-md hover:bg-slate-100 transition-colors"
                disabled={isDeleting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                You are about to delete <strong className="text-slate-900">{customerToDelete.name || `#${String(customerToDelete.seller_id)} Seller`}</strong>. How would you like to proceed?
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => handleDelete('customer_only')}
                  disabled={isDeleting}
                  className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all group disabled:opacity-50"
                >
                  <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Delete Customer Only</div>
                  <div className="text-xs text-slate-500 mt-1">Archives the seller profile so they no longer appear in search/dropdowns, but safely preserves their existing transaction data.</div>
                </button>
                
                <button
                  onClick={() => handleDelete('entire_data')}
                  disabled={isDeleting}
                  className="w-full text-left p-4 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-50 hover:border-rose-300 transition-all group disabled:opacity-50"
                >
                  <div className="font-bold text-rose-700 group-hover:text-rose-800 transition-colors">Delete Customer & Entire Data</div>
                  <div className="text-xs text-rose-600/70 mt-1">Permanently removes the seller AND all their transactions and history. Cannot be undone.</div>
                </button>
              </div>
            </div>
            
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setCustomerToDelete(null)}
                disabled={isDeleting}
                className="px-5 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-200/50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
