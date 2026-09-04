'use client'

import React, { useState, useEffect } from 'react'
import { FileText, FileSpreadsheet, Printer, Share2, QrCode, Landmark, Check, X, RotateCcw } from 'lucide-react'
import {
  exportToExcel,
  exportToPDF,
  printReport,
  shareOnWhatsApp,
  getSavedBankDetails,
  saveBankDetails,
  DEFAULT_BANK_DETAILS,
  BankDetails,
} from '@/lib/exportUtils'

interface ExportActionBarProps {
  title?: string
  filename?: string
  excelHeaders?: { label: string; key: string }[]
  pdfHeaders?: string[]
  pdfRows?: (string | number)[][]
  data?: any[]
  whatsAppMessage?: string
  onExportPDF?: () => void
  onExportExcel?: () => void
  onPrint?: () => void
  onShareWhatsApp?: () => void
  onPDF?: () => void
  onExcel?: () => void
  selectedCount?: number
  className?: string
}

export default function ExportActionBar({
  title = 'Report',
  filename = 'Report',
  excelHeaders,
  pdfHeaders,
  pdfRows,
  data = [],
  whatsAppMessage,
  onExportPDF,
  onExportExcel,
  onPrint,
  onShareWhatsApp,
  onPDF,
  onExcel,
  selectedCount = 0,
  className = '',
}: ExportActionBarProps) {
  const [isBankModalOpen, setIsBankModalOpen] = useState(false)
  const [bankDetails, setBankDetails] = useState<BankDetails>(DEFAULT_BANK_DETAILS)
  const [savedSuccess, setSavedSuccess] = useState(false)

  useEffect(() => {
    setBankDetails(getSavedBankDetails())
  }, [])

  const handleSaveBankDetails = (e: React.FormEvent) => {
    e.preventDefault()
    saveBankDetails(bankDetails)
    setSavedSuccess(true)
    setTimeout(() => {
      setSavedSuccess(false)
      setIsBankModalOpen(false)
    }, 800)
  }

  const handleResetDefaults = () => {
    setBankDetails(DEFAULT_BANK_DETAILS)
    saveBankDetails(DEFAULT_BANK_DETAILS)
  }

  const handleExcel = () => {
    if (onExportExcel) {
      onExportExcel()
    } else if (onExcel) {
      onExcel()
    } else if (filename && excelHeaders && data) {
      exportToExcel(filename, excelHeaders, data)
    }
  }

  const handlePDF = () => {
    if (onExportPDF) {
      onExportPDF()
    } else if (onPDF) {
      onPDF()
    } else if (title && pdfHeaders && pdfRows) {
      exportToPDF({ title, headers: pdfHeaders, data: pdfRows, bankDetails })
    }
  }

  const handlePrint = () => {
    if (onPrint) {
      onPrint()
    } else if (title && pdfHeaders && pdfRows) {
      printReport({ title, headers: pdfHeaders, data: pdfRows, bankDetails })
    }
  }

  const handleWhatsApp = () => {
    if (onShareWhatsApp) {
      onShareWhatsApp()
    } else if (whatsAppMessage) {
      shareOnWhatsApp(whatsAppMessage)
    } else {
      const summaryMsg = `*Hetal Trading Company - ${title} Report*\n📅 Date: ${new Date().toLocaleDateString('en-IN')}\n📊 Total Entries: ${data.length}\n\nCheck report details in the admin portal.`
      shareOnWhatsApp(summaryMsg)
    }
  }

  const countBadge = selectedCount > 0 ? ` (${selectedCount})` : ''

  return (
    <>
      <div className={`flex flex-wrap items-center gap-2 ${className}`}>
        {/* Export PDF Button */}
        <button
          type="button"
          onClick={handlePDF}
          className="inline-flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xs transition-colors"
          title={selectedCount > 0 ? `Export ${selectedCount} selected items to PDF` : 'Export Report to PDF'}
        >
          <FileText className="w-3.5 h-3.5 text-rose-600" />
          <span>Export PDF{countBadge}</span>
        </button>

        {/* Export Excel Button */}
        <button
          type="button"
          onClick={handleExcel}
          className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xs transition-colors"
          title={selectedCount > 0 ? `Export ${selectedCount} selected items to Excel` : 'Export Report to Excel'}
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
          <span>Export Excel{countBadge}</span>
        </button>

        {/* Print Button */}
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xs transition-colors"
          title={selectedCount > 0 ? `Print ${selectedCount} selected items` : 'Print Report'}
        >
          <Printer className="w-3.5 h-3.5 text-slate-700" />
          <span>Print{countBadge}</span>
        </button>

        {/* Share WhatsApp Button */}
        <button
          type="button"
          onClick={handleWhatsApp}
          className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xs transition-colors"
          title={selectedCount > 0 ? `Share ${selectedCount} selected items on WhatsApp` : 'Share Summary on WhatsApp'}
        >
          <Share2 className="w-3.5 h-3.5 text-white" />
          <span>Share WhatsApp{countBadge}</span>
        </button>

        {/* Owner Payment & Bank Details Settings Button */}
        <button
          type="button"
          onClick={() => {
            setBankDetails(getSavedBankDetails())
            setIsBankModalOpen(true)
          }}
          className="inline-flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xs transition-colors"
          title="Edit Owner Bank Transfer Details & UPI QR Code for Exports"
        >
          <QrCode className="w-3.5 h-3.5 text-amber-700" />
          <span>Bank Details</span>
        </button>
      </div>

      {/* Bank & Payment Details Owner Modal */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-gradient-to-r from-amber-700 to-amber-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-600/50 rounded-xl">
                  <Landmark className="w-5 h-5 text-amber-200" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Owner Bank & UPI Payment Details</h3>
                  <p className="text-xs text-amber-200">Appears on PDF exports & printouts for customer payments</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBankModalOpen(false)}
                className="text-amber-200 hover:text-white p-1 rounded-lg hover:bg-amber-800/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBankDetails} className="p-5 overflow-y-auto space-y-4 text-xs">
              {savedSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 font-semibold">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Bank details saved successfully for all exports!</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Account Holder Name *</label>
                  <input
                    type="text"
                    required
                    value={bankDetails.accountName}
                    onChange={(e) => setBankDetails({ ...bankDetails, accountName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    placeholder="e.g. Hetal Trading Company"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Bank Name *</label>
                  <input
                    type="text"
                    required
                    value={bankDetails.bankName}
                    onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    placeholder="e.g. HDFC Bank"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Account Number *</label>
                  <input
                    type="text"
                    required
                    value={bankDetails.accountNumber}
                    onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    placeholder="e.g. 50200012345678"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">IFSC Code *</label>
                  <input
                    type="text"
                    required
                    value={bankDetails.ifscCode}
                    onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono uppercase font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    placeholder="e.g. HDFC0001234"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Branch Name *</label>
                  <input
                    type="text"
                    required
                    value={bankDetails.branch}
                    onChange={(e) => setBankDetails({ ...bankDetails, branch: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    placeholder="e.g. Gota Branch, Ahmedabad"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">UPI ID * (For QR Code)</label>
                  <input
                    type="text"
                    required
                    value={bankDetails.upiId}
                    onChange={(e) => setBankDetails({ ...bankDetails, upiId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    placeholder="e.g. hetaltrading@upi"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Payment Instructions / Customer Note</label>
                <textarea
                  rows={2}
                  value={bankDetails.note || ''}
                  onChange={(e) => setBankDetails({ ...bankDetails, note: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  placeholder="e.g. Please share transaction reference / screenshot after payment transfer."
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-bold text-xs py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Defaults</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsBankModalOpen(false)}
                    className="px-4 py-2 text-slate-600 hover:text-slate-900 font-bold text-xs rounded-xl transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-md transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Payment Info</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

