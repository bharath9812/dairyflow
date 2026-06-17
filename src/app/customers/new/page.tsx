'use client'

import React, { useState, useEffect } from 'react'
import { User, Phone, MapPin, Save, Users, UserPlus, ArrowLeft, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Sidebar from '@/components/Sidebar'
import { createSeller } from './actions'

export default function NewSellerPage() {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  
  const [sellerId, setSellerId] = useState('')
  const [isFetchingId, setIsFetchingId] = useState(true)
  const [totalSellers, setTotalSellers] = useState<number>(0)

  useEffect(() => {
    async function getNextId() {
      const { data, count } = await supabase
        .from('customers')
        .select('seller_id', { count: 'exact' })
        .order('seller_id', { ascending: false })
        .limit(1)

      if (data && data.length > 0 && data[0].seller_id) {
        setTotalSellers(data[0].seller_id)
        setSellerId(String(data[0].seller_id + 1).padStart(3, '0'))
      } else {
        setTotalSellers(0)
        setSellerId('001')
      }
      setIsFetchingId(false)
    }
    getNextId()
  }, [supabase])

  return (
    <div className="min-h-[100dvh] bg-surface flex flex-col font-sans text-on-surface">
      <div className="flex flex-1 h-[100dvh] overflow-hidden">
        {/* Persistent Sidebar (Desktop) */}
        <Sidebar
          links={[
            { label: 'Sellers Directory', href: '/customers', icon: <Users className="w-5 h-5" />, isActive: false },
            { label: 'Register New', href: '/customers/new', icon: <UserPlus className="w-5 h-5" />, isActive: true },
          ]}
          onLogout={async () => { await supabase.auth.signOut(); router.push('/login'); }}
        />

        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          {/* Top Navigation Bar */}
          <header className="h-[60px] flex items-center justify-end px-6 lg:px-10 shrink-0 bg-transparent relative z-20 gap-6">
            <Link href="/customers" className="text-sm font-semibold text-slate-500 hover:text-onyx transition-colors">
              Sellers Directory
            </Link>
            <Link href="/" className="text-sm font-semibold text-slate-500 hover:text-onyx transition-colors flex items-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>
          </header>

          {/* Main Content — Viewport Centered */}
          <main className="flex-1 flex flex-col items-center justify-start p-6 md:p-12 pt-4 md:pt-8 overflow-y-auto custom-scrollbar">

            <div className="max-w-2xl w-full flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500">

              {/* Registration Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <form action={async (formData) => {
                  setLoading(true)
                  setErrorMsg('')
                  const res = await createSeller(formData)
                  if (res?.error) {
                    setErrorMsg(res.error)
                    setLoading(false)
                  }
                }} className="p-8 sm:p-10 flex flex-col gap-7">
                  
                  {/* Title inside card */}
                  <div className="flex flex-col gap-1">
                    <h1 className="text-xl font-bold text-onyx tracking-tight">Register Seller</h1>
                    <p className="text-sm text-slate-500">Add a new daily milk supplier to the database.</p>
                  </div>

                  {/* Premium Error Banner */}
                  {errorMsg && (
                    <div className="bg-rose-50 border border-rose-200/60 p-4 rounded-xl flex items-start gap-3 animate-in fade-in zoom-in-95 duration-200">
                      <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                      <div className="flex flex-col">
                        <h4 className="text-sm font-bold text-rose-800">Registration Failed</h4>
                        <p className="text-xs font-medium text-rose-600/80 mt-0.5">{errorMsg}</p>
                      </div>
                    </div>
                  )}

                  {/* Seller ID Number */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-800 flex items-center gap-1">
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
                        className={`w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 pl-12 text-slate-800 font-medium focus:border-onyx focus:ring-2 focus:ring-onyx/10 transition-all outline-none ${isFetchingId ? 'opacity-50' : 'opacity-100'}`}
                      />
                    </div>
                  </div>

                  {/* Full Name */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-800">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        name="name"
                        type="text" 
                        placeholder="Enter full name"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 pl-12 text-slate-800 font-medium focus:border-onyx focus:ring-2 focus:ring-onyx/10 transition-all outline-none"
                      />
                    </div>
                  </div>

                  {/* Contact + Location — side by side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-slate-800">
                        Contact Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input 
                          name="contact"
                          type="text" 
                          placeholder="Ex: 9876543210"
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 pl-12 text-slate-800 font-medium focus:border-onyx focus:ring-2 focus:ring-onyx/10 transition-all outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-slate-800">
                        Location / Village
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input 
                          name="location"
                          type="text" 
                          placeholder="Enter village or city"
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 pl-12 text-slate-800 font-medium focus:border-onyx focus:ring-2 focus:ring-onyx/10 transition-all outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Divider + Submit */}
                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="bg-onyx hover:bg-onyx/90 disabled:bg-slate-300 disabled:text-slate-500 text-white font-bold text-sm px-7 py-3 rounded-xl shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:hover:scale-100 disabled:cursor-not-allowed"
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

              {/* Total Registered Sellers stat bar */}
              <div className="bg-slate-100 rounded-2xl border border-slate-200/60 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-slate-500" />
                  <span className="text-sm font-semibold text-slate-700">Total Registered Sellers</span>
                </div>
                <span className="bg-white text-slate-800 text-sm font-bold px-3 py-1 rounded-lg border border-slate-200 shadow-sm">
                  {totalSellers}
                </span>
              </div>

            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
