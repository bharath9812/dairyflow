/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps, prefer-const, react/no-unescaped-entities, react-hooks/set-state-in-effect */
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
  const customerId = searchParams.get('customerId') || ''

  const supabase = await createClient()

  let query = supabase
    .from('transactions')
    .select('*, customers!inner(seller_id, name, contact, location)')

  if (shift !== 'ALL') query = query.eq('shift', shift)
  if (milkType !== 'ALL') query = query.eq('milk_type', milkType)
  if (customerId) query = query.eq('customer_id', customerId)

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
    if (exactMonth) {
      const [yy, exMm] = exactMonth.split('-')
      query = query.gte('transaction_date', `${yy}-${exMm}-01`).lte('transaction_date', `${yy}-${exMm}-15`)
    } else {
      query = query.gte('transaction_date', `${year}-${mm}-01`).lte('transaction_date', `${year}-${mm}-15`)
    }
  } else if (timeframe === 'MONTH_SECOND_HALF') {
    if (exactMonth) {
      const [yy, exMm] = exactMonth.split('-')
      const lastDay = new Date(Number(yy), Number(exMm), 0).getDate()
      query = query.gte('transaction_date', `${yy}-${exMm}-16`).lte('transaction_date', `${yy}-${exMm}-${String(lastDay).padStart(2, '0')}`)
    } else {
      const lastDay = new Date(year, month + 1, 0).getDate()
      query = query.gte('transaction_date', `${year}-${mm}-16`).lte('transaction_date', `${year}-${mm}-${String(lastDay).padStart(2, '0')}`)
    }
  } else if (timeframe === 'MONTHLY') {
    const lastDay = new Date(year, month + 1, 0).getDate()
    query = query.gte('transaction_date', `${year}-${mm}-01`).lte('transaction_date', `${year}-${mm}-${String(lastDay).padStart(2, '0')}`)
  } else if (timeframe === 'ALL_TIME') {
    // Pass
  }

  const sortBy = searchParams.get('sortBy') || 'DATE_ASC'
  if (sortBy === 'DATE_DESC') {
    query = query.order('transaction_date', { ascending: false }).order('created_at', { ascending: false })
  } else if (sortBy === 'DATE_ASC') {
    query = query.order('transaction_date', { ascending: true }).order('created_at', { ascending: true })
  } else if (sortBy === 'TOTAL_DESC') {
    query = query.order('total_price', { ascending: false })
  } else if (sortBy === 'TOTAL_ASC') {
    query = query.order('total_price', { ascending: true })
  } else {
    query = query.order('transaction_date', { ascending: false })
  }
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
    if (!hiddenCols.includes('col_volume')) headerParts.push('Quantity (L)', 'Fat %')
    if (!hiddenCols.includes('col_capital')) headerParts.push('Rate (INR)', 'Gross Price (INR)', 'Net Payable (INR)')
    if (!hiddenCols.includes('col_audit')) headerParts.push('Audit Trail')

    const csvContent = [
      headerParts.join(','),
      ...data.map((tx, index) => {
        const rowParts = []
        if (!hiddenCols.includes('col_sno')) rowParts.push(index + 1)
        if (!hiddenCols.includes('col_date')) rowParts.push(tx.transaction_date, tx.shift)
        if (!hiddenCols.includes('col_seller')) rowParts.push(String(tx.customers?.seller_id), `"${tx.customers?.name || 'Unknown'}"`)
        if (!hiddenCols.includes('col_type')) rowParts.push(tx.milk_type)
        if (!hiddenCols.includes('col_volume')) rowParts.push(tx.quantity_litres, tx.fat_percentage)
        if (!hiddenCols.includes('col_capital')) {
          const np = (Number(tx.total_price)).toFixed(2)
          rowParts.push(tx.price_per_litre, tx.total_price, np)
        }
        if (!hiddenCols.includes('col_audit')) {
          const creation = `C: ${tx.created_by_name || 'Admin'} (${new Date(tx.created_at).toLocaleDateString()})`
          const update = tx.updated_at ? ` | U: ${tx.updated_by_name || 'Admin'} (${new Date(tx.updated_at).toLocaleDateString()})` : ''
          rowParts.push(`"${creation}${update}"`)
        }
        return rowParts.join(',')
      })
    ].join('\n')

    let sellerComponent = "Global"
    if (customerId && data.length > 0) {
      const name = data[0].customers?.name?.replace(/\s+/g, '') || "Seller"
      const id = String(data[0].customers?.seller_id)
      sellerComponent = `${name}_${id}`
    }

    let dateComponent = timeframe
    if (timeframe === "SPECIFIC_DATE") dateComponent = exactDate || "Date"
    if (timeframe === "SPECIFIC_MONTH") dateComponent = exactMonth || "Month"
    if (timeframe === "CUSTOM_RANGE") dateComponent = `${startDate}_to_${endDate}`
    if (timeframe === "TODAY") dateComponent = "Today"
    if (timeframe === "MONTHLY") dateComponent = "Monthly"
    if (timeframe === "MONTH_FIRST_HALF") dateComponent = "FirstHalf"
    if (timeframe === "MONTH_SECOND_HALF") dateComponent = "SecondHalf"
    if (timeframe === "ALL_TIME") dateComponent = "AllTime"

    const shiftComponent = shift === "ALL" ? "AllShifts" : shift
    const finalFileName = `DairyFlow_${sellerComponent}_${dateComponent}_${shiftComponent}.csv`

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${finalFileName}"`
      }
    })
  }

  if (format === 'json') {
    let loanInfo = null;
    let payout = null;
    let currentCyclePayment = null;
    let customerInfo = null;

    if (customerId) {
      const custRes = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();
      customerInfo = custRes.data;

      if (timeframe === 'MONTH_FIRST_HALF' || timeframe === 'MONTH_SECOND_HALF') {
        let cycleYear = new Date().getFullYear();
        let cycleMonth = new Date().getMonth() + 1;
        if (exactMonth) {
          const [yy, mm] = exactMonth.split('-');
          cycleYear = parseInt(yy);
          cycleMonth = parseInt(mm);
        }
        const cycleSuffix = timeframe === 'MONTH_SECOND_HALF' ? 'C2' : 'C1';
        const selectedCycle = `${cycleYear}-${String(cycleMonth).padStart(2, '0')}-${cycleSuffix}`;

        const payoutRes = await supabase
          .from('payouts')
          .select('*')
          .eq('customer_id', customerId)
          .eq('cycle_identifier', selectedCycle)
          .limit(1)
          .single();
        payout = payoutRes.data;

        const lpRes = await supabase
          .from('loan_payments')
          .select('loan_id, loans!inner(customer_id)')
          .eq('loans.customer_id', customerId)
          .eq('cycle_identifier', selectedCycle)
          .limit(1)
          .single();
          
        let targetLoanId = lpRes.data?.loan_id;
        if (!targetLoanId) {
          const activeLoanRes = await supabase
            .from('v_loan_current_state')
            .select('loan_id')
            .eq('customer_id', customerId)
            .eq('status', 'ACTIVE')
            .limit(1)
            .single();
          targetLoanId = activeLoanRes.data?.loan_id;
        }

        if (targetLoanId) {
          const loanRes = await supabase
            .from('v_loan_current_state')
            .select('*')
            .eq('loan_id', targetLoanId)
            .single();
          loanInfo = loanRes.data;
          
          const payRes = await supabase
            .from('loan_payments')
            .select('*')
            .eq('loan_id', targetLoanId)
            .order('created_at', { ascending: false });
          currentCyclePayment = (payRes.data || []).find((p: any) => p.cycle_identifier === selectedCycle) || null;

          loanInfo.historical_outstanding = Number(loanInfo.outstanding_principal);
          loanInfo.historical_interest = Number(loanInfo.forecasted_interest);
        }
      }
    }

    const settingsRes = await supabase.from('app_settings').select('value').eq('id', 'pdf_branding').maybeSingle();
    const pdfSettings = settingsRes.data?.value || null;

    return NextResponse.json({ data, payout, loanInfo, currentCyclePayment, pdfSettings, customerInfo })
  }

  return NextResponse.json({ error: 'Unsupported format' }, { status: 400 })
}
