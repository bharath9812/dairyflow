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

  const parsedSellerId = parseInt(seller_id, 10)

  // 1. Check for existing seller ID
  const { data: existingCustomer, error: existingError } = await supabase
    .from('customers')
    .select('id, is_active')
    .eq('seller_id', parsedSellerId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (existingCustomer) {
    if (existingCustomer.is_active) {
      return { error: `Seller ID #${seller_id.padStart(3, '0')} is already actively assigned to another customer.` }
    } else {
      // 2. Reactivate archived customer
      const { data, error } = await supabase
        .from('customers')
        .update({
          name: name || null,
          contact: contact || null,
          location: location || null,
          is_active: true
        })
        .eq('id', existingCustomer.id)
        .select()

      if (error) {
        console.error("Reactivation error:", error)
        return { error: error.message }
      }

      revalidatePath('/')
      revalidatePath('/customers')
      redirect(`/customers/${data[0].id}`)
    }
  }

  // 3. Insert fresh customer
  const { data, error } = await supabase.from('customers').insert([
    {
      seller_id: parsedSellerId,
      name: name || null,
      contact: contact || null,
      location: location || null,
      is_active: true
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
