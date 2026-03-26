import Link from 'next/link'
import { ShieldCheck, LogOut, Users, UserCog, TrendingUp } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <div className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-sm shrink-0">
        <div className="w-full lg:w-[70%] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <ShieldCheck className="w-6 h-6 text-blue-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">DairyFlow <span className="text-slate-500 font-normal">| Admin Terminal</span></h1>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">
              Standard Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="flex-1 flex w-full lg:w-[70%] mx-auto px-4 sm:px-6 lg:px-8 py-8 gap-8 relative items-start">

        {/* Navigation Rail */}
        <div className="w-64 shrink-0 hidden lg:flex flex-col gap-2 sticky top-24">
          <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white text-slate-600 hover:text-blue-600 font-bold hover:shadow-sm border border-transparent hover:border-slate-200 transition-all">
            <TrendingUp className="w-5 h-5 text-slate-400" /> Analytics Grid
          </Link>
          <Link href="/admin/profile" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white text-slate-600 hover:text-blue-600 font-bold hover:shadow-sm border border-transparent hover:border-slate-200 transition-all">
            <UserCog className="w-5 h-5 text-slate-400" /> My Profile
          </Link>
          <Link href="/admin/employees" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white text-slate-600 hover:text-blue-600 font-bold hover:shadow-sm border border-transparent hover:border-slate-200 transition-all">
            <Users className="w-5 h-5 text-slate-400" /> Manage Employees
          </Link>
          <form action={async () => {
            'use server';
            const s = await createClient()
            await s.auth.signOut()
            redirect('/login')
          }}>
            <button className="w-full mt-4 flex items-center gap-3 px-4 py-3 rounded-xl text-rose-600 hover:bg-rose-50 font-bold transition-all text-left">
              <LogOut className="w-5 h-5 opacity-70" /> Disconnect Session
            </button>
          </form>
        </div>

        {/* Dynamic Content Window */}
        <div className="flex-1 w-full min-w-0">
          {children}
        </div>

      </div>
    </div>
  )
}
