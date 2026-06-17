'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

import { usePathname } from 'next/navigation'

export type ViewMode = 'scroll' | 'expand'

export interface TransactionViewModeState {
  mode: ViewMode
  toggleMode: () => void
  setMode: (mode: ViewMode) => void
}

const TransactionViewModeContext = createContext<TransactionViewModeState | undefined>(undefined)

export function TransactionViewModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ViewMode>('scroll')
  const [isMounted, setIsMounted] = useState(false)
  const pathname = usePathname()
  
  // Safe base key avoiding complex slugs
  const routeKey = pathname === '/' ? 'home' : pathname?.split('/')[1] || 'default'

  useEffect(() => {
    setIsMounted(true)
    const stored = localStorage.getItem(`view_mode_${routeKey}`)
    if (stored === 'expand' || stored === 'scroll') {
      setModeState(stored)
    } else {
      setModeState('scroll')
    }
  }, [routeKey])

  const setMode = (newMode: ViewMode) => {
    setModeState(newMode)
    localStorage.setItem(`view_mode_${routeKey}`, newMode)
  }

  const toggleMode = () => {
    setMode(mode === 'scroll' ? 'expand' : 'scroll')
  }

  // Sync mode to body for global CSS targeting
  useEffect(() => {
    if (isMounted) {
      if (mode === 'expand') {
        document.body.classList.add('expand-mode-active')
      } else {
        document.body.classList.remove('expand-mode-active')
      }
    }
    return () => {
      document.body.classList.remove('expand-mode-active')
    }
  }, [mode, isMounted])

  return (
    <TransactionViewModeContext.Provider value={{ mode: isMounted ? mode : 'scroll', toggleMode, setMode }}>
      {children}
    </TransactionViewModeContext.Provider>
  )
}

export function useTransactionViewMode() {
  const context = useContext(TransactionViewModeContext)
  if (!context) {
    throw new Error('useTransactionViewMode must be used within a TransactionViewModeProvider')
  }
  return context
}
