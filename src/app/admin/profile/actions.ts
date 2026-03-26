'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function updateAdminProfile(formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Build the unified payload securely
  const payload: any = {}
  
  if (name && name !== user.user_metadata?.name) {
    payload.data = { name }
  }
  
  if (email && email !== user.email) {
    payload.email = email
  }
  
  if (password) {
    payload.password = password
  }

  // Check if we actually have updates
  if (Object.keys(payload).length === 0) {
    redirect(`/admin/profile?message=${encodeURIComponent('No modifications detected.')}`)
  }

  const { error } = await supabase.auth.updateUser(payload)

  if (error) {
    redirect(`/admin/profile?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/admin/profile')
  const msg = payload.email || payload.password 
    ? 'Identity synced. You may need to verify your new email or login with updated credentials.' 
    : 'Identity parameters applied securely.'
    
  redirect(`/admin/profile?message=${encodeURIComponent(msg)}`)
}
