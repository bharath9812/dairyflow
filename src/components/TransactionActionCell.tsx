'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'
import EditTransactionModal from './EditTransactionModal'
import { useRouter } from 'next/navigation'

export default function TransactionActionCell({ tx, onUpdate }: { tx: any, onUpdate?: () => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group"
        title="Edit Record"
      >
        <Pencil className="w-4 h-4 group-hover:scale-110 transition-transform" />
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
    </>
  )
}
