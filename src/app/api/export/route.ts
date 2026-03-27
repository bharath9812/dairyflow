import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const timeframe = searchParams.get('timeframe') || 'TODAY'
  const exactDate = searchParams.get('exactDate') || ''
  const exactMonth = searchParams.get('exactMonth') || ''
  const startDate = searchParams.get('startDate') || ''
  const endDate = searchParams.get('endDate') || ''
  const shift = searchParams.get('shift') || 'ALL'
  const milkType = searchParams.get('milkType') || 'ALL'
  const minQty = searchParams.get('minQty') || ''
  const search = searchParams.get('search') || ''
  const format = searchParams.get('format') || 'csv'
  const hiddenCols = (searchParams.get('hiddenCols') || '').split(',').filter(Boolean)

  const supabase = await createClient()

  let query = supabase
    .from('transactions')
    .select('*, customers!inner(seller_id, name)')

  if (shift !== 'ALL') query = query.eq('shift', shift)
  if (milkType !== 'ALL') query = query.eq('milk_type', milkType)
  
  const qtyOp = searchParams.get('qtyOp') || 'gt'
  if (minQty && Number(minQty) > 0) {
    const op = qtyOp === 'eq' ? 'eq' : qtyOp === 'lt' ? 'lt' : 'gt'
    query = query.filter('quantity_litres', op, minQty)
  }

  if (search) {
    const searchVal = search.trim()
    const isNum = !isNaN(Number(searchVal)) && searchVal !== ''
    if (isNum) {
      query = query.eq('customers.seller_id', Number(searchVal))
    } else {
      query = query.ilike('customers.name', `%${searchVal}%`)
    }
  }

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const mm = String(month + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const todayStr = `${year}-${mm}-${dd}`

  if (timeframe === 'TODAY') {
    query = query.eq('transaction_date', todayStr)
  } else if (timeframe === 'SPECIFIC_DATE' && exactDate) {
    query = query.eq('transaction_date', exactDate)
  } else if (timeframe === 'SPECIFIC_MONTH' && exactMonth) {
    const [yy, exMm] = exactMonth.split('-')
    const lastDay = new Date(Number(yy), Number(exMm), 0).getDate()
    const startStr = `${yy}-${exMm}-01`
    const endStr = `${yy}-${exMm}-${String(lastDay).padStart(2, '0')}`
    query = query.gte('transaction_date', startStr).lte('transaction_date', endStr)
  } else if (timeframe === 'CUSTOM_RANGE' && startDate && endDate) {
    query = query.gte('transaction_date', startDate).lte('transaction_date', endDate)
  } else if (timeframe === 'MONTH_FIRST_HALF') {
    query = query.gte('transaction_date', `${year}-${mm}-01`).lte('transaction_date', `${year}-${mm}-15`)
  } else if (timeframe === 'MONTH_SECOND_HALF') {
    const lastDay = new Date(year, month + 1, 0).getDate()
    query = query.gte('transaction_date', `${year}-${mm}-16`).lte('transaction_date', `${year}-${mm}-${String(lastDay).padStart(2, '0')}`)
  } else if (timeframe === 'MONTHLY') {
    const lastDay = new Date(year, month + 1, 0).getDate()
    query = query.gte('transaction_date', `${year}-${mm}-01`).lte('transaction_date', `${year}-${mm}-${String(lastDay).padStart(2, '0')}`)
  } else if (timeframe === 'ALL_TIME') {
    // Pass
  }

  query = query.order('transaction_date', { ascending: false })

  const { data, error } = await query

  if (error || !data) {
    return NextResponse.json({ error: 'Failed to stream data' }, { status: 500 })
  }

  if (format === 'csv') {
    const headerParts = []
    if (!hiddenCols.includes('col_sno')) headerParts.push('S.No')
    if (!hiddenCols.includes('col_date')) headerParts.push('Transaction Date', 'Shift')
    if (!hiddenCols.includes('col_seller')) headerParts.push('Seller ID', 'Seller Name')
    if (!hiddenCols.includes('col_type')) headerParts.push('Milk Type')
    if (!hiddenCols.includes('col_volume')) headerParts.push('Quantity (L)')
    if (!hiddenCols.includes('col_capital')) headerParts.push('Rate (INR)', 'Total Price (INR)')
    if (!hiddenCols.includes('col_audit')) headerParts.push('Audit Trail')

    const csvContent = [
      headerParts.join(','),
      ...data.map((tx, index) => {
        const rowParts = []
        if (!hiddenCols.includes('col_sno')) rowParts.push(index + 1)
        if (!hiddenCols.includes('col_date')) rowParts.push(tx.transaction_date, tx.shift)
        if (!hiddenCols.includes('col_seller')) rowParts.push(String(tx.customers?.seller_id).padStart(3, '0'), `"${tx.customers?.name || 'Unknown'}"`)
        if (!hiddenCols.includes('col_type')) rowParts.push(tx.milk_type)
        if (!hiddenCols.includes('col_volume')) rowParts.push(tx.quantity_litres)
        if (!hiddenCols.includes('col_capital')) rowParts.push(tx.price_per_litre, tx.total_price)
        if (!hiddenCols.includes('col_audit')) {
          const creation = `C: ${tx.created_by_name || 'Admin'} (${new Date(tx.created_at).toLocaleDateString()})`
          const update = tx.updated_at ? ` | U: ${tx.updated_by_name || 'Admin'} (${new Date(tx.updated_at).toLocaleDateString()})` : ''
          rowParts.push(`"${creation}${update}"`)
        }
        return rowParts.join(',')
      })
    ].join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="DairyFlow_Export_${timeframe}_${shift}.csv"`
      }
    })
  }

  if (format === 'json') {
    return NextResponse.json({ data })
  }

  return NextResponse.json({ error: 'Unsupported format' }, { status: 400 })
}
