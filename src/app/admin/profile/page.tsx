import { createClient } from '@/utils/supabase/server'
import { User, Lock, Mail } from 'lucide-react'
import { updateAdminProfile } from './actions'

export default async function AdminProfilePage(props: { searchParams?: Promise<{ message?: string, error?: string }> }) {
  const searchParams = await props.searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const name = user?.user_metadata?.name || ''
  const email = user?.email || ''

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">System Profile</h1>
        <p className="text-slate-500 font-medium mt-1">Manage your active administrative credentials and preferences.</p>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
        {searchParams?.message && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold text-sm">
            {searchParams.message}
          </div>
        )}
        {searchParams?.error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 font-bold text-sm">
            {searchParams.error}
          </div>
        )}

        <form action={updateAdminProfile} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">Full Name / Username</label>
              <div className="relative">
                <User className="w-5 h-5 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  name="name" 
                  defaultValue={name}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
                <input 
                  type="email" 
                  name="email" 
                  defaultValue={email}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold"
                />
              </div>
            </div>
          </div>
          
          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Security</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-2">New Password (Optional)</label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input 
                    type="password" 
                    name="password" 
                    placeholder="Leave blank to keep unchanged"
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end">
             <button 
                type="submit" 
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm shadow-blue-500/20 transition-all"
             >
               Save Profile Identity
             </button>
          </div>
        </form>
      </div>
    </div>
  )
}
