'use client'
// Cache invalidation comment to force TS re-evaluation
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps, prefer-const, react/no-unescaped-entities, react-hooks/set-state-in-effect */

import { useState } from 'react'
import { Download, FileText, Loader2 } from 'lucide-react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function ExportButtons({ timeframe, exactDate, exactMonth, startDate, endDate, shift, milkType, minQty, qtyOp, search, hiddenCols, customerId, sortBy = 'DATE_DESC' }: { timeframe: string, exactDate: string, exactMonth: string, startDate?: string, endDate?: string, shift: string, milkType: string, minQty: string, qtyOp: string, search: string, hiddenCols: string[], customerId?: string, sortBy?: string }) {
  const [isExportingPDF, setIsExportingPDF] = useState(false)

  const queryStr = `timeframe=${timeframe}&exactDate=${exactDate}&exactMonth=${exactMonth}&startDate=${startDate}&endDate=${endDate}&shift=${shift}&milkType=${milkType}&minQty=${minQty}&qtyOp=${qtyOp}&search=${encodeURIComponent(search)}&hiddenCols=${hiddenCols.join(',')}${customerId ? `&customerId=${customerId}` : ''}&sortBy=${sortBy}`

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
        // SELLER OFFICIAL STATEMENT (HERITAGE STYLE)
        // ==========================================
        const sellerName = json.data[0].customers?.name || 'Unknown'
        const sellerCode = String(json.data[0].customers?.seller_id).padStart(3, '0')
        const sellerPhone = json.data[0].customers?.contact || 'N/A'
        const sellerLoc = json.data[0].customers?.location || 'Unknown Location'

        const pdfSettings = typeof json.pdfSettings === 'string' ? JSON.parse(json.pdfSettings) : (json.pdfSettings || {});
        const farmName = pdfSettings.farmName || "SRI LAKSHMI DAIRY FARM - MAIN BRANCH";
        const farmAddress = pdfSettings.farmAddress || "GSTIN: 37XXXXX1234X1ZX | Plot 42, Industrial Area";
        const footerMsg = pdfSettings.footerMessage || "This is a computer generated receipt. Please report any discrepancies within 24 hours.";

        // Draw generic logo
        doc.setLineWidth(0.5)
        doc.rect(14, 10, 12, 12)
        doc.setFontSize(7)
        doc.text("LOGO", 20, 17.5, { align: "center" })

        doc.setFont("courier", "bold")
        doc.setFontSize(14)
        doc.text(farmName.toUpperCase(), 105, 15, { align: "center" })

        doc.setFontSize(9)
        doc.setFont("courier", "normal")
        doc.text(farmAddress, 105, 20, { align: "center" })
        doc.text("Web: www.kosha.bharathreddy.space  E-mail: support@xyz.com", 105, 24, { align: "center" })

        doc.text(`Payment Details From: ${startDate || exactDate || 'Start'} To: ${endDate || exactDate || 'End'}`, 105, 30, { align: "center" })

        const printDate = new Date().toLocaleDateString('en-GB')
        const printTime = new Date().toLocaleTimeString('en-GB', { hour12: false })
        doc.setFontSize(8)
        doc.text(`Printed by Admin on ${printDate} at ${printTime}`, 14, 38)
        doc.text(`Page No : 1/1`, 196, 38, { align: "right" })

        // Divider
        doc.setLineWidth(0.5)
        doc.setLineDashPattern([2, 2], 0)
        doc.line(14, 40, 196, 40)

        // Customer Details
        doc.setFontSize(9)
        doc.text(`Route : DEFAULT     : MAIN CENTER`, 14, 44)
        doc.text(`M C C : 0001        : ${sellerLoc.substring(0, 15).toUpperCase()}`, 14, 49)

        doc.text(`Rep : ${sellerCode.padEnd(8)} : ${sellerName.toUpperCase()}`, 110, 44)
        doc.text(`Mob : ${sellerPhone}`, 110, 49)

        doc.text(`Bank: HDFC0001013 HDFC BANK LTD "MAIN BRANCH"`, 14, 55)
        doc.text(`A/C No : 50200090801332`, 145, 55)

        doc.line(14, 57, 196, 57)

        // 4. Transactions Table (Heritage Style)
        const tableColumn = ['Date', 'Shift', 'Type', 'Qty(L)', 'Fat%', 'Rate', 'Amount']
        const tableRows = json.data.map((tx: any) => {
          const tp = Number(tx.total_price)
          const qty = Number(tx.quantity_litres)
          const fat = tx.fat_percentage ? Number(tx.fat_percentage) : 6.5 // fallback

          let displayShift = tx.shift;
          if (tx.shift === 'Morning' || tx.shift === 'AM') displayShift = 'AM';
          else if (tx.shift === 'Evening' || tx.shift === 'PM') displayShift = 'PM';

          return [
            new Date(tx.transaction_date).toLocaleDateString('en-GB').substring(0, 5), // Just DD/MM
            displayShift,
            tx.milk_type === 'Buffalo' ? 'BUF' : 'COW',
            qty.toFixed(2),
            fat.toFixed(1),
            Number(tx.price_per_litre).toFixed(2),
            tp.toFixed(2)
          ]
        })

        let tableFontSize = 8;
        let tablePadding = 1;
        if (tableRows.length >= 28) {
          tableFontSize = 7;
          tablePadding = 0.8;
        }

        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: 60,
          theme: 'plain',
          styles: { font: 'courier', fontSize: tableFontSize, cellPadding: tablePadding, textColor: 20 },
          headStyles: { fontStyle: 'bold' },
          margin: { left: 14, right: 14 },
          didDrawPage: function (data) {
            const y = data.cursor ? data.cursor.y : 0;
            if (y > 0) doc.line(14, y, 196, y);
          }
        })

        // Reset line dash for solid lines below if needed, or keep dashed
        let finalY = Math.max((doc as any).lastAutoTable.finalY + 4, 100)
        doc.line(14, finalY - 3, 196, finalY - 3)

        // 5. LOAN SUMMARY (If Applicable)
        let deductions = 0.00;
        let actualNet = sumNet;

        if (json.loanInfo) {
          const lInfo = json.loanInfo;
          let pPaid = 0;
          let iPaid = 0;
          let source = 'N/A';

          if (json.currentCyclePayment) {
            pPaid = Number(json.currentCyclePayment.principal_paid);
            iPaid = Number(json.currentCyclePayment.interest_paid);
            source = json.currentCyclePayment.payment_source || 'CYCLE EARNINGS';
          } else if (json.payout) {
            pPaid = Number(json.payout.loan_principal_deducted);
            iPaid = Number(json.payout.loan_interest_deducted);
            source = 'CYCLE EARNINGS';
          }
          deductions = pPaid + iPaid;
          actualNet = sumNet - deductions;

          const outst = Number(lInfo.historical_outstanding || 0);
          const inter = Number(lInfo.historical_interest || 0);
          const totalDebt = outst + inter;

          doc.setFont("courier", "bold")
          doc.setFontSize(9)
          doc.text("LOAN SUMMARY", 14, finalY + 4)

          const loanHead = ['OUTSTANDING', 'INTEREST', 'TOTAL DEBT', 'PRIN. PAID', 'INT. PAID', 'TOTAL PAID', 'SOURCE'];
          const loanRow = [
            `Rs. ${outst.toFixed(2)}`,
            `Rs. ${inter.toFixed(2)}`,
            `Rs. ${totalDebt.toFixed(2)}`,
            `Rs. ${pPaid.toFixed(2)}`,
            `Rs. ${iPaid.toFixed(2)}`,
            `Rs. ${(pPaid + iPaid).toFixed(2)}`,
            source.toUpperCase()
          ];

          autoTable(doc, {
            head: [loanHead],
            body: [loanRow],
            startY: finalY + 6,
            theme: 'plain',
            styles: { font: 'courier', fontSize: 8, cellPadding: 1, textColor: 20 },
            headStyles: { fontStyle: 'bold' },
            margin: { left: 14, right: 14 },
            didDrawPage: function (data) {
              const y = data.cursor ? data.cursor.y : 0;
              if (y > 0) doc.line(14, y, 196, y);
            }
          })

          finalY = Math.max((doc as any).lastAutoTable.finalY + 4, finalY + 20)
          doc.line(14, finalY - 3, 196, finalY - 3)
        }

        // 6. Summary Section
        doc.setFont("courier", "bold")
        doc.setFontSize(9)
        doc.text(`Total Qty: ${sumVol.toFixed(2)} L`, 14, finalY + 2)
        doc.text(`(Cow: ${cowVol.toFixed(1)} L | Buf: ${bufVol.toFixed(1)} L)`, 14, finalY + 7)

        doc.text(`Gross Amount :`, 120, finalY + 2)
        doc.text(`${sumCap.toFixed(2)}`, 190, finalY + 2, { align: "right" })

        doc.setFont("courier", "normal")
        doc.text(`Loan Deduction :`, 120, finalY + 7)
        doc.text(`- Rs. ${deductions.toFixed(2)}`, 190, finalY + 7, { align: "right" })

        doc.line(120, finalY + 10, 196, finalY + 10)

        doc.setFont("courier", "bold")
        doc.setFontSize(10)
        doc.text(`Net Amount Payable Rs :`, 105, finalY + 16)
        doc.text(`${actualNet.toFixed(2)}`, 190, finalY + 16, { align: "right" })

        doc.line(14, finalY + 20, 196, finalY + 20)

        // Disclaimer & Footer
        let sigY = finalY + 25
        if (sigY > 290) {
          doc.addPage()
          sigY = 20
        }

        doc.setFontSize(7)
        doc.setFont("courier", "normal")
        doc.text(footerMsg, 105, sigY, { align: "center" })
        doc.setLineDashPattern([], 0) // reset to solid for the rest of the app
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
