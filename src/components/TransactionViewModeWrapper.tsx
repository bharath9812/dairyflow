'use client'

import React from 'react'
import { useTransactionViewMode } from './TransactionViewModeContext'
import { Maximize2, Minimize2 } from 'lucide-react'

interface WrapperProps {
  children: React.ReactNode
  headerLeft: React.ReactNode
  topSection?: React.ReactNode
  bottomSection?: React.ReactNode
}

export function TransactionViewModeWrapper({ children, headerLeft, topSection, bottomSection }: WrapperProps) {
  const { mode, toggleMode } = useTransactionViewMode()

  return (
    <>
      {mode !== 'expand' && topSection && (
        <div className="w-full shrink-0">
          {topSection}
        </div>
      )}

      <div className="w-full flex flex-col flex-1 min-h-0">
        <div className="bg-white/80 backdrop-blur-2xl border border-white/40 rounded-xl shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
          
          <div className="px-5 py-5 flex items-center justify-between shrink-0 bg-white/50 border-b border-slate-200/50">
            {headerLeft}
            
            <button 
              onClick={toggleMode}
              className="ml-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
            >
              {mode === 'expand' ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>

          {/* Children should handle min-h-0 internally */}
          {children}
        </div>
      </div>

      {mode !== 'expand' && bottomSection && (
        <div className="w-full shrink-0">
          {bottomSection}
        </div>
      )}
    </>
  )
}
