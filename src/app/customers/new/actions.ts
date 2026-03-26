'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createSeller(formData: FormData) {
  const supabase = await createClient()

  const seller_id = formData.get('seller_id') as string // Optional explicit ID
  const name = formData.get('name') as string
  const contact = formData.get('contact') as string
  const location = formData.get('location') as string

  if (!seller_id) {
    return { error: 'Seller ID is strictly required to register a new user.' }
  }

  const { data, error } = await supabase.from('customers').insert([
    {
      seller_id: parseInt(seller_id, 10),
      name: name || null,
      contact: contact || null,
      location: location || null
    }
  ]).select()

  if (error) {
    console.error("Insertion error:", error)
    return { error: error.message }
  }

  revalidatePath('/')
  revalidatePath('/customers')
  redirect(`/customers/${data[0].id}`)
}
