'use client'

import { useFormStatus } from 'react-dom'

export default function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <button 
      type="submit" 
      disabled={pending}
      className={`text-white px-6 py-3 rounded-lg font-bold text-sm transition-all shadow-sm flex items-center gap-2 bg-onyx hover:opacity-90 active:scale-[0.98] ${pending ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {pending ? 'Saving...' : 'Save Profile Identity'}
    </button>
  )
}
