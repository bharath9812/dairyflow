'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function processMilkTransaction(txData: any) {
  const supabase = await createClient()
  
  // 1. Fetch active loans for this customer, ordered by oldest first
  const { data: activeLoans, error: loanError } = await supabase
    .from('customer_loans')
    .select('*')
    .eq('customer_id', txData.customer_id)
    .eq('status', 'ACTIVE')
    .order('issued_date', { ascending: true })

  if (loanError) return { error: loanError.message }

  let remainingValueToDeduct = txData.total_price
  let totalDeducted = 0
  const recoveriesToInsert = []
  const loansToUpdate = []

  // 2. Calculate deductions against active loans
  if (activeLoans && activeLoans.length > 0) {
    for (const loan of activeLoans) {
      if (remainingValueToDeduct <= 0) break

      const remainingBalance = Number(loan.amount) - Number(loan.recovered_amount)
      if (remainingBalance <= 0) continue // Should be CLEARED already, but just in case

      const deduction = Math.min(remainingValueToDeduct, remainingBalance)
      
      remainingValueToDeduct -= deduction
      totalDeducted += deduction

      const newRecoveredAmount = Number(loan.recovered_amount) + deduction
      const newStatus = newRecoveredAmount >= Number(loan.amount) ? 'CLEARED' : 'ACTIVE'

      loansToUpdate.push({
        id: loan.id,
        recovered_amount: newRecoveredAmount,
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      
      recoveriesToInsert.push({
        loan_id: loan.id,
        amount_recovered: deduction
      })
    }
  }

  // Calculate the total remaining balance across all active loans
  const totalOutstandingBefore = activeLoans ? activeLoans.reduce((sum, loan) => sum + (Number(loan.amount) - Number(loan.recovered_amount)), 0) : 0
  const loanBalanceAfter = Math.max(0, totalOutstandingBefore - totalDeducted)

  // 3. Prepare the final transaction record
  const finalTx = {
    ...txData,
    loan_deduction: totalDeducted,
    loan_balance_after: loanBalanceAfter,
    status: totalDeducted > 0 ? (totalDeducted >= txData.total_price ? 'LOAN_CLEARED' : 'LOAN_ADJUSTED') : 'NORMAL'
  }

  // 4. Insert transaction
  const { data: insertedTx, error: txError } = await supabase
    .from('transactions')
    .insert([finalTx])
    .select('id, *, customers(name)')
    .single()

  if (txError) return { error: txError.message }

  // 5. If there were deductions, record recoveries and update loans
  if (totalDeducted > 0 && insertedTx) {
    // Add transaction_id to recoveries
    const readyRecoveries = recoveriesToInsert.map(r => ({ ...r, transaction_id: insertedTx.id }))
    
    await supabase.from('loan_recoveries').insert(readyRecoveries)

    // Update loans (Supabase JS doesn't have bulk update, so we loop or upsert)
    // Since these are existing records, we can upsert if we provide all required fields,
    // or just run individual updates.
    for (const update of loansToUpdate) {
      await supabase.from('customer_loans').update({
        recovered_amount: update.recovered_amount,
        status: update.status,
        updated_at: update.updated_at
      }).eq('id', update.id)
    }
  }

  revalidatePath('/')
  return { data: insertedTx }
}

export async function deleteTransactions(txIds: string[]) {
  const supabase = await createClient()

  for (const id of txIds) {
    const { error } = await supabase.rpc('delete_transaction_safe', { p_transaction_id: id })
    if (error) {
      console.error('Delete TX Error:', error.message)
      return { error: error.message }
    }
  }

  revalidatePath('/')
  return { success: true }
}

export async function deleteLoan(loanId: string) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('delete_loan_safe', { p_loan_id: loanId })
  if (error) {
    console.error('Delete Loan Error:', error.message)
    return { error: error.message }
  }

  revalidatePath('/')
  return { success: true }
}

export async function updateLoanAmount(loanId: string, newAmount: number) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('update_loan_safe', { p_loan_id: loanId, p_new_amount: newAmount })
  if (error) {
    console.error('Update Loan Error:', error.message)
    return { error: error.message }
  }

  revalidatePath('/')
  return { success: true }
}
