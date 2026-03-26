'use client'

import React, { useState, useEffect } from 'react'
import { User, Phone, MapPin, ArrowLeft, Save, Droplets, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { createSeller } from './actions'

export default function NewSellerPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  
  const [sellerId, setSellerId] = useState('')
  const [isFetchingId, setIsFetchingId] = useState(true)

  useEffect(() => {
    async function getNextId() {
      const { data } = await supabase
        .from('customers')
        .select('seller_id')
        .order('seller_id', { ascending: false })
        .limit(1)

      if (data && data.length > 0 && data[0].seller_id) {
        setSellerId(String(data[0].seller_id + 1).padStart(3, '0'))
      } else {
        setSellerId('001')
      }
      setIsFetchingId(false)
    }
    getNextId()
  }, [supabase])

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
           <Link href="/customers" className="text-slate-500 hover:text-blue-600 transition-colors hidden sm:block">
             Sellers Directory
           </Link>
           <div className="w-px h-6 bg-slate-200 hidden md:block"></div>
           <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors">
             <ArrowLeft className="w-4 h-4" /> Back to Dashboard
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
      <main className="flex-1 flex flex-col w-full max-w-3xl mx-auto p-4 lg:p-10 lg:mt-8">
        
        <div className="mb-6 flex flex-col gap-1">
          <h2 className="text-2xl lg:text-3xl font-bold text-slate-800 tracking-tight">Register Seller</h2>
          <p className="text-slate-500 font-medium">Add a new daily milk supplier to the database.</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-[0_2px_10px_rgba(0,0,0,0.03)] flex flex-col overflow-hidden">
                    <form action={async (formData) => {
              setLoading(true)
              const res = await createSeller(formData)
              if (res?.error) {
                alert(res.error)
                setLoading(false)
              }
            }} className="p-6 sm:p-8 space-y-6 lg:space-y-8">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                <div className="space-y-1.5 relative md:col-span-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                    Seller ID Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      name="seller_id"
                      type="number"
                      required
                      value={sellerId}
                      onChange={(e) => setSellerId(e.target.value)}
                      placeholder={isFetchingId ? "Generating..." : "001"}
                      readOnly={isFetchingId}
                      className={`w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3.5 pl-12 text-slate-800 font-bold focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all outline-none ${isFetchingId ? 'opacity-50' : 'opacity-100'}`}
                    />
                  </div>
                </div>

                <div className="h-px bg-slate-100 md:col-span-2" />

                <div className="space-y-1.5 relative md:col-span-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      name="name"
                      type="text" 
                      placeholder="Enter full name"
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3.5 pl-12 text-slate-800 font-bold focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 relative">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                     Contact Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      name="contact"
                      type="text" 
                      placeholder="Ex: 9876543210"
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3.5 pl-12 text-slate-800 font-bold focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 relative">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                     Location / Village
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      name="location"
                      type="text" 
                      placeholder="Enter village or city"
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3.5 pl-12 text-slate-800 font-bold focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all outline-none"
                    />
                  </div>
                </div>
              </div>

            {/* Submit Border Footer */}
            <div className="pt-6 mt-4 border-t border-slate-100 flex justify-end">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 text-white font-bold text-sm lg:text-base px-8 py-3.5 rounded-lg shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-slate-300 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save Seller
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      </main>
    </div>
  )
}
