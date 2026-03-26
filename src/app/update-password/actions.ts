'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function updatePassword(formData: FormData) {
  const password = formData.get('password') as string
  const confirm = formData.get('confirm_password') as string
  
  if (password !== confirm) {
    redirect(`/update-password?error=${encodeURIComponent("Passwords do not match.")}`)
  }

  const supabase = await createClient()

  // Supabase's updateUser automatically updates the authenticated user's profile
  // The user is authenticated via the PKCE auth/callback exchange before arriving here
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    console.error("Update Password Error:", error.message)
    redirect(`/update-password?error=${encodeURIComponent(error.message)}`)
  }

  // Password updated successfully. Redirect to login. 
  // We sign them out strictly so they re-authenticate with the fresh credentials.
  await supabase.auth.signOut()
  
  redirect(`/login?message=${encodeURIComponent('Password successfully updated. Please log in with your new credentials.')}`)
}
