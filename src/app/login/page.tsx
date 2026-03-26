'use client'

import { useState, useActionState, useEffect } from 'react'
import { login, signup, sendResetLink } from './actions'
import { Droplets, AlertCircle, ArrowLeft, MailCheck, CheckCircle2 } from 'lucide-react'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Grab any standard error params from the URL upon mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('error')) setErrorMsg(params.get('error'))
    if (params.get('message')) setSuccessMsg(params.get('message'))
  }, [])

  const handleSubmit = async (formData: FormData) => {
    setErrorMsg(null)
    setSuccessMsg(null)

    if (mode === 'login') {
      const res = await login(formData)
      if (res?.error) setErrorMsg(res.error)
    } else if (mode === 'signup') {
      const res = await signup(formData)
      if (res?.error) setErrorMsg(res.error)
      if (res?.success) {
        setSuccessMsg(res.success)
        setMode('login')
      }
    } else if (mode === 'forgot') {
      const res = await sendResetLink(formData)
      if (res?.error) setErrorMsg(res.error)
      if (res?.success) {
        setSuccessMsg(res.success)
        setMode('login')
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center items-center p-4 font-sans max-w-[100vw] overflow-hidden">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 p-8">
        
        {mode === 'forgot' && (
          <button 
            onClick={() => setMode('login')} 
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </button>
        )}

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 bg-blue-100 rounded-full mb-4">
            <Droplets className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Recover Access'}
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            {mode === 'login' ? 'Sign in to access the dashboard' : mode === 'signup' ? 'Register as a new administrator' : 'Enter your email to request a reset link'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-start gap-3 text-sm font-medium">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{errorMsg}</p>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-start gap-3 text-sm font-medium">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
            <p>{successMsg}</p>
          </div>
        )}

        <form action={handleSubmit} className="space-y-4">
          
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1" htmlFor="username">Full Name (Username)</label>
              <input 
                id="username" 
                name="username" 
                type="text" 
                required 
                placeholder="Ex: John Doe"
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1" htmlFor="email">Email</label>
            <input 
              id="email" 
              name="email" 
              type="email" 
              required 
              placeholder="admin@dairy.com"
              className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
            />
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-semibold text-slate-600" htmlFor="password">Password</label>
                {mode === 'login' && (
                  <button type="button" onClick={() => setMode('forgot')} className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors">
                    Forgot Password?
                  </button>
                )}
              </div>
              <input 
                id="password" 
                name="password" 
                type="password" 
                required 
                placeholder="••••••••"
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
              />
              {mode === 'signup' && (
                <p className="text-xs text-slate-400 mt-2 ml-1 font-medium">
                  Must be at least 6 characters. Do not use easily guessable passwords.
                </p>
              )}
            </div>
          )}

          <div className="pt-4 flex gap-3">
            <button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
            >
              {mode === 'login' ? 'Log in' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
            </button>
          </div>
          
          <div className="text-center mt-6">
            {mode === 'login' ? (
              <p className="text-sm font-medium text-slate-500">
                Don't have an account? <button type="button" onClick={() => setMode('signup')} className="text-blue-600 font-bold hover:underline">Sign up</button>
              </p>
            ) : mode === 'signup' ? (
              <p className="text-sm font-medium text-slate-500">
                Already have an account? <button type="button" onClick={() => setMode('login')} className="text-blue-600 font-bold hover:underline">Log in</button>
              </p>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  )
}
