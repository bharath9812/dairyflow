'use client'
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */

import React, { useState, useEffect } from 'react'
import { Receipt, Search, FileText, CheckCircle2, AlertCircle, Banknote, Loader2, Download, Printer, RefreshCw, CheckSquare, ArrowRightCircle } from 'lucide-react'
import Link from 'next/link'
import TopBar from '@/components/TopBar'
import Wrapper from '@/components/Wrapper'
import { createClient } from '@/utils/supabase/client'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

import { fetchCycleConfig, getPreviousCycle, getCycleDates } from '@/utils/cycle'

export default function PayoutTrackerPage() {
  const [supabase] = useState(() => createClient())
  const [cycleConfig, setCycleConfig] = useState<any>({ c1StartDay: 1, c1EndDay: 14 })
  const [cycle, setCycle] = useState('')
  const [payouts, setPayouts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGeneratingGlobal, setIsGeneratingGlobal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [downloadingPdfFor, setDownloadingPdfFor] = useState<string | null>(null)
  const [selectedPayouts, setSelectedPayouts] = useState<Set<string>>(new Set())
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'PAID'>('ALL')
  const [sortFilter, setSortFilter] = useState<'NET_PAYABLE_DESC' | 'NET_PAYABLE_ASC' | 'LOAN_DED_DESC' | 'CF_PRIN_DESC' | 'NAME_ASC'>('NET_PAYABLE_DESC')

  useEffect(() => {
    const init = async () => {
      const config = await fetchCycleConfig(supabase)
      setCycleConfig(config)
      setCycle(getPreviousCycle(config))
    }
    init()
  }, [])

  const fetchPayouts = async () => {
    if (!cycle) return
    setIsLoading(true)
    
    // Auto-update pending payouts logic could be placed here, but user asked for "fetch and try to update whenever loaded AND manual update button"
    // Let's do the manual update button to prevent slow loads.
    
    const { data, error } = await supabase
      .from('payouts')
      .select(`
        *,
        customers (
          name,
          seller_id,
          contact,
          location
        )
      `)
      .eq('cycle_identifier', cycle)
      .order('net_payable', { ascending: false })

    // Also fetch active loans
    const { data: loansData } = await supabase
      .from('loans')
      .select('id, customer_id, status')
      .eq('status', 'ACTIVE')

    if (error) {
      console.error('Error fetching payouts:', error)
    } else {
      const merged = (data || []).map((p: any) => {
        const l = loansData?.find((loan: any) => loan.customer_id === p.customer_id)
        return { ...p, active_loan_id: l?.id || null }
      })
      setPayouts(merged)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchPayouts()
    setSelectedPayouts(new Set())
  }, [cycle])

  const handleGenerateOrUpdatePayouts = async () => {
    setIsGenerating(true)
    
    try {
      // 1. Fetch live aggregates
      const { data: aggregates } = await supabase
        .from('live_cycle_aggregates')
        .select('*')
        .eq('cycle_identifier', cycle)
        
      if (!aggregates || aggregates.length === 0) {
        alert('No milk poured by any customer in this cycle.')
        return
      }

      // 2. Use RPC to generate and update all payouts (Enterprise Backend)
      await supabase.rpc('generate_payouts_for_cycle', { p_cycle_identifier: cycle })

      fetchPayouts()
    } catch (err: any) {
      alert('Error updating payouts: ' + err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  const markSelectedAsPaid = async () => {
    if (selectedPayouts.size === 0) return
    if (!confirm(`Mark ${selectedPayouts.size} payouts as PAID?`)) return
    
    setIsLoading(true)
    const ids = Array.from(selectedPayouts)
    const { error } = await supabase
      .from('payouts')
      .update({ status: 'PAID', paid_at: new Date().toISOString() })
      .in('id', ids)
    
    if (error) {
      alert("Error marking as paid: " + error.message)
    } else {
      setSelectedPayouts(new Set())
      fetchPayouts()
    }
    setIsLoading(false)
  }

  const markSelectedAsUnpaid = async () => {
    if (selectedPayouts.size === 0) return
    if (!confirm(`Mark ${selectedPayouts.size} payouts as UNPAID?`)) return
    
    setIsLoading(true)
    const ids = Array.from(selectedPayouts)
    const { error } = await supabase
      .from('payouts')
      .update({ status: 'PENDING', paid_at: null })
      .in('id', ids)
    
    if (error) {
      alert("Error marking as unpaid: " + error.message)
    } else {
      setSelectedPayouts(new Set())
      fetchPayouts()
    }
    setIsLoading(false)
  }

  const toggleSelection = (id: string) => {
    const next = new Set(selectedPayouts)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedPayouts(next)
  }

  const toggleAllSelection = () => {
    if (selectedPayouts.size === filteredPayouts.length) {
      setSelectedPayouts(new Set())
    } else {
      const next = new Set<string>()
      filteredPayouts.forEach(p => next.add(p.id))
      setSelectedPayouts(next)
    }
  }

  // PDF Generation Logic
  const buildReceiptPage = (doc: jsPDF, payout: any, transactions: any[], isFirstPage: boolean) => {
    if (!isFirstPage) doc.addPage()
      
    const startDate = payout.cycle_start_date
    const endDate = payout.cycle_end_date
    const sellerName = payout.customers?.name || `Seller ${String(payout.customers?.seller_id || '').padStart(3, '0')}`
    const sellerCode = String(payout.customers?.seller_id).padStart(3, '0')

    // Header
    doc.setFontSize(22)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(30, 64, 175)
    doc.text("DAIRYFLOW PROCUREMENT SYSTEM", 105, 20, { align: "center" })

    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(100, 116, 139)
    doc.text("Official Settlement Receipt | Generated via DairyFlow Admin", 105, 26, { align: "center" })

    doc.setLineWidth(0.5)
    doc.setDrawColor(203, 213, 225)
    doc.line(14, 32, 196, 32)

    // Title
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(15, 23, 42)
    doc.text("CYCLE SETTLEMENT RECEIPT", 105, 40, { align: "center" })

    // Meta Info Box
    doc.setDrawColor(226, 232, 240)
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(14, 46, 182, 22, 2, 2, "FD")

    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(71, 85, 105)
    doc.text("Seller Details:", 18, 52)
    doc.text("Statement Period:", 110, 52)

    doc.setFont("helvetica", "normal")
    doc.setTextColor(15, 23, 42)
    doc.text(`ID: #${sellerCode}  |  Name: ${sellerName}`, 18, 58)
    doc.text(`Cycle ${payout.cycle_identifier} (${startDate} to ${endDate})`, 110, 58)

    doc.text(`Phone: ${payout.customers?.contact || 'N/A'}`, 18, 64)
    doc.text(`Settlement Date: ${new Date(payout.payout_date).toLocaleDateString('en-GB')}`, 110, 64)

    // Transactions Table
    if (transactions && transactions.length > 0) {
      const tableColumn = ['Date', 'Shift', 'Type', 'Qty (L)', 'Rate/L', 'Gross (Rs)']
      const tableRows = transactions.map((t: any) => [
        new Date(t.transaction_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        t.shift,
        t.milk_type,
        Number(t.quantity_litres).toFixed(1),
        Number(t.price_per_litre).toFixed(2),
        Number(t.total_price).toFixed(2)
      ])

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 75,
        theme: 'striped',
        headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105], fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 3 },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        margin: { left: 14, right: 14 }
      })
    }

    // Financial Summary
    const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : 75

    doc.setFillColor(248, 250, 252)
    doc.setDrawColor(226, 232, 240)
    doc.roundedRect(110, finalY, 86, 55, 2, 2, "FD")

    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text("SETTLEMENT SUMMARY", 115, finalY + 8)

    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    
    doc.text("Gross Earnings:", 115, finalY + 16)
    doc.text(`Rs. ${Number(payout.total_earnings).toFixed(2)}`, 190, finalY + 16, { align: "right" })
    
    doc.text("Loan Deductions (Principal):", 115, finalY + 22)
    doc.text(`- Rs. ${Number(payout.principal_paid_from_milk || 0).toFixed(2)}`, 190, finalY + 22, { align: "right" })
    
    doc.text("Loan Deductions (Interest):", 115, finalY + 28)
    doc.text(`- Rs. ${Number(payout.interest_paid || 0).toFixed(2)}`, 190, finalY + 28, { align: "right" })

    doc.setDrawColor(203, 213, 225)
    doc.line(115, finalY + 32, 190, finalY + 32)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.setTextColor(16, 185, 129) // emerald-500
    doc.text("NET PAYABLE:", 115, finalY + 40)
    doc.text(`Rs. ${Number(payout.net_payable).toFixed(2)}`, 190, finalY + 40, { align: "right" })
    
    doc.setFontSize(8)
    doc.setFont("helvetica", "italic")
    doc.setTextColor(100, 116, 139)
    doc.text(`Remaining Loan C/F: Rs. ${Number(payout.carried_forward_principal || 0).toFixed(2)}`, 190, finalY + 48, { align: "right" })

    // Footer
    const pageHeight = doc.internal.pageSize.height
    doc.setFontSize(8)
    doc.setFont("helvetica", "italic")
    doc.setTextColor(148, 163, 184)
    doc.text("This is an electronically generated statement and requires no physical signature.", 105, pageHeight - 15, { align: "center" })
  }

  const downloadReceipt = async (payout: any) => {
    setDownloadingPdfFor(payout.id)
    try {
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('customer_id', payout.customer_id)
        .gte('transaction_date', payout.cycle_start_date)
        .lte('transaction_date', payout.cycle_end_date)
        .order('transaction_date', { ascending: true })

      const doc = new jsPDF()
      buildReceiptPage(doc, payout, transactions || [], true)
      
      const sellerCode = String(payout.customers?.seller_id).padStart(3, '0')
      doc.save(`Payout_Receipt_${sellerCode}_${payout.cycle_identifier}.pdf`)
    } catch (err) {
      console.error(err)
      alert("Failed to generate PDF receipt.")
    }
    setDownloadingPdfFor(null)
  }

  const downloadGlobalReceipts = async () => {
    if (filteredPayouts.length === 0) return
    setIsGeneratingGlobal(true)
    try {
      const doc = new jsPDF()
      
      doc.setFontSize(22)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(30, 64, 175)
      doc.text("DAIRYFLOW PROCUREMENT SYSTEM", 105, 20, { align: "center" })

      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(100, 116, 139)
      doc.text(`Global Settlement Report | Cycle ${cycle}`, 105, 28, { align: "center" })
      
      const dates = getCycleDates(cycle, cycleConfig)
      const startDateStr = new Date(dates.startDate).toLocaleDateString('en-GB')
      const endDateStr = new Date(dates.endDate).toLocaleDateString('en-GB')
      doc.text(`Period: ${startDateStr} to ${endDateStr}`, 105, 34, { align: "center" })

      // Define table columns
      const tableColumn = ['ID', 'Seller Name', 'Total Milk (L)', 'Gross Earnings', 'Loan Deductions', 'C/F Principal', 'Net Payable', 'Status']
      const tableRows = filteredPayouts.map(p => {
        const id = String(p.customers?.seller_id).padStart(3, '0')
        const name = p.customers?.name || 'Unknown'
        const milk = Number(p.total_milk_litres).toFixed(1)
        const gross = Number(p.total_earnings).toFixed(2)
        const ded = (Number(p.loan_principal_deducted) + Number(p.loan_interest_deducted)).toFixed(2)
        const cf = Number(p.carried_forward_principal).toFixed(2)
        const net = Number(p.net_payable).toFixed(2)
        const stat = p.status
        return [id, name, milk, gross, ded, cf, net, stat]
      })

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 45,
        theme: 'striped',
        headStyles: { fillColor: [30, 64, 175], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 3 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 }
      })

      // Add summary
      const finalY = (doc as any).lastAutoTable.finalY + 15
      doc.setFontSize(11)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(15, 23, 42)
      doc.text("GRAND TOTALS", 14, finalY)

      const totalGross = filteredPayouts.reduce((s, p) => s + Number(p.total_earnings), 0).toFixed(2)
      const totalDed = filteredPayouts.reduce((s, p) => s + Number(p.loan_principal_deducted) + Number(p.loan_interest_deducted), 0).toFixed(2)
      const totalNet = filteredPayouts.reduce((s, p) => s + Number(p.net_payable), 0).toFixed(2)

      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      doc.text(`Total Gross Earnings: Rs. ${totalGross}`, 14, finalY + 8)
      doc.text(`Total Loan Deductions: Rs. ${totalDed}`, 14, finalY + 14)
      
      doc.setFont("helvetica", "bold")
      doc.setTextColor(16, 185, 129)
      doc.text(`TOTAL NET PAYABLE: Rs. ${totalNet}`, 14, finalY + 22)
      
      doc.save(`Global_Settlement_Report_${cycle}.pdf`)
    } catch (err) {
      console.error(err)
      alert("Failed to generate Global PDF.")
    }
    setIsGeneratingGlobal(false)
  }

  const filteredPayouts = payouts.filter(p => {
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false
    const term = (searchTerm || '').trim().toLowerCase()
    if (!term) return true
    return (
      (p.customers?.name && p.customers.name.toLowerCase().includes(term)) ||
      (p.customers?.location && p.customers.location.toLowerCase().includes(term)) ||
      (p.customers?.contact && p.customers.contact.includes(term)) ||
      (String(p.customers?.seller_id).padStart(3, '0').includes(term)) ||
      (String(p.customers?.seller_id) === term)
    )
  }).sort((a, b) => {
    if (sortFilter === 'NET_PAYABLE_DESC') return Number(b.net_payable) - Number(a.net_payable)
    if (sortFilter === 'NET_PAYABLE_ASC') return Number(a.net_payable) - Number(b.net_payable)
    if (sortFilter === 'LOAN_DED_DESC') {
      const bDed = Number(b.loan_principal_deducted) + Number(b.loan_interest_deducted)
      const aDed = Number(a.loan_principal_deducted) + Number(a.loan_interest_deducted)
      return bDed - aDed
    }
    if (sortFilter === 'CF_PRIN_DESC') return Number(b.carried_forward_principal) - Number(a.carried_forward_principal)
    if (sortFilter === 'NAME_ASC') {
      const nameA = (a.customers?.name || '').toLowerCase()
      const nameB = (b.customers?.name || '').toLowerCase()
      return nameA.localeCompare(nameB)
    }
    return 0
  })

  const totalCyclePayout = payouts.reduce((sum, p) => sum + Number(p.net_payable), 0)
  const allSelected = filteredPayouts.length > 0 && selectedPayouts.size === filteredPayouts.length

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      <TopBar
        leftPillLabel="Settlements"
        leftPillHref="/payout"
        leftPillActive={true}
        rightPillLabel="View Loans"
        rightPillHref="/loan"
        rightPillActive={false}
        dateString={new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
      />

      <main className="flex-1 flex flex-col w-full p-4 md:p-6 lg:p-8 overflow-hidden relative">
        <Wrapper
          statsBar={
            <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto items-center">
              <div className="bg-gradient-to-br from-white/80 to-indigo-50/50 backdrop-blur-2xl border border-white/40 rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden min-w-[200px]">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 tracking-wider uppercase">
                  <Receipt className="w-4 h-4" /> CYCLE
                </div>
                <div className="mt-2 text-xl font-bold text-onyx">
                  <select 
                    value={cycle}
                    onChange={(e) => setCycle(e.target.value)}
                    className="bg-transparent border-none outline-none focus:ring-0 p-0 text-xl font-bold text-indigo-900 cursor-pointer"
                  >
                    {[...Array(8)].map((_, i) => {
                      const d = new Date()
                      d.setMonth(d.getMonth() - Math.floor(i/2))
                      const y = d.getFullYear()
                      const m = String(d.getMonth() + 1).padStart(2, '0')
                      const c = i % 2 === 0 ? 'C2' : 'C1'
                      const val = `${y}-${m}-${c}`
                      const dates = getCycleDates(val, cycleConfig)
                      const displayDate = `${new Date(dates.startDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })} - ${new Date(dates.endDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}`
                      return <option key={val} value={val}>{val} ({displayDate})</option>
                    })}
                  </select>
                </div>
              </div>

              <div className="bg-gradient-to-br from-white/80 to-emerald-50/50 backdrop-blur-2xl border border-white/40 rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden min-w-[200px]">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 tracking-wider uppercase">
                  <Banknote className="w-4 h-4" /> TOTAL CYCLE PAYOUT
                </div>
                <div className="mt-2 text-2xl font-bold text-emerald-600 font-mono">
                  ₹{totalCyclePayout.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
              
              <button
                onClick={handleGenerateOrUpdatePayouts}
                disabled={isGenerating}
                className="ml-auto px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 text-sm whitespace-nowrap"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Generate / Update Settlements
              </button>
            </div>
          }
          headerLeft={
            <div className="flex items-center gap-4">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-onyx leading-tight">Settlement Records</h2>
                <p className="text-sm font-medium text-slate-500">Manage cycle payouts and receipts</p>
              </div>
              <div className="ml-4 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 w-64 focus-within:ring-2 ring-emerald-500/20 transition-all">
                <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder="Search sellers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm text-onyx font-semibold w-full placeholder:text-slate-400 placeholder:font-medium"
                />
              </div>
              <select
                value={sortFilter}
                onChange={(e) => setSortFilter(e.target.value as any)}
                className="ml-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-600 focus:ring-2 ring-emerald-500/20 outline-none"
              >
                <option value="NET_PAYABLE_DESC">Net Payable (High - Low)</option>
                <option value="NET_PAYABLE_ASC">Net Payable (Low - High)</option>
                <option value="LOAN_DED_DESC">Loan Deductions (Highest)</option>
                <option value="CF_PRIN_DESC">C/F Principal (Highest)</option>
                <option value="NAME_ASC">Seller Name (A-Z)</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="ml-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-600 focus:ring-2 ring-emerald-500/20 outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
              </select>
            </div>
          }
        >
          <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Toolbar for bulk actions */}
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center z-10">
              <div className="flex items-center gap-4">
                <button 
                  onClick={toggleAllSelection}
                  className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors"
                >
                  <CheckSquare className={`w-4 h-4 ${allSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                  {allSelected ? 'Deselect All' : 'Select All'}
                </button>
                {selectedPayouts.size > 0 && (
                  <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                    {selectedPayouts.size} selected
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {selectedPayouts.size > 0 && (
                  <>
                    <button
                      onClick={markSelectedAsPaid}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm shadow-sm transition-all"
                    >
                      Mark Selected as PAID
                    </button>
                    <button
                      onClick={markSelectedAsUnpaid}
                      className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-sm shadow-sm transition-all"
                    >
                      Mark as UNPAID
                    </button>
                  </>
                )}
                <button
                  onClick={downloadGlobalReceipts}
                  disabled={isGeneratingGlobal || filteredPayouts.length === 0}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-bold rounded-lg text-sm shadow-sm transition-all flex items-center gap-2"
                >
                  {isGeneratingGlobal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                  Global PDF Receipts
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              </div>
            ) : payouts.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white border border-slate-200 rounded-2xl m-4 shadow-sm border-dashed">
                <AlertCircle className="w-12 h-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-onyx">No Settlements Found</h3>
                <p className="text-slate-500 max-w-sm mt-2 mb-6">There are no generated payout records for cycle <b>{cycle}</b>.</p>
                <button
                  onClick={handleGenerateOrUpdatePayouts}
                  disabled={isGenerating}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-sm transition-all flex items-center gap-2"
                >
                  {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                  Generate Settlements for {cycle}
                </button>
              </div>
            ) : (
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-200 text-slate-500 font-semibold uppercase text-xs tracking-wider">
                    <tr>
                      <th className="px-4 py-4 border-b border-slate-200 w-12"></th>
                      <th className="px-4 py-4 border-b border-slate-200">Status</th>
                      <th className="px-4 py-4 border-b border-slate-200">Seller Entity</th>
                      <th className="px-4 py-4 border-b border-slate-200 text-right">Gross Earnings</th>
                      <th className="px-4 py-4 border-b border-slate-200 text-right">Int. Paid</th>
                      <th className="px-4 py-4 border-b border-slate-200 text-right">Prin. Paid</th>
                      <th className="px-4 py-4 border-b border-slate-200 text-right">Net Payable</th>
                      <th className="px-4 py-4 border-b border-slate-200 text-right">C/F Principal</th>
                      <th className="px-4 py-4 border-b border-slate-200 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredPayouts.map((row) => (
                      <tr key={row.id} className={`hover:bg-slate-50/80 transition-colors group ${row.requires_attention ? 'bg-amber-50/30' : ''}`}>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <input 
                            type="checkbox" 
                            checked={selectedPayouts.has(row.id)}
                            onChange={() => toggleSelection(row.id)}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {row.status === 'PAID' ? (
                            <span className="flex items-center gap-1.5 w-max px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" /> PAID
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 w-max px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
                              <AlertCircle className="w-3.5 h-3.5" /> PENDING
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold ${row.requires_attention ? 'bg-amber-100 border-amber-200 text-amber-700' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                              {row.customers?.seller_id}
                            </div>
                            <div>
                              <span className="font-semibold text-onyx block">
                                {row.customers?.name || `Seller ${String(row.customers?.seller_id || '').padStart(3, '0')}`}
                              </span>
                              {row.requires_attention && (
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wide">Needs Repayment</span>
                                  {row.active_loan_id && (
                                    <Link href={`/loan/${row.active_loan_id}`} className="text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Go to Loan">
                                      <ArrowRightCircle className="w-3.5 h-3.5" />
                                    </Link>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-slate-600 font-medium">
                          ₹{Number(row.total_earnings).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right font-mono text-amber-600 font-bold">
                          {Number(row.interest_paid || 0) > 0 ? `₹${Number(row.interest_paid).toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right font-mono text-emerald-600 font-bold">
                          {Number(row.principal_paid_from_milk || 0) > 0 ? `₹${Number(row.principal_paid_from_milk).toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right">
                          <span className="font-mono font-bold text-indigo-700 text-base bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 shadow-sm">
                            ₹{Number(row.net_payable).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-red-600 font-bold font-mono">
                          {Number(row.carried_forward_principal || 0) > 0 ? `₹${Number(row.carried_forward_principal).toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right">
                          <button 
                            onClick={() => downloadReceipt(row)}
                            disabled={downloadingPdfFor === row.id}
                            className="inline-flex items-center justify-center px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {downloadingPdfFor === row.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <><Download className="w-4 h-4 mr-1.5" /> PDF</>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Wrapper>
      </main>
    </div>
  )
}
