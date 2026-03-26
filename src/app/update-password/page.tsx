import { Droplets, AlertCircle, Lock } from 'lucide-react'
import { updatePassword } from './actions'

export default async function UpdatePasswordPage(props: { searchParams: Promise<{ error?: string }> }) {
  const searchParams = await props.searchParams
  const errorMsg = searchParams?.error

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center items-center p-4 font-sans max-w-[100vw] overflow-hidden">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 p-8">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 bg-blue-100 rounded-full mb-4">
            <Droplets className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Create New Password</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium px-2">Your identity has been verified. Enter your new secure password below.</p>
        </div>

        {errorMsg && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-start gap-3 text-sm font-medium">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{errorMsg}</p>
          </div>
        )}

        <form action={updatePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1" htmlFor="password">New Password</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input 
                id="password" 
                name="password" 
                type="password" 
                required 
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium shadow-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1" htmlFor="confirm_password">Confirm Password</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input 
                id="confirm_password" 
                name="confirm_password" 
                type="password" 
                required 
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium shadow-sm"
              />
            </div>
          </div>
          <div className="pt-4">
            <button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              Update Password
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}
