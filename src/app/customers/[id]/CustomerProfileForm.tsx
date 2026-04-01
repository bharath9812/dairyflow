'use client'

import React, { useState } from 'react'
import { User, Phone, MapPin, Save, Loader2 } from 'lucide-react'
import { updateCustomerDetails } from './actions'

interface ProfileProps {
  id: string
  initialSellerId: string
  initialName: string
  initialContact: string
  initialLocation: string
}

export default function CustomerProfileForm({ id, initialSellerId, initialName, initialContact, initialLocation }: ProfileProps) {
  const [saving, setSaving] = useState(false)
  const [sellerId, setSellerId] = useState(initialSellerId)
  const [name, setName] = useState(initialName)
  const [contact, setContact] = useState(initialContact)
  const [location, setLocation] = useState(initialLocation)

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const formData = new FormData()
    formData.append('seller_id', sellerId)
    formData.append('name', name)
    formData.append('contact', contact)
    formData.append('location', location)

    const result = await updateCustomerDetails(id, formData)

    if (result.error) {
      alert("Error updating profile: " + result.error)
    } else {
      alert("Profile successfully updated!")
    }
    setSaving(false)
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 lg:p-8">
      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 border-b border-slate-100 pb-3 flex items-center justify-between">
        Account Identity
        <span className="text-blue-500 lowercase">#{id.slice(0, 8)}</span>
      </h3>

      <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-5">
        
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-tighter flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-blue-500" /> Seller ID Number
          </label>
          <input
            type="number" required value={sellerId} onChange={e => setSellerId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-800 font-black focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-tighter flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-blue-500" /> Full Name
          </label>
          <input
            type="text" value={name} onChange={e => setName(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800 font-bold focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-tighter flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-blue-500" /> Contact Number
          </label>
          <input
            type="text" value={contact} onChange={e => setContact(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800 font-bold focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-tighter flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-blue-500" /> Location / Village
          </label>
          <input
            type="text" value={location} onChange={e => setLocation(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800 font-bold focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all outline-none"
          />
        </div>

        <button
          type="submit" disabled={saving}
          className="xl:col-span-1 md:col-span-2 w-full bg-slate-900 hover:bg-black text-white font-black py-3.5 mt-2 rounded-xl shadow-lg shadow-slate-200 transition-all active:scale-95 flex justify-center items-center gap-2 disabled:bg-slate-300 disabled:shadow-none"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-3.5 h-3.5" /> Save Profile Changes</>}
        </button>
      </form>
    </div>
  )
}
