'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateCustomerDetails(id: string, formData: FormData) {
  const supabase = await createClient()

  const seller_id = formData.get('seller_id') as string
  const name = formData.get('name') as string
  const contact = formData.get('contact') as string
  const location_id = formData.get('location_id') as string

  if (!seller_id) {
    return { error: 'Seller ID is strictly required.' }
  }

  let finalLocationName = null
  if (location_id) {
    const { data: loc } = await supabase.from('locations').select('name').eq('id', location_id).maybeSingle()
    if (loc) finalLocationName = loc.name
  }

  const { error } = await supabase
    .from('customers')
    .update({ 
      seller_id: parseInt(seller_id, 10), 
      name: name || null, 
      contact: contact || null, 
      location: finalLocationName || null,
      location_id: location_id || null
    })
    .eq('id', id)

  if (error) {
    console.error("Update error:", error)
    if (error.message.includes('customers_location_scoped_seller_id_idx') || error.code === '23505') {
      return { error: `Seller ID #${seller_id} is already in use for this location.` }
    }
    return { error: error.message }
  }

  // Force Next.js to purge cached versions of the pages so data natively reflects
  revalidatePath(`/customers/${id}`)
  revalidatePath(`/customers`)
  revalidatePath(`/`)
  
  return { success: true }
}
