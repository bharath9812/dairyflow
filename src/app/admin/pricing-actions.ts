'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updatePricing(formData: FormData) {
  const supabase = await createClient()
  
  const cow_price = Number(formData.get('cow_price'))
  const buffalo_price = Number(formData.get('buffalo_price'))
  
  if (!cow_price || !buffalo_price) {
    return { error: 'Both cow and buffalo prices are required.' }
  }

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Unauthorized.' }
  }

  // Update global_pricing. Assuming there's only one row.
  const { error } = await supabase
    .from('global_pricing')
    .update({ cow_price, buffalo_price, updated_by: user.id, updated_at: new Date().toISOString() })
    .neq('id', '00000000-0000-0000-0000-000000000000') // A trick to update all (or the only) row
  
  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin')
  revalidatePath('/admin/pricing')
  revalidatePath('/')
  
  return { success: 'Pricing updated successfully.' }
}
