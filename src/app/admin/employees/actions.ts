/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps, prefer-const, react/no-unescaped-entities, react-hooks/set-state-in-effect */
'use server'

import { createClient } from '@supabase/supabase-js'
import { createClient as createSSRClient } from '@/utils/supabase/server'
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

  const ssrClient = await createSSRClient()
  const { data: { user } } = await ssrClient.auth.getUser()

  if (!user || user.user_metadata?.role !== 'primary') {
    redirect('/admin')
  }

  const adminAuth = getAdminClient().auth.admin

  const { data, error } = await adminAuth.createUser({
    email,
    password,
    user_metadata: { name, role: 'secondary' },
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

  const ssrClient = await createSSRClient()
  const { data: { user } } = await ssrClient.auth.getUser()

  if (!user || user.user_metadata?.role !== 'primary') {
    redirect('/admin')
  }

  const adminAuth = getAdminClient().auth.admin

  const { error } = await adminAuth.deleteUser(uid)

  if (error) {
    redirect(`/admin/employees?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/admin/employees', 'page')
  redirect(`/admin/employees?message=${encodeURIComponent('Identity revoked successfully.')}`)
}

export async function transferPrimaryAdmin(newPrimaryId: string, currentPrimaryId: string) {
  const ssrClient = await createSSRClient()
  const { data: { user } } = await ssrClient.auth.getUser()

  if (!user || user.id !== currentPrimaryId || user.user_metadata?.role !== 'primary') {
    redirect('/admin')
  }

  const adminAuth = getAdminClient().auth.admin

  // Promote the target user to 'primary'
  const targetUser = await adminAuth.getUserById(newPrimaryId)
  if (targetUser.data?.user) {
    const updatedMeta = { ...targetUser.data.user.user_metadata, role: 'primary' }
    await adminAuth.updateUserById(newPrimaryId, { user_metadata: updatedMeta })
  }

  // Demote the current user to 'secondary'
  const updatedCurrentMeta = { ...user.user_metadata, role: 'secondary' }
  await adminAuth.updateUserById(currentPrimaryId, { user_metadata: updatedCurrentMeta })

  // Log them out or redirect them back to admin since they no longer have employee access
  revalidatePath('/', 'layout')
  redirect('/admin')
}

export async function resetEmployeePassword(formData: FormData) {
  const uid = formData.get('uid') as string
  const newPassword = formData.get('newPassword') as string

  if (!uid || !newPassword) {
    redirect('/admin/employees?error=User ID and new password are required.')
  }

  if (newPassword.length < 6) {
    redirect('/admin/employees?error=Password must be at least 6 characters.')
  }

  const ssrClient = await createSSRClient()
  const { data: { user } } = await ssrClient.auth.getUser()

  if (!user || user.user_metadata?.role !== 'primary') {
    redirect('/admin')
  }

  const adminAuth = getAdminClient().auth.admin

  const { error } = await adminAuth.updateUserById(uid, {
    password: newPassword
  })

  if (error) {
    redirect(`/admin/employees?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/admin/employees', 'page')
  redirect(`/admin/employees?message=${encodeURIComponent('Password reset successfully! Share the new password with the employee.')}`)
}
