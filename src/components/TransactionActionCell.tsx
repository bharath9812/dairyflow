'use client'
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps, prefer-const, react/no-unescaped-entities, react-hooks/set-state-in-effect */

import { useState } from 'react'
import { Pencil, Trash2, Loader2 } from 'lucide-react'
import EditTransactionModal from './EditTransactionModal'
import { useRouter } from 'next/navigation'
import { deleteTransactions } from '@/app/transaction-actions'

export default function TransactionActionCell({ tx, onUpdate }: { tx: any, onUpdate?: () => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this transaction? This will automatically rollback any loan adjustments linked to it.')) return
    setIsDeleting(true)
    const res = await deleteTransactions([tx.id])
    if (res?.error) {
      alert("Failed to delete: " + res.error)
      setIsDeleting(false)
    } else {
      if (onUpdate) onUpdate()
      else router.refresh()
    }
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <button 
        onClick={() => setIsOpen(true)} 
        disabled={isDeleting}
        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group disabled:opacity-50"
        title="Edit Record"
      >
        <Pencil className="w-4 h-4 group-hover:scale-110 transition-transform" />
      </button>

      <button 
        onClick={handleDelete}
        disabled={isDeleting}
        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors group disabled:opacity-50"
        title="Delete Record"
      >
        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin text-rose-600" /> : <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />}
      </button>

      {isOpen && (
        <EditTransactionModal 
          transaction={tx} 
          onClose={() => setIsOpen(false)} 
          onSuccess={() => {
            setIsOpen(false)
            if (onUpdate) onUpdate()
            else router.refresh()
          }} 
        />
      )}
    </div>
  )
}
