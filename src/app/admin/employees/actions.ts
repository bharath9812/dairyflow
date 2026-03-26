'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function createEmployee(formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!name || !email || !password) {
    redirect('/admin/employees?error=All parameters are required.')
  }

  const adminAuth = getAdminClient().auth.admin

  const { data, error } = await adminAuth.createUser({
    email,
    password,
    user_metadata: { name },
    email_confirm: true // bypass confirmation for superusers making employees
  })

  if (error) {
    redirect(`/admin/employees?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/admin/employees', 'page')
  redirect(`/admin/employees?message=${encodeURIComponent('Secondary Admin generated securely!')}`)
}

export async function deleteEmployee(formData: FormData) {
  const uid = formData.get('uid') as string

  if (!uid) {
    redirect('/admin/employees?error=Invalid identity constraint.')
  }

  const adminAuth = getAdminClient().auth.admin

  const { error } = await adminAuth.deleteUser(uid)

  if (error) {
    redirect(`/admin/employees?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/admin/employees', 'page')
  redirect(`/admin/employees?message=${encodeURIComponent('Identity revoked successfully.')}`)
}
