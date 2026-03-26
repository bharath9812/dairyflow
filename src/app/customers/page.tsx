'use client'

import React, { useState, useEffect } from 'react'
import { Users, Search, ArrowLeft, ChevronRight, Droplets, MapPin, Phone, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function CustomersDirectory() {
  const router = useRouter()
  const [customers, setCustomers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function fetchSellers() {
      const { data } = await supabase.from('customers').select('*').order('seller_id', { ascending: true })
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

  return (
    <div className="min-h-[100dvh] bg-slate-50 flex flex-col font-sans text-slate-800">
      
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 px-6 lg:px-10 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2">
           <div className="bg-blue-600 p-2 rounded-lg text-white shadow-sm">
             <Droplets className="w-5 h-5" />
           </div>
           <Link href="/" className="text-xl font-bold tracking-tight text-slate-800 hidden sm:block">
             DairyFlow<span className="text-blue-600 text-2xl leading-none">.</span>
           </Link>
        </div>
        <div className="flex items-center gap-6 text-sm font-semibold">
           <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors">
             <ArrowLeft className="w-4 h-4" /> Dashboard
           </Link>
           <div className="w-px h-6 bg-slate-200 hidden md:block"></div>
           <Link href="/customers/new" className="hidden md:block bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors">
             + New Seller
           </Link>
           <div className="w-px h-6 bg-slate-200 hidden md:block"></div>
           <button 
             onClick={async () => { await supabase.auth.signOut(); router.push('/login') }}
             className="flex items-center gap-2 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors font-bold"
           >
             <LogOut className="w-4 h-4" /> Log Out
           </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col w-full max-w-6xl mx-auto p-4 lg:p-8">
        
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
              <Users className="w-7 h-7 text-blue-600" /> Sellers Directory
            </h2>
            <p className="text-slate-500 font-medium mt-1">Manage all registered daily milk suppliers and view their analytics.</p>
          </div>
          
          <div className="relative w-full sm:w-auto">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search Name or Location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-80 rounded-lg border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-sm font-medium text-slate-800 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-none shadow-sm"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-[0_2px_10px_rgba(0,0,0,0.03)] flex flex-col overflow-hidden">
          
          <div className="overflow-x-auto">
             <table className="w-full text-left text-sm whitespace-nowrap">
               <thead className="bg-slate-50 border-b border-slate-200">
                 <tr>
                   <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Seller Details</th>
                   <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Contact Info</th>
                   <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs text-right">Action</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {loading ? (
                   <tr>
                     <td colSpan={3} className="px-6 py-12 text-center text-slate-400 font-medium animate-pulse">Loading directory...</td>
                   </tr>
                 ) : filtered.length === 0 ? (
                   <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-slate-400 font-medium">No sellers found. Try a different search.</td>
                   </tr>
                 ) : filtered.map((c) => (
                   <tr key={c.id} className="hover:bg-slate-50/80 transition-colors group">
                     
                     <td className="px-6 py-4">
                        <div className="font-bold text-slate-800 text-base flex items-center gap-2">
                          <span className="text-xs font-mono bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100">
                            #{String(c.seller_id).padStart(3, '0')}
                          </span>
                          {c.name ? c.name : `${String(c.seller_id).padStart(3, '0')} Seller`}
                        </div>
                        <div className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" /> {c.location || 'Unknown Location'}
                        </div>
                     </td>
                     
                     <td className="px-6 py-4">
                        <div className="text-sm text-slate-700 font-medium flex items-center gap-2">
                          <Phone className="w-4 h-4 text-slate-400" /> {c.contact || 'N/A'}
                        </div>
                     </td>
                     
                     <td className="px-6 py-4 text-right">
                        <Link 
                          href={`/customers/${c.id}`} 
                          className="inline-flex items-center gap-1 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors border border-blue-100"
                        >
                          View Details <ChevronRight className="w-4 h-4" />
                        </Link>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>

        </div>

      </main>
    </div>
  )
}
