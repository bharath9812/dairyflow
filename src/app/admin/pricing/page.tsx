import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import PricingManager from '../PricingManager'
import { Globe } from 'lucide-react'

export const metadata = {
  title: 'Commodity Pricing | Lumina',
}

export default async function CommodityPricingPage() {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // Fetch current pricing
  const { data: pricingData } = await supabase.from('global_pricing').select('*').limit(1).single()
  
  const currentCow = pricingData?.cow_price || 80
  const currentBuffalo = pricingData?.buffalo_price || 90

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Page Header */}
      <div className="flex flex-col gap-1 mt-8">
        <div className="flex items-center gap-2 text-sky-700 bg-sky-50 border border-sky-100 w-fit px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
          <Globe className="w-4 h-4" />
          Market Operations
        </div>
        <h2 className="text-3xl font-black text-onyx tracking-tight">Global Commodity Pricing</h2>
        <p className="text-slate-500 font-medium max-w-2xl mt-1">
          Manage base rates per kilogram for dairy intake. These prices serve as the terminal-wide baseline for all incoming supply calculations and vendor settlements.
        </p>
      </div>

      {/* Pricing Engine Grid */}
      <div className="grid grid-cols-1 gap-6">
        <PricingManager initialCow={currentCow} initialBuffalo={currentBuffalo} />
      </div>

    </div>
  )
}
