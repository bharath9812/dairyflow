'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { CheckCircle2, XCircle, X } from 'lucide-react'

function ToasterContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const [toasts, setToasts] = useState<{ id: string, type: 'success'|'error', message: string }[]>([])

  useEffect(() => {
    const msg = searchParams.get('message')
    const err = searchParams.get('error')

    if (msg || err) {
      const id = Math.random().toString(36).substring(7)
      
      if (msg) setToasts(prev => [...prev, { id, type: 'success', message: msg }])
      if (err) setToasts(prev => [...prev, { id, type: 'error', message: err }])

      // Clean the URL so a refresh doesn't show the toast again
      const newParams = new URLSearchParams(searchParams.toString())
      newParams.delete('message')
      newParams.delete('error')
      const queryStr = newParams.toString()
      const newUrl = queryStr ? `${pathname}?${queryStr}` : pathname
      router.replace(newUrl, { scroll: false })
      
      // Auto dismiss after 5 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, 5000)
    }
  }, [searchParams, pathname, router])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map(toast => (
        <div key={toast.id} className={`pointer-events-auto flex items-start gap-4 p-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border min-w-[320px] max-w-md animate-in slide-in-from-right-8 fade-in duration-300 ${toast.type === 'success' ? 'bg-emerald-50/95 backdrop-blur border-emerald-200 text-emerald-800' : 'bg-rose-50/95 backdrop-blur border-rose-200 text-rose-800'}`}>
          <div className="mt-0.5 shrink-0">
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-rose-600" />}
          </div>
          <p className="font-semibold text-sm leading-snug flex-1">{toast.message}</p>
          <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} className={`shrink-0 transition-colors p-1 rounded-md -mr-1 -mt-1 ${toast.type === 'success' ? 'text-emerald-500 hover:bg-emerald-100 hover:text-emerald-700' : 'text-rose-500 hover:bg-rose-100 hover:text-rose-700'}`}>
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}

export function GlobalToaster() {
  return (
    <Suspense fallback={null}>
      <ToasterContent />
    </Suspense>
  )
}
