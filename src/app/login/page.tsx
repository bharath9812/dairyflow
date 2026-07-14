'use client'
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps, prefer-const, react/no-unescaped-entities, react-hooks/set-state-in-effect */

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { login, signup, sendResetLink } from './actions'
import { Droplets, ArrowLeft, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login')
  const router = useRouter()
  const pathname = usePathname()

  // URL params are now handled by GlobalToaster

  const handleSubmit = async (formData: FormData) => {

    if (mode === 'login') {
      const res = await login(formData)
      if (res?.error) router.replace(`${pathname}?error=${encodeURIComponent(res.error)}`, { scroll: false })
      else if (res?.success) window.location.href = '/'
    } else if (mode === 'signup') {
      const res = await signup(formData)
      if (res?.error) router.replace(`${pathname}?error=${encodeURIComponent(res.error)}`, { scroll: false })
      if (res?.success) {
        router.replace(`${pathname}?message=${encodeURIComponent(res.success)}`, { scroll: false })
        setMode('login')
      }
    } else if (mode === 'forgot') {
      const res = await sendResetLink(formData)
      if (res?.error) router.replace(`${pathname}?error=${encodeURIComponent(res.error)}`, { scroll: false })
      if (res?.success) {
        router.replace(`${pathname}?message=${encodeURIComponent(res.success)}`, { scroll: false })
        setMode('login')
      }
    }
  }

  return (
    <div className="min-h-[100dvh] bg-surface flex flex-col font-sans relative overflow-hidden text-on-surface">
      
      {/* Top Left Logo (Hidden in forgot mode for cleaner card view, or just keep it) */}
      <div className="absolute top-6 left-6 lg:top-10 lg:left-10 flex items-center gap-3 z-10">
        <div className="w-10 h-10 bg-onyx text-white rounded-xl flex items-center justify-center shadow-sm">
          <Droplets className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-lg leading-tight text-onyx tracking-tight">Lumina</span>
          <span className="text-[10px] font-mono font-medium tracking-widest text-slate-400">DAIRY TERMINAL</span>
        </div>
      </div>

      {/* Main Centered Content */}
      <div className="flex-1 flex justify-center items-center p-4 z-20">
        <div className="w-full max-w-md glass-modal p-8 sm:p-10 flex flex-col shadow-2xl shadow-slate-200/50">
          
          {mode === 'forgot' && (
            <button 
              type="button"
              onClick={() => setMode('login')} 
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-onyx transition-colors mb-6 self-start uppercase tracking-wider"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Login
            </button>
          )}

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-onyx tracking-tight mb-2">
              {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Recover Access'}
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              {mode === 'login' ? 'Enter your credentials to access the terminal' : mode === 'signup' ? 'Register as a new administrator' : 'Enter your email to request a reset link'}
            </p>
          </div>

          <form action={handleSubmit} className="flex flex-col gap-5">
            
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider" htmlFor="username">Full Name</label>
                <input 
                  id="username" 
                  name="username" 
                  type="text" 
                  required 
                  placeholder="Ex: John Doe"
                  className="w-full px-4 py-3.5 rounded-xl bg-slate-50/50 border border-slate-200 text-onyx focus:outline-none focus:bg-white focus:border-slate-300 focus:ring-[3px] focus:ring-slate-400/20 shadow-sm hover:border-slate-300 transition-all duration-200 font-medium text-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider" htmlFor="email">Email</label>
              <input 
                id="email" 
                name="email" 
                type="email" 
                required 
                placeholder="admin@dairy.com"
                className="w-full px-4 py-3.5 rounded-xl bg-slate-50/50 border border-slate-200 text-onyx focus:outline-none focus:bg-white focus:border-slate-300 focus:ring-[3px] focus:ring-slate-400/20 shadow-sm hover:border-slate-300 transition-all duration-200 font-medium text-sm"
              />
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider" htmlFor="password">Password</label>
                </div>
                <input 
                  id="password" 
                  name="password" 
                  type="password" 
                  required 
                  placeholder="••••••••"
                  className="w-full px-4 py-3.5 rounded-xl bg-slate-50/50 border border-slate-200 text-onyx focus:outline-none focus:bg-white focus:border-slate-300 focus:ring-[3px] focus:ring-slate-400/20 shadow-sm hover:border-slate-300 transition-all duration-200 font-medium text-sm"
                />
                
                {mode === 'login' && (
                  <div className="mt-2 text-right">
                    <button type="button" onClick={() => setMode('forgot')} className="text-xs font-bold text-sky-accent hover:text-sky-600 transition-colors">
                      Forgot Password? &rarr;
                    </button>
                  </div>
                )}

                {mode === 'signup' && (
                  <p className="text-xs text-slate-400 mt-2 font-medium">
                    Must be at least 6 characters. Do not use easily guessable passwords.
                  </p>
                )}
              </div>
            )}

            <div className="pt-2 flex gap-3">
              <button 
                type="submit" 
                className="w-full bg-onyx hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {mode === 'login' ? 'Log In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="text-center mt-6 pt-4 border-t border-slate-100">
              {mode === 'login' ? (
                <p className="text-sm font-medium text-slate-500">
                  Don't have an account? <button type="button" onClick={() => setMode('signup')} className="text-onyx font-bold hover:underline">Sign up</button>
                </p>
              ) : mode === 'signup' ? (
                <p className="text-sm font-medium text-slate-500">
                  Already have an account? <button type="button" onClick={() => setMode('login')} className="text-onyx font-bold hover:underline">Log in</button>
                </p>
              ) : null}
            </div>
          </form>
        </div>
      </div>

      {/* Footer Bar */}
      {mode === 'signup' ? (
        <div className="absolute bottom-6 left-6 right-6 lg:bottom-10 lg:left-10 lg:right-10 flex items-center justify-center text-[10px] font-mono font-medium tracking-widest text-slate-400 text-center">
          LUMINA TERMINAL V2.4.0 &bull; DAIRY SUPPLY CHAIN INTELLIGENCE
        </div>
      ) : (
        <div className="absolute bottom-6 left-6 right-6 lg:bottom-10 lg:left-10 lg:right-10 flex items-center justify-between text-[10px] font-mono font-bold tracking-widest text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            SYSTEM ONLINE
          </div>
          <div>NODE: LMN-01</div>
        </div>
      )}

    </div>
  )
}
