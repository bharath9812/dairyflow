import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

// Use service role key to bypass RLS since this is a cron job running in the background
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function GET(request: Request) {
  return handleCron(request)
}

export async function POST(request: Request) {
  return handleCron(request)
}

async function handleCron(request: Request) {
  const { searchParams } = new URL(request.url)
  const cronSecret = searchParams.get('secret') || request.headers.get('Authorization')?.replace('Bearer ', '')

  // Enforce CRON_SECRET if it is configured in the environment
  const expectedSecret = process.env.CRON_SECRET
  if (expectedSecret && cronSecret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isForce = searchParams.get('force') === 'true'
  const frequencyParam = searchParams.get('frequency')

  try {
    // 1. Fetch backup configuration
    const { data: configRow } = await supabaseAdmin
      .from('app_settings')
      .select('value')
      .eq('id', 'backup_config')
      .maybeSingle()

    if (!configRow?.value) {
      return NextResponse.json({ message: 'Backup config not found' })
    }

    const config = typeof configRow.value === 'string' ? JSON.parse(configRow.value) : configRow.value

    if (frequencyParam) {
      // Direct execution for a specific frequency
      if (frequencyParam !== 'Daily' && frequencyParam !== 'Weekly' && frequencyParam !== 'Monthly') {
        return NextResponse.json({ error: `Invalid frequency: ${frequencyParam}` }, { status: 400 })
      }
      const result = await executeBackup(frequencyParam, config, isForce)
      return NextResponse.json(result)
    } else {
      // Orchestrator Mode (Ideal for Vercel Cron hourly ping):
      // Loops through Daily, Weekly, and Monthly and runs any that match their schedule.
      const executed: string[] = []
      const skipped: string[] = []

      for (const freq of ['Daily'] as const) {
        const freqConfig = config.configs?.[freq]
        if (!freqConfig || !freqConfig.enabled) {
          skipped.push(`${freq} (Disabled)`)
          continue
        }



        // Date / duplicate checks
        const now = new Date()
        const todayStr = now.toISOString().split('T')[0]
        const lastStatus = config.lastBackupStatuses?.[freq] || ''
        
        if (freq === 'Daily') {
          const alreadyRunToday = lastStatus.includes('Success') && lastStatus.includes(todayStr)
          if (alreadyRunToday) {
            skipped.push(`${freq} (Already run today)`)
            continue
          }
        } else if (freq === 'Weekly') {
          // Verify at least 6 days elapsed since last success to prevent duplicate weekly emails
          const lastSuccessDate = parseLastSuccessDate(lastStatus)
          if (lastSuccessDate) {
            const daysDiff = (now.getTime() - lastSuccessDate.getTime()) / (1000 * 60 * 60 * 24)
            if (daysDiff < 6) {
              skipped.push(`${freq} (Run skipped; only ${Math.round(daysDiff)} days since last weekly backup)`)
              continue
            }
          }
        } else if (freq === 'Monthly') {
          // Verify at least 27 days elapsed since last success to prevent duplicate monthly emails
          const lastSuccessDate = parseLastSuccessDate(lastStatus)
          if (lastSuccessDate) {
            const daysDiff = (now.getTime() - lastSuccessDate.getTime()) / (1000 * 60 * 60 * 24)
            if (daysDiff < 27) {
              skipped.push(`${freq} (Run skipped; only ${Math.round(daysDiff)} days since last monthly backup)`)
              continue
            }
          }
        }

        // Run it!
        await executeBackup(freq, config, false)
        executed.push(freq)

        // Refresh configuration object for the next loop iteration (updates last run logs in state)
        const { data: updatedConfigRow } = await supabaseAdmin
          .from('app_settings')
          .select('value')
          .eq('id', 'backup_config')
          .maybeSingle()
        if (updatedConfigRow?.value) {
          Object.assign(config, typeof updatedConfigRow.value === 'string' ? JSON.parse(updatedConfigRow.value) : updatedConfigRow.value)
        }
      }

      return NextResponse.json({
        message: 'Orchestrator completed execution.',
        executed,
        skipped
      })
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// Helper to parse dates from "Success on DD/MM/YYYY, HH:MM:SS" status strings
function parseLastSuccessDate(statusStr: string): Date | null {
  if (!statusStr || !statusStr.includes('Success on')) return null
  try {
    // Format: "Success on DD/MM/YYYY, HH:MM:SS" or "Success on D/M/YYYY..."
    const datePart = statusStr.split('Success on ')[1]?.split(',')[0]?.trim()
    if (!datePart) return null
    const [day, month, year] = datePart.split('/').map(Number)
    return new Date(year, month - 1, day)
  } catch (e) {
    return null
  }
}

async function executeBackup(frequency: 'Daily' | 'Weekly' | 'Monthly', config: any, isForce: boolean) {
  const freqConfig = config.configs?.[frequency]

  if (!freqConfig) {
    return { error: `Configuration for ${frequency} backup not found` }
  }

  const { email, tables, subjectPrefix, exportFormat } = freqConfig

  if (!email) {
    return { error: `No recipient email configured for ${frequency} backup` }
  }

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  // Determine optimized date range based on frequency
  let startDateStr = todayStr
  if (frequency === 'Weekly') {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    startDateStr = d.toISOString().split('T')[0]
  } else if (frequency === 'Monthly') {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    startDateStr = d.toISOString().split('T')[0]
  }

  // 2. Fetch transactions based on frequency
  const { data: transactions, error: txError } = await supabaseAdmin
    .from('transactions')
    .select('*, customers(seller_id, name, location)')
    .gte('transaction_date', startDateStr)
    .lte('transaction_date', todayStr)
    .order('created_at', { ascending: true })

  if (txError) {
    await logStatus(frequency, `Failed: Database error (transactions): ${txError.message}`, config)
    return { error: txError.message }
  }

  const attachments: any[] = []
  let totalRowCount = (transactions || []).length

  // Generate Transactions sheet
  const txHeaders = [
    'S.No', 'Transaction Date', 'Shift', 'Seller ID', 'Seller Name', 
    'Location', 'Milk Type', 'Quantity (L)', 'Fat %', 'Rate (INR/L)', 
    'Total Price (INR)', 'Net Payable (INR)', 'Created At'
  ]
  const txRows = (transactions || []).map((tx: any, idx: number) => [
    idx + 1,
    tx.transaction_date,
    tx.shift,
    tx.customers?.seller_id || '',
    tx.customers?.name || 'Unknown',
    tx.customers?.location || '',
    tx.milk_type,
    Number(tx.quantity_litres || 0),
    Number(tx.fat_percentage || 0),
    Number(tx.price_per_litre || 0),
    Number(tx.total_price || 0),
    Number(tx.net_payable ?? tx.total_price ?? 0),
    tx.created_at
  ])

  if (exportFormat === 'xlsx') {
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([txHeaders, ...txRows])
    XLSX.utils.book_append_sheet(wb, ws, "Transactions")
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    attachments.push({
      filename: `transactions_${frequency.toLowerCase()}_backup_${todayStr}.xlsx`,
      content: buffer.toString('base64')
    })
  } else {
    const csv = [txHeaders.join(','), ...txRows.map(r => r.map(v => String(v).includes(',') ? `"${String(v).replace(/"/g, '""')}"` : v).join(','))].join('\n')
    attachments.push({
      filename: `transactions_${frequency.toLowerCase()}_backup_${todayStr}.csv`,
      content: Buffer.from(csv).toString('base64')
    })
  }

  // 3. Fetch Loans & Loan Payments if "all" scope selected
  if (tables === 'all') {
    const { data: loans, error: loanError } = await supabaseAdmin
      .from('loans')
      .select('*, customers(seller_id, name, location)')
      .gte('created_at', `${startDateStr}T00:00:00.000Z`)
      .lte('created_at', `${todayStr}T23:59:59.999Z`)
      .order('created_at', { ascending: false })

    const { data: loanPayments, error: payError } = await supabaseAdmin
      .from('loan_payments')
      .select('*, loans(customer_id, customers(seller_id, name))')
      .gte('created_at', `${startDateStr}T00:00:00.000Z`)
      .lte('created_at', `${todayStr}T23:59:59.999Z`)
      .order('created_at', { ascending: false })

    if (loanError || payError) {
      const errorMsg = loanError?.message || payError?.message || 'Database error fetching loan tables'
      await logStatus(frequency, `Failed: ${errorMsg}`, config)
      return { error: errorMsg }
    }

    const activeLoans = loans || []
    const activePayments = loanPayments || []
    totalRowCount += activeLoans.length + activePayments.length

    // Format Loans
    const loanHeaders = [
      'S.No', 'Loan ID', 'Seller ID', 'Seller Name', 'Location', 
      'Principal Amount (INR)', 'Rate of Interest (%)', 'Outstanding Principal (INR)', 'Status', 'Created At'
    ]
    const loanRows = activeLoans.map((loan: any, idx: number) => [
      idx + 1,
      loan.id,
      loan.customers?.seller_id || '',
      loan.customers?.name || 'Unknown',
      loan.customers?.location || '',
      Number(loan.principal_amount || 0),
      Number(loan.interest_rate_rupees || 0),
      Number(loan.outstanding_principal || 0),
      loan.status,
      loan.created_at
    ])

    // Format Loan Payments
    const paymentHeaders = [
      'S.No', 'Payment ID', 'Loan ID', 'Seller ID', 'Seller Name', 
      'Principal Paid (INR)', 'Interest Paid (INR)', 'Total Paid (INR)', 'Payment Source', 'Payment Date'
    ]
    const paymentRows = activePayments.map((pay: any, idx: number) => {
      const principal = Number(pay.principal_paid || 0)
      const interest = Number(pay.interest_paid || 0)
      const total = principal + interest
      return [
        idx + 1,
        pay.id,
        pay.loan_id,
        pay.loans?.customers?.seller_id || '',
        pay.loans?.customers?.name || 'Unknown',
        principal,
        interest,
        total,
        pay.source || 'Unknown',
        pay.payment_date || ''
      ]
    })

    if (exportFormat === 'xlsx') {
      const wbLoans = XLSX.utils.book_new()
      const wsLoans = XLSX.utils.aoa_to_sheet([loanHeaders, ...loanRows])
      XLSX.utils.book_append_sheet(wbLoans, wsLoans, "Loans")
      const bufferLoans = XLSX.write(wbLoans, { type: 'buffer', bookType: 'xlsx' })
      attachments.push({
        filename: `loans_${frequency.toLowerCase()}_backup_${todayStr}.xlsx`,
        content: bufferLoans.toString('base64')
      })

      const wbPayments = XLSX.utils.book_new()
      const wsPayments = XLSX.utils.aoa_to_sheet([paymentHeaders, ...paymentRows])
      XLSX.utils.book_append_sheet(wbPayments, wsPayments, "Payments")
      const bufferPayments = XLSX.write(wbPayments, { type: 'buffer', bookType: 'xlsx' })
      attachments.push({
        filename: `loan_payments_${frequency.toLowerCase()}_backup_${todayStr}.xlsx`,
        content: bufferPayments.toString('base64')
      })
    } else {
      const csvLoans = [loanHeaders.join(','), ...loanRows.map(r => r.map(v => String(v).includes(',') ? `"${String(v).replace(/"/g, '""')}"` : v).join(','))].join('\n')
      const csvPayments = [paymentHeaders.join(','), ...paymentRows.map(r => r.map(v => String(v).includes(',') ? `"${String(v).replace(/"/g, '""')}"` : v).join(','))].join('\n')
      attachments.push(
        {
          filename: `loans_${frequency.toLowerCase()}_backup_${todayStr}.csv`,
          content: Buffer.from(csvLoans).toString('base64')
        },
        {
          filename: `loan_payments_${frequency.toLowerCase()}_backup_${todayStr}.csv`,
          content: Buffer.from(csvPayments).toString('base64')
        }
      )
    }
  }

  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    await logStatus(frequency, "Failed: RESEND_API_KEY missing in environment", config)
    return { error: 'RESEND_API_KEY is not configured' }
  }

  // Build Lumina Terminal DESIGN.md Styled Email HTML
  const emailHTML = `
    <div style="background-color: #f9f9fb; padding: 48px 24px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-height: 100%;">
      <div style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e2e4; border-radius: 12px; box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.01); overflow: hidden;">
        
        <!-- Top Accent Bar -->
        <div style="height: 6px; background-color: #000000;"></div>
        
        <div style="padding: 32px;">
          <!-- Header -->
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700; color: #7e7576; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 16px;">
            DairyFlow Terminal // Backup Service
          </div>
          
          <h2 style="font-size: 22px; font-weight: 600; color: #1a1c1d; letter-spacing: -0.02em; margin: 0 0 12px 0;">
            Automated ${frequency} Backup
          </h2>
          
          <p style="font-size: 13px; color: #4c4546; line-height: 1.6; margin: 0 0 24px 0;">
            Your scheduled automated ${frequency.toLowerCase()} backup has been compiled. The attached documents contain operational and financial data corresponding to the configured frequency timeline.
          </p>

          <!-- Configuration Summary Card -->
          <div style="background-color: #fcfcfd; border: 1px solid #eeeef0; border-radius: 8px; padding: 18px; margin-bottom: 24px;">
            <h4 style="font-size: 10px; font-weight: 700; color: #7e7576; letter-spacing: 0.05em; text-transform: uppercase; margin: 0 0 12px 0; font-family: 'JetBrains Mono', monospace;">
              Backup Metadata
            </h4>
            
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr style="border-bottom: 1px solid #eeeef0;">
                <td style="padding: 8px 0; color: #7e7576; font-weight: 500;">Export Date</td>
                <td style="padding: 8px 0; text-align: right; color: #1a1c1d; font-family: 'JetBrains Mono', monospace; font-weight: 700;">${todayStr}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eeeef0;">
                <td style="padding: 8px 0; color: #7e7576; font-weight: 500;">Backup Frequency</td>
                <td style="padding: 8px 0; text-align: right; color: #1a1c1d; font-weight: 600;">${frequency}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eeeef0;">
                <td style="padding: 8px 0; color: #7e7576; font-weight: 500;">Backup Scope</td>
                <td style="padding: 8px 0; text-align: right; color: #1a1c1d; font-weight: 600; text-transform: capitalize;">${tables === 'all' ? 'All Tables (Tx, Loans, Payments)' : 'Transactions Only'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eeeef0;">
                <td style="padding: 8px 0; color: #7e7576; font-weight: 500;">Export Format</td>
                <td style="padding: 8px 0; text-align: right; color: #1a1c1d; font-family: 'JetBrains Mono', monospace; font-weight: 700; text-transform: uppercase;">${exportFormat}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #7e7576; font-weight: 500;">Total Records Packaged</td>
                <td style="padding: 8px 0; text-align: right; color: #1a1c1d; font-family: 'JetBrains Mono', monospace; font-weight: 700;">${totalRowCount}</td>
              </tr>
            </table>
          </div>

          <div style="font-size: 11px; color: #7e7576; line-height: 1.5; margin-bottom: 32px; background-color: #fbfbfb; border-left: 3px solid #7e7576; padding: 10px 14px;">
            <strong>Security Warning:</strong> This is a secure automated delivery. These backups are intended strictly for administrative review. Do not upload to unverified public repositories or third-party services.
          </div>

          <!-- Footer -->
          <div style="border-top: 1px solid #eeeef0; padding-top: 20px; text-align: center;">
            <p style="font-size: 9px; color: #7e7576; margin: 0; font-family: 'JetBrains Mono', monospace; letter-spacing: 0.05em; text-transform: uppercase;">
              DairyFlow Terminal Automation // Achromatic Security Spec
            </p>
          </div>

        </div>
      </div>
    </div>
  `

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'DairyFlow Backups <onboarding@resend.dev>',
      to: email,
      subject: `${subjectPrefix || `${frequency} Backup`} - ${todayStr}`,
      html: emailHTML,
      attachments: attachments
    })
  })

  const resendData = await resendRes.json()

  if (!resendRes.ok) {
    const errorMsg = resendData.message || 'Failed to send via Resend'
    await logStatus(frequency, `Failed: ${errorMsg}`, config)
    return { error: errorMsg }
  }

  // 5. Update lastBackupStatus to success
  const nowTimestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
  await logStatus(frequency, `Success on ${nowTimestamp}`, config)

  return { success: true, id: resendData.id }
}

async function logStatus(frequency: string, statusStr: string, currentConfig: any) {
  try {
    const updatedStatuses = {
      ...(currentConfig.lastBackupStatuses || {}),
      [frequency]: statusStr
    }
    const updatedValue = {
      ...currentConfig,
      lastBackupStatuses: updatedStatuses
    }
    await supabaseAdmin.from('app_settings').upsert({
      id: 'backup_config',
      value: updatedValue,
      updated_at: new Date().toISOString()
    })
  } catch (err) {
    console.error("Error logging backup status:", err)
  }
}
