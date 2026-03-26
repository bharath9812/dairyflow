'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateCustomerDetails(id: string, formData: FormData) {
  const supabase = await createClient()

  const seller_id = formData.get('seller_id') as string
  const name = formData.get('name') as string
  const contact = formData.get('contact') as string
  const location = formData.get('location') as string

  if (!seller_id) {
    return { error: 'Seller ID is strictly required.' }
  }

  const { error } = await supabase
    .from('customers')
    .update({ 
      seller_id: parseInt(seller_id, 10), 
      name: name || null, 
      contact: contact || null, 
      location: location || null 
    })
    .eq('id', id)

  if (error) {
    console.error("Update error:", error)
    return { error: error.message }
  }

  // Force Next.js to purge cached versions of the pages so data natively reflects
  revalidatePath(`/customers/${id}`)
  revalidatePath(`/customers`)
  revalidatePath(`/`)
  
  return { success: true }
}
