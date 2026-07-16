'use client'

import React from 'react'
import Sidebar from '@/components/Sidebar'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoanLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const supabase = createClient()

  return (
    <div className="min-h-[100dvh] bg-surface flex flex-col font-sans text-on-surface">
      <div className="flex flex-1 h-[100dvh] overflow-hidden">
        <Sidebar
          onLogout={async () => {
            try {
              await supabase.auth.signOut()
            } catch (e) {
              console.error("Signout error:", e)
            }
            if (typeof window !== 'undefined') {
              for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i)
                if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
                  localStorage.removeItem(key)
                }
              }
            }
            router.push('/login')
          }}
        />
        {children}
      </div>
    </div>
  )
}
