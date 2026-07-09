'use client'
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps, prefer-const, react/no-unescaped-entities, react-hooks/set-state-in-effect */

import { useState } from 'react'
import { Download, FileText, Loader2 } from 'lucide-react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function ExportButtons({ timeframe, exactDate, exactMonth, startDate, endDate, shift, milkType, minQty, qtyOp, search, hiddenCols, customerId }: { timeframe: string, exactDate: string, exactMonth: string, startDate?: string, endDate?: string, shift: string, milkType: string, minQty: string, qtyOp: string, search: string, hiddenCols: string[], customerId?: string }) {
  const [isExportingPDF, setIsExportingPDF] = useState(false)

  const queryStr = `timeframe=${timeframe}&exactDate=${exactDate}&exactMonth=${exactMonth}&startDate=${startDate}&endDate=${endDate}&shift=${shift}&milkType=${milkType}&minQty=${minQty}&qtyOp=${qtyOp}&search=${encodeURIComponent(search)}&hiddenCols=${hiddenCols.join(',')}${customerId ? `&customerId=${customerId}` : ''}`

  const downloadCSV = () => {
    window.open(`/api/export?${queryStr}&format=csv`, '_blank')
  }

  const downloadPDF = async () => {
    setIsExportingPDF(true)
    try {
      const res = await fetch(`/api/export?${queryStr}&format=json`)
      const json = await res.json()

      if (!json.data || json.data.length === 0) {
        alert('No data matches the current filters for PDF export.')
        setIsExportingPDF(false)
        return
      }

      const doc = new jsPDF()

      let timeLabel = timeframe
      if (timeframe === 'SPECIFIC_DATE') timeLabel = exactDate
      if (timeframe === 'SPECIFIC_MONTH') timeLabel = exactMonth
      if (timeframe === 'CUSTOM_RANGE') timeLabel = `${startDate} to ${endDate}`

      // Calculate Aggregates
      let sumVol = 0, sumCap = 0, sumDed = 0, sumNet = 0, cowVol = 0, bufVol = 0, mornVol = 0, eveVol = 0
      json.data.forEach((tx: any) => {
        const v = Number(tx.quantity_litres)
        const tp = Number(tx.total_price)
        sumVol += v
        sumCap += tp
        sumNet += tp

        if (tx.milk_type === 'Cow') cowVol += v
        if (tx.milk_type === 'Buffalo') bufVol += v
        if (tx.shift === 'Morning') mornVol += v
        if (tx.shift === 'Evening') eveVol += v
      })

      if (customerId && json.data.length > 0) {
        // ==========================================
        // SELLER OFFICIAL STATEMENT (INVOICE STYLE)
        // ==========================================
        const sellerName = json.data[0].customers?.name || 'Unknown'
        const sellerCode = String(json.data[0].customers?.seller_id).padStart(3, '0')

        // 1. Dairy Farm Header (Center Aligned)
        doc.setFontSize(22)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(30, 64, 175) // blue-800
        doc.text("DAIRYFLOW PROCUREMENT SYSTEM", 105, 20, { align: "center" })

        doc.setFontSize(9)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(100, 116, 139)
        doc.text("Official Automated Milk Payment Statement | Generated via DairyFlow Admin", 105, 26, { align: "center" })

        doc.setLineWidth(0.5)
        doc.setDrawColor(203, 213, 225)
        doc.line(14, 32, 196, 32)

        // 2. Document Title
        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(15, 23, 42)
        doc.text("MILK PAYMENT STATEMENT", 105, 40, { align: "center" })

        // 3. Meta Info Box
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
        doc.text(`${timeLabel}`, 110, 58)

        doc.text(`Phone: ${json.data[0].customers?.contact || 'N/A'}  |  Location: ${json.data[0].customers?.location || 'N/A'}`, 18, 64)
        doc.text(`Generated On: ${new Date().toLocaleDateString('en-GB')}`, 110, 64)

        // 4. Transactions Table
        const tableColumn = ['Date', 'Shift', 'Type', 'Qty (L)', 'Rate/L', 'Gross (Rs)']
        const tableRows = json.data.map((tx: any) => {
          const tp = Number(tx.total_price)
          return [
            new Date(tx.transaction_date).toLocaleDateString('en-GB'),
            tx.shift === 'Morning' ? 'Morn' : 'Eve',
            tx.milk_type,
            Number(tx.quantity_litres).toFixed(1),
            Number(tx.price_per_litre).toFixed(2),
            tp.toFixed(2)
          ]
        })

        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: 75,
          theme: 'grid',
          headStyles: { fillColor: [30, 64, 175], fontSize: 9, fontStyle: 'bold', halign: 'center' },
          bodyStyles: { fontSize: 8, textColor: [51, 65, 85], halign: 'center' },
          alternateRowStyles: { fillColor: [248, 250, 252] },

        })



        const finalY = Math.max((doc as any).lastAutoTable.finalY + 10, 100)

        // 5. Financial Summary Box
        doc.setDrawColor(30, 64, 175)
        doc.setFillColor(239, 246, 255) // blue-50
        doc.roundedRect(100, finalY, 96, 42, 2, 2, "FD")

        doc.setFontSize(10)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(71, 85, 105)
        doc.text("Total Volume (Liters):", 105, finalY + 8)

        doc.setFontSize(8)
        doc.setTextColor(148, 163, 184)
        doc.text(`(Cow: ${cowVol.toFixed(1)} L  |  Buffalo: ${bufVol.toFixed(1)} L)`, 105, finalY + 13)

        doc.setFontSize(10)
        doc.setTextColor(71, 85, 105)
        doc.text("Gross Payable:", 105, finalY + 20)

        doc.setFont("helvetica", "bold")
        doc.setTextColor(15, 23, 42)
        doc.text(`${sumVol.toFixed(1)} L`, 190, finalY + 8, { align: "right" })
        doc.text(`Rs. ${sumCap.toFixed(2)}`, 190, finalY + 20, { align: "right" })

        doc.setFontSize(11)
        doc.setTextColor(30, 64, 175)
        doc.text("NET PAYABLE TO SELLER:", 105, finalY + 34)
        doc.setFontSize(12)
        doc.text(`Rs. ${sumNet.toFixed(2)}`, 190, finalY + 34, { align: "right" })

        // 6. Signature Lines
        let sigY = finalY + 60
        if (sigY > 270) {
          doc.addPage()
          sigY = 40
        }

        doc.setFontSize(10)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(100, 116, 139)
        doc.text("__________________________", 20, sigY)
        doc.text("Seller Signature", 32, sigY + 6)

        doc.text("__________________________", 130, sigY)
        doc.text("Authorized Farm Signatory", 134, sigY + 6)

        doc.setFontSize(8)
        doc.setFont("helvetica", "italic")
        doc.setTextColor(148, 163, 184)
        doc.text("This is a computer generated receipt. Please report any discrepancies within 24 hours.", 105, sigY + 20, { align: "center" })

      } else {
        // ==========================================
        // GLOBAL ADMIN EXPORT (OFFICIAL STYLE)
        // ==========================================

        // 1. Dairy Farm Header (Center Aligned)
        doc.setFontSize(22)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(30, 64, 175) // blue-800
        doc.text("DAIRYFLOW PROCUREMENT SYSTEM", 105, 20, { align: "center" })

        doc.setFontSize(9)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(100, 116, 139)
        doc.text("Global Operations Master Report | Generated via DairyFlow Admin", 105, 26, { align: "center" })

        doc.setLineWidth(0.5)
        doc.setDrawColor(203, 213, 225)
        doc.line(14, 32, 196, 32)

        // 2. Document Title
        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(15, 23, 42)
        doc.text("GLOBAL PROCUREMENT REPORT", 105, 40, { align: "center" })

        // 3. Meta Info Box
        doc.setDrawColor(226, 232, 240)
        doc.setFillColor(248, 250, 252)
        doc.roundedRect(14, 46, 182, 22, 2, 2, "FD")

        doc.setFontSize(9)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(71, 85, 105)
        doc.text("Scope Details:", 18, 52)
        doc.text("Timeframe:", 110, 52)

        doc.setFont("helvetica", "normal")
        doc.setTextColor(15, 23, 42)

        const qtyLabel = minQty ? `${qtyOp === 'eq' ? '=' : qtyOp === 'lt' ? '<' : '>'} ${minQty}L` : 'None'
        doc.text(`Commodity: ${milkType === 'ALL' ? 'Cow & Buffalo' : milkType}  |  Shift: ${shift}`, 18, 58)
        doc.text(`${timeLabel}`, 110, 58)

        doc.text(`Qty Filter: ${qtyLabel}  |  Search: ${search || 'None'}`, 18, 64)
        doc.text(`Generated On: ${new Date().toLocaleDateString('en-GB')}`, 110, 64)

        // 4. Table Generation
        const tableColumn = []
        if (!hiddenCols.includes('col_sno')) tableColumn.push('S.No')
        if (!hiddenCols.includes('col_date')) tableColumn.push('Date', 'Shift')
        if (!hiddenCols.includes('col_seller')) tableColumn.push('Seller ID', 'Name')
        if (!hiddenCols.includes('col_type')) tableColumn.push('Type')
        if (!hiddenCols.includes('col_volume')) tableColumn.push('Volume (L)')
        if (!hiddenCols.includes('col_capital')) tableColumn.push('Rate', 'Gross (INR)', 'Net Payable')
        if (!hiddenCols.includes('col_audit')) tableColumn.push('Audit Trail')

        const tableRows = json.data.map((tx: any, index: number) => {
          const row: any[] = []
          if (!hiddenCols.includes('col_sno')) row.push(index + 1)
          if (!hiddenCols.includes('col_date')) {
            row.push(new Date(tx.transaction_date).toLocaleDateString('en-GB'))
            row.push(tx.shift === 'Morning' ? 'Morn' : 'Eve')
          }
          if (!hiddenCols.includes('col_seller')) {
            row.push(String(tx.customers?.seller_id).padStart(3, '0'))
            row.push(tx.customers?.name || 'Unknown')
          }
          if (!hiddenCols.includes('col_type')) {
            row.push(tx.milk_type)
          }
          if (!hiddenCols.includes('col_volume')) {
            row.push(Number(tx.quantity_litres).toFixed(1))
          }
          if (!hiddenCols.includes('col_capital')) {
            const tp = Number(tx.total_price)
            const np = tp

            row.push(Number(tx.price_per_litre).toFixed(2))
            row.push(tp.toFixed(2))
            row.push(np.toFixed(2))
          }
          if (!hiddenCols.includes('col_audit')) {
            row.push(`C: ${tx.created_by_name || 'Admin'} (${new Date(tx.created_at).toLocaleDateString('en-GB')})`)
          }
          return row
        })

        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: 75,
          theme: 'grid',
          headStyles: { fillColor: [15, 23, 42], fontSize: 8, fontStyle: 'bold', halign: 'center' },
          bodyStyles: { fontSize: 7, textColor: [51, 65, 85], halign: 'center' },
          alternateRowStyles: { fillColor: [248, 250, 252] },

        })

        const finalY = Math.max((doc as any).lastAutoTable.finalY + 10, 100)

        // 5. Financial Summary Box (Global)
        doc.setDrawColor(15, 23, 42)
        doc.setFillColor(248, 250, 252)
        doc.roundedRect(100, finalY, 96, 42, 2, 2, "FD")

        doc.setFontSize(10)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(71, 85, 105)
        doc.text("Total Global Volume:", 105, finalY + 8)

        doc.setFontSize(8)
        doc.setTextColor(148, 163, 184)
        doc.text(`(Cow: ${cowVol.toFixed(1)} L  |  Buffalo: ${bufVol.toFixed(1)} L)`, 105, finalY + 13)

        doc.setFontSize(10)
        doc.setTextColor(71, 85, 105)
        doc.text("Total Gross Capital:", 105, finalY + 20)

        doc.setFont("helvetica", "bold")
        doc.setTextColor(15, 23, 42)
        doc.text(`${sumVol.toFixed(1)} L`, 190, finalY + 8, { align: "right" })
        doc.text(`Rs. ${sumCap.toFixed(2)}`, 190, finalY + 20, { align: "right" })

        doc.setFontSize(11)
        doc.setTextColor(15, 23, 42)
        doc.text("NET POOL PAYABLE:", 105, finalY + 34)
        doc.setFontSize(12)
        doc.text(`Rs. ${sumNet.toFixed(2)}`, 190, finalY + 34, { align: "right" })

        // 6. Signatures (Global Admin)
        let sigY = finalY + 60
        if (sigY > 270) {
          doc.addPage()
          sigY = 40
        }

        doc.setFontSize(10)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(100, 116, 139)
        doc.text("__________________________", 20, sigY)
        doc.text("System Administrator", 30, sigY + 6)

        doc.text("__________________________", 130, sigY)
        doc.text("Authorized Executive", 138, sigY + 6)

        doc.setFontSize(8)
        doc.setFont("helvetica", "italic")
        doc.setTextColor(148, 163, 184)
        doc.text("This is an internal global administrative report.", 105, sigY + 20, { align: "center" })
      }

      // 5. Save file uniquely
      let sellerComponent = "Global"
      if (customerId && json.data.length > 0) {
        const name = json.data[0].customers?.name?.replace(/\s+/g, '') || "Seller"
        const id = String(json.data[0].customers?.seller_id).padStart(3, '0')
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
      const finalFileName = `DairyFlow_${sellerComponent}_${dateComponent}_${shiftComponent}.pdf`

      doc.save(finalFileName)

    } catch (err) {
      console.error(err)
      alert("Failed to build PDF. Check logs.")
    } finally {
      setIsExportingPDF(false)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto mt-4 lg:mt-0">
      <button
        onClick={downloadCSV}
        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/50 border border-white/60 hover:bg-white/80 text-sky-accent px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm backdrop-blur-sm"
      >
        <Download className="w-4 h-4" /> CSV Export
      </button>

      <button
        onClick={downloadPDF}
        disabled={isExportingPDF}
        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/50 border border-white/60 hover:bg-white/80 text-sky-accent px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm backdrop-blur-sm disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isExportingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
        {isExportingPDF ? 'Building PDF...' : 'PDF Receipt'}
      </button>
    </div>
  )
}
