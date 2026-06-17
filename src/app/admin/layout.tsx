import Link from 'next/link'
import { ShieldCheck, LogOut, Users, UserCog, TrendingUp, Database, Banknote } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-[100dvh] bg-surface flex flex-col font-sans text-on-surface">
      <div className="flex flex-1 h-[100dvh] overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          links={[
            { label: 'Commodity Pricing', href: '/admin/pricing', icon: <Banknote className="w-5 h-5" /> },
            { label: 'System Records', href: '/admin', icon: <Database className="w-5 h-5" /> },
            ...(user.user_metadata?.role === 'primary' ? [{ label: 'Employee Management', href: '/admin/employees', icon: <Users className="w-5 h-5" /> }] : [])
          ]}
          onLogout={async () => { 
            'use server';
            const s = await createClient();
            await s.auth.signOut();
            redirect('/login');
          }}
        />

        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          {/* TopBar Redesign */}
          <TopBar
            leftPillLabel="Standard Dashboard"
            leftPillHref="/"
            leftPillActive={false}
            rightPillLabel="Seller Directory"
            rightPillHref="/customers"
            rightPillActive={false}
            dateString={new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
          />

          <main className="flex-1 flex flex-col w-full px-4 md:px-6 lg:px-10 xl:px-12 pb-8 pt-4 lg:pt-8 overflow-hidden items-stretch">
            {children}
          </main>
        </div>

      </div>
    </div>
  )
}
