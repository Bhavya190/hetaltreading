'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Phone,
  Clock,
  MapPin,
  Receipt,
  Wallet,
  Plus,
  Loader2,
  X,
  Share2,
  Printer,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertCircle,
  Building2,
} from 'lucide-react'
import ExportActionBar from '@/components/ExportActionBar'
import { exportToExcel, printReport, exportToPDF, shareOnWhatsApp } from '@/lib/exportUtils'

export interface VendorDebtTransactionRecord {
  id: string
  billNumber: string
  date: string
  itemsSummary: string
  billAmount: number
  paidAmount: number
  balanceAmount: number
  paymentStatus: 'PAID' | 'PARTIAL' | 'PENDING'
}

export interface VendorDebtPaymentRecord {
  id: string
  vendorAccountId: string
  date: string
  paymentType: 'CASH' | 'CHEQUE' | 'UPI' | 'BANK_TRANSFER'
  amount: number
  note?: string | null
  appliedBillNo?: string | null
}

export interface VendorAccountRecord {
  id: string
  vendorName: string
  vendorCode: string
  contactPerson?: string
  phone: string
  city: string
  totalDebtAmount: number
  totalPaidAmount: number
  balanceDue: number
  status: 'ACTIVE' | 'INACTIVE'
  transactions?: VendorDebtTransactionRecord[]
  payments?: VendorDebtPaymentRecord[]
}

export default function VendorDebtDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const vendorId = resolvedParams.id
  const router = useRouter()

  const [account, setAccount] = useState<VendorAccountRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'bills' | 'payments'>('bills')

  // Payment Form Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const todayStr = new Date().toISOString().split('T')[0]
  const [paymentDate, setPaymentDate] = useState(todayStr)
  const [paymentType, setPaymentType] = useState<'CASH' | 'CHEQUE' | 'UPI' | 'BANK_TRANSFER'>('CASH')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentNote, setPaymentNote] = useState('')
  const [paymentTargetBillNo, setPaymentTargetBillNo] = useState('')

  // Add Bill Modal State
  const [showAddBillModal, setShowAddBillModal] = useState(false)
  const [newBillNumber, setNewBillNumber] = useState('')
  const [newBillDate, setNewBillDate] = useState(todayStr)
  const [newItemsSummary, setNewItemsSummary] = useState('')
  const [newBillAmount, setNewBillAmount] = useState('')
  const [newInitialPaid, setNewInitialPaid] = useState('')

  const fetchVendorDetails = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/vendor-accounts/${vendorId}`)
      const data = await res.json()
      if (data.success && data.data) {
        setAccount(data.data)
      }
    } catch (err) {
      console.error('Error fetching vendor details:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (vendorId) fetchVendorDetails()
  }, [vendorId])

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = Math.round(parseFloat(paymentAmount) || 0)
    if (amt <= 0) {
      alert('Please enter a valid payment amount')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/vendor-accounts/${vendorId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: paymentDate,
          paymentType,
          amount: amt,
          note: paymentNote,
          appliedBillNo: paymentTargetBillNo || null,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setShowPaymentModal(false)
        fetchVendorDetails()
        setPaymentAmount('')
        setPaymentNote('')
        setPaymentTargetBillNo('')
      } else {
        alert(data.error || 'Failed to record vendor payment')
      }
    } catch (err) {
      console.error('Error recording vendor payment:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleAddPurchaseBill = async (e: React.FormEvent) => {
    e.preventDefault()
    const bAmt = Math.round(parseFloat(newBillAmount) || 0)
    if (!newBillNumber || bAmt <= 0) {
      alert('Please enter a valid Bill Number and Amount')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/vendor-accounts/${vendorId}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billNumber: newBillNumber,
          date: newBillDate,
          itemsSummary: newItemsSummary || 'Purchase Entry',
          billAmount: bAmt,
          initialPaid: Math.round(parseFloat(newInitialPaid) || 0),
        }),
      })

      const data = await res.json()
      if (data.success) {
        setShowAddBillModal(false)
        fetchVendorDetails()
        setNewBillNumber('')
        setNewItemsSummary('')
        setNewBillAmount('')
        setNewInitialPaid('')
      } else {
        alert(data.error || 'Failed to add purchase bill')
      }
    } catch (err) {
      console.error('Error adding purchase bill:', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        <p className="text-sm font-bold text-slate-600">Loading Vendor Account Ledger...</p>
      </div>
    )
  }

  if (!account) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4 text-center">
        <Building2 className="w-12 h-12 text-slate-300" />
        <h2 className="text-xl font-bold text-slate-800">Vendor Account Not Found</h2>
        <Link
          href="/admin/vendor-debt"
          className="px-4 py-2 bg-amber-600 text-white font-bold text-xs rounded-xl hover:bg-amber-700 transition-colors"
        >
          Return to Vendor Accounts
        </Link>
      </div>
    )
  }

  const handleExportExcel = () => {
    exportToExcel({
      filename: `Vendor_Statement_${account.vendorCode}`,
      headers: ['Bill #', 'Date', 'Items Summary', 'Bill Amount', 'Paid Amount', 'Balance Due', 'Status'],
      rows: (account.transactions || []).map((t) => [
        t.billNumber,
        new Date(t.date).toLocaleDateString(),
        t.itemsSummary,
        t.billAmount,
        t.paidAmount,
        t.balanceAmount,
        t.paymentStatus,
      ]),
    })
  }

  const handlePrint = () => {
    printReport({
      title: `Vendor Statement - ${account.vendorName}`,
      headers: ['Bill #', 'Date', 'Items Summary', 'Bill Amount', 'Paid Amount', 'Balance Due', 'Status'],
      data: (account.transactions || []).map((t) => [
        t.billNumber,
        new Date(t.date).toLocaleDateString(),
        t.itemsSummary,
        `₹ ${Math.round(t.billAmount).toLocaleString()}`,
        `₹ ${Math.round(t.paidAmount).toLocaleString()}`,
        `₹ ${Math.round(t.balanceAmount).toLocaleString()}`,
        t.paymentStatus,
      ]),
    })
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/vendor-debt"
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Vendor Accounts</span>
        </Link>

        <ExportActionBar
          title={`Vendor Statement - ${account.vendorName}`}
          onExportExcel={handleExportExcel}
          onExportPDF={handleExportExcel}
          onPrint={handlePrint}
          onShareWhatsApp={() => shareOnWhatsApp(`Vendor Statement for ${account.vendorName}: Net Payable Balance ₹${Math.round(account.balanceDue)}`)}
        />
      </div>

      {/* Header Info Card */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 font-mono text-xs font-bold rounded-lg border border-amber-500/30">
              #{account.vendorCode}
            </span>
            <span className="px-2.5 py-1 bg-slate-800 text-slate-300 text-xs font-bold rounded-lg">
              {account.status}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {account.vendorName}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 font-medium pt-1">
            {account.contactPerson && (
              <div className="flex items-center gap-1.5 font-semibold text-amber-300">
                <span>Contact: {account.contactPerson}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>{account.phone || 'No Phone Registered'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>{account.city || 'City N/A'}</span>
            </div>
          </div>
        </div>

        {/* Balance Card */}
        <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15 min-w-[240px] text-right space-y-1 relative z-10">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300">
            NET BALANCE PAYABLE
          </div>
          <div className="text-3xl font-black font-mono text-amber-300">
            ₹{Math.round(account.balanceDue).toLocaleString()}
          </div>
          <div className="text-xs text-slate-300 font-medium pt-1">
            Purchases: ₹{Math.round(account.totalDebtAmount).toLocaleString()} | Paid: ₹{Math.round(account.totalPaidAmount).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Tabs & Quick Action Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('bills')}
            className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all ${
              activeTab === 'bills'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Purchase Bills ({account.transactions?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all ${
              activeTab === 'payments'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Installment Payments ({account.payments?.length || 0})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPaymentModal(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl flex items-center gap-2 shadow-xs transition-all active:scale-98 cursor-pointer"
          >
            <Wallet className="w-4 h-4" />
            <span>+ Record Vendor Payment</span>
          </button>

          <button
            onClick={() => setShowAddBillModal(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold rounded-xl flex items-center gap-2 shadow-xs transition-all active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Purchase Bill</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {activeTab === 'bills' ? (
          <div>
            {!account.transactions || account.transactions.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <Receipt className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-base font-bold text-slate-700">No Purchase Bills Recorded</p>
                <p className="text-xs">Click "+ Add Purchase Bill" to log a purchase order on debt.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="bg-slate-50 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                    <tr>
                      <th className="py-3.5 px-4">PO / BILL #</th>
                      <th className="py-3.5 px-4">DATE</th>
                      <th className="py-3.5 px-4">ITEMS SUMMARY</th>
                      <th className="py-3.5 px-4 text-right">BILL AMOUNT (₹)</th>
                      <th className="py-3.5 px-4 text-right">PAID (₹)</th>
                      <th className="py-3.5 px-4 text-right">BALANCE (₹)</th>
                      <th className="py-3.5 px-4 text-center">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {account.transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          #{t.billNumber}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500">
                          {new Date(t.date).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-slate-800 text-xs font-semibold">
                          {t.itemsSummary}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                          ₹{Math.round(t.billAmount).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600">
                          ₹{Math.round(t.paidAmount).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-extrabold text-rose-600">
                          ₹{Math.round(t.balanceAmount).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`px-2.5 py-1 text-[11px] font-extrabold rounded-full inline-block border ${
                              t.paymentStatus === 'PAID'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : t.paymentStatus === 'PARTIAL'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {t.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div>
            {!account.payments || account.payments.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <Wallet className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-base font-bold text-slate-700">No Installment Payments Logged</p>
                <p className="text-xs">Record payment installments made to this vendor.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="bg-emerald-50/50 text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 border-b border-emerald-200/80">
                    <tr>
                      <th className="py-3.5 px-4">PAYMENT DATE</th>
                      <th className="py-3.5 px-4">METHOD</th>
                      <th className="py-3.5 px-4">TARGET PO / BILL</th>
                      <th className="py-3.5 px-4">NOTE / REF NO</th>
                      <th className="py-3.5 px-4 text-right">AMOUNT PAID (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {account.payments.map((p) => (
                      <tr key={p.id} className="hover:bg-emerald-50/20 transition-colors">
                        <td className="py-3.5 px-4 text-xs font-semibold text-slate-900">
                          {new Date(p.date).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-emerald-800 text-xs">
                          {p.paymentType}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-700">
                          {p.appliedBillNo || 'Auto (FIFO)'}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600">
                          {p.note || '-'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-600 text-base">
                          +₹{Math.round(p.amount).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Record Payment to Vendor</h3>
                  <p className="text-xs text-slate-500 font-medium">Vendor: {account.vendorName}</p>
                </div>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-4 text-xs font-bold text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">DATE *</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1">PAYMENT METHOD *</label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 bg-white"
                  >
                    <option value="CASH">Cash</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="UPI">UPI</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-1">AMOUNT PAID TO VENDOR (₹) *</label>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold text-slate-900 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">TARGET PURCHASE BILL (OPTIONAL)</label>
                <input
                  type="text"
                  placeholder="e.g. PO-2026-001 (Leave blank for FIFO)"
                  value={paymentTargetBillNo}
                  onChange={(e) => setPaymentTargetBillNo(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block mb-1">SUMMARY / CHEQUE NO / NOTE</label>
                <input
                  type="text"
                  placeholder="e.g. Paid cash installment"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 bg-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Purchase Bill Modal */}
      {showAddBillModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">
                Add Purchase Bill for {account.vendorName}
              </h3>
              <button onClick={() => setShowAddBillModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPurchaseBill} className="space-y-4 text-xs font-bold text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">BILL / PO NUMBER *</label>
                  <input
                    type="text"
                    placeholder="e.g. PO-2026-001"
                    value={newBillNumber}
                    onChange={(e) => setNewBillNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold text-slate-900 bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1">DATE *</label>
                  <input
                    type="date"
                    value={newBillDate}
                    onChange={(e) => setNewBillDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1">ITEMS SUMMARY</label>
                <input
                  type="text"
                  placeholder="e.g. Hydrated Lime (x50 Bags)"
                  value={newItemsSummary}
                  onChange={(e) => setNewItemsSummary(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">BILL AMOUNT (₹) *</label>
                  <input
                    type="number"
                    placeholder="e.g. 25000"
                    value={newBillAmount}
                    onChange={(e) => setNewBillAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold text-slate-900 bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1">INITIAL PAID (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 5000"
                    value={newInitialPaid}
                    onChange={(e) => setNewInitialPaid(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold text-slate-900 bg-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddBillModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs disabled:opacity-50"
                >
                  {saving ? 'Adding...' : 'Add Bill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
