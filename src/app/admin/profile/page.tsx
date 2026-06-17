import { createClient } from '@/utils/supabase/server'
import { User, Lock, Mail } from 'lucide-react'
import { updateAdminProfile } from './actions'
import SubmitButton from './SubmitButton'

export default async function AdminProfilePage(props: { searchParams?: Promise<{ message?: string, error?: string }> }) {
  const searchParams = await props.searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const name = user?.user_metadata?.name || ''
  const email = user?.email || ''

  return (
    <div className="max-w-4xl mx-auto mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-onyx tracking-tight mb-2">System Profile</h1>
        <p className="text-slate-500 text-base font-medium">Manage your active administrative credentials and preferences.</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white/80 backdrop-blur-2xl border border-white/40 shadow-sm rounded-xl p-8 relative z-20">
        
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

        <form action={updateAdminProfile}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            
            {/* Full Name Field */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-onyx">Full Name / Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  name="name" 
                  defaultValue={name}
                  className="w-full pl-10 pr-10 py-3 bg-white/50 border-2 border-onyx rounded-lg text-onyx font-bold focus:outline-none focus:ring-0 focus:border-onyx shadow-sm transition-all outline-none"
                />
                {/* Right side icon matching HTML design */}
                <span className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                </span>
              </div>
            </div>

            {/* Email Address Field (Read Only) */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-onyx">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="email" 
                  defaultValue={email}
                  readOnly
                  className="w-full pl-10 py-3 bg-slate-50/50 border border-slate-200 rounded-lg text-slate-500 font-semibold focus:outline-none focus:ring-2 focus:ring-onyx/20 outline-none cursor-not-allowed"
                />
              </div>
            </div>
            
          </div>

          <div className="h-px bg-slate-200/60 w-full mb-8"></div>

          {/* Security Section */}
          <div className="mb-6">
            <h2 className="text-xl font-black text-onyx mb-6">Security</h2>
            <div className="flex flex-col gap-2 max-w-xl">
              <label className="text-sm font-bold text-onyx">New Password (Optional)</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="password" 
                  name="password" 
                  placeholder="Leave blank to keep unchanged"
                  className="w-full pl-10 py-3 bg-white/50 border border-slate-200 rounded-lg text-onyx placeholder:text-slate-400 font-mono focus:outline-none focus:ring-2 focus:ring-onyx focus:border-transparent transition-all shadow-sm outline-none"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end mt-10">
            <SubmitButton />
          </div>
        </form>

      </div>
    </div>
  )
}
