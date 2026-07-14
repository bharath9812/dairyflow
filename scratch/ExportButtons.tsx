        // ==========================================
        // SELLER OFFICIAL STATEMENT (INVOICE STYLE)
        // ==========================================
        const sellerName = json.data[0].customers?.name || 'Unknown'
        const sellerCode = String(json.data[0].customers?.seller_id).padStart(3, '0')
        const phone = json.data[0].customers?.contact || 'N/A'
        const location = json.data[0].customers?.location || 'N/A'

        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(0, 0, 0)
        doc.text("Bill to Sri Krishna Dairy Farm", 105, 15, { align: "center" })

        doc.setFontSize(8)
        doc.setFont("helvetica", "normal")
        doc.text("Survey No. 123, Main Road, Kadapa, Andhra Pradesh - 516203", 105, 20, { align: "center" })
        doc.text("Web: www.srikrishnadairy.in   Email: contact@srikrishnadairy.in", 105, 24, { align: "center" })

        doc.setLineWidth(0.3)
        doc.setDrawColor(0, 0, 0)
        
        // Header Box
        doc.rect(14, 28, 182, 16)
        doc.line(14, 34, 196, 34)
        doc.line(60, 28, 60, 44)
        doc.line(105, 28, 105, 44)
        doc.line(150, 28, 150, 44)

        doc.setFontSize(7)
        doc.setFont("helvetica", "bold")
        doc.text("Supplier detail", 37, 32, { align: "center" })
        doc.text("Vendor detail", 82, 32, { align: "center" })
        doc.text("Bill of supply", 127, 32, { align: "center" })
        doc.text("Date of payment", 173, 32, { align: "center" })

        doc.setFont("helvetica", "normal")
        doc.text(`Name: ${sellerName}`, 16, 38)
        doc.text(`UID: ${sellerCode}`, 16, 42)

        doc.text(`Phone: ${phone}`, 62, 38)
        doc.text(`Loc: ${location}`, 62, 42)

        doc.text(`Period:`, 107, 38)
        doc.text(`${timeLabel}`, 107, 42)

        doc.text(`Generated On:`, 152, 38)
        doc.text(`${new Date().toLocaleDateString('en-GB')}`, 152, 42)

        // 4. Transactions Table
        const tableColumn = ['Date', 'Shift', 'Milk Type', 'Qty (L)', 'FAT%', 'SNF%', 'Rate', 'Amount']
        const tableRows = json.data.map((tx: any) => {
          const tp = Number(tx.total_price)
          return [
            new Date(tx.transaction_date).toLocaleDateString('en-GB'),
            tx.shift,
            tx.milk_type === 'Buffalo' ? 'BM' : 'CM',
            Number(tx.quantity_litres).toFixed(2),
            Number(tx.fat_percentage).toFixed(1),
            tx.snf_percentage ? Number(tx.snf_percentage).toFixed(2) : '-',
            Number(tx.price_per_litre).toFixed(2),
            tp.toFixed(2)
          ]
        })

        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          foot: [['Total', '', '', sumVol.toFixed(2), '', '', '', sumCap.toFixed(2)]],
          startY: 46,
          theme: 'grid',
          styles: {
            fontSize: 7,
            cellPadding: 1.5,
            lineColor: [0, 0, 0],
            lineWidth: 0.1,
            textColor: [0, 0, 0]
          },
          headStyles: {
            fillColor: [240, 240, 240],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            halign: 'center'
          },
          footStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
          },
          columnStyles: {
            0: { halign: 'center' },
            1: { halign: 'center' },
            2: { halign: 'center' },
            3: { halign: 'right' },
            4: { halign: 'right' },
            5: { halign: 'right' },
            6: { halign: 'right' },
            7: { halign: 'right' }
          },
          margin: { left: 14, right: 14 }
        })

        let finalY = (doc as any).lastAutoTable.finalY + 5

        const { payout, loanInfo, currentCyclePayment } = json || {}

        const grossPayable = payout ? Number(payout.total_earnings) : sumCap
        const loanDeduction = payout ? Number(payout.loan_principal_deducted) + Number(payout.loan_interest_deducted) : 0
        const netPayable = payout ? Number(payout.net_payable) : sumNet
        
        if (finalY + 40 > 280) {
          doc.addPage()
          finalY = 20
        }

        doc.setDrawColor(0, 0, 0)
        doc.setLineWidth(0.3)
        doc.rect(14, finalY, 182, 25)
        doc.line(14, finalY + 5, 196, finalY + 5) 
        doc.line(105, finalY, 105, finalY + 25) 
        
        doc.setFontSize(7)
        doc.setFont("helvetica", "bold")
        doc.text("Payable details", 16, finalY + 3.5)
        doc.text("Amount", 103, finalY + 3.5, { align: "right" })
        
        doc.text("Deduction details", 107, finalY + 3.5)
        doc.text("Amount", 194, finalY + 3.5, { align: "right" })

        doc.setFont("helvetica", "normal")
        doc.text(`Milk Gross Amount (+)`, 16, finalY + 9)
        doc.text(`${grossPayable.toFixed(2)}`, 103, finalY + 9, { align: "right" })
        
        if (loanInfo) {
           doc.text(`Historical Outstanding Loan`, 107, finalY + 9)
           const histOut = Number(loanInfo.historical_outstanding || loanInfo.outstanding_principal)
           const histInt = Number(loanInfo.historical_interest || loanInfo.forecasted_interest)
           doc.text(`${(histOut + histInt).toFixed(2)}`, 194, finalY + 9, { align: "right" })
           
           doc.text(`Loan Deducted This Cycle (-)`, 107, finalY + 14)
           doc.text(`${loanDeduction.toFixed(2)}`, 194, finalY + 14, { align: "right" })
        }
        
        if (currentCyclePayment && currentCyclePayment.source === 'CYCLE_EARNINGS_AND_CASH' && payout) {
           const manualCash = Math.max(0, (Number(currentCyclePayment.principal_paid) + Number(currentCyclePayment.interest_paid)) - grossPayable)
           doc.text(`Manual Cash Recovery (+)`, 16, finalY + 14)
           doc.text(`${manualCash.toFixed(2)}`, 103, finalY + 14, { align: "right" })
        }

        finalY += 25
        doc.rect(14, finalY, 182, 7)
        doc.setFont("helvetica", "bold")
        doc.setFontSize(9)
        doc.text("Net Payable Rs.", 16, finalY + 5)
        doc.text(`${netPayable.toFixed(2)}`, 194, finalY + 5, { align: "right" })

        let sigY = finalY + 20
        if (sigY > 280) {
          doc.addPage()
          sigY = 40
        }

        doc.setDrawColor(0, 0, 0)
        doc.setLineWidth(0.3)
        doc.line(25, sigY, 75, sigY)
        doc.line(125, sigY, 185, sigY)

        doc.setFontSize(9)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(0, 0, 0)
        doc.text("Seller Signature", 50, sigY + 6, { align: "center" })
        doc.text("Authorized Farm Signatory", 155, sigY + 6, { align: "center" })

        doc.setFontSize(8)
        doc.setFont("helvetica", "italic")
        doc.setTextColor(120, 120, 120)
        doc.text("This is a computer generated receipt. Please report any discrepancies within 24 hours.", 105, sigY + 15, { align: "center" })