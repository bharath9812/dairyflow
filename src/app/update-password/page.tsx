import { Droplets, AlertCircle, Lock, ArrowRight, ShieldCheck, ArrowLeft } from 'lucide-react'
import { updatePassword } from './actions'

export default async function UpdatePasswordPage(props: { searchParams: Promise<{ error?: string }> }) {
  const searchParams = await props.searchParams
  const errorMsg = searchParams?.error

  return (
    <div className="min-h-[100dvh] bg-surface flex flex-col font-sans relative overflow-hidden text-on-surface">
      
      {/* Main Centered Content */}
      <div className="flex-1 flex justify-center items-center p-4 z-20">
        <div className="w-full max-w-md glass-modal p-8 sm:p-10 flex flex-col shadow-2xl shadow-slate-200/50">
          
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-4 bg-blue-100 rounded-full mb-4">
              <Droplets className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-onyx tracking-tight mb-2">Create New Password</h1>
            <p className="text-slate-500 text-sm font-medium">Your identity has been verified. Enter your new secure password below.</p>
          </div>

          <form action={updatePassword} className="flex flex-col gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider" htmlFor="password">New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input 
                  id="password" 
                  name="password" 
                  type="password" 
                  required 
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50/50 border border-slate-200 text-onyx focus:outline-none focus:bg-white focus:border-slate-300 focus:ring-[3px] focus:ring-slate-400/20 shadow-sm hover:border-slate-300 transition-all duration-200 font-medium text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider" htmlFor="confirm_password">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input 
                  id="confirm_password" 
                  name="confirm_password" 
                  type="password" 
                  required 
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50/50 border border-slate-200 text-onyx focus:outline-none focus:bg-white focus:border-slate-300 focus:ring-[3px] focus:ring-slate-400/20 shadow-sm hover:border-slate-300 transition-all duration-200 font-medium text-sm"
                />
              </div>
            </div>
            <div className="pt-2">
              <button 
                type="submit" 
                className="w-full bg-onyx hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
              >
                Update Password <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

        </div>
      </div>

      {/* Footer Bar */}
      <div className="absolute bottom-6 left-6 right-6 lg:bottom-10 lg:left-10 lg:right-10 flex items-center justify-between text-[10px] font-mono font-bold tracking-widest text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          ENCRYPTED TERMINAL SESSION
        </div>
        <a href="/login" className="flex items-center gap-1 hover:text-onyx transition-colors">
          <ArrowLeft className="w-3 h-3" /> Back to Sign In
        </a>
      </div>

    </div>
  )
}
