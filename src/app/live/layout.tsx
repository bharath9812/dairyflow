'use client'

import React from 'react'
import Sidebar from '@/components/Sidebar'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function LiveLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const supabase = createClient()

  return (
    <div className="min-h-[100dvh] bg-surface flex flex-col font-sans text-on-surface">
      <div className="flex flex-1 h-[100dvh] overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          onLogout={async () => { await supabase.auth.signOut(); router.push('/login'); }}
        />
        {/* Main Content */}
        {children}
      </div>
    </div>
  )
}
