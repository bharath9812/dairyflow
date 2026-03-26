import { Users, UserPlus, KeyRound, ShieldAlert, BadgeCheck } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { createClient as createSSRClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { deleteEmployee, createEmployee } from './actions'

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
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Staff Framework</h1>
        <p className="text-slate-500 font-medium mt-1">Deploy and revoke secondary administrative tokens safely.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* Registration Panel */}
        <div className="lg:col-span-1 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm sticky top-24">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-500" /> New License
          </h3>

          <form action={createEmployee} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Full Name</label>
              <input
                name="name"
                type="text"
                required
                placeholder="e.g. Sub-Employee 1"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                style={{ color: '#111827', backgroundColor: '#ffffff', WebkitTextFillColor: '#111827' }}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Email</label>
              <input
                name="email"
                type="email"
                required
                placeholder="@gmail.com"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                style={{ color: '#111827', backgroundColor: '#ffffff', WebkitTextFillColor: '#111827' }}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Password</label>
              <input
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                style={{ color: '#111827', backgroundColor: '#ffffff', WebkitTextFillColor: '#111827' }}
              />
            </div>
            <button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm py-2.5 rounded-lg shadow-sm transition-all mt-4">
              Create New Employee
            </button>
          </form>
        </div>

        {/* Directory Grid */}
        <div className="lg:col-span-2 space-y-4">

          {searchParams?.message && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold text-sm">
              {searchParams.message}
            </div>
          )}
          {searchParams?.error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 font-bold text-sm">
              {searchParams.error}
            </div>
          )}

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100">
              {authUsers.users.map(target => (
                <div key={target.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-800">{target.user_metadata?.name || 'Unnamed Agent'}</h4>
                        {target.id === user.id && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">
                            <BadgeCheck className="w-3 h-3" /> You
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-slate-500">{target.email}</p>
                      <p className="text-xs text-slate-400 mt-1 font-mono">ID: {target.id.split('-')[0]}</p>
                    </div>
                  </div>

                  {target.id !== user.id && (
                    <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                      <form action={async () => {
                        'use server';
                        redirect(`/login?mode=forgot`);
                      }} className="flex-1 sm:flex-none">
                        <button className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100">
                          <KeyRound className="w-3.5 h-3.5" /> Reset Password
                        </button>
                      </form>
                      <form action={deleteEmployee} className="flex-1 sm:flex-none">
                        <input type="hidden" name="uid" value={target.id} />
                        <button
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-500 rounded-lg transition-colors border border-rose-100 hover:border-rose-500"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
