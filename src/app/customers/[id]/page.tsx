'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, User, Phone, MapPin, Save, Droplets, TrendingUp, Calendar, CalendarDays, Activity, Loader2, FileDown, LogOut, Pencil, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { updateCustomerDetails } from './actions'
import EditTransactionModal from '@/components/EditTransactionModal'

export default function CustomerAnalyticsPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  // Profile Editable State
  const [sellerId, setSellerId] = useState('')
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [location, setLocation] = useState('')

  // Analytics & History
  const [transactions, setTransactions] = useState<any[]>([])
  const [editingTx, setEditingTx] = useState<any>(null)
  const [billingMonth, setBillingMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Computed Stats
  const [totalSales, setTotalSales] = useState(0)
  const [monthlySales, setMonthlySales] = useState(0)
  const [weeklySales, setWeeklySales] = useState(0)

  useEffect(() => {
    async function loadData() {
      // 1. Fetch Profile
      const { data: profile } = await supabase.from('customers').select('*').eq('id', id).single()
      if (profile) {
        setSellerId(profile.seller_id ? String(profile.seller_id) : '')
        setName(profile.name || '')
        setContact(profile.contact || '')
        setLocation(profile.location || '')
      }

      // 2. Fetch Transactions
      const { data: txs } = await supabase.from('transactions').select('*').eq('customer_id', id).order('transaction_date', { ascending: false })

      if (txs) {
        setTransactions(txs)
        setCurrentPage(1) // Reset page on ID change
        
        // Compute Analytics
        let tSales = 0
        let mSales = 0
        let wSales = 0

        const now = new Date()
        const oneWeekAgo = new Date()
        oneWeekAgo.setDate(now.getDate() - 7)

        txs.forEach(tx => {
          const val = Number(tx.total_price) || 0
          tSales += val

          const txDate = new Date(tx.transaction_date)

          if (txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear()) {
            mSales += val
          }
          if (txDate >= oneWeekAgo) {
            wSales += val
          }
        })

        setTotalSales(tSales)
        setMonthlySales(mSales)
        setWeeklySales(wSales)
      }
      setLoading(false)
    }

    if (id) loadData()
  }, [id, supabase])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const formData = new FormData()
    formData.append('seller_id', sellerId)
    formData.append('name', name)
    formData.append('contact', contact)
    formData.append('location', location)

    const result = await updateCustomerDetails(id as string, formData)

    if (result.error) {
      alert("Error updating profile: " + result.error)
    } else {
      alert("Profile successfully updated!")
    }
    setSaving(false)
  }

  // Pure Client-Side PDF Generation bypassing NextJS SSR
  const handleDownloadPDF = async () => {
    setDownloadingPdf(true)
    try {
      // Dynamic imports to prevent SSR "window is not defined" crashes
      const { jsPDF } = await import('jspdf')
      const autoTable = (await import('jspdf-autotable')).default

      const [year, month] = billingMonth.split('-')

      // Filter the transactions array to ONLY the selected billingMonth
      const filteredTxs = transactions.filter(tx => {
        const d = new Date(tx.transaction_date)
        return d.getFullYear() === Number(year) && d.getMonth() + 1 === Number(month)
      }).sort((a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime())

      if (filteredTxs.length === 0) {
        alert('No transactions recorded for the selected billing month.')
        setDownloadingPdf(false)
        return
      }

      const doc = new jsPDF()

      // 1. Header Structure
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("SUBBI REDDY MILK PRODUCER COMPANY LIMITED", 105, 15, { align: "center" })

      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text("DAIRY - KOTTALA-522213", 105, 21, { align: "center" })

      doc.setFontSize(11)
      doc.setFont("helvetica", "bold")
      doc.text("MILK PROCUREMENT BILL", 105, 28, { align: "center" })

      // 2. Date Range
      const startDate = new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('en-GB')
      const endDate = new Date(Number(year), Number(month), 0).toLocaleDateString('en-GB')
      doc.setFontSize(9)
      doc.text(`FROM DATE : ${startDate}      TO DATE : ${endDate}`, 105, 34, { align: "center" })

      // 3. Seller Master Details Box
      doc.rect(14, 40, 182, 35) // Outer box
      doc.setFontSize(8)
      doc.setFont("helvetica", "bold")

      // Left Details
      doc.text("DAIRY CODE", 16, 46); doc.text(": V.V. KOTTALA", 45, 46)
      doc.text("MILK TYPE", 16, 52); doc.text(": MIXED (Cow/Buffalo)", 45, 52)
      doc.text("BANK", 16, 58); doc.text(": ICICI BANK (Placeholder)", 45, 58)
      doc.text("ACCOUNT.NO", 16, 64); doc.text(": XXXX0675 (Placeholder)", 45, 64)
      doc.text("SELLER NO.", 16, 70); doc.text(`: ${sellerId.padStart(3, '0')} - ${name.toUpperCase()}, ${location.toUpperCase()}`, 45, 70)

      // Right Details
      doc.text("SUB CODE", 130, 46); doc.text(": A (Vendor)", 155, 46)
      doc.text("RATE", 130, 52); doc.text(": AS PER LOGS", 155, 52)
      doc.text("S.NO", 130, 58); doc.text(": 1", 155, 58)
      doc.text("BRANCH", 130, 64); doc.text(": PRODDATUR", 155, 64)
      doc.text("ROUTE CODE", 130, 70); doc.text(": 237 XXXXX", 155, 70)

      // 4. Data Mapping
      let totQty = 0
      let totFatSum = 0
      let totAmt = 0

      const bodyData = filteredTxs.map((tx, index) => {
        const q = Number(tx.quantity_litres)
        const f = Number(tx.fat_percentage)
        const a = Number(tx.total_price)

        totQty += q
        totFatSum += (f * q) 
        totAmt += a

        let auditStr = `C: ${tx.created_by_name || 'Admin'} (${new Date(tx.created_at).toLocaleDateString()})`
        if (tx.updated_at) {
          auditStr += `\nU: ${tx.updated_by_name || 'Admin'} (${new Date(tx.updated_at).toLocaleDateString()})`
        }

        return [
          index + 1,
          new Date(tx.transaction_date).toLocaleDateString('en-GB'),
          tx.shift === 'Morning' ? 'M' : 'E',
          tx.milk_type === 'Cow' ? 'Cow' : 'Buffalo',
          q.toFixed(2),
          f.toFixed(2),
          Number(tx.price_per_litre).toFixed(2),
          a.toFixed(2),
          auditStr
        ]
      })

      // 5. Data Table Rendering
      autoTable(doc, {
        startY: 80,
        head: [[
          { content: 'S.NO', styles: { halign: 'center' } },
          { content: 'DATE', styles: { halign: 'center' } },
          { content: 'SHIFT', styles: { halign: 'center' } },
          { content: 'TYPE', styles: { halign: 'center' } },
          { content: 'QTY (L)', styles: { halign: 'right' } },
          { content: 'FAT %', styles: { halign: 'right' } },
          { content: 'RATE (Rs)', styles: { halign: 'right' } },
          { content: 'NET AMT (Rs)', styles: { halign: 'right' } },
          { content: 'AUDIT', styles: { halign: 'left' } }
        ]],
        body: bodyData,
        foot: [[
          'TOTAL:', '', '', '',
          { content: totQty.toFixed(2), styles: { halign: 'right' } },
          '', '', // Leave fat and rate col empty in total row
          { content: totAmt.toFixed(2), styles: { halign: 'right' } },
          ''
        ]],
        theme: 'plain',
        styles: { fontSize: 8, cellPadding: 2.5, textColor: [0, 0, 0] },
        headStyles: { fontStyle: 'bold', lineWidth: { top: 0.5, bottom: 0.5 }, lineColor: [0, 0, 0] },
        footStyles: { fontStyle: 'bold', lineWidth: { top: 0.5, bottom: 0.5 }, lineColor: [0, 0, 0] },
        columnStyles: {
          0: { halign: 'center', cellWidth: 12 },
          1: { halign: 'center' },
          2: { halign: 'center', cellWidth: 15 },
          3: { halign: 'center' },
          4: { halign: 'right' },
          5: { halign: 'right' },
          6: { halign: 'right' },
          7: { halign: 'right' },
          8: { halign: 'left', cellWidth: 35 }
        }
      })

      // 6. Bottom Totals & Remarks Area
      const finalY = (doc as any).lastAutoTable.finalY + 10
      doc.setFontSize(9)
      doc.setFont("helvetica", "bold")

      doc.text(`Total Qty : ${totQty.toFixed(2)} L`, 16, finalY)
      const avgFat = totQty > 0 ? (totFatSum / totQty) : 0
      doc.text(`Average FAT % : ${avgFat.toFixed(2)}%`, 105, finalY, { align: 'center' })

      // Totals Box on the Right
      doc.rect(130, finalY, 66, 25)
      doc.setFontSize(8)
      doc.text(`TOTAL MILK VALUE`, 133, finalY + 7); doc.text(`:   Rs ${totAmt.toFixed(2)}`, 165, finalY + 7)

      doc.setFont("helvetica", "normal")
      doc.text(`ADDITIONS`, 133, finalY + 12.5); doc.text(`:   Rs 0.00`, 165, finalY + 12.5)
      doc.text(`DEDUCTIONS`, 133, finalY + 18); doc.text(`:   Rs 0.00`, 165, finalY + 18)

      doc.setLineWidth(0.2)
      doc.line(130, finalY + 20, 196, finalY + 20)

      doc.setFont("helvetica", "bold")
      doc.text(`TOTAL NET AMOUNT`, 133, finalY + 23.5); doc.text(`:   Rs ${totAmt.toFixed(2)}`, 165, finalY + 23.5)

      // Save Output directly to User's PC
      doc.save(`Milk_Bill_${name.replace(/\s+/g, '_')}_${billingMonth}.pdf`)

    } catch (error) {
      console.error(error)
      alert('Error generating PDF report. Make sure your browser allows downloads.')
    }
    setDownloadingPdf(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-blue-600">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-slate-500 font-bold tracking-tight">Loading Profile & Analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-slate-50 flex flex-col font-sans text-slate-800">

      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 px-6 lg:px-10 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg text-white shadow-sm">
            <Droplets className="w-5 h-5" />
          </div>
          <Link href="/" className="text-xl font-bold tracking-tight text-slate-800 hidden sm:block">
            DairyFlow<span className="text-blue-600 text-2xl leading-none">.</span>
          </Link>
        </div>
        <div className="flex items-center gap-6 text-sm font-semibold">
          <Link href="/customers" className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Directory
          </Link>
          <div className="w-px h-6 bg-slate-200 hidden md:block"></div>
          <button 
            onClick={async () => { await supabase.auth.signOut(); router.push('/login') }}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors font-bold"
          >
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col xl:flex-row w-full max-w-[1600px] mx-auto p-4 lg:p-8 gap-6 xl:gap-8 items-start">

        {/* =========================================================
            LEFT COLUMN: SETTINGS & KPIS
            ========================================================= */}
        <div className="w-full xl:w-[35%] flex flex-col gap-6">

          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{name}'s Profile</h2>
          </div>

          {/* EDITABLE PROFILE CARD */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-[0_2px_10px_rgba(0,0,0,0.03)] p-6 lg:p-8">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 border-b border-slate-100 pb-3">Account Details</h3>

            <form onSubmit={handleUpdate} className="space-y-5">
              
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" /> Seller ID Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="number" required value={sellerId} onChange={e => setSellerId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-800 font-bold focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" /> Full Name
                </label>
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-800 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" /> Contact Number
                </label>
                <input
                  type="text" value={contact} onChange={e => setContact(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-800 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" /> Location / Village
                </label>
                <input
                  type="text" value={location} onChange={e => setLocation(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-800 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-none"
                />
              </div>

              <button
                type="submit" disabled={saving}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 mt-4 rounded-lg transition-colors flex justify-center items-center gap-2 disabled:bg-slate-300"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Update Profile</>}
              </button>
            </form>
          </div>

          {/* ANALYTICS HUD */}
          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-xl shadow-lg p-6 lg:p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2"></div>

            <h3 className="text-xs font-bold uppercase tracking-widest text-blue-200 mb-6 relative z-10 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Lifetime Analytics
            </h3>

            <div className="space-y-6 relative z-10">
              <div>
                <div className="flex items-center gap-2 text-blue-100 text-sm font-medium mb-1"><TrendingUp className="w-4 h-4" /> Total Business</div>
                <div className="text-4xl font-black drop-shadow-sm">₹{totalSales.toFixed(2)}</div>
              </div>

              <div className="h-px bg-white/20 w-full" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-1.5 text-blue-100 text-xs font-medium mb-1"><CalendarDays className="w-3.5 h-3.5" /> This Month</div>
                  <div className="text-xl font-bold">₹{monthlySales.toFixed(2)}</div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-blue-100 text-xs font-medium mb-1"><Calendar className="w-3.5 h-3.5" /> Past 7 Days</div>
                  <div className="text-xl font-bold">₹{weeklySales.toFixed(2)}</div>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* =========================================================
            RIGHT COLUMN: TRANSACTION HISTORY & BILLING
            ========================================================= */}
        <div className="w-full xl:w-[65%] flex flex-col mt-4 xl:mt-0 gap-6">

          {/* Billing PDF Generation Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-[0_2px_10px_rgba(0,0,0,0.03)] p-5 lg:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
                <FileDown className="w-5 h-5 text-indigo-600" /> Monthly PDF Bill
              </h3>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Generate and download official receipt for a specific month.</p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <input
                type="month"
                value={billingMonth}
                onChange={(e) => setBillingMonth(e.target.value)}
                className="w-full sm:w-auto rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none"
              />
              <button
                onClick={handleDownloadPDF}
                disabled={downloadingPdf}
                className="shrink-0 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-bold px-5 py-2.5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {downloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Download PDF'}
              </button>
            </div>
          </div>

          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="text-lg lg:text-xl font-bold text-slate-800 tracking-tight">Transaction History</h2>
            <span className="text-xs font-bold text-slate-500 bg-slate-200 px-3 py-1 rounded-md">
              {transactions.length} Records
            </span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-[0_2px_10px_rgba(0,0,0,0.03)] flex flex-col flex-1 overflow-hidden min-h-[500px]">

            <div className="flex-1 overflow-x-auto overflow-y-auto">
              <table className="min-w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 z-10">
                  <tr>
                    <th className="px-3 py-4 font-bold text-slate-500 uppercase tracking-wider text-[11px] text-center">S.No</th>
                    <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[11px]">Transaction Date</th>
                    <th className="px-5 py-4 font-bold text-slate-500 uppercase tracking-wider text-[11px]">Milk Details</th>
                    <th className="px-5 py-4 font-bold text-slate-500 uppercase tracking-wider text-[11px] text-right">Price (/kg)</th>
                    <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[11px] text-right">Total Net (₹)</th>
                    <th className="px-5 py-4 font-bold text-slate-500 uppercase tracking-wider text-[11px]">Audit</th>
                    <th className="px-4 py-4 border-b border-slate-200"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center text-slate-400 font-medium">No historical transactions logged for this specified seller.</td>
                    </tr>
                  ) : transactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((tx, index) => (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-3 py-4 text-center text-slate-400 font-mono text-[11px]">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{new Date(tx.transaction_date).toLocaleDateString()}</div>
                        <div className="text-xs text-slate-400 font-medium">{new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          {tx.milk_type === 'Cow' ? '🐄 Cow' : '🐃 Buffalo'}
                          <span className="text-slate-300 mx-1">|</span> {tx.shift}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                          {Number(tx.quantity_litres)}L <span className="text-slate-300">•</span> {Number(tx.fat_percentage)}% Fat
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right font-medium text-slate-600">
                        ₹{Number(tx.price_per_litre).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-slate-800 text-base">
                        ₹{Number(tx.total_price).toFixed(2)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-[10px] text-slate-500 font-medium whitespace-normal min-w-[120px]">
                          <div>C: {tx.created_by_name || 'Admin'}</div>
                          {tx.updated_at && (
                            <div className="text-indigo-500 mt-0.5">U: {tx.updated_by_name || 'Admin'}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button onClick={() => setEditingTx(tx)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors group">
                          <Pencil className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Banner */}
            <div className="bg-white border-t border-slate-200 p-4 shrink-0 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                {transactions.length > 0 
                  ? `Showing ${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, transactions.length)} of ${transactions.length}`
                  : '0 logs'
                }
              </span>
              <div className="flex items-center gap-1.5">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="text-xs font-medium text-slate-600 px-2">
                  {currentPage} <span className="text-slate-300 mx-0.5">/</span> {Math.max(1, Math.ceil(transactions.length / itemsPerPage))}
                </div>
                <button 
                  disabled={currentPage === Math.ceil(transactions.length / itemsPerPage) || transactions.length === 0}
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(transactions.length / itemsPerPage), p + 1))}
                  className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

        </div>

      </main>

      {editingTx && (
        <EditTransactionModal 
          transaction={editingTx} 
          onClose={() => setEditingTx(null)} 
          onSuccess={() => {
            setEditingTx(null)
            supabase.from('transactions').select('*').eq('customer_id', id).order('transaction_date', { ascending: false })
              .then(res => res.data && setTransactions(res.data))
          }} 
        />
      )}
    </div>
  )
}
