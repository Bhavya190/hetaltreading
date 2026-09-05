'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Receipt,
  Printer,
  FileSpreadsheet,
  FileText,
  Share2,
  Loader2,
  Package,
  Calendar,
  TrendingUp,
  ShoppingBag,
} from 'lucide-react'
import {
  printSaleInvoice,
  exportSaleInvoiceExcel,
  shareSaleInvoiceWhatsApp,
  calculateBillGstTotals,
} from '@/lib/exportUtils'

export interface BillItemRecord {
  id: string
  productId?: string
  productName: string
  hsnCode?: string
  serialNumber?: string
  gstRate: string
  unit: string
  quantity: number
  unitPrice: number
  amount: number
  discount: number
  netTotal: number
}

export interface BillDetailRecord {
  id: string
  type: 'SALES' | 'PURCHASE'
  billNumber: string
  date: string
  customerName: string
  subtotal: number
  extraCharges: number
  grandTotal: number
  status: string
  items: BillItemRecord[]
}

export default function BillDetailPage() {
  const params = useParams()
  const billId = params?.id ? decodeURIComponent(params.id as string) : ''

  const [bill, setBill] = useState<BillDetailRecord | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchBillDetail = async () => {
    if (!billId) return
    try {
      setLoading(true)
      const res = await fetch(`/api/bills/${encodeURIComponent(billId)}`)
      const data = await res.json()
      if (data.success && data.data) {
        setBill({
          ...data.data,
          type: data.type || 'SALES',
        })
      } else {
        setBill(null)
      }
    } catch (err) {
      console.error('Error fetching bill detail:', err)
      setBill(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBillDetail()
  }, [billId])

  const handleExportPDF = () => {
    if (!bill) return
    printSaleInvoice({
      billNumber: bill.billNumber,
      date: bill.date,
      customerName: bill.customerName,
      subtotal: bill.subtotal || 0,
      extraCharges: bill.extraCharges || 0,
      grandTotal: bill.grandTotal || 0,
      items: bill.items || [],
    })
  }

  const handleExportExcel = () => {
    if (!bill) return
    exportSaleInvoiceExcel({
      billNumber: bill.billNumber,
      date: bill.date,
      customerName: bill.customerName,
      subtotal: bill.subtotal || 0,
      extraCharges: bill.extraCharges || 0,
      grandTotal: bill.grandTotal || 0,
      items: bill.items || [],
    })
  }

  const handlePrint = () => {
    if (!bill) return
    printSaleInvoice({
      billNumber: bill.billNumber,
      date: bill.date,
      customerName: bill.customerName,
      subtotal: bill.subtotal || 0,
      extraCharges: bill.extraCharges || 0,
      grandTotal: bill.grandTotal || 0,
      items: bill.items || [],
    })
  }

  const handleShareWhatsApp = () => {
    if (!bill) return
    shareSaleInvoiceWhatsApp({
      billNumber: bill.billNumber,
      date: bill.date,
      customerName: bill.customerName,
      subtotal: bill.subtotal || 0,
      extraCharges: bill.extraCharges || 0,
      grandTotal: bill.grandTotal || 0,
      items: bill.items || [],
    })
  }

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        <p className="text-sm font-semibold">Loading invoice bill details...</p>
      </div>
    )
  }

  if (!bill) {
    return (
      <div className="p-10 max-w-xl mx-auto text-center space-y-4">
        <div className="p-4 bg-rose-100 text-rose-800 rounded-2xl font-bold">
          Invoice Bill Record Not Found
        </div>
        <Link
          href="/admin/debt"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Bills Ledger</span>
        </Link>
      </div>
    )
  }

  // GST Calculation Breakdown
  const gstSummary = calculateBillGstTotals(bill.items || [], bill.extraCharges || 0)

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Navigation Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Link
          href="/admin/debt"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold text-xs bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-colors border border-slate-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Bills Ledger</span>
        </Link>

        {/* Invoice Action Bar */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-extrabold text-amber-700 uppercase tracking-wider px-2">Print / Export Bill:</span>
          <button
            onClick={handleExportPDF}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
            title="Export Bill to PDF"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
            title="Export Bill to Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
            title="Print Bill Invoice"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
          <button
            onClick={handleShareWhatsApp}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
            title="Share Invoice on WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>
        </div>
      </div>

      {/* Invoice Main Light Theme Banner Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
        {/* Header Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              {bill.type === 'SALES' ? (
                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-md uppercase">
                  <TrendingUp className="w-3 h-3 text-emerald-700" />
                  <span>SALES INVOICE</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-md uppercase">
                  <ShoppingBag className="w-3 h-3 text-amber-800" />
                  <span>PURCHASE INVOICE</span>
                </span>
              )}
              <div className="inline-flex items-center gap-1.5 text-blue-900 text-[11px] font-extrabold uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200 font-mono">
                <Receipt className="w-3.5 h-3.5 text-blue-700" />
                <span>INVOICE #: {bill.billNumber}</span>
              </div>
            </div>

            <h1 className="text-2xl font-extrabold text-slate-900 pt-1">{bill.customerName}</h1>

            <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-1 font-mono">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Date: {bill.date ? bill.date.split('T')[0] : ''}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-slate-400 font-medium">Status:</span>
                <span className="bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase">
                  {bill.status}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-200 text-right space-y-0.5 min-w-[220px]">
            <div className="text-emerald-800 font-bold uppercase text-[10px] tracking-wider">Grand Total Amount</div>
            <div className="font-mono font-black text-emerald-900 text-2xl">
              ₹ {gstSummary.calculatedGrandTotal.toFixed(2)}
            </div>
            <div className="text-[10px] text-emerald-700 font-semibold">Inclusive of all taxes & charges</div>
          </div>
        </div>

        {/* Product Line Items Table */}
        <div className="space-y-4">
          <h2 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Package className="w-4 h-4 text-slate-500" />
            <span>Product Line Items with Detailed GST Calculations ({gstSummary.processedItems.length})</span>
          </h2>

          {gstSummary.processedItems.length === 0 ? (
            <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
              No line items recorded for this bill.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-extrabold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3">Product Name</th>
                    <th className="py-3 px-3">HSN Code</th>
                    <th className="py-3 px-3">Qty</th>
                    <th className="py-3 px-3">Unit Price</th>
                    <th className="py-3 px-3">Discount</th>
                    <th className="py-3 px-3">Raw Taxable Amt</th>
                    <th className="py-3 px-3 text-center">GST Rate</th>
                    <th className="py-3 px-3">CGST Amt</th>
                    <th className="py-3 px-3">SGST Amt</th>
                    <th className="py-3 px-3 text-right">Net Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {gstSummary.processedItems.map((it) => (
                    <tr key={it.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900">{it.productName}</td>
                      <td className="py-3 px-3 font-mono text-slate-500">{it.hsnCode || it.serialNumber || '-'}</td>
                      <td className="py-3 px-3 font-bold text-amber-700">
                        {it.quantity} {it.unit || 'Kg'}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700">₹ {(it.unitPrice || 0).toLocaleString()}</td>
                      <td className="py-3 px-3 font-mono text-rose-600">₹ {(it.discount || 0).toLocaleString()}</td>
                      <td className="py-3 px-3 font-mono font-semibold text-slate-900">
                        ₹ {it.calc.rawAmount.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex flex-col items-center bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[10px]">
                          <span className="font-extrabold text-slate-900">{it.calc.gstRateNum}%</span>
                          <span className="text-[9px] text-slate-500">CGST {it.calc.cgstRate}% + SGST {it.calc.sgstRate}%</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-blue-700 font-semibold">
                        ₹ {it.calc.cgstAmount.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 font-mono text-blue-700 font-semibold">
                        ₹ {it.calc.sgstAmount.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 font-mono font-extrabold text-emerald-700 text-right">
                        ₹ {(it.netTotal || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Detailed GST Breakdown Summary Box */}
          <div className="flex justify-end pt-2">
            <div className="w-full sm:w-80 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs font-mono shadow-2xs">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-900 pb-1.5 border-b border-slate-200 flex items-center justify-between">
                <span>Tax Breakdown Summary</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Raw Subtotal (Taxable):</span>
                <span className="font-bold text-slate-900">₹ {gstSummary.totalRawAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-blue-700">
                <span>CGST Total:</span>
                <span className="font-bold text-blue-900">₹ {gstSummary.totalCgstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-blue-700">
                <span>SGST Total:</span>
                <span className="font-bold text-blue-900">₹ {gstSummary.totalSgstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Total GST Tax:</span>
                <span className="font-bold text-amber-800">₹ {gstSummary.totalGstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Extra Charges:</span>
                <span className="font-bold text-slate-900">₹ {(gstSummary.extraCharges || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-emerald-800 pt-2 border-t border-slate-200">
                <span>Grand Total:</span>
                <span>₹ {gstSummary.calculatedGrandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
