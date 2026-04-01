'use client'

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

      // 1. Brand Logo / Header
      doc.setFontSize(22)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(37, 99, 235) // blue-600
      doc.text("DairyFlow", 14, 20)

      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(100, 116, 139) // slate-500
      doc.text("Official Procurement Receipt", 14, 26)

      // 2. Scope Summary
      doc.setFontSize(11)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(15, 23, 42) // slate-900
      doc.text("Scope Summary:", 14, 40)

      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(71, 85, 105) // slate-600
      
      let timeLabel = timeframe
      if (timeframe === 'SPECIFIC_DATE') timeLabel = exactDate
      if (timeframe === 'SPECIFIC_MONTH') timeLabel = exactMonth
      if (timeframe === 'CUSTOM_RANGE') timeLabel = `${startDate} to ${endDate}`
      
      doc.text(`Timeframe: ${timeLabel}`, 14, 46)
      doc.text(`Shift: ${shift}`, 14, 52)
      doc.text(`Commodity: ${milkType === 'ALL' ? 'Cow & Buffalo' : milkType}`, 14, 58)
      const qtyLabel = minQty ? `${qtyOp === 'eq' ? '=' : qtyOp === 'lt' ? '<' : '>'} ${minQty}L` : 'None'
      doc.text(`Qty Filter: ${qtyLabel}`, 100, 46)
      doc.text(`Search Query: ${search || 'None'}`, 100, 52)

      // 3. Table Generation
      const tableColumn = []
      if (!hiddenCols.includes('col_sno')) tableColumn.push('S.No')
      if (!hiddenCols.includes('col_date')) tableColumn.push('Date', 'Shift')
      if (!hiddenCols.includes('col_seller')) tableColumn.push('Seller ID', 'Name')
      if (!hiddenCols.includes('col_type')) tableColumn.push('Type')
      if (!hiddenCols.includes('col_volume')) tableColumn.push('Volume (L)')
      if (!hiddenCols.includes('col_capital')) tableColumn.push('Rate', 'Total (INR)')
      if (!hiddenCols.includes('col_audit')) tableColumn.push('Audit Trail')

      const tableRows = json.data.map((tx: any, index: number) => {
        const row: any[] = []
        if (!hiddenCols.includes('col_sno')) row.push(index + 1)
        if (!hiddenCols.includes('col_date')) {
          row.push(new Date(tx.transaction_date).toLocaleDateString('en-GB'))
          row.push(tx.shift)
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
          row.push(Number(tx.price_per_litre).toFixed(2))
          row.push(Number(tx.total_price).toFixed(2))
        }
        if (!hiddenCols.includes('col_audit')) {
          let auditStr = `C: ${tx.created_by_name || 'Admin'} (${new Date(tx.created_at).toLocaleDateString()})`
          if (tx.updated_at) {
            auditStr += `\nU: ${tx.updated_by_name || 'Admin'} (${new Date(tx.updated_at).toLocaleDateString()})`
          }
          row.push(auditStr)
        }
        return row
      })

      // Calculate Aggregates
      let sumVol = 0, sumCap = 0, cowVol = 0, bufVol = 0, mornVol = 0, eveVol = 0
      json.data.forEach((tx: any) => {
        const v = Number(tx.quantity_litres)
        sumVol += v
        sumCap += Number(tx.total_price)
        if (tx.milk_type === 'Cow') cowVol += v
        if (tx.milk_type === 'Buffalo') bufVol += v
        if (tx.shift === 'Morning') mornVol += v
        if (tx.shift === 'Evening') eveVol += v
      })

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 65,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], fontSize: 9, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { top: 65 }
      })

      // Draw Summary Table
      const finalY = (doc as any).lastAutoTable.finalY + 15
      
      autoTable(doc, {
        startY: finalY,
        theme: 'grid',
        head: [[
          { content: 'System Gross Aggregates', colSpan: 2, styles: { halign: 'center', fillColor: [30, 41, 59] } },
          { content: 'Commodity Procurement', colSpan: 2, styles: { halign: 'center', fillColor: [37, 99, 235] } },
          { content: 'Shift Diagnostics', colSpan: 2, styles: { halign: 'center', fillColor: [15, 23, 42] } }
        ]],
        body: [
          [
            'Net Volume', `${sumVol.toFixed(1)} L`,
            'Cow Variant', `${cowVol.toFixed(1)} L`,
            'Morning Checkins', `${mornVol.toFixed(1)} L`
          ],
          [
            'Net Capital', `Rs. ${sumCap.toFixed(2)}`,
            'Buffalo Variant', `${bufVol.toFixed(1)} L`,
            'Evening Checkins', `${eveVol.toFixed(1)} L`
          ]
        ],
        bodyStyles: { textColor: [51, 65, 85], cellPadding: 4, valign: 'middle' },
        columnStyles: {
          0: { fontStyle: 'bold', fillColor: [248, 250, 252], textColor: [15, 23, 42], cellWidth: 33 },
          1: { fontStyle: 'bold', textColor: [16, 185, 129], cellWidth: 27 },
          2: { fontStyle: 'bold', fillColor: [248, 250, 252], textColor: [15, 23, 42], cellWidth: 34 },
          3: { fontStyle: 'bold', textColor: [37, 99, 235], cellWidth: 28 },
          4: { fontStyle: 'bold', fillColor: [248, 250, 252], textColor: [15, 23, 42], cellWidth: 34 },
          5: { fontStyle: 'bold', textColor: [245, 158, 11], cellWidth: 26 }
        }
      })

      // 4. Save file uniquely
      doc.save(`DairyFlow_Export_${timeframe}_${shift.toUpperCase()}.pdf`)

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
        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm"
      >
        <Download className="w-4 h-4" /> CSV Export
      </button>

      <button 
        onClick={downloadPDF}
        disabled={isExportingPDF}
        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isExportingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />} 
        {isExportingPDF ? 'Building PDF...' : 'PDF Receipt'}
      </button>
    </div>
  )
}
