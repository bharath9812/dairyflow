'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    console.error("Login Error:", error.message)
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: {
        name: (formData.get('username') as string)?.trim() || null
      }
    }
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    console.error("Signup Error:", error.message)
    return { error: error.message }
  }

  return { success: "Please confirm your email inbox before logging in." }
}

export async function sendResetLink(formData: FormData) {
  const email = formData.get('email') as string
  const supabase = await createClient()
  
  const originList = (await headers()).get('origin')
  const hostMatch = (await headers()).get('host')
  const siteUrl = originList || (hostMatch ? `http://${hostMatch}` : 'http://localhost:3000')

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/update-password`,
  })

  if (error) {
    console.error("Reset Email Error:", error.message)
    return { error: error.message }
  }
  
  return { success: "Secure link dispatched. Please check your email inbox." }
}
