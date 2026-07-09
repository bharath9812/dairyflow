/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps, prefer-const, react/no-unescaped-entities, react-hooks/set-state-in-effect */
'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function processMilkTransaction(txData: any) {
  const supabase = await createClient()

  // 1. Prepare the final transaction record
  const finalTx = {
    ...txData
  }

  // 2. Insert transaction
  const { data: insertedTx, error: txError } = await supabase
    .from('transactions')
    .insert([finalTx])
    .select()
    .single()

  if (txError) return { error: txError.message }

  revalidatePath('/')
  return { data: insertedTx }
}

export async function deleteTransactions(txIds: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  for (const id of txIds) {
    const { error } = await adminClient.from('transactions').delete().eq('id', id)
    if (error) {
      console.error('Delete TX Error:', error.message)
      return { error: error.message }
    }
  }

  revalidatePath('/')
  return { success: true }
}

