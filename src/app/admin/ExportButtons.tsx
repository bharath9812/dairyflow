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

      const hasData = json.data && json.data.length > 0;
      if (!hasData && !customerId) {
        alert('No data matches the current filters for PDF export.')
        setIsExportingPDF(false)
        return
      }

      // 1. Calculate the start and end dates (inclusive) of the selected timeframe
      let startRangeStr = '';
      let endRangeStr = '';
      
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1;
      const mmStr = String(currentMonth).padStart(2, '0');
      
      if (timeframe === 'TODAY') {
        const ddStr = String(today.getDate()).padStart(2, '0');
        startRangeStr = `${currentYear}-${mmStr}-${ddStr}`;
        endRangeStr = startRangeStr;
      } else if (timeframe === 'SPECIFIC_DATE' && exactDate) {
        startRangeStr = exactDate;
        endRangeStr = exactDate;
      } else if (timeframe === 'SPECIFIC_MONTH' && exactMonth) {
        const [yy, exMm] = exactMonth.split('-');
        const lastDay = new Date(Number(yy), Number(exMm), 0).getDate();
        startRangeStr = `${yy}-${exMm}-01`;
        endRangeStr = `${yy}-${exMm}-${String(lastDay).padStart(2, '0')}`;
      } else if (timeframe === 'CUSTOM_RANGE' && startDate && endDate) {
        startRangeStr = startDate;
        endRangeStr = endDate;
      } else if (timeframe === 'MONTH_FIRST_HALF') {
        const [yy, exMm] = exactMonth ? exactMonth.split('-') : [String(currentYear), mmStr];
        startRangeStr = `${yy}-${exMm}-01`;
        endRangeStr = `${yy}-${exMm}-15`;
      } else if (timeframe === 'MONTH_SECOND_HALF') {
        const [yy, exMm] = exactMonth ? exactMonth.split('-') : [String(currentYear), mmStr];
        const lastDay = new Date(Number(yy), Number(exMm), 0).getDate();
        startRangeStr = `${yy}-${exMm}-16`;
        endRangeStr = `${yy}-${exMm}-${String(lastDay).padStart(2, '0')}`;
      } else if (timeframe === 'MONTHLY') {
        const [yy, exMm] = exactMonth ? exactMonth.split('-') : [String(currentYear), mmStr];
        const lastDay = new Date(Number(yy), Number(exMm), 0).getDate();
        startRangeStr = `${yy}-${exMm}-01`;
        endRangeStr = `${yy}-${exMm}-${String(lastDay).padStart(2, '0')}`;
      } else {
        const ddStr = String(today.getDate()).padStart(2, '0');
        startRangeStr = `${currentYear}-${mmStr}-${ddStr}`;
        endRangeStr = startRangeStr;
      }

      // Timezone-safe UTC date-range array generator
      const getDatesInRange = (startS: string, endS: string) => {
        const dates = [];
        const [startY, startM, startD] = startS.split('-').map(Number);
        const [endY, endM, endD] = endS.split('-').map(Number);
        
        let current = new Date(Date.UTC(startY, startM - 1, startD));
        const end = new Date(Date.UTC(endY, endM - 1, endD));
        
        while (current <= end) {
          const y = current.getUTCFullYear();
          const m = String(current.getUTCMonth() + 1).padStart(2, '0');
          const d = String(current.getUTCDate()).padStart(2, '0');
          dates.push(`${y}-${m}-${d}`);
          current.setUTCDate(current.getUTCDate() + 1);
        }
        return dates;
      };

      // 2. Perform zero-filling logic for customers (absent rows receive zeroes)
      let finalData = json.data || [];
      if (customerId) {
        const datesInRange = getDatesInRange(startRangeStr, endRangeStr);
        const txMap: Record<string, any[]> = {};
        finalData.forEach((tx: any) => {
          const key = `${tx.transaction_date}_${(tx.shift === 'Morning' || tx.shift === 'AM') ? 'AM' : 'PM'}`;
          if (!txMap[key]) {
            txMap[key] = [];
          }
          txMap[key].push(tx);
        });

        const alignedData: any[] = [];
        datesInRange.forEach(date => {
          ['AM', 'PM'].forEach(shift => {
            const key = `${date}_shift_${shift}`;
            const mapKey = `${date}_${shift}`;
            if (txMap[mapKey] && txMap[mapKey].length > 0) {
              alignedData.push(...txMap[mapKey]);
            } else {
              alignedData.push({
                id: 'placeholder-' + key,
                transaction_date: date,
                shift: shift,
                milk_type: 'Cow',
                quantity_litres: 0.00,
                fat_percentage: 0.0,
                price_per_litre: 0.00,
                total_price: 0.00,
                net_payable: 0.00,
                created_at: new Date().toISOString(),
                customers: json.customerInfo || {
                  name: 'Unknown',
                  seller_id: customerId,
                  location: 'Unknown Location',
                  contact: 'N/A'
                }
              });
            }
          });
        });
        finalData = alignedData;
      }

      const doc = new jsPDF()

      let timeLabel = timeframe
      if (timeframe === 'SPECIFIC_DATE') timeLabel = exactDate
      if (timeframe === 'SPECIFIC_MONTH') timeLabel = exactMonth
      if (timeframe === 'CUSTOM_RANGE') timeLabel = `${startDate} to ${endDate}`

      // Calculate Aggregates on final aligned data
      let sumVol = 0, sumCap = 0, sumDed = 0, sumNet = 0, cowVol = 0, bufVol = 0, mornVol = 0, eveVol = 0
      finalData.forEach((tx: any) => {
        const v = Number(tx.quantity_litres)
        const tp = Number(tx.total_price)
        sumVol += v
        sumCap += tp
        sumNet += tp

        if (tx.milk_type === 'Cow') cowVol += v
        if (tx.milk_type === 'Buffalo') bufVol += v
        if (tx.shift === 'Morning' || tx.shift === 'AM') mornVol += v
        if (tx.shift === 'Evening' || tx.shift === 'PM') eveVol += v
      })

      if (customerId && finalData.length > 0) {
        // ==========================================
        // SELLER OFFICIAL STATEMENT (HERITAGE STYLE)
        // ==========================================
        const sellerName = finalData[0].customers?.name || json.customerInfo?.name || 'Unknown'
        const sellerCode = String(finalData[0].customers?.seller_id || json.customerInfo?.seller_id || customerId)
        const sellerPhone = finalData[0].customers?.contact || json.customerInfo?.contact || 'N/A'
        const sellerLoc = finalData[0].customers?.location || json.customerInfo?.location || 'Unknown Location'

        const pdfSettings = typeof json.pdfSettings === 'string' ? JSON.parse(json.pdfSettings) : (json.pdfSettings || {});
        const farmName = pdfSettings.farmName || "SUBBI REDDY DAIRY FARM - MAIN BRANCH";
        const farmAddress = pdfSettings.farmAddress || "GSTIN: 37XXXXX1234X1ZX | V.V. Kottala, Andhra Pradesh";
        const rawFooterMsg = pdfSettings.footerMessage || "This is a computer generated receipt. Thank you for your continued partnership with {$farm name}. Please report any discrepancies within 24 hours.";
        const footerMsg = rawFooterMsg.replace("{$farm name}", farmName).replace("{$farm_name}", farmName);

        // Draw generic logo
        doc.setLineWidth(0.5)
        doc.rect(14, 10, 12, 12)
        doc.setFontSize(7)
        doc.setFont("courier", "normal")
        doc.text("LOGO", 20, 17.5, { align: "center" })

        doc.setFont("courier", "bold")
        doc.setFontSize(14)
        doc.text(farmName.toUpperCase(), 105, 15, { align: "center" })

        doc.setFontSize(9)
        doc.setFont("courier", "normal")
        doc.text(farmAddress, 105, 20, { align: "center" })
        doc.text("Web: www.kosha.bharathreddy.space  E-mail: support@xyz.com", 105, 24, { align: "center" })

        // Get start and end dates from filtered range
        const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
        const [sY, sM, sD] = startRangeStr.split('-').map(Number);
        const [eY, eM, eD] = endRangeStr.split('-').map(Number);
        const fromDateStr = String(sD).padStart(2, '0');
        const toDateStr = String(eD).padStart(2, '0') + ' ' + monthNames[eM - 1] + ' ' + eY;
        
        doc.text(`Payment Details: FROM ${fromDateStr} TO ${toDateStr}`, 105, 30, { align: "center" })

        const printDate = new Date().toLocaleDateString('en-GB')
        const printTime = new Date().toLocaleTimeString('en-GB', { hour12: false })
        doc.setFontSize(8)
        doc.text(`Printed by Admin on ${printDate} at ${printTime}`, 14, 35)
        doc.text(`Page No : 1/1`, 196, 35, { align: "right" })

        // Divider
        doc.setLineWidth(0.5)
        doc.line(14, 37, 196, 37)

        // Customer Details
        doc.setFontSize(9)
        doc.text(`Route : DEFAULT     : MAIN CENTER`, 14, 42)
        doc.text(`M C C : 0001        : ${sellerLoc.toUpperCase()}`, 14, 47)

        doc.text(`Seller ID : ${sellerCode}`, 110, 42)
        doc.text(`Name      : ${sellerName.toUpperCase()} | Mob: ${sellerPhone}`, 110, 47)

        doc.line(14, 50, 196, 50)

        // Determine exact Loan Repayment values from JSON parameters (NO client-side re-engineering)
        let pPaid = 0;
        let iPaid = 0;
        let source = 'CYCLE EARNINGS';

        if (json.currentCyclePayment) {
          pPaid = Number(json.currentCyclePayment.principal_paid);
          iPaid = Number(json.currentCyclePayment.interest_paid);
          source = json.currentCyclePayment.source || 'CYCLE_EARNINGS_FULL';
        } else if (json.payout) {
          pPaid = Number(json.payout.principal_paid_from_milk || 0);
          iPaid = Number(json.payout.interest_paid || 0);
          source = 'CYCLE_EARNINGS_FULL';
        }

        const totalRepaid = pPaid + iPaid;
        const hasLoan = !!json.loanInfo;

        // Dynamic Height spacing layout math to occupy exactly 100% of the page
        const headerHeight = 52;
        const loanHeight = hasLoan ? 24 : 0;
        const totalsHeight = hasLoan ? (source.startsWith('CYCLE_EARNINGS') && !source.includes('AND_CASH') ? 22 : 28) : 15;
        const footerHeight = 12;
        const marginOffset = 10; // Bottom offset padding

        const fixedSum = headerHeight + loanHeight + totalsHeight + footerHeight;
        const budget = 297 - fixedSum - marginOffset;

        const rowCount = finalData.length;
        let targetTableHeight = budget * 0.72;
        let rowHeight = targetTableHeight / (rowCount + 1);

        // Clamp row height
        const maxRowHeight = 9.5;
        const minRowHeight = 4.2;
        if (rowHeight > maxRowHeight) {
          rowHeight = maxRowHeight;
        } else if (rowHeight < minRowHeight) {
          rowHeight = minRowHeight;
        }

        const actualTableHeight = rowHeight * (rowCount + 1);
        const remainingSpace = 297 - fixedSum - actualTableHeight - marginOffset;
        const numSpacers = hasLoan ? 3 : 2;
        const spacerSize = Math.max(2, remainingSpace / numSpacers);

        // Dynamic font size based on height
        let tableFontSize = 8;
        if (rowHeight >= 9.0) tableFontSize = 10;
        else if (rowHeight >= 7.5) tableFontSize = 9.5;
        else if (rowHeight >= 6.0) tableFontSize = 9;
        else if (rowHeight >= 5.0) tableFontSize = 8.5;
        else tableFontSize = 7.5;

        const fontHeightMm = tableFontSize / 2.834;
        const targetPadding = (rowHeight - fontHeightMm) / 2;
        const tablePadding = Math.max(0.15, Math.min(2.5, targetPadding));

        // 4. Transactions Table (Heritage Style)
        const tableColumn = ['Date', 'Shift', 'Type', 'Qty(L)', 'Fat%', 'Rate', 'Amount']
        const tableRows = finalData.map((tx: any) => {
          const tp = Number(tx.total_price)
          const qty = Number(tx.quantity_litres)
          const fat = tx.fat_percentage ? Number(tx.fat_percentage) : 0.0

          let displayShift = tx.shift;
          if (tx.shift === 'Morning' || tx.shift === 'AM') displayShift = 'AM';
          else if (tx.shift === 'Evening' || tx.shift === 'PM') displayShift = 'PM';

          return [
            new Date(tx.transaction_date).toLocaleDateString('en-GB').substring(0, 5),
            displayShift,
            tx.milk_type === 'Buffalo' ? 'BUF' : 'COW',
            qty.toFixed(2),
            fat.toFixed(1),
            Number(tx.price_per_litre).toFixed(2),
            tp.toFixed(2)
          ]
        })

        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: 52,
          theme: 'plain',
          styles: { font: 'courier', fontSize: tableFontSize, cellPadding: tablePadding, textColor: 20 },
          headStyles: { fontStyle: 'bold' },
          margin: { left: 14, right: 14 },
        })

        let tableEndY = (doc as any).lastAutoTable.finalY;

        // Double solid line below transactions table
        doc.setLineWidth(0.5);
        doc.line(14, tableEndY + 1, 196, tableEndY + 1);
        doc.line(14, tableEndY + 2, 196, tableEndY + 2);
        tableEndY = tableEndY + 3;

        // 5. LOAN SUMMARY (If Applicable)
        let totalsStartY = tableEndY + spacerSize;

        if (hasLoan) {
          const lInfo = json.loanInfo;
          const loanSummaryStartY = tableEndY + spacerSize;

          doc.setFont("courier", "bold")
          doc.setFontSize(9)
          doc.text("LOAN SUMMARY", 14, loanSummaryStartY + 4)

          const outst = json.currentCyclePayment && json.currentCyclePayment.principal_before !== undefined && json.currentCyclePayment.principal_before !== null
            ? Number(json.currentCyclePayment.principal_before)
            : Number(lInfo.historical_outstanding || 0);

          const inter = json.currentCyclePayment && json.currentCyclePayment.forecasted_interest !== undefined && json.currentCyclePayment.forecasted_interest !== null
            ? Number(json.currentCyclePayment.forecasted_interest)
            : Number(lInfo.historical_interest || 0);

          const totalDebt = outst + inter;

          const loanHead = ['BAL O/S', 'INTEREST', 'TOT DEBT', 'PRIN PAID', 'INT PAID', 'TOT PAID', 'SOURCE'];
          const loanRow = [
            `Rs. ${outst.toFixed(2)}`,
            `Rs. ${inter.toFixed(2)}`,
            `Rs. ${totalDebt.toFixed(2)}`,
            `Rs. ${pPaid.toFixed(2)}`,
            `Rs. ${iPaid.toFixed(2)}`,
            `Rs. ${totalRepaid.toFixed(2)}`,
            source.replace(/_/g, ' ').toUpperCase()
          ];

          autoTable(doc, {
            head: [loanHead],
            body: [loanRow],
            startY: loanSummaryStartY + 6,
            theme: 'plain',
            styles: { font: 'courier', fontSize: 8, cellPadding: 1, textColor: 20 },
            headStyles: { fontStyle: 'bold' },
            margin: { left: 14, right: 14 },
          })

          let loanEndY = (doc as any).lastAutoTable.finalY;

          // Double solid line below loan summary table
          doc.setLineWidth(0.5);
          doc.line(14, loanEndY + 1, 196, loanEndY + 1);
          doc.line(14, loanEndY + 2, 196, loanEndY + 2);

          totalsStartY = loanEndY + 3 + spacerSize;
        }

        // 6. Summary Totals Section
        let deductions = 0.00;
        let paidFromMilk = 0.00;
        let paidFromCash = 0.00;
        let actualNet = sumCap;

        if (hasLoan) {
          if (source.startsWith('CYCLE_EARNINGS') && !source.includes('AND_CASH')) {
            deductions = totalRepaid;
            actualNet = Math.max(0, sumCap - deductions);
          } else if (source === 'MANUAL_CASH') {
            paidFromMilk = 0.00;
            paidFromCash = totalRepaid;
            actualNet = sumCap;
          } else if (source.includes('AND_CASH')) {
            paidFromMilk = Math.min(sumCap, totalRepaid);
            paidFromCash = totalRepaid - paidFromMilk;
            actualNet = sumCap - paidFromMilk;
          }
        }

        doc.setFont("courier", "bold")
        doc.setFontSize(9)

        // Left aggregates
        doc.text(`Total Qty: ${sumVol.toFixed(2)} L`, 14, totalsStartY + 4)
        doc.text(`(Cow: ${cowVol.toFixed(1)} L | Buf: ${bufVol.toFixed(1)} L)`, 14, totalsStartY + 9)

        // Right aggregates
        let currentRightY = totalsStartY + 4;
        doc.text(`Milk Earnings   :`, 115, currentRightY)
        doc.text(`${sumCap.toFixed(2)}`, 196, currentRightY, { align: "right" })
        currentRightY += 5;

        if (hasLoan) {
          if (source.startsWith('CYCLE_EARNINGS') && !source.includes('AND_CASH')) {
            doc.text(`Loan Deduction  :`, 115, currentRightY)
            doc.text(`- Rs. ${deductions.toFixed(2)}`, 196, currentRightY, { align: "right" })
            currentRightY += 5;
          } else {
            // MANUAL_CASH or CYCLE_EARNINGS_AND_CASH
            doc.text(`Paid from Milk  :`, 115, currentRightY)
            doc.text(`- Rs. ${paidFromMilk.toFixed(2)}`, 196, currentRightY, { align: "right" })
            currentRightY += 5;

            doc.text(`Paid from Cash  :`, 115, currentRightY)
            doc.text(`Rs. ${paidFromCash.toFixed(2)}`, 196, currentRightY, { align: "right" })
            currentRightY += 5;
          }
        }

        // Horizontal line above Net Amount Payable
        doc.setLineWidth(0.5);
        doc.line(115, currentRightY - 2, 196, currentRightY - 2);

        doc.setFontSize(10.5)
        doc.setFont("courier", "bold")
        doc.text(`Net Amount Payable :`, 105, currentRightY + 3)
        doc.text(`${actualNet.toFixed(2)}`, 196, currentRightY + 3, { align: "right" })

        const totalsEndY = currentRightY + 6;

        // Dashed line below Net Amount Payable
        doc.setLineWidth(0.5);
        doc.line(14, totalsEndY + 2, 196, totalsEndY + 2);

        // Footer & Disclaimer
        const sigY = totalsEndY + 2 + spacerSize;
        doc.setFontSize(7)
        doc.setFont("courier", "normal")

        // Split footer message to prevent overflow on either side of the page
        const splitFooter = doc.splitTextToSize(footerMsg, 180);
        let currentFooterY = sigY + 3;
        splitFooter.forEach((line: string) => {
          doc.text(line, 105, currentFooterY, { align: "center" });
          currentFooterY += 3.5;
        });
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
      if (customerId) {
        const name = (finalData.length > 0 ? finalData[0].customers?.name : json.customerInfo?.name)?.replace(/\s+/g, '') || "Seller"
        const id = String(finalData.length > 0 ? finalData[0].customers?.seller_id : (json.customerInfo?.seller_id || customerId))
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
