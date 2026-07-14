'use client'

import React, { useState, useEffect } from 'react'
import { User, Phone, MapPin, Save, Users, UserPlus, ArrowLeft, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'
import { createSeller } from './actions'

export default function NewSellerPage() {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  
  const [sellerId, setSellerId] = useState('')
  const [isFetchingId, setIsFetchingId] = useState(true)
  const [totalSellers, setTotalSellers] = useState<number>(0)
  const [locations, setLocations] = useState<any[]>([])
  const [selectedLocationId, setSelectedLocationId] = useState('')
  const [newLocationName, setNewLocationName] = useState('')
  const [isAddingNewLocation, setIsAddingNewLocation] = useState(false)

  useEffect(() => {
    async function fetchLocations() {
      const { data } = await supabase.from('locations').select('*').order('name', { ascending: true })
      if (data) {
        setLocations(data)
        if (data.length > 0) setSelectedLocationId(data[0].id)
      }
    }
    fetchLocations()
  }, [supabase])

  useEffect(() => {
    async function getNextId() {
      if (!selectedLocationId && !isAddingNewLocation) return
      setIsFetchingId(true)

      let query = supabase.from('customers').select('seller_id', { count: 'exact' }).order('seller_id', { ascending: false }).limit(1)
      if (!isAddingNewLocation && selectedLocationId) {
        query = query.eq('location_id', selectedLocationId)
      } else {
        // New location gets ID 1
        setTotalSellers(0)
        setSellerId('1')
        setIsFetchingId(false)
        return
      }

      const { data } = await query

      if (data && data.length > 0 && data[0].seller_id) {
        setTotalSellers(data[0].seller_id)
        setSellerId(String(data[0].seller_id + 1))
      } else {
        setTotalSellers(0)
        setSellerId('1')
      }
      setIsFetchingId(false)
    }
    getNextId()
  }, [supabase, selectedLocationId, isAddingNewLocation])

  return (
    <div className="min-h-[100dvh] bg-surface flex flex-col font-sans text-on-surface">
      <div className="flex flex-1 h-[100dvh] overflow-hidden">
        {/* Persistent Sidebar (Desktop) */}
        <Sidebar
          onLogout={async () => { await supabase.auth.signOut(); router.push('/login'); }}
        />

        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          {/* Top Navigation Bar */}
          <TopBar
            leftPillLabel="Sellers Directory"
            leftPillHref="/customers"
            leftPillActive={false}
            rightPillLabel="Register New"
            rightPillHref="/customers/new"
            rightPillActive={true}
            dateString={new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
          />

          <main className="flex-1 overflow-y-auto px-6 py-3 -mt-6 custom-scrollbar">
            <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
              
              <div className="flex items-center gap-3 mb-2">
                <Link href="/customers" className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                  <h1 className="text-3xl font-black text-onyx tracking-tight">Register Seller</h1>
                  <p className="text-slate-500 text-sm font-medium mt-1">Create a new customer profile and assign an ID.</p>
                </div>
              </div>

              {errorMsg && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-sm font-bold">{errorMsg}</p>
                </div>
              )}

              <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-sky-accent" />
                  <h2 className="font-bold text-slate-800">Seller Details</h2>
                </div>
                
                <form 
                  className="p-6 md:p-8 space-y-6"
                  onSubmit={async (e) => {
                    e.preventDefault()
                    setLoading(true)
                    setErrorMsg('')
                    const formData = new FormData(e.currentTarget)
                    // Inject our state location variables
                    if (isAddingNewLocation) {
                      formData.set('location_new', newLocationName)
                    } else {
                      formData.set('location_id', selectedLocationId)
                    }
                    const result = await createSeller(formData)
                    if (result?.error) {
                      setErrorMsg(result.error)
                      setLoading(false)
                    }
                  }}
                >
                  {/* Location Selector (New) */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-800 flex justify-between">
                      <span>Location / Village</span>
                      <button 
                        type="button" 
                        onClick={() => setIsAddingNewLocation(!isAddingNewLocation)}
                        className="text-xs text-sky-accent font-bold hover:underline"
                      >
                        {isAddingNewLocation ? 'Select Existing' : '+ Add New Location'}
                      </button>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      {isAddingNewLocation ? (
                        <input 
                          type="text" 
                          value={newLocationName}
                          onChange={(e) => setNewLocationName(e.target.value)}
                          placeholder="Type new village or city name..."
                          required
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 pl-12 text-slate-800 font-medium focus:border-onyx focus:ring-2 focus:ring-onyx/10 transition-all outline-none"
                        />
                      ) : (
                        <select 
                          value={selectedLocationId}
                          onChange={(e) => setSelectedLocationId(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 pl-12 text-slate-800 font-medium focus:border-onyx focus:ring-2 focus:ring-onyx/10 transition-all outline-none appearance-none"
                        >
                          {locations.length === 0 ? <option value="" disabled>No locations found...</option> : null}
                          {locations.map(loc => (
                            <option key={loc.id} value={loc.id}>{loc.name} ({loc.short_code})</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* ID Field */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-800">
                      Seller ID <span className="text-slate-400 font-normal">(Auto-assigned per location)</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        name="seller_id"
                        type="number"
                        required
                        value={sellerId}
                        onChange={(e) => setSellerId(e.target.value)}
                        placeholder={isFetchingId ? "Generating..." : "1"}
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
                        required
                        placeholder="Enter full name"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 pl-12 text-slate-800 font-medium focus:border-onyx focus:ring-2 focus:ring-onyx/10 transition-all outline-none"
                      />
                    </div>
                  </div>

                  {/* Contact */}
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
