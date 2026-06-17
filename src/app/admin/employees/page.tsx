/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps, prefer-const, react/no-unescaped-entities, react-hooks/set-state-in-effect */
import { Users, UserPlus, KeyRound, ShieldAlert, BadgeCheck } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { createClient as createSSRClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { deleteEmployee, createEmployee, resetEmployeePassword } from './actions'

// Initialize the privileged service client securely on the server
// Bypasses RLS to allow SuperUser operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export default async function EmployeeManagementPage(props: { searchParams?: Promise<{ message?: string, error?: string }> }) {
  const searchParams = await props.searchParams

  // Authenticate Current User
  const ssrClient = await createSSRClient()
  const { data: { user } } = await ssrClient.auth.getUser()

  if (!user) redirect('/login')

  if (user.user_metadata?.role !== 'primary') {
    redirect('/admin')
  }

  // Fetch complete roster
  const { data: authUsers, error } = await supabaseAdmin.auth.admin.listUsers()

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-700 p-6 rounded-2xl flex items-center gap-3">
        <ShieldAlert className="w-6 h-6" />
        <div>
          <h2 className="font-bold text-lg">Admin Connection Failure</h2>
          <p className="font-medium text-sm">Failed to connect to the Supabase Service Role API. Ensure \`SUPABASE_SERVICE_ROLE_KEY\` is present in your environment variables.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-onyx tracking-tight mb-2">Staff Framework</h2>
        <p className="text-slate-500 text-base font-medium">Deploy and revoke secondary administrative tokens safely.</p>
      </div>

      {searchParams?.message && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold text-sm mb-6">
          {searchParams.message}
        </div>
      )}
      {searchParams?.error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 font-bold text-sm mb-6">
          {searchParams.error}
        </div>
      )}

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-stretch">

        {/* Left Column: New License Form */}
        <div className="sm:col-span-5 lg:col-span-4 flex flex-col gap-6 sticky top-24">
          <div className="bg-white/80 backdrop-blur-2xl border border-white/40 shadow-sm rounded-xl p-6 h-[420px] flex flex-col relative z-20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-sky-600">
                <UserPlus className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-onyx">New License</h3>
            </div>
            
            <form action={createEmployee} className="flex flex-col gap-5 flex-1">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 tracking-wider uppercase">Full Name</label>
                <input 
                  name="name" type="text" required placeholder="e.g. Sub-Employee 1"
                  className="w-full bg-white/50 border border-slate-200 rounded-md px-4 py-2.5 text-sm font-semibold focus:border-onyx focus:ring-1 focus:ring-onyx transition-colors placeholder:text-slate-400 outline-none" 
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 tracking-wider uppercase">Email</label>
                <input 
                  name="email" type="email" required placeholder="@gmail.com"
                  className="w-full bg-white/50 border border-slate-200 rounded-md px-4 py-2.5 text-sm font-semibold focus:border-onyx focus:ring-1 focus:ring-onyx transition-colors placeholder:text-slate-400 outline-none" 
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 tracking-wider uppercase">Password</label>
                <input 
                  name="password" type="password" required placeholder="••••••••"
                  className="w-full bg-white/50 border border-slate-200 rounded-md px-4 py-2.5 text-sm font-mono focus:border-onyx focus:ring-1 focus:ring-onyx transition-colors placeholder:text-slate-400 outline-none" 
                />
              </div>
              
              <div className="mt-auto pt-4">
                <button className="w-full bg-onyx text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2">
                  Create New Employee
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Active Members List */}
        <div className="sm:col-span-7 lg:col-span-8">
          <div className="bg-white/80 backdrop-blur-2xl border border-white/40 shadow-sm rounded-xl p-0 flex flex-col h-[420px] overflow-hidden relative z-20">
            <div className="px-6 py-5 border-b border-slate-200/50 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-onyx flex items-center gap-2">
                  <Users className="w-5 h-5 text-slate-500" /> Active Members
                </h3>
                <div className="flex gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500">
                    {authUsers.users.length} Active
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col divide-y divide-slate-100 overflow-y-auto custom-scrollbar">
              {authUsers.users.map(target => {
                const isCurrent = target.id === user.id;
                const initials = (target.user_metadata?.name || 'A').substring(0, 2).toUpperCase();
                return (
                  <div key={target.id} className={`p-5 hover:bg-slate-50/50 transition-colors group relative ${isCurrent ? 'bg-slate-50/50' : ''}`}>
                    {isCurrent && <div className="absolute left-0 top-0 bottom-0 w-1 bg-onyx rounded-r-full"></div>}
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full font-bold text-lg flex items-center justify-center shrink-0 shadow-sm relative ${isCurrent ? 'bg-onyx text-white' : 'bg-sky-100 text-sky-800 border border-sky-200'}`}>
                          {initials}
                          {isCurrent && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-onyx text-base">{target.user_metadata?.name || 'Unnamed Agent'}</span>
                            {isCurrent && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-onyx border border-slate-300/30">
                                <BadgeCheck className="w-3 h-3" /> YOU
                              </span>
                            )}
                          </div>
                          <span className="text-sm font-medium text-slate-500">{target.email}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-400 font-mono font-bold uppercase">ID: {target.id.split('-')[0]}</span>
                            {isCurrent && <span className="text-[10px] text-sky-600 font-bold tracking-wide">• Current Session</span>}
                          </div>
                        </div>
                      </div>

                      <div className={`flex items-center gap-2 self-start sm:self-auto shrink-0 ${isCurrent ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                        <form action={resetEmployeePassword} className="flex items-center gap-1.5">
                          <input type="hidden" name="uid" value={target.id} />
                          <input 
                            name="newPassword" type="password" required placeholder="New pwd" minLength={6}
                            className="w-24 bg-white/80 border border-slate-200 rounded-md px-2 py-1.5 text-xs font-mono focus:border-onyx focus:ring-1 focus:ring-onyx transition-colors placeholder:text-slate-400 outline-none h-8" 
                          />
                          <button className="px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors flex items-center gap-1.5 h-8">
                            <KeyRound className="w-3.5 h-3.5" /> Set
                          </button>
                        </form>
                        <form action={async () => {
                          'use server'
                          const { transferPrimaryAdmin } = await import('./actions')
                          await transferPrimaryAdmin(target.id, user.id)
                        }}>
                          <button className="px-3 py-1.5 text-xs font-semibold rounded-md border border-amber-200 text-amber-600 hover:bg-amber-50 transition-colors h-8">
                            Make Primary
                          </button>
                        </form>
                        <form action={deleteEmployee}>
                          <input type="hidden" name="uid" value={target.id} />
                          <button className="w-8 h-8 rounded-md border border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors flex items-center justify-center">
                            <ShieldAlert className="w-4 h-4" />
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  )
}
