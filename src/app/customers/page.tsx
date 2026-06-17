'use client'
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps, prefer-const, react/no-unescaped-entities, react-hooks/set-state-in-effect */

import React, { useState, useEffect } from 'react'
import { Users, Search, Plus, ArrowLeft, UserPlus, CirclePlus, ChevronLeft, ChevronRight, Droplets, MapPin, Phone, LogOut, Trash2, X, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'


export default function CustomersDirectory() {
  const router = useRouter()
  const [customers, setCustomers] = useState<any[]>([])
  const [search, setSearch] = useState('')
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

  const filtered = customers.filter(c =>
    (c.name && c.name.toLowerCase().includes(search.toLowerCase())) ||
    (c.location && c.location.toLowerCase().includes(search.toLowerCase())) ||
    (c.contact && c.contact.includes(search)) ||
    (String(c.seller_id).padStart(3, '0').includes(search)) ||
    (String(c.seller_id) === search)
  )

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
          links={[
            { label: 'Sellers Directory', href: '/customers', icon: <Users className="w-5 h-5" />, isActive: true },
            { label: 'Register New', href: '/customers/new', icon: <UserPlus className="w-5 h-5" />, isActive: false }
          ]}
          onLogout={async () => { await supabase.auth.signOut(); router.push('/login'); }}
        />

        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          {/* TopBar Redesign */}
          <TopBar
            leftPillLabel="Standard Dashboard"
            leftPillHref="/"
            leftPillActive={false}
            rightPillLabel="Admin"
            rightPillHref="/admin"
            rightPillActive={false}
          />

          <main className="flex-1 flex flex-col w-full px-4 md:px-6 lg:px-10 xl:px-12 pb-8 pt-4 lg:pt-8 overflow-hidden">

            <div className="w-full max-w-5xl mx-auto flex flex-col h-full min-h-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 shrink-0">
                <div>
                  <h2 className="text-3xl font-black text-onyx tracking-tight flex items-center gap-3">
                    <Users className="w-7 h-7 text-onyx" /> Sellers Directory
                  </h2>
                  <p className="text-slate-500 font-medium text-base mt-2">Manage all registered daily milk suppliers and view their analytics.</p>
                </div>

                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search Name or Location..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-lg border-2 border-slate-200 bg-white/80 backdrop-blur-xl pl-11 pr-4 py-3 text-sm font-bold text-onyx placeholder:text-slate-400 focus:border-onyx focus:ring-0 transition-all outline-none shadow-sm"
                  />
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-2xl rounded-xl border border-white/40 shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden relative z-20">

                <div className="overflow-x-auto flex-1 min-h-0 overflow-y-auto custom-scrollbar" ref={tableContainerRef}>
                  <table className="w-full text-left text-sm whitespace-nowrap min-w-[600px]">
                    <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-200/60">
                      <tr>
                        <th className="px-6 py-5 font-bold text-slate-400 uppercase tracking-widest text-xs bg-transparent">Seller Details</th>
                        <th className="px-6 py-5 font-bold text-slate-400 uppercase tracking-widest text-xs bg-transparent">Contact Info</th>
                        <th className="px-6 py-5 font-bold text-slate-400 uppercase tracking-widest text-xs text-right bg-transparent">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/80">
                      {loading ? (
                        <tr>
                          <td colSpan={3} className="px-6 py-12 text-center text-slate-400 font-bold animate-pulse">Loading directory...</td>
                        </tr>
                      ) : slicedData.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-6 py-12 text-center text-slate-400 font-bold">No sellers found on this page.</td>
                        </tr>
                      ) : slicedData.map((c) => (
                        <tr key={c.id} className="hover:bg-white/50 transition-colors group">

                          <td className="px-6 py-5">
                            <div className="font-black text-onyx text-base flex items-center gap-3">
                              <span className="text-xs font-mono font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md border border-slate-200/50">
                                #{String(c.seller_id).padStart(3, '0')}
                              </span>
                              {c.name ? c.name : `${String(c.seller_id).padStart(3, '0')} Seller`}
                            </div>
                            <div className="text-sm text-slate-500 font-medium flex items-center gap-1.5 mt-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" /> {c.location || 'Unknown Location'}
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <div className="text-sm text-onyx font-bold flex items-center gap-2">
                              <Phone className="w-4 h-4 text-slate-400" /> {c.contact || 'N/A'}
                            </div>
                          </td>

                          <td className="px-6 py-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/customers/${c.id}`}
                                className="inline-flex items-center gap-1.5 text-xs font-black text-teal-700 bg-teal-50 hover:bg-teal-100 px-4 py-2.5 rounded-full transition-all border border-teal-100/50 hover:shadow-sm"
                              >
                                View Details <ChevronRight className="w-3.5 h-3.5" />
                              </Link>
                              <button
                                onClick={() => setCustomerToDelete(c)}
                                className="p-2.5 rounded-full bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 transition-colors border border-rose-100/50"
                                title="Delete Seller"
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

                {totalPages > 1 && (
                  <div className="sticky bottom-0 z-10 bg-white/95 backdrop-blur-sm border-t border-slate-200/60 p-4 shrink-0 flex items-center justify-between min-w-[600px] w-full">
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
                You are about to delete <strong className="text-slate-900">{customerToDelete.name || `#${String(customerToDelete.seller_id).padStart(3, '0')} Seller`}</strong>. How would you like to proceed?
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
                  <div className="text-xs text-rose-600/70 mt-1">Permanently removes the seller AND all their transactions, loans, and history. Cannot be undone.</div>
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
