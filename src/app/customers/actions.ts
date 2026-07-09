'use server'

import { createClient } from '@supabase/supabase-js'
import { createClient as createSSRClient } from '@/utils/supabase/server'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function deleteCustomerComplete(customerId: string) {
  const ssrClient = await createSSRClient()
  const { data: { user } } = await ssrClient.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const adminClient = getAdminClient()

  try {

    // Explicitly delete remaining top-level child records
    const res2 = await adminClient.from('transactions').delete().eq('customer_id', customerId)
    if (res2.error) return { error: `Failed to clear transactions: ${res2.error.message}` }
    
    // Delete the customer profile
    const { error } = await adminClient.from('customers').delete().eq('id', customerId)
    
    if (error) {
      return { error: error.message }
    }
    
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function deleteCustomerOnly(customerId: string) {
  const ssrClient = await createSSRClient()
  const { data: { user } } = await ssrClient.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const adminClient = getAdminClient()

  try {
    // Perform a soft-delete to keep historical transactions intact while hiding the customer
    const { error } = await adminClient.from('customers').update({ is_active: false }).eq('id', customerId)
    
    if (error) {
      return { error: error.message }
    }
    
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}
