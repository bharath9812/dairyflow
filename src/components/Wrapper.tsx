import React from 'react'

interface WrapperProps {
  children: React.ReactNode
  headerLeft?: React.ReactNode
  statsBar?: React.ReactNode
}

export default function Wrapper({ children, headerLeft, statsBar }: WrapperProps) {
  return (
    <div className="font-sans flex-1 flex flex-col min-h-0 gap-6 w-full pb-4">
      
      {/* Stats Bar (Top Section) */}
      {statsBar && (
        <div className="w-full shrink-0">
          {statsBar}
        </div>
      )}

      {/* Main Container */}
      <div className="w-full flex flex-col flex-1 min-h-0">
        <div className="bg-white/80 backdrop-blur-2xl border border-white/40 rounded-xl shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
          
          {/* Header */}
          {headerLeft && (
            <div className="px-5 py-5 flex items-center justify-between shrink-0 bg-white/50 border-b border-slate-200/50">
              {headerLeft}
            </div>
          )}

          {/* Children should handle min-h-0 internally */}
          {children}
        </div>
      </div>
    </div>
  )
}
