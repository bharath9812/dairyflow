'use client'
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps, prefer-const, react/no-unescaped-entities, react-hooks/set-state-in-effect */

import React, { createContext, useContext, useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { deleteTransactions } from '@/app/transaction-actions'
import { useRouter } from 'next/navigation'

const MultiSelectContext = createContext<any>(null)

export function MultiSelectProvider({ children, allIds }: { children: React.ReactNode, allIds: string[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const toggleAll = (checked: boolean) => setSelected(checked ? new Set(allIds) : new Set())
  const toggleOne = (id: string, checked: boolean) => {
    const next = new Set(selected)
    if (checked) next.add(id)
    else next.delete(id)
    setSelected(next)
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selected.size} transactions?`)) return
    setIsDeleting(true)
    const res = await deleteTransactions(Array.from(selected))
    if (res?.error) alert(res.error)
    else {
      setSelected(new Set())
      router.refresh()
    }
    setIsDeleting(false)
  }

  return (
    <MultiSelectContext.Provider value={{ selected, toggleAll, toggleOne, allIds, isDeleting, handleDelete }}>
      <div className="relative flex flex-col flex-1 min-h-0 w-full h-full">
        {selected.size > 0 && (
           <div className="absolute top-0 left-0 right-0 bg-indigo-50 border-b border-indigo-100 p-3 flex justify-between z-20 items-center px-6 shadow-sm">
             <span className="text-sm font-bold text-indigo-800">{selected.size} record{selected.size > 1 ? 's' : ''} selected</span>
             <button 
                onClick={handleDelete} 
                disabled={isDeleting} 
                className="bg-rose-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-rose-700 active:scale-95 transition-all shadow-md shadow-rose-200 disabled:opacity-50"
             >
               {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Trash2 className="w-3.5 h-3.5"/>} Delete Selected
             </button>
           </div>
        )}
        <div className={`flex flex-col flex-1 min-h-0 ${selected.size > 0 ? "pt-12" : ""}`}>
          {children}
        </div>
      </div>
    </MultiSelectContext.Provider>
  )
}

export function MultiSelectHeader() {
  const { toggleAll, selected, allIds } = useContext(MultiSelectContext)
  return (
    <input 
      type="checkbox" 
      checked={selected.size === allIds.length && allIds.length > 0} 
      onChange={e => toggleAll(e.target.checked)} 
      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shadow-sm transition-all" 
    />
  )
}

export function MultiSelectCheckbox({ id }: { id: string }) {
  const { toggleOne, selected } = useContext(MultiSelectContext)
  return (
    <input 
      type="checkbox" 
      checked={selected.has(id)} 
      onChange={e => toggleOne(id, e.target.checked)} 
      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shadow-sm transition-all" 
    />
  )
}
