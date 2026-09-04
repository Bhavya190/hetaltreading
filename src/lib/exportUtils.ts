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
  const qrCodeUrl = `https://quickchart.io/qr?text=${encodeURIComponent(upiUrl)}&size=200&margin=1`

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
            body {
              padding: 0;
              margin: 0;
              background: #ffffff;
            }
            .page-container {
              max-width: 100% !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              border-radius: 0 !important;
              box-shadow: none !important;
            }
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            .payment-section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="page-container">
          <div class="header-container">
            <div class="header-left">
              <img src="${logoUrl}" alt="Hetal Trading Company Logo" class="company-logo" />
              <div class="company-info">
                <h1>Hetal Trading Company</h1>
                <p>Industrial Chemical Procurement & Sales Ledger</p>
                <div class="report-badge">${title}</div>
              </div>
            </div>
            <div class="meta-box">
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

