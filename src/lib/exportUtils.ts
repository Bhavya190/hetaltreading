/**
 * Export and Sharing Utilities for Hetal Trading Company
 * Supports: Export Excel (.csv), Export PDF, Print, and Share on WhatsApp
 */

// 1. Export to Excel (.csv format with UTF-8 BOM for Excel)
export function exportToExcel(
  filenameOrObj: string | { filename: string; headers: ({ label: string; key: string } | string)[]; rows?: any[]; data?: any[] },
  headers?: ({ label: string; key: string } | string)[],
  data?: any[]
) {
  if (typeof filenameOrObj === 'object') {
    const filename = filenameOrObj.filename || 'Export'
    const rawHeaders = filenameOrObj.headers || []
    const rawData = filenameOrObj.data || filenameOrObj.rows || []

    if (!rawData || rawData.length === 0) {
      alert('No data available to export.')
      return
    }

    const csvRows: string[] = []

    if (rawHeaders.length > 0 && typeof rawHeaders[0] === 'string') {
      csvRows.push((rawHeaders as string[]).map((h) => `"${String(h).replace(/"/g, '""')}"`).join(','))
      rawData.forEach((row: any) => {
        if (Array.isArray(row)) {
          csvRows.push(row.map((val) => `"${String(val ?? '').replace(/"/g, '""')}"`).join(','))
        } else if (typeof row === 'object' && row !== null) {
          csvRows.push(Object.values(row).map((val) => `"${String(val ?? '').replace(/"/g, '""')}"`).join(','))
        }
      })
    } else {
      const hList = rawHeaders as { label: string; key: string }[]
      csvRows.push(hList.map((h) => `"${h.label.replace(/"/g, '""')}"`).join(','))
      rawData.forEach((row: any) => {
        if (Array.isArray(row)) {
          csvRows.push(row.map((val) => `"${String(val ?? '').replace(/"/g, '""')}"`).join(','))
        } else if (typeof row === 'object' && row !== null) {
          const values = hList.map((h) => {
            let val = row[h.key]
            if (val === null || val === undefined) val = ''
            if (typeof val === 'object') val = JSON.stringify(val)
            return `"${String(val).replace(/"/g, '""')}"`
          })
          csvRows.push(values.join(','))
        }
      })
    }

    const csvString = '\uFEFF' + csvRows.join('\r\n')
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    return
  }

  if (!data || data.length === 0) {
    alert('No data available to export.')
    return
  }

  const csvRows: string[] = []
  const hList = (headers || []) as { label: string; key: string }[]
  csvRows.push(hList.map((h) => `"${h.label.replace(/"/g, '""')}"`).join(','))

  data.forEach((row) => {
    const values = hList.map((h) => {
      let val = row[h.key]
      if (val === null || val === undefined) val = ''
      if (typeof val === 'object') val = JSON.stringify(val)
      return `"${String(val).replace(/"/g, '""')}"`
    })
    csvRows.push(values.join(','))
  })

  const csvString = '\uFEFF' + csvRows.join('\r\n')
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `${filenameOrObj}_${new Date().toISOString().split('T')[0]}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export interface BankDetails {
  accountName: string
  bankName: string
  accountNumber: string
  ifscCode: string
  branch: string
  upiId: string
  note?: string
}

export const DEFAULT_BANK_DETAILS: BankDetails = {
  accountName: 'Hetal Trading Company',
  bankName: 'HDFC Bank',
  accountNumber: '50200012345678',
  ifscCode: 'HDFC0001234',
  branch: 'Gota Branch, Ahmedabad',
  upiId: 'hetaltrading@upi',
  note: 'Please share transaction reference / screenshot after payment transfer.',
}

export function getSavedBankDetails(): BankDetails {
  if (typeof window === 'undefined') return DEFAULT_BANK_DETAILS
  try {
    const saved = localStorage.getItem('hetal_bank_details')
    if (saved) {
      const parsed = JSON.parse(saved)
      return { ...DEFAULT_BANK_DETAILS, ...parsed }
    }
  } catch (e) {
    console.error('Error reading bank details from localStorage:', e)
  }
  return DEFAULT_BANK_DETAILS
}

export function saveBankDetails(details: BankDetails): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('hetal_bank_details', JSON.stringify(details))
  } catch (e) {
    console.error('Error saving bank details to localStorage:', e)
  }
}

// 2. Print Styled Report
export function printReport(
  titleOrObj:
    | string
    | {
        title: string
        headers: string[]
        data?: (string | number)[][]
        rows?: (string | number)[][]
        bankDetails?: BankDetails
        logoUrl?: string
      },
  headers?: string[],
  rows?: (string | number)[][],
  customBankDetails?: BankDetails
) {
  let title = 'Report'
  let hdrs: string[] = []
  let rws: (string | number)[][] = []
  let bankDetails: BankDetails = getSavedBankDetails()
  let logoUrlPath = '/Hetal-Treading-Logo-bg-removed.png'

  if (typeof titleOrObj === 'object') {
    title = titleOrObj.title || 'Report'
    hdrs = titleOrObj.headers || []
    rws = titleOrObj.data || titleOrObj.rows || []
    if (titleOrObj.bankDetails) {
      bankDetails = { ...bankDetails, ...titleOrObj.bankDetails }
    }
    if (titleOrObj.logoUrl) {
      logoUrlPath = titleOrObj.logoUrl
    }
  } else {
    title = titleOrObj
    hdrs = headers || []
    rws = rows || []
    if (customBankDetails) {
      bankDetails = { ...bankDetails, ...customBankDetails }
    }
  }

  if (!rws || rws.length === 0) {
    alert('No records available to print.')
    return
  }

  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Please allow popups to print/export PDF reports.')
    return
  }

  const logoUrl = typeof window !== 'undefined' ? `${window.location.origin}${logoUrlPath}` : logoUrlPath
  const upiUrl = `upi://pay?pa=${encodeURIComponent(bankDetails.upiId || 'hetaltrading@upi')}&pn=${encodeURIComponent(bankDetails.accountName || 'Hetal Trading Company')}&cu=INR`
  const qrCodeUrl = typeof window !== 'undefined' ? `${window.location.origin}/HTC-QR.jpeg` : '/HTC-QR.jpeg'

  const tableHeadersHtml = hdrs
    .map(
      (h) =>
        `<th style="padding: 10px 12px; border: 1px solid #cbd5e1; background-color: #0f172a; color: #ffffff; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">${h}</th>`
    )
    .join('')

  const tableRowsHtml = rws
    .map(
      (r, i) =>
        `<tr style="background-color: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'}; font-size: 11.5px;">` +
        r
          .map(
            (cell) =>
              `<td style="padding: 8px 12px; border: 1px solid #e2e8f0; color: #1e293b;">${cell !== undefined && cell !== null ? cell : '-'}</td>`
          )
          .join('') +
        `</tr>`
    )
    .join('')

  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title} - Hetal Trading Company</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          * { box-sizing: border-box; }
          html, body {
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
            color: #0f172a;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body {
            padding: 20px 0;
          }
          .page-container {
            max-width: 210mm;
            margin: 0 auto;
            background: #ffffff;
            padding: 24px 28px;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
          }
          .header-top-banner {
            text-align: center !important;
            width: 100% !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            font-size: 13px;
            font-weight: 800;
            color: #78350f;
            margin-bottom: 12px;
            letter-spacing: 0.5px;
          }
          .tax-invoice-heading {
            font-size: 15px;
            font-weight: 800;
            color: #92400e;
            text-transform: uppercase;
            margin-top: 2px;
            letter-spacing: 1px;
          }
          .header-container {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #d97706;
            padding-bottom: 12px;
            margin-bottom: 16px;
          }
          .header-left {
            display: flex;
            align-items: center;
            gap: 14px;
          }
          .company-logo {
            height: 50px;
            width: auto;
            max-width: 150px;
            object-fit: contain;
          }
          .company-info h1 {
            font-size: 17px;
            font-weight: 800;
            color: #78350f;
            margin: 0;
            letter-spacing: 0.3px;
            text-transform: uppercase;
          }
          .company-info p {
            font-size: 10.5px;
            color: #64748b;
            margin: 2px 0 0 0;
            font-weight: 500;
          }
          .company-gstin {
            font-size: 10.5px;
            font-weight: 700;
            color: #0f172a;
            margin-top: 2px;
            font-family: monospace;
          }
          .report-badge {
            display: inline-block;
            margin-top: 3px;
            font-size: 11px;
            font-weight: 700;
            color: #92400e;
            background-color: #fef3c7;
            padding: 2px 8px;
            border-radius: 4px;
            border: 1px solid #fde68a;
          }
          .meta-box {
            text-align: right;
            font-size: 10.5px;
            color: #475569;
            line-height: 1.5;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
            margin-bottom: 16px;
          }
          th {
            padding: 8px 10px;
            border: 1px solid #cbd5e1;
            background-color: #0f172a;
            color: #ffffff;
            text-align: left;
            font-size: 10.5px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }
          td {
            padding: 7px 10px;
            border: 1px solid #e2e8f0;
            color: #1e293b;
            font-size: 11px;
          }
          tr:nth-child(even) { background-color: #f8fafc; }

          .payment-section {
            margin-top: 16px;
            padding: 12px 16px;
            background-color: #fffbeb;
            border: 1px solid #fcd34d;
            border-radius: 8px;
            page-break-inside: avoid;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 16px;
          }
          .bank-details-col {
            flex: 1;
          }
          .payment-title {
            font-size: 11.5px;
            font-weight: 800;
            color: #92400e;
            margin: 0 0 8px 0;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }
          .bank-grid {
            display: grid;
            grid-template-columns: 100px 1fr;
            gap: 4px 10px;
            font-size: 11px;
          }
          .bank-label {
            color: #78350f;
            font-weight: 600;
          }
          .bank-val {
            color: #0f172a;
            font-weight: 700;
          }
          .mono-val {
            font-family: monospace;
            font-size: 11.5px;
          }
          .upi-qr-col {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding-left: 16px;
            border-left: 1px dashed #fde68a;
            min-width: 140px;
          }
          .qr-card {
            background: #ffffff;
            padding: 6px;
            border-radius: 6px;
            border: 1px solid #fcd34d;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            text-align: center;
          }
          .qr-card img {
            width: 90px;
            height: 90px;
            display: block;
          }
          .upi-id-badge {
            margin-top: 5px;
            font-size: 10px;
            font-weight: 700;
            color: #92400e;
            background: #fef3c7;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: monospace;
            border: 1px solid #fde68a;
          }
          .payment-note {
            margin-top: 5px;
            font-size: 9px;
            color: #78350f;
            font-style: italic;
            text-align: center;
            max-width: 140px;
            line-height: 1.3;
          }
          .footer {
            margin-top: 18px;
            border-top: 1px solid #e2e8f0;
            padding-top: 8px;
            font-size: 9.5px;
            color: #94a3b8;
            text-align: center;
          }

          @media print {
            body { padding: 12mm 15mm !important; margin: 0 !important; background: #ffffff !important; }
            .page-container { max-width: 100% !important; width: 100% !important; margin: 0 !important; padding: 0 !important; border: none !important; border-radius: 0 !important; box-shadow: none !important; }
            @page { size: A4 portrait; margin: 0; }
            .payment-section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="page-container">
          <div class="header-top-banner" style="text-align: center; width: 100%; margin: 0 auto 12px auto; display: block;">
            <div style="text-align: center; font-size: 13px; font-weight: 800; color: #78350f; letter-spacing: 0.5px;">|| શ્રી આદિનાથાય નમઃ ||</div>
            <div style="text-align: center; font-size: 15px; font-weight: 800; color: #92400e; text-transform: uppercase; margin-top: 2px; letter-spacing: 1px;">TAX INVOICE</div>
          </div>
          <div class="header-container">
            <div class="header-left">
              <img src="${logoUrl}" alt="Hetal Trading Company Logo" class="company-logo" />
              <div class="company-info">
                <h1>Hetal Trading Company</h1>
                <div class="company-gstin"><strong>GSTIN :</strong> 24AGWPD0844K1Z7</div>
              </div>
            </div>
            <div class="meta-box">
              <div><strong>MO :</strong> 9428480067</div>
              <div><strong>Generated:</strong> ${currentDate}</div>
              <div><strong>Total Records:</strong> ${rws.length}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>${tableHeadersHtml}</tr>
            </thead>
            <tbody>
              ${tableRowsHtml}
            </tbody>
          </table>

          <div class="payment-section">
            <div class="bank-details-col">
              <div class="payment-title">🏦 Direct Bank Transfer Details</div>
              <div class="bank-grid">
                <div class="bank-label">Account Holder:</div>
                <div class="bank-val">${bankDetails.accountName}</div>
                <div class="bank-label">Bank Name:</div>
                <div class="bank-val">${bankDetails.bankName}</div>
                <div class="bank-label">Account No:</div>
                <div class="bank-val mono-val">${bankDetails.accountNumber}</div>
                <div class="bank-label">IFSC Code:</div>
                <div class="bank-val mono-val">${bankDetails.ifscCode}</div>
                <div class="bank-label">Branch:</div>
                <div class="bank-val">${bankDetails.branch}</div>
              </div>
            </div>

            <div class="upi-qr-col">
              <div class="payment-title" style="margin-bottom: 6px;">📲 Scan & Pay via UPI</div>
              <div class="qr-card">
                <img src="${qrCodeUrl}" alt="Scan QR Code to Pay via UPI" />
              </div>
              <div class="upi-id-badge">${bankDetails.upiId}</div>
              ${bankDetails.note ? `<div class="payment-note">${bankDetails.note}</div>` : ''}
            </div>
          </div>

          <div class="footer">
            Hetal Trading Company • Industrial Chemical Sales & Supply • Computer Generated Report
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
    </html>
  `)
  printWindow.document.close()
}

// 3. Export PDF (Triggers Print Window with PDF instruction)
export function exportToPDF(
  titleOrObj:
    | string
    | {
        title: string
        headers: string[]
        data?: (string | number)[][]
        rows?: (string | number)[][]
        filename?: string
        bankDetails?: BankDetails
        logoUrl?: string
      },
  headers?: string[],
  rows?: (string | number)[][],
  customBankDetails?: BankDetails
) {
  if (typeof titleOrObj === 'object') {
    printReport(titleOrObj)
  } else {
    printReport(titleOrObj, headers, rows, customBankDetails)
  }
}

// 4. Share via WhatsApp
export function shareOnWhatsApp(message: string, phoneNumber?: string) {
  const encodedText = encodeURIComponent(message)
  let url = ''

  if (phoneNumber) {
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '')
    url = `https://wa.me/${cleanPhone}?text=${encodedText}`
  } else {
    url = `https://api.whatsapp.com/send?text=${encodedText}`
  }

  window.open(url, '_blank')
}

export interface CustomerStatementExportParams {
  customerName: string
  mobileNumber: string
  billingAddress: string
  creditLimitDays: number
  totalDebtAmount: number
  totalPaidAmount: number
  balanceDue: number
  transactions: {
    billNumber: string
    date: string
    itemsSummary: string
    billAmount: number
    paidAmount: number
    balanceAmount: number
    paymentStatus: string
  }[]
  payments: {
    date: string
    paymentType: string
    amount: number
    appliedBillNo?: string | null
    note?: string | null
  }[]
  bankDetails?: BankDetails
  logoUrl?: string
}

export function printCustomerStatement(params: CustomerStatementExportParams) {
  let bankDetails: BankDetails = getSavedBankDetails()
  if (params.bankDetails) {
    bankDetails = { ...bankDetails, ...params.bankDetails }
  }
  const logoUrlPath = params.logoUrl || '/Hetal-Treading-Logo-bg-removed.png'
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Please allow popups to print/export PDF reports.')
    return
  }

  const logoUrl = typeof window !== 'undefined' ? `${window.location.origin}${logoUrlPath}` : logoUrlPath
  const upiUrl = `upi://pay?pa=${encodeURIComponent(bankDetails.upiId || 'hetaltrading@upi')}&pn=${encodeURIComponent(bankDetails.accountName || 'Hetal Trading Company')}&cu=INR`
  const qrCodeUrl = typeof window !== 'undefined' ? `${window.location.origin}/HTC-QR.jpeg` : '/HTC-QR.jpeg'

  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  // Bills HTML Rows
  const billsRowsHtml = (params.transactions || []).map((t, i) => `
    <tr style="background-color: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'}; font-size: 11px;">
      <td style="padding: 7px 10px; border: 1px solid #e2e8f0; font-family: monospace; font-weight: bold; color: #92400e;">${t.billNumber}</td>
      <td style="padding: 7px 10px; border: 1px solid #e2e8f0; color: #475569;">${t.date ? t.date.split('T')[0] : ''}</td>
      <td style="padding: 7px 10px; border: 1px solid #e2e8f0; color: #0f172a; font-weight: 600;">${t.itemsSummary}</td>
      <td style="padding: 7px 10px; border: 1px solid #e2e8f0; font-family: monospace; font-weight: bold;">₹ ${(t.billAmount || 0).toLocaleString()}</td>
      <td style="padding: 7px 10px; border: 1px solid #e2e8f0; font-family: monospace; font-weight: bold; color: #15803d;">₹ ${(t.paidAmount || 0).toLocaleString()}</td>
      <td style="padding: 7px 10px; border: 1px solid #e2e8f0; font-family: monospace; font-weight: bold; color: #b91c1c;">₹ ${(t.balanceAmount || 0).toLocaleString()}</td>
      <td style="padding: 7px 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; font-size: 10px;">
        <span style="padding: 2px 6px; border-radius: 4px; background: ${t.paymentStatus === 'PAID' ? '#dcfce7' : t.paymentStatus === 'PARTIAL' ? '#fef3c7' : '#ffe4e6'}; color: ${t.paymentStatus === 'PAID' ? '#166534' : t.paymentStatus === 'PARTIAL' ? '#92400e' : '#991b1b'};">
          ${t.paymentStatus}
        </span>
      </td>
    </tr>
  `).join('')

  // Payments HTML Rows
  const paymentsRowsHtml = (params.payments || []).map((p, i) => {
    const payTypeLabel = p.paymentType === 'CASH' ? 'Cash' : p.paymentType === 'CHEQUE' ? 'Cheque' : p.paymentType === 'UPI' ? 'UPI' : 'Bank Transfer'
    const dateStr = p.date ? new Date(p.date).toISOString().split('T')[0] : ''
    return `
      <tr style="background-color: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'}; font-size: 11px;">
        <td style="padding: 7px 10px; border: 1px solid #e2e8f0; font-family: monospace; font-weight: bold; color: #475569;">${dateStr}</td>
        <td style="padding: 7px 10px; border: 1px solid #e2e8f0;">
          <span style="padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 10px; background: #dcfce7; color: #166534;">${payTypeLabel}</span>
        </td>
        <td style="padding: 7px 10px; border: 1px solid #e2e8f0; font-family: monospace; font-weight: bold; color: #15803d; font-size: 11.5px;">₹ ${(p.amount || 0).toLocaleString()}</td>
        <td style="padding: 7px 10px; border: 1px solid #e2e8f0; color: #1e293b; font-weight: 500;">${p.appliedBillNo || 'General Credit'}</td>
        <td style="padding: 7px 10px; border: 1px solid #e2e8f0; color: #64748b;">${p.note || '-'}</td>
      </tr>
    `
  }).join('')

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Ledger Statement - ${params.customerName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          * { box-sizing: border-box; }
          html, body {
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
            color: #0f172a;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body { padding: 20px 0; }
          .page-container {
            max-width: 210mm;
            margin: 0 auto;
            background: #ffffff;
            padding: 24px 28px;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
          }
          .header-container {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #d97706;
            padding-bottom: 12px;
            margin-bottom: 16px;
          }
          .header-left { display: flex; align-items: center; gap: 14px; }
          .company-logo { height: 50px; width: auto; max-width: 150px; object-fit: contain; }
          .company-info h1 { font-size: 17px; font-weight: 800; color: #78350f; margin: 0; letter-spacing: 0.3px; text-transform: uppercase; }
          .company-info p { font-size: 10.5px; color: #64748b; margin: 2px 0 0 0; font-weight: 500; }
          .report-badge { display: inline-block; margin-top: 3px; font-size: 11px; font-weight: 700; color: #92400e; background-color: #fef3c7; padding: 2px 8px; border-radius: 4px; border: 1px solid #fde68a; }
          .meta-box { text-align: right; font-size: 10.5px; color: #475569; line-height: 1.5; }
          
          .customer-card {
            background-color: #0f172a;
            color: #ffffff;
            padding: 14px 18px;
            border-radius: 8px;
            margin-bottom: 16px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .cust-name { font-size: 15px; font-weight: 800; color: #ffffff; margin-bottom: 4px; }
          .cust-detail { font-size: 11px; color: #cbd5e1; margin-top: 2px; }

          .summary-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 12px;
            margin-bottom: 20px;
          }
          .sum-card {
            padding: 10px 14px;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
            background: #ffffff;
          }
          .sum-title { font-size: 10.5px; font-weight: 700; color: #64748b; text-transform: uppercase; }
          .sum-val { font-size: 15px; font-weight: 800; font-family: monospace; margin-top: 2px; }

          .section-heading {
            font-size: 12px;
            font-weight: 800;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 16px 0 8px 0;
            display: flex;
            align-items: center;
            gap: 6px;
          }

          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
          th { padding: 8px 10px; border: 1px solid #cbd5e1; background-color: #0f172a; color: #ffffff; text-align: left; font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; }
          td { padding: 7px 10px; border: 1px solid #e2e8f0; color: #1e293b; font-size: 11px; }

          .payment-section {
            margin-top: 20px;
            padding: 12px 16px;
            background-color: #fffbeb;
            border: 1px solid #fcd34d;
            border-radius: 8px;
            page-break-inside: avoid;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 16px;
          }
          .bank-details-col { flex: 1; }
          .payment-title { font-size: 11.5px; font-weight: 800; color: #92400e; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.3px; }
          .bank-grid { display: grid; grid-template-columns: 100px 1fr; gap: 4px 10px; font-size: 11px; }
          .bank-label { color: #78350f; font-weight: 600; }
          .bank-val { color: #0f172a; font-weight: 700; }
          .mono-val { font-family: monospace; font-size: 11.5px; }
          .upi-qr-col { display: flex; flex-direction: column; align-items: center; justify-content: center; padding-left: 16px; border-left: 1px dashed #fde68a; min-width: 140px; text-align: center; }
          .qr-card { background: #ffffff; padding: 6px; border-radius: 6px; border: 1px solid #fcd34d; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
          .qr-card img { width: 90px; height: 90px; display: block; margin: 0 auto; }
          .upi-id-badge { margin-top: 5px; font-size: 10px; font-weight: 700; color: #92400e; background: #fef3c7; padding: 2px 6px; border-radius: 4px; font-family: monospace; border: 1px solid #fde68a; }
          .payment-note { margin-top: 5px; font-size: 9px; color: #78350f; font-style: italic; max-width: 140px; line-height: 1.3; }
          .footer { margin-top: 18px; border-top: 1px solid #e2e8f0; padding-top: 8px; font-size: 9.5px; color: #94a3b8; text-align: center; }

          @media print {
            body { padding: 12mm 15mm !important; margin: 0 !important; background: #ffffff !important; }
            .page-container { max-width: 100% !important; width: 100% !important; margin: 0 !important; padding: 0 !important; border: none !important; border-radius: 0 !important; box-shadow: none !important; }
            @page { size: A4 portrait; margin: 0; }
            .payment-section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="page-container">
          <div class="header-top-banner" style="text-align: center; width: 100%; margin: 0 auto 12px auto; display: block;">
            <div style="text-align: center; font-size: 13px; font-weight: 800; color: #78350f; letter-spacing: 0.5px;">|| શ્રી આદિનાથાય નમઃ ||</div>
            <div style="text-align: center; font-size: 15px; font-weight: 800; color: #92400e; text-transform: uppercase; margin-top: 2px; letter-spacing: 1px;">CUSTOMER DEBT & PAYMENT STATEMENT</div>
          </div>
          <div class="header-container">
            <div class="header-left">
              <img src="${logoUrl}" alt="Hetal Trading Company Logo" class="company-logo" />
              <div class="company-info">
                <h1>Hetal Trading Company</h1>
                <div class="company-gstin"><strong>GSTIN :</strong> 24AGWPD0844K1Z7</div>
              </div>
            </div>
            <div class="meta-box">
              <div><strong>MO :</strong> 9428480067</div>
              <div><strong>Statement Date:</strong> ${currentDate}</div>
            </div>
          </div>

          <!-- Customer Card -->
          <div class="customer-card">
            <div>
              <div class="cust-name">${params.customerName}</div>
              <div class="cust-detail">📞 Mobile: <strong>${params.mobileNumber}</strong> | ⏱ Credit Terms: <strong>${params.creditLimitDays} Days</strong></div>
              <div class="cust-detail">📍 Address: ${params.billingAddress}</div>
            </div>
          </div>

          <!-- Financial Summary Cards -->
          <div class="summary-grid">
            <div class="sum-card" style="border-left: 4px solid #475569;">
              <div class="sum-title">Total Credit Debt</div>
              <div class="sum-val" style="color: #0f172a;">₹ ${(params.totalDebtAmount || 0).toLocaleString()}</div>
            </div>
            <div class="sum-card" style="border-left: 4px solid #16a34a; background-color: #f0fdf4;">
              <div class="sum-title" style="color: #15803d;">Total Received Payments</div>
              <div class="sum-val" style="color: #15803d;">₹ ${(params.totalPaidAmount || 0).toLocaleString()}</div>
            </div>
            <div class="sum-card" style="border-left: 4px solid #dc2626; background-color: #fef2f2;">
              <div class="sum-title" style="color: #b91c1c;">Outstanding Udhaar Due</div>
              <div class="sum-val" style="color: #b91c1c;">₹ ${(params.balanceDue || 0).toLocaleString()}</div>
            </div>
          </div>

          <!-- Section 1: Bills Issued -->
          <div class="section-heading">📑 1. Debt Bills & Invoices Issued (${(params.transactions || []).length})</div>
          <table>
            <thead>
              <tr>
                <th>Bill No.</th>
                <th>Date</th>
                <th>Product / Items Summary</th>
                <th>Bill Total</th>
                <th>Paid Amount</th>
                <th>Balance Due</th>
                <th style="text-align: center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${billsRowsHtml || `<tr><td colspan="7" style="text-align: center; color: #94a3b8; padding: 12px;">No debt bills issued.</td></tr>`}
            </tbody>
          </table>

          <!-- Section 2: Payments Received Logs -->
          <div class="section-heading">💵 2. Received Payment History Logs (${(params.payments || []).length})</div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Payment Type</th>
                <th>Amount Received</th>
                <th>Bill Reduction Details</th>
                <th>Summary / Extra Note</th>
              </tr>
            </thead>
            <tbody>
              ${paymentsRowsHtml || `<tr><td colspan="5" style="text-align: center; color: #94a3b8; padding: 12px;">No payment receipt logs recorded yet.</td></tr>`}
            </tbody>
          </table>

          <!-- Payment Options Footer -->
          <div class="payment-section">
            <div class="bank-details-col">
              <div class="payment-title">🏦 Direct Bank Transfer Details</div>
              <div class="bank-grid">
                <div class="bank-label">Account Holder:</div>
                <div class="bank-val">${bankDetails.accountName}</div>
                <div class="bank-label">Bank Name:</div>
                <div class="bank-val">${bankDetails.bankName}</div>
                <div class="bank-label">Account No:</div>
                <div class="bank-val mono-val">${bankDetails.accountNumber}</div>
                <div class="bank-label">IFSC Code:</div>
                <div class="bank-val mono-val">${bankDetails.ifscCode}</div>
                <div class="bank-label">Branch:</div>
                <div class="bank-val">${bankDetails.branch}</div>
              </div>
            </div>

            <div class="upi-qr-col">
              <div class="payment-title" style="margin-bottom: 6px;">📲 Scan & Pay via UPI</div>
              <div class="qr-card">
                <img src="${qrCodeUrl}" alt="Scan QR Code to Pay via UPI" />
              </div>
              <div class="upi-id-badge">${bankDetails.upiId}</div>
              ${bankDetails.note ? `<div class="payment-note">${bankDetails.note}</div>` : ''}
            </div>
          </div>

          <div class="footer">
            Hetal Trading Company • Customer Ledger Statement • Computer Generated Document
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 500);
          };
        </script>
      </body>
    </html>
  `)
  printWindow.document.close()
}

export function exportCustomerStatementExcel(params: CustomerStatementExportParams) {
  const csvRows: string[] = []
  csvRows.push(`"CUSTOMER DEBT & PAYMENT LEDGER STATEMENT"`)
  csvRows.push(`"Customer Name:","${params.customerName.replace(/"/g, '""')}"`)
  csvRows.push(`"Mobile Number:","${params.mobileNumber}"`)
  csvRows.push(`"Billing Address:","${params.billingAddress.replace(/"/g, '""')}"`)
  csvRows.push(`"Total Credit Debt:","₹ ${params.totalDebtAmount}"`)
  csvRows.push(`"Total Received Payments:","₹ ${params.totalPaidAmount}"`)
  csvRows.push(`"Outstanding Udhaar Due:","₹ ${params.balanceDue}"`)
  csvRows.push(`""`)

  csvRows.push(`"1. DEBT BILLS & INVOICES ISSUED"`)
  csvRows.push(`"Bill No.","Date","Product / Items Summary","Bill Total (₹)","Paid Amount (₹)","Balance Due (₹)","Status"`)
  ;(params.transactions || []).forEach((t) => {
    csvRows.push([
      `"${t.billNumber}"`,
      `"${t.date ? t.date.split('T')[0] : ''}"`,
      `"${(t.itemsSummary || '').replace(/"/g, '""')}"`,
      `"${t.billAmount}"`,
      `"${t.paidAmount}"`,
      `"${t.balanceAmount}"`,
      `"${t.paymentStatus}"`
    ].join(','))
  })

  csvRows.push(`""`)
  csvRows.push(`"2. RECEIVED PAYMENT HISTORY LOGS"`)
  csvRows.push(`"Date","Payment Type","Amount Received (₹)","Bill Reduction Details","Summary / Extra Note"`)
  ;(params.payments || []).forEach((p) => {
    const dateStr = p.date ? new Date(p.date).toISOString().split('T')[0] : ''
    csvRows.push([
      `"${dateStr}"`,
      `"${p.paymentType}"`,
      `"${p.amount}"`,
      `"${(p.appliedBillNo || '').replace(/"/g, '""')}"`,
      `"${(p.note || '').replace(/"/g, '""')}"`
    ].join(','))
  })

  const csvString = '\uFEFF' + csvRows.join('\r\n')
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `Statement_${params.customerName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function shareCustomerStatementWhatsApp(params: CustomerStatementExportParams) {
  const summaryText =
    `📒 *Customer Statement - Hetal Trading Company*\n` +
    `*Customer:* ${params.customerName}\n` +
    `*Mobile:* ${params.mobileNumber}\n\n` +
    `📊 *Financial Summary:*\n` +
    `• Total Billed Debt: ₹${params.totalDebtAmount.toLocaleString()}\n` +
    `• Total Paid / Cleared: ₹${params.totalPaidAmount.toLocaleString()}\n` +
    `• *Outstanding Udhaar Due:* ₹${params.balanceDue.toLocaleString()}\n\n` +
    `Please clear your outstanding balance of ₹${params.balanceDue.toLocaleString()} at your earliest. Thank you!`

  shareOnWhatsApp(summaryText, params.mobileNumber)
}

export interface SaleInvoiceExportParams {
  billNumber: string
  date: string
  customerName: string
  subtotal: number
  extraCharges: number
  grandTotal: number
  items: {
    productName: string
    hsnCode?: string
    serialNumber?: string
    gstRate?: string | number
    unit?: string
    quantity: number
    unitPrice: number
    discount: number
    netTotal: number
  }[]
  bankDetails?: BankDetails
  logoUrl?: string
}

export interface CalculatedGstItem {
  gstRateNum: number
  deductionPercent: number
  rawAmount: number
  cgstRate: number
  sgstRate: number
  cgstAmount: number
  sgstAmount: number
  totalGstAmount: number
  itemTotal: number
}

export function calculateItemGst(item: { netTotal: number; gstRate?: string | number }): CalculatedGstItem {
  const netTotal = item.netTotal || 0
  const rateStr = String(item.gstRate || '18').replace('%', '')
  const gstRateNum = parseFloat(rateStr) || 18

  let deductionPercent = 15.25
  if (gstRateNum === 5) {
    deductionPercent = 4.77
  } else if (gstRateNum === 18) {
    deductionPercent = 15.25
  } else if (gstRateNum > 0) {
    deductionPercent = (1 - 1 / (1 + gstRateNum / 100)) * 100
  } else {
    deductionPercent = 0
  }

  const rawAmount = netTotal * (1 - deductionPercent / 100)
  const cgstRate = gstRateNum / 2
  const sgstRate = gstRateNum / 2
  const cgstAmount = rawAmount * (cgstRate / 100)
  const sgstAmount = rawAmount * (sgstRate / 100)
  const totalGstAmount = cgstAmount + sgstAmount
  const itemTotal = rawAmount + totalGstAmount

  return {
    gstRateNum,
    deductionPercent,
    rawAmount,
    cgstRate,
    sgstRate,
    cgstAmount,
    sgstAmount,
    totalGstAmount,
    itemTotal,
  }
}

export function calculateBillGstTotals<T extends { netTotal: number; gstRate?: string | number }>(
  items: T[],
  extraCharges: number = 0
) {
  let totalRawAmount = 0
  let totalCgstAmount = 0
  let totalSgstAmount = 0

  const processedItems = (items || []).map((it) => {
    const calc = calculateItemGst(it)
    totalRawAmount += calc.rawAmount
    totalCgstAmount += calc.cgstAmount
    totalSgstAmount += calc.sgstAmount
    return {
      ...it,
      calc,
    }
  })

  const totalGstAmount = totalCgstAmount + totalSgstAmount
  const calculatedGrandTotal = totalRawAmount + totalGstAmount + (extraCharges || 0)

  return {
    processedItems,
    totalRawAmount,
    totalCgstAmount,
    totalSgstAmount,
    totalGstAmount,
    extraCharges,
    calculatedGrandTotal,
  }
}

export function printSaleInvoice(params: SaleInvoiceExportParams) {
  let bankDetails: BankDetails = getSavedBankDetails()
  if (params.bankDetails) {
    bankDetails = { ...bankDetails, ...params.bankDetails }
  }
  const logoUrlPath = params.logoUrl || '/Hetal-Treading-Logo-bg-removed.png'
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Please allow popups to print/export PDF reports.')
    return
  }

  const logoUrl = typeof window !== 'undefined' ? `${window.location.origin}${logoUrlPath}` : logoUrlPath
  const upiUrl = `upi://pay?pa=${encodeURIComponent(bankDetails.upiId || 'hetaltrading@upi')}&pn=${encodeURIComponent(bankDetails.accountName || 'Hetal Trading Company')}&cu=INR`
  const qrCodeUrl = typeof window !== 'undefined' ? `${window.location.origin}/HTC-QR.jpeg` : '/HTC-QR.jpeg'

  const currentDate = new Date().toISOString().split('T')[0]
  const gstBreakdown = calculateBillGstTotals(params.items || [], params.extraCharges || 0)

  const itemsHtml = gstBreakdown.processedItems.map((it, i) => `
    <tr style="background-color: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'}; font-size: 10.5px;">
      <td style="padding: 7px 8px; border: 1px solid #e2e8f0; font-weight: 700; color: #0f172a;">${it.productName}</td>
      <td style="padding: 7px 8px; border: 1px solid #e2e8f0; font-family: monospace; color: #64748b;">${it.hsnCode || it.serialNumber || '-'}</td>
      <td style="padding: 7px 8px; border: 1px solid #e2e8f0; font-weight: 600;">${it.quantity} ${it.unit || 'Kg'}</td>
      <td style="padding: 7px 8px; border: 1px solid #e2e8f0; font-family: monospace;">₹ ${(it.unitPrice || 0).toLocaleString()}</td>
      <td style="padding: 7px 8px; border: 1px solid #e2e8f0; font-family: monospace; color: #dc2626;">₹ ${(it.discount || 0).toLocaleString()}</td>
      <td style="padding: 7px 8px; border: 1px solid #e2e8f0; font-family: monospace; font-weight: 600;">₹ ${it.calc.rawAmount.toFixed(2)}</td>
      <td style="padding: 7px 8px; border: 1px solid #e2e8f0; font-family: monospace; text-align: center; font-size: 10px;">
        <strong>${it.calc.gstRateNum}%</strong><br/>
        <span style="color: #64748b; font-size: 9px;">CGST ${it.calc.cgstRate}% + SGST ${it.calc.sgstRate}%</span>
      </td>
      <td style="padding: 7px 8px; border: 1px solid #e2e8f0; font-family: monospace; color: #0284c7;">₹ ${it.calc.cgstAmount.toFixed(2)}</td>
      <td style="padding: 7px 8px; border: 1px solid #e2e8f0; font-family: monospace; color: #0284c7;">₹ ${it.calc.sgstAmount.toFixed(2)}</td>
      <td style="padding: 7px 8px; border: 1px solid #e2e8f0; font-family: monospace; font-weight: bold; color: #16a34a; text-align: right;">₹ ${(it.netTotal || 0).toLocaleString()}</td>
    </tr>
  `).join('')

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Invoice #${params.billNumber} - Hetal Trading Company</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          * { box-sizing: border-box; }
          html, body { margin: 0; padding: 0; background-color: #f8fafc; color: #0f172a; font-family: 'Inter', system-ui, -apple-system, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body { padding: 20px 0; }
          .page-container { max-width: 210mm; margin: 0 auto; background: #ffffff; padding: 24px 28px; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
          .header-container { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #d97706; padding-bottom: 12px; margin-bottom: 16px; }
          .header-left { display: flex; align-items: center; gap: 14px; }
          .company-logo { height: 50px; width: auto; max-width: 150px; object-fit: contain; }
          .company-info h1 { font-size: 17px; font-weight: 800; color: #78350f; margin: 0; letter-spacing: 0.3px; text-transform: uppercase; }
          .company-info p { font-size: 10.5px; color: #64748b; margin: 2px 0 0 0; font-weight: 500; }
          .report-badge { display: inline-block; margin-top: 3px; font-size: 11px; font-weight: 700; color: #92400e; background-color: #fef3c7; padding: 2px 8px; border-radius: 4px; border: 1px solid #fde68a; }
          
          .bill-meta-card {
            background-color: #0f172a;
            color: #ffffff;
            padding: 14px 18px;
            border-radius: 8px;
            margin-bottom: 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .bill-no { font-size: 16px; font-weight: 800; color: #fbbf24; font-family: monospace; }
          .cust-name { font-size: 14px; font-weight: 700; color: #ffffff; margin-top: 2px; }
          .bill-date { font-size: 11px; color: #94a3b8; font-family: monospace; text-align: right; }

          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
          th { padding: 8px 8px; border: 1px solid #cbd5e1; background-color: #0f172a; color: #ffffff; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; }
          td { padding: 7px 8px; border: 1px solid #e2e8f0; color: #1e293b; font-size: 10.5px; }

          .totals-box {
            margin-left: auto;
            width: 290px;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 12px 16px;
            background-color: #f8fafc;
            margin-bottom: 20px;
            font-size: 11px;
          }
          .totals-row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dashed #e2e8f0; }
          .grand-total-row { display: flex; justify-content: space-between; padding-top: 8px; border-top: 2px solid #0f172a; font-size: 13.5px; font-weight: 800; color: #15803d; }

          .payment-section {
            margin-top: 16px;
            padding: 12px 16px;
            background-color: #fffbeb;
            border: 1px solid #fcd34d;
            border-radius: 8px;
            page-break-inside: avoid;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 16px;
          }
          .bank-details-col { flex: 1; }
          .payment-title { font-size: 11.5px; font-weight: 800; color: #92400e; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.3px; }
          .bank-grid { display: grid; grid-template-columns: 100px 1fr; gap: 4px 10px; font-size: 11px; }
          .bank-label { color: #78350f; font-weight: 600; }
          .bank-val { color: #0f172a; font-weight: 700; }
          .mono-val { font-family: monospace; font-size: 11.5px; }
          .upi-qr-col { display: flex; flex-direction: column; align-items: center; justify-content: center; padding-left: 16px; border-left: 1px dashed #fde68a; min-width: 140px; text-align: center; }
          .qr-card { background: #ffffff; padding: 6px; border-radius: 6px; border: 1px solid #fcd34d; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
          .qr-card img { width: 90px; height: 90px; display: block; margin: 0 auto; }
          .upi-id-badge { margin-top: 5px; font-size: 10px; font-weight: 700; color: #92400e; background: #fef3c7; padding: 2px 6px; border-radius: 4px; font-family: monospace; border: 1px solid #fde68a; }
          .payment-note { margin-top: 5px; font-size: 9px; color: #78350f; font-style: italic; max-width: 140px; line-height: 1.3; }
          .footer { margin-top: 18px; border-top: 1px solid #e2e8f0; padding-top: 8px; font-size: 9.5px; color: #94a3b8; text-align: center; }

          @media print {
            body { padding: 12mm 15mm !important; margin: 0 !important; background: #ffffff !important; }
            .page-container { max-width: 100% !important; width: 100% !important; margin: 0 !important; padding: 0 !important; border: none !important; border-radius: 0 !important; box-shadow: none !important; }
            @page { size: A4 portrait; margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="page-container">
          <div class="header-top-banner" style="text-align: center; width: 100%; margin: 0 auto 12px auto; display: block;">
            <div style="text-align: center; font-size: 13px; font-weight: 800; color: #78350f; letter-spacing: 0.5px;">|| શ્રી આદિનાથાય નમઃ ||</div>
            <div style="text-align: center; font-size: 15px; font-weight: 800; color: #92400e; text-transform: uppercase; margin-top: 2px; letter-spacing: 1px;">TAX INVOICE</div>
          </div>
          <div class="header-container">
            <div class="header-left">
              <img src="${logoUrl}" alt="Hetal Trading Company Logo" class="company-logo" />
              <div class="company-info">
                <h1>Hetal Trading Company</h1>
                <div class="company-gstin"><strong>GSTIN :</strong> 24AGWPD0844K1Z7</div>
              </div>
            </div>
            <div class="meta-box">
              <div><strong>Mo :</strong> 9428480067</div>
              <div><strong>Date:</strong> ${currentDate}</div>
            </div>
          </div>

          <div class="bill-meta-card">
            <div>
              <div class="bill-no">Bill #: ${params.billNumber}</div>
              <div class="cust-name">Customer: ${params.customerName}</div>
            </div>
            <div class="bill-date">
              <div>Date: ${params.date ? params.date.split('T')[0] : ''}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>HSN Code</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Discount</th>
                <th>Raw Taxable Amt</th>
                <th style="text-align: center;">GST Rate</th>
                <th>CGST Amt</th>
                <th>SGST Amt</th>
                <th style="text-align: right;">Net Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml || `<tr><td colspan="10" style="text-align: center; color: #94a3b8;">No line items found.</td></tr>`}
            </tbody>
          </table>

          <div class="totals-box">
            <div class="totals-row"><span>Raw Subtotal (Taxable):</span><strong>₹ ${gstBreakdown.totalRawAmount.toFixed(2)}</strong></div>
            <div class="totals-row"><span>CGST Total:</span><strong>₹ ${gstBreakdown.totalCgstAmount.toFixed(2)}</strong></div>
            <div class="totals-row"><span>SGST Total:</span><strong>₹ ${gstBreakdown.totalSgstAmount.toFixed(2)}</strong></div>
            <div class="totals-row"><span>Total GST Tax:</span><strong>₹ ${gstBreakdown.totalGstAmount.toFixed(2)}</strong></div>
            <div class="totals-row"><span>Extra Charges:</span><strong>₹ ${(gstBreakdown.extraCharges || 0).toFixed(2)}</strong></div>
            <div class="grand-total-row"><span>Grand Total:</span><span>₹ ${gstBreakdown.calculatedGrandTotal.toFixed(2)}</span></div>
          </div>

          <div class="payment-section">
            <div class="bank-details-col">
              <div class="payment-title">🏦 Direct Bank Transfer Details</div>
              <div class="bank-grid">
                <div class="bank-label">Account Holder:</div>
                <div class="bank-val">${bankDetails.accountName}</div>
                <div class="bank-label">Bank Name:</div>
                <div class="bank-val">${bankDetails.bankName}</div>
                <div class="bank-label">Account No:</div>
                <div class="bank-val mono-val">${bankDetails.accountNumber}</div>
                <div class="bank-label">IFSC Code:</div>
                <div class="bank-val mono-val">${bankDetails.ifscCode}</div>
                <div class="bank-label">Branch:</div>
                <div class="bank-val">${bankDetails.branch}</div>
              </div>
            </div>

            <div class="upi-qr-col">
              <div class="payment-title" style="margin-bottom: 6px;">📲 Scan & Pay via UPI</div>
              <div class="qr-card">
                <img src="${qrCodeUrl}" alt="Scan QR Code to Pay via UPI" />
              </div>
              <div class="upi-id-badge">${bankDetails.upiId}</div>
              ${bankDetails.note ? `<div class="payment-note">${bankDetails.note}</div>` : ''}
            </div>
          </div>

          <div class="footer">
            Hetal Trading Company • GST Tax Invoice • Computer Generated Document
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 500);
          };
        </script>
      </body>
    </html>
  `)
  printWindow.document.close()
}

export function exportSaleInvoiceExcel(params: SaleInvoiceExportParams) {
  const gstBreakdown = calculateBillGstTotals(params.items || [], params.extraCharges || 0)

  const csvRows: string[] = []
  csvRows.push(`"GST TAX INVOICE / SALE BILL DETAILS"`)
  csvRows.push(`"Bill Number:","${params.billNumber}"`)
  csvRows.push(`"Customer Name:","${params.customerName.replace(/"/g, '""')}"`)
  csvRows.push(`"Date:","${params.date ? params.date.split('T')[0] : ''}"`)
  csvRows.push(`""`)

  csvRows.push(`"PRODUCT LINE ITEMS WITH GST BREAKDOWN"`)
  csvRows.push(`"Product Name","HSN Code","Qty","Unit Price (₹)","Discount (₹)","Raw Taxable Amount (₹)","GST Rate (%)","CGST (%)","CGST Amount (₹)","SGST (%)","SGST Amount (₹)","Net Total (₹)"`)
  gstBreakdown.processedItems.forEach((it) => {
    csvRows.push([
      `"${(it.productName || '').replace(/"/g, '""')}"`,
      `"${it.hsnCode || it.serialNumber || '-'}"`,
      `"${it.quantity} ${it.unit || 'Kg'}"`,
      `"${it.unitPrice}"`,
      `"${it.discount}"`,
      `"${it.calc.rawAmount.toFixed(2)}"`,
      `"${it.calc.gstRateNum}%"`,
      `"${it.calc.cgstRate}%"`,
      `"${it.calc.cgstAmount.toFixed(2)}"`,
      `"${it.calc.sgstRate}%"`,
      `"${it.calc.sgstAmount.toFixed(2)}"`,
      `"${it.netTotal}"`
    ].join(','))
  })

  csvRows.push(`""`)
  csvRows.push(`"GST BREAKDOWN SUMMARY"`)
  csvRows.push(`"Raw Subtotal (Taxable Amount):","₹ ${gstBreakdown.totalRawAmount.toFixed(2)}"`)
  csvRows.push(`"CGST Total:","₹ ${gstBreakdown.totalCgstAmount.toFixed(2)}"`)
  csvRows.push(`"SGST Total:","₹ ${gstBreakdown.totalSgstAmount.toFixed(2)}"`)
  csvRows.push(`"Total GST Tax:","₹ ${gstBreakdown.totalGstAmount.toFixed(2)}"`)
  csvRows.push(`"Extra Charges:","₹ ${gstBreakdown.extraCharges.toFixed(2)}"`)
  csvRows.push(`"Grand Total:","₹ ${gstBreakdown.calculatedGrandTotal.toFixed(2)}"`)

  const csvString = '\uFEFF' + csvRows.join('\r\n')
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `Invoice_${params.billNumber}_${new Date().toISOString().split('T')[0]}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function shareSaleInvoiceWhatsApp(params: SaleInvoiceExportParams) {
  const gstBreakdown = calculateBillGstTotals(params.items || [], params.extraCharges || 0)

  const itemsText = gstBreakdown.processedItems
    .map((it) => `• ${it.productName} (${it.quantity} ${it.unit || 'Kg'}) [GST ${it.calc.gstRateNum}%: CGST ₹${it.calc.cgstAmount.toFixed(2)} + SGST ₹${it.calc.sgstAmount.toFixed(2)}] - ₹${it.netTotal.toLocaleString()}`)
    .join('\n')

  const msg =
    `🧾 *GST Tax Invoice #${params.billNumber}*\n` +
    `*Customer:* ${params.customerName}\n` +
    `*Date:* ${params.date ? params.date.split('T')[0] : ''}\n\n` +
    `📦 *Items Purchased:*\n${itemsText}\n\n` +
    `📊 *Tax Breakdown:*\n` +
    `• Raw Subtotal: ₹${gstBreakdown.totalRawAmount.toFixed(2)}\n` +
    `• CGST Total: ₹${gstBreakdown.totalCgstAmount.toFixed(2)}\n` +
    `• SGST Total: ₹${gstBreakdown.totalSgstAmount.toFixed(2)}\n` +
    `• Extra Charges: ₹${gstBreakdown.extraCharges.toFixed(2)}\n` +
    `💵 *Grand Total:* ₹${gstBreakdown.calculatedGrandTotal.toFixed(2)}\n\n` +
    `Thank you for doing business with Hetal Trading Company!`

  shareOnWhatsApp(msg)
}




