'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createSeller(formData: FormData) {
  const supabase = await createClient()

  const seller_id = formData.get('seller_id') as string // Optional explicit ID
  const name = formData.get('name') as string
  const contact = formData.get('contact') as string
  const location_id_input = formData.get('location_id') as string
  const location_new_input = formData.get('location_new') as string

  if (!seller_id) {
    return { error: 'Seller ID is strictly required to register a new user.' }
  }

  const parsedSellerId = parseInt(seller_id, 10)
  
  let finalLocationId = location_id_input
  let finalLocationName = ''

  // If adding a new location
  if (location_new_input && location_new_input.trim() !== '') {
    finalLocationName = location_new_input.trim()
    const shortCode = finalLocationName.substring(0, 3).toUpperCase()
    
    // Check if location name already exists
    const { data: existingLoc } = await supabase.from('locations').select('id, name').ilike('name', finalLocationName).maybeSingle()
    if (existingLoc) {
      finalLocationId = existingLoc.id
      finalLocationName = existingLoc.name
    } else {
      const { data: newLoc, error: locErr } = await supabase.from('locations').insert([{ name: finalLocationName, short_code: shortCode }]).select().single()
      if (locErr) return { error: `Failed to create location: ${locErr.message}` }
      finalLocationId = newLoc.id
    }
  } else if (location_id_input) {
    const { data: loc } = await supabase.from('locations').select('name').eq('id', location_id_input).maybeSingle()
    if (loc) finalLocationName = loc.name
  } else {
    return { error: 'A location is strictly required.' }
  }

  // 1. Check for existing seller ID in this specific location
  const { data: existingCustomer } = await supabase
    .from('customers')
    .select('id, is_active')
    .eq('location_id', finalLocationId)
    .eq('seller_id', parsedSellerId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (existingCustomer) {
    if (existingCustomer.is_active) {
      return { error: `Seller ID #${seller_id} is already actively assigned to another customer in this location.` }
    } else {
      // 2. Reactivate archived customer
      const { data, error } = await supabase
        .from('customers')
        .update({
          name: name || null,
          contact: contact || null,
          location: finalLocationName,
          location_id: finalLocationId,
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
      location: finalLocationName,
      location_id: finalLocationId,
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
