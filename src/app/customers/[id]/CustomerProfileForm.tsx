'use client'

import React, { useState, useEffect } from 'react'
import { User, Phone, MapPin, Save, Loader2, ChevronUp } from 'lucide-react'
import { updateCustomerDetails } from './actions'

interface ProfileProps {
  id: string
  initialSellerId: string
  initialName: string
  initialContact: string
  initialLocationId: string
  locations: any[]
}

export default function CustomerProfileForm({ id, initialSellerId, initialName, initialContact, initialLocationId, locations }: ProfileProps) {
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [sellerId, setSellerId] = useState(initialSellerId)
  const [name, setName] = useState(initialName || '')
  const [contact, setContact] = useState(initialContact || '')
  const [locationId, setLocationId] = useState(initialLocationId || '')
  const [status, setStatus] = useState<{ type: 'error' | 'success', message: string } | null>(null)

  useEffect(() => {
    const savedState = localStorage.getItem(`customer-profile-expanded-${id}`)
    if (savedState) {
      setExpanded(savedState === 'true')
    }
  }, [id])

  const toggleExpanded = () => {
    const newState = !expanded
    setExpanded(newState)
    localStorage.setItem(`customer-profile-expanded-${id}`, String(newState))
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    setStatus(null)

    const formData = new FormData()
    formData.append('seller_id', sellerId)
    formData.append('name', name)
    formData.append('contact', contact)
    formData.append('location_id', locationId)

    const result = await updateCustomerDetails(id, formData)

    if (result.error) {
      setStatus({ type: 'error', message: result.error })
    } else {
      setStatus({ type: 'success', message: 'Profile successfully updated!' })
      // Auto-hide success after 4 seconds
      setTimeout(() => setStatus(null), 4000)
    }
    setSaving(false)
  }

  return (
    <div className="bg-white/70 backdrop-blur-2xl border border-white/40 rounded-xl p-3 flex flex-col shadow-sm">
      
      {/* Collapsible Header */}
      <div 
        onClick={toggleExpanded} 
        className="flex justify-between items-center cursor-pointer mb-2"
      >
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Account Identity</h3>
        <div className="flex items-center gap-2">
          {!expanded && <span className="text-[10px] text-slate-400 italic mr-1">Expand to edit details</span>}
          <span className="text-xs font-mono text-teal-600">#{id.slice(0, 8)}</span>
          <ChevronUp className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${expanded ? '' : 'rotate-180'}`} />
        </div>
      </div>

      {/* Expandable Content */}
      {expanded && (
        <form onSubmit={handleUpdate} className="flex flex-col gap-3 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
          
          {status && (
            <div className={`p-3 rounded-lg text-sm font-medium flex items-start gap-2 ${status.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
              <span>{status.message}</span>
            </div>
          )}

          {/* Seller ID */}
          <div>
            <label className="text-xs text-slate-500 font-medium flex items-center gap-1 mb-1">
              <User className="w-3.5 h-3.5" /> SELLER ID NUMBER
            </label>
            <input
              type="number" required value={sellerId} onChange={e => setSellerId(e.target.value)}
              className="w-full bg-slate-100 text-onyx text-sm p-2 rounded-md border border-slate-200/50 focus:outline-none cursor-default font-mono"
              readOnly
            />
          </div>

          {/* Full Name */}
          <div>
            <label className="text-xs text-slate-500 font-medium flex items-center gap-1 mb-1">
              <User className="w-3.5 h-3.5" /> FULL NAME
            </label>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-white text-onyx text-sm p-2 rounded-md border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
            />
          </div>

          {/* Contact Number */}
          <div>
            <label className="text-xs text-slate-500 font-medium flex items-center gap-1 mb-1">
              <Phone className="w-3.5 h-3.5" /> CONTACT NUMBER
            </label>
            <input
              type="text" value={contact} onChange={e => setContact(e.target.value)}
              className="w-full bg-white text-onyx text-sm p-2 rounded-md border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all font-mono"
            />
          </div>

          {/* Location */}
          <div>
            <label className="text-xs text-slate-500 font-medium flex items-center gap-1 mb-1">
              <MapPin className="w-3.5 h-3.5" /> LOCATION / VILLAGE
            </label>
            <select
              value={locationId} onChange={e => setLocationId(e.target.value)}
              className="w-full bg-white text-onyx text-sm p-2 rounded-md border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
            >
              <option value="" disabled>Select a location</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name} ({loc.short_code})</option>
              ))}
            </select>
          </div>

          {/* Save Button */}
          <button
            type="submit" disabled={saving}
            className="w-full bg-onyx text-white font-medium text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save Profile Changes</>}
          </button>
        </form>
      )}
    </div>
  )
}
