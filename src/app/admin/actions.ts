'use server'

import { createClient } from '@/utils/supabase/server'

export async function fetchAdminTransactions(filters: { timeframe: string, shift: string, milkType?: string, minQty?: string, qtyOp?: string, search?: string, exactDate?: string, exactMonth?: string, startDate?: string, endDate?: string, limit: number, offset: number }) {
  const supabase = await createClient()

  let query = supabase
    .from('transactions')
    .select('*, customers!inner(seller_id, name, location)', { count: 'exact' })

  // Shift Handling
  if (filters.shift && filters.shift !== 'ALL') {
    query = query.eq('shift', filters.shift)
  }

  // Milk Type Handling
  if (filters.milkType && filters.milkType !== 'ALL') {
    query = query.eq('milk_type', filters.milkType)
  }

  // Quantity Filter Handling
  if (filters.minQty && Number(filters.minQty) > 0) {
    const op = filters.qtyOp === 'eq' ? 'eq' : filters.qtyOp === 'lt' ? 'lt' : 'gt'
    query = query.filter('quantity_litres', op, filters.minQty)
  }

  // Seller Search Handling (Chained into the !inner customers join)
  if (filters.search) {
    const searchVal = filters.search.trim()
    const isNum = !isNaN(Number(searchVal)) && searchVal !== ''
    if (isNum) {
      query = query.eq('customers.seller_id', Number(searchVal))
    } else {
      query = query.ilike('customers.name', `%${searchVal}%`)
    }
  }

  // Timeframe Handling
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const mm = String(month + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const todayStr = `${year}-${mm}-${dd}`

  if (filters.timeframe === 'TODAY') {
    query = query.eq('transaction_date', todayStr)
  } else if (filters.timeframe === 'SPECIFIC_DATE' && filters.exactDate) {
    query = query.eq('transaction_date', filters.exactDate)
  } else if (filters.timeframe === 'SPECIFIC_MONTH' && filters.exactMonth) {
    const [yy, exMm] = filters.exactMonth.split('-')
    const lastDay = new Date(Number(yy), Number(exMm), 0).getDate()
    const startStr = `${yy}-${exMm}-01`
    const endStr = `${yy}-${exMm}-${String(lastDay).padStart(2, '0')}`
    query = query.gte('transaction_date', startStr).lte('transaction_date', endStr)
  } else if (filters.timeframe === 'MONTH_FIRST_HALF') {
    query = query.gte('transaction_date', `${year}-${mm}-01`).lte('transaction_date', `${year}-${mm}-15`)
  } else if (filters.timeframe === 'MONTH_SECOND_HALF') {
    const lastDay = new Date(year, month + 1, 0).getDate()
    query = query.gte('transaction_date', `${year}-${mm}-16`).lte('transaction_date', `${year}-${mm}-${String(lastDay).padStart(2, '0')}`)
  } else if (filters.timeframe === 'MONTHLY') {
    const lastDay = new Date(year, month + 1, 0).getDate()
    query = query.gte('transaction_date', `${year}-${mm}-01`).lte('transaction_date', `${year}-${mm}-${String(lastDay).padStart(2, '0')}`)
  } else if (filters.timeframe === 'CUSTOM_RANGE' && filters.startDate && filters.endDate) {
    query = query.gte('transaction_date', filters.startDate).lte('transaction_date', filters.endDate)
  } else if (filters.timeframe === 'ALL_TIME') {
    // No date restriction
  }

  // Sorting constraint
  query = query.order('transaction_date', { ascending: false }).order('created_at', { ascending: false })

  // Standard Pagination bounds
  query = query.range(filters.offset, filters.offset + filters.limit - 1)

  const { data, count, error } = await query

  if (error) {
    console.error("Fetch Admin TX Error:", error.message)
    return { data: [], count: 0 }
  }

  return { data, count }
}

export async function fetchAdminAggregates(filters: { timeframe: string, shift: string, milkType?: string, minQty?: string, qtyOp?: string, search?: string, exactDate?: string, exactMonth?: string, startDate?: string, endDate?: string }) {
  const supabase = await createClient()

  let query = supabase
    .from('transactions')
    .select('quantity_litres, total_price, shift, customers!inner(seller_id, name)')

  // Milk Type Handling
  if (filters.milkType && filters.milkType !== 'ALL') {
    query = query.eq('milk_type', filters.milkType)
  }

  // Quantity Filter Handling
  if (filters.minQty && Number(filters.minQty) > 0) {
    const op = filters.qtyOp === 'eq' ? 'eq' : filters.qtyOp === 'lt' ? 'lt' : 'gt'
    query = query.filter('quantity_litres', op, filters.minQty)
  }

  // Seller Search Handling (Chained into the !inner customers join)
  if (filters.search) {
    const searchVal = filters.search.trim()
    const isNum = !isNaN(Number(searchVal)) && searchVal !== ''
    if (isNum) {
      query = query.eq('customers.seller_id', Number(searchVal))
    } else {
      query = query.ilike('customers.name', `%${searchVal}%`)
    }
  }

  // Timeframe Handling Code (Duplicated safely to prevent cross-fetch limits)
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const mm = String(month + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const todayStr = `${year}-${mm}-${dd}`

  if (filters.timeframe === 'TODAY') {
    query = query.eq('transaction_date', todayStr)
  } else if (filters.timeframe === 'SPECIFIC_DATE' && filters.exactDate) {
    query = query.eq('transaction_date', filters.exactDate)
  } else if (filters.timeframe === 'SPECIFIC_MONTH' && filters.exactMonth) {
    const [yy, exMm] = filters.exactMonth.split('-')
    const lastDay = new Date(Number(yy), Number(exMm), 0).getDate()
    const startStr = `${yy}-${exMm}-01`
    const endStr = `${yy}-${exMm}-${String(lastDay).padStart(2, '0')}`
    query = query.gte('transaction_date', startStr).lte('transaction_date', endStr)
  } else if (filters.timeframe === 'MONTH_FIRST_HALF') {
    query = query.gte('transaction_date', `${year}-${mm}-01`).lte('transaction_date', `${year}-${mm}-15`)
  } else if (filters.timeframe === 'MONTH_SECOND_HALF') {
    const lastDay = new Date(year, month + 1, 0).getDate()
    query = query.gte('transaction_date', `${year}-${mm}-16`).lte('transaction_date', `${year}-${mm}-${String(lastDay).padStart(2, '0')}`)
  } else if (filters.timeframe === 'MONTHLY') {
    const lastDay = new Date(year, month + 1, 0).getDate()
    query = query.gte('transaction_date', `${year}-${mm}-01`).lte('transaction_date', `${year}-${mm}-${String(lastDay).padStart(2, '0')}`)
  } else if (filters.timeframe === 'CUSTOM_RANGE' && filters.startDate && filters.endDate) {
    query = query.gte('transaction_date', filters.startDate).lte('transaction_date', filters.endDate)
  } else if (filters.timeframe === 'ALL_TIME') {
    // No date restriction
  }

  // Filter shifts after query inside Javascript strictly for complex analytics splits
  const { data, error } = await query

  if (error) {
    console.error("Aggregation Frame Error:", error.message)
    return { total_bought: 0, morning_bought: 0, evening_bought: 0, total_spent: 0, morning_spent: 0, evening_spent: 0 }
  }

  let totals = {
    total_bought: 0,
    morning_bought: 0,
    evening_bought: 0,
    total_spent: 0,
    morning_spent: 0,
    evening_spent: 0
  }

  data?.forEach(tx => {
    // Only accumulate if shift strictly matches the optional param, unless all
    if (filters.shift !== 'ALL' && tx.shift !== filters.shift) return;

    const lit = Number(tx.quantity_litres) || 0
    const price = Number(tx.total_price) || 0

    totals.total_bought += lit
    totals.total_spent += price

    if (tx.shift === 'Morning') {
      totals.morning_bought += lit
      totals.morning_spent += price
    } else if (tx.shift === 'Evening') {
      totals.evening_bought += lit
      totals.evening_spent += price
    }
  })

  return totals
}
