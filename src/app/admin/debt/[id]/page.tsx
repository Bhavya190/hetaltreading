'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
  Building,
} from 'lucide-react'
import ExportActionBar from '@/components/ExportActionBar'
import {
  printCustomerStatement,
  exportCustomerStatementExcel,
  shareCustomerStatementWhatsApp,
} from '@/lib/exportUtils'

export interface DebtTransactionRecord {
  id: string
  billNumber: string
  date: string
  itemsSummary: string
  billAmount: number
  paidAmount: number
  balanceAmount: number
  paymentStatus: 'PAID' | 'PARTIAL' | 'PENDING'
}

export interface DebtPaymentRecord {
  id: string
  deptAccountId: string
  date: string
  paymentType: 'CASH' | 'CHEQUE' | 'UPI' | 'BANK_TRANSFER'
  amount: number
  note?: string | null
  appliedBillNo?: string | null
  createdAt?: string
}

export interface DeptAccountRecord {
  id: string
  customerName: string
  mobileNumber: string
  billingAddress: string
  creditLimitDays: number
  totalDebtAmount: number
  totalPaidAmount: number
  balanceDue: number
  status: 'ACTIVE' | 'INACTIVE'
  transactions?: DebtTransactionRecord[]
  payments?: DebtPaymentRecord[]
}

export default function CustomerDebtDetailPage() {
  const params = useParams()
  const router = useRouter()
  const customerId = params?.id ? decodeURIComponent(params.id as string) : ''

  const [customer, setCustomer] = useState<DeptAccountRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Payment Receive Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [paymentType, setPaymentType] = useState<'CASH' | 'CHEQUE' | 'UPI' | 'BANK_TRANSFER'>('CASH')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentNote, setPaymentNote] = useState('')
  const [paymentTargetBillNo, setPaymentTargetBillNo] = useState('')

  // Add Debt Bill Modal State
  const [showAddBillModal, setShowAddBillModal] = useState(false)
  const [billNumber, setBillNumber] = useState('')
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0])
  const [itemsSummary, setItemsSummary] = useState('')
  const [billAmount, setBillAmount] = useState('')
  const [paidAmount, setPaidAmount] = useState('0')

  const fetchCustomerDetails = async () => {
    if (!customerId) return
    try {
      setLoading(true)
      const res = await fetch(`/api/dept-accounts/${encodeURIComponent(customerId)}`)
      const data = await res.json()
      if (data.success && data.data) {
        setCustomer(data.data)
      } else {
        setCustomer(null)
      }
    } catch (err) {
      console.error('Error fetching customer details:', err)
      setCustomer(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomerDetails()
  }, [customerId])

  // Submit Payment
  const handleReceivePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customer || !paymentAmount || parseFloat(paymentAmount) <= 0) return

    setSaving(true)
    try {
      const res = await fetch(`/api/dept-accounts/${encodeURIComponent(customer.id)}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: paymentDate,
          paymentType,
          amount: parseFloat(paymentAmount),
          note: paymentNote,
          targetBillNo: paymentTargetBillNo || undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setShowPaymentModal(false)
        setPaymentAmount('')
        setPaymentNote('')
        setPaymentTargetBillNo('')
        await fetchCustomerDetails()
      } else {
        alert(data.error || 'Failed to record payment')
      }
    } catch (err) {
      console.error('Error recording payment:', err)
      alert('Failed to record payment.')
    } finally {
      setSaving(false)
    }
  }

  // Submit Add Bill
  const handleAddBillSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customer || !billNumber || !itemsSummary || !billAmount) return

    setSaving(true)
    const amount = parseFloat(billAmount) || 0
    const paid = parseFloat(paidAmount) || 0

    try {
      const res = await fetch(`/api/dept-accounts/${encodeURIComponent(customer.id)}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billNumber,
          date: billDate,
          itemsSummary,
          billAmount: amount,
          paidAmount: paid,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setShowAddBillModal(false)
        setBillNumber('')
        setItemsSummary('')
        setBillAmount('')
        setPaidAmount('0')
        await fetchCustomerDetails()
      } else {
        alert(data.error || 'Failed to add bill transaction')
      }
    } catch (err) {
      console.error('Error adding bill transaction:', err)
      alert('Failed to add bill transaction.')
    } finally {
      setSaving(false)
    }
  }

  // Unified Statement Export Handlers
  const handleExportPDF = () => {
    if (!customer) return
    printCustomerStatement({
      customerName: customer.customerName,
      mobileNumber: customer.mobileNumber,
      billingAddress: customer.billingAddress,
      creditLimitDays: customer.creditLimitDays,
      totalDebtAmount: customer.totalDebtAmount || 0,
      totalPaidAmount: customer.totalPaidAmount || 0,
      balanceDue: customer.balanceDue || 0,
      transactions: customer.transactions || [],
      payments: customer.payments || [],
    })
  }

  const handleExportExcel = () => {
    if (!customer) return
    exportCustomerStatementExcel({
      customerName: customer.customerName,
      mobileNumber: customer.mobileNumber,
      billingAddress: customer.billingAddress,
      creditLimitDays: customer.creditLimitDays,
      totalDebtAmount: customer.totalDebtAmount || 0,
      totalPaidAmount: customer.totalPaidAmount || 0,
      balanceDue: customer.balanceDue || 0,
      transactions: customer.transactions || [],
      payments: customer.payments || [],
    })
  }

  const handlePrint = () => {
    if (!customer) return
    printCustomerStatement({
      customerName: customer.customerName,
      mobileNumber: customer.mobileNumber,
      billingAddress: customer.billingAddress,
      creditLimitDays: customer.creditLimitDays,
      totalDebtAmount: customer.totalDebtAmount || 0,
      totalPaidAmount: customer.totalPaidAmount || 0,
      balanceDue: customer.balanceDue || 0,
      transactions: customer.transactions || [],
      payments: customer.payments || [],
    })
  }

  const handleShareWhatsApp = () => {
    if (!customer) return
    shareCustomerStatementWhatsApp({
      customerName: customer.customerName,
      mobileNumber: customer.mobileNumber,
      billingAddress: customer.billingAddress,
      creditLimitDays: customer.creditLimitDays,
      totalDebtAmount: customer.totalDebtAmount || 0,
      totalPaidAmount: customer.totalPaidAmount || 0,
      balanceDue: customer.balanceDue || 0,
      transactions: customer.transactions || [],
      payments: customer.payments || [],
    })
  }

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        <p className="text-sm font-semibold">Loading customer ledger statement...</p>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="p-10 max-w-xl mx-auto text-center space-y-4">
        <div className="p-4 bg-rose-100 text-rose-800 rounded-2xl font-bold">
          Customer Debt Account Not Found
        </div>
        <Link
          href="/admin/debt"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Debtors Ledger</span>
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Link
          href="/admin/debt"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold text-xs bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Debtors Ledger</span>
        </Link>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => setShowPaymentModal(true)}
            className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-colors flex items-center gap-1.5"
          >
            <Wallet className="w-4 h-4" />
            <span>+ Receive Payment</span>
          </button>

          <button
            onClick={() => setShowAddBillModal(true)}
            className="btn-gold px-4 py-2 text-xs font-bold shadow-md flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Debt Bill / Sale</span>
          </button>
        </div>
      </div>

      {/* Customer Information Card */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-amber-400 text-[10px] font-extrabold uppercase tracking-wider bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              <span>Account ID: {customer.id}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white">{customer.customerName}</h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
              <div className="flex items-center gap-1 font-mono">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>{customer.mobileNumber}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Credit Terms: {customer.creditLimitDays} Days</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{customer.billingAddress}</span>
              </div>
            </div>
          </div>

          {/* Export Action Bar (Unified Statement Export) */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/80">
            <span className="text-[11px] font-extrabold text-amber-400 uppercase tracking-wider px-1">Statement Export:</span>
            <button
              onClick={handleExportPDF}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
              title="Export Full PDF Statement"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
              title="Export Full Excel Statement"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
              title="Print Customer Statement"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
              title="Share Statement on WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Financial Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 text-xs">
          <div className="bg-slate-800/90 p-4 rounded-xl border border-slate-700 space-y-1">
            <div className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Total Credit Billed</div>
            <div className="font-mono font-extrabold text-white text-xl">
              ₹ {(customer.totalDebtAmount || 0).toLocaleString()}
            </div>
          </div>

          <div className="bg-emerald-950/50 p-4 rounded-xl border border-emerald-800/80 space-y-1">
            <div className="text-emerald-400 font-bold uppercase text-[10px] tracking-wider">Total Received Payments</div>
            <div className="font-mono font-extrabold text-emerald-400 text-xl">
              ₹ {(customer.totalPaidAmount || 0).toLocaleString()}
            </div>
          </div>

          <div className="bg-rose-950/50 p-4 rounded-xl border border-rose-800/80 space-y-1">
            <div className="text-rose-400 font-bold uppercase text-[10px] tracking-wider">Outstanding Udhaar Balance Due</div>
            <div className="font-mono font-extrabold text-rose-400 text-xl">
              ₹ {(customer.balanceDue || 0).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: Debt Bills & Invoices Issued */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm space-y-3 p-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-700" />
            <span>1. Debt Bills & Invoices Issued ({customer.transactions?.length || 0})</span>
          </h2>
          <button
            onClick={() => setShowAddBillModal(true)}
            className="btn-gold py-1.5 px-3 text-xs font-bold shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Debt Bill</span>
          </button>
        </div>

        {!customer.transactions || customer.transactions.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <Receipt className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="font-bold text-slate-800">No Debt Invoices Issued Yet</div>
            <p className="text-xs text-slate-500">
              Click <strong>"Add Debt Bill"</strong> to record credit sales for this customer.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Bill No.</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Product / Items Summary</th>
                  <th className="py-3 px-4">Bill Total</th>
                  <th className="py-3 px-4">Paid Amount</th>
                  <th className="py-3 px-4">Balance Due</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {customer.transactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-900">{txn.billNumber}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono">{txn.date ? txn.date.split('T')[0] : ''}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{txn.itemsSummary}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      ₹ {(txn.billAmount || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-700 font-bold">
                      ₹ {(txn.paidAmount || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-rose-700">
                      ₹ {(txn.balanceAmount || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {txn.paymentStatus === 'PAID' && (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-300">
                          PAID
                        </span>
                      )}
                      {txn.paymentStatus === 'PARTIAL' && (
                        <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-300">
                          PARTIAL
                        </span>
                      )}
                      {txn.paymentStatus === 'PENDING' && (
                        <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-rose-300">
                          PENDING
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 2: Payment Received History Logs */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm space-y-3 p-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-700" />
            <span>2. Received Payment History Logs ({customer.payments?.length || 0})</span>
          </h2>
          <button
            onClick={() => setShowPaymentModal(true)}
            className="bg-emerald-700 hover:bg-emerald-800 text-white py-1.5 px-3 text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>+ Record Received Payment</span>
          </button>
        </div>

        {!customer.payments || customer.payments.length === 0 ? (
          <div className="p-8 text-center bg-emerald-50/50 rounded-xl border border-emerald-200/80 space-y-2">
            <Wallet className="w-8 h-8 text-emerald-400 mx-auto" />
            <div className="font-bold text-slate-800">No Received Payment Logs Recorded Yet</div>
            <p className="text-xs text-slate-500">
              Click <strong>"+ Record Received Payment"</strong> to log cash, cheque, UPI, or bank transfer payments.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Payment Type</th>
                  <th className="py-3 px-4">Amount Received</th>
                  <th className="py-3 px-4">Bill Reduction Details</th>
                  <th className="py-3 px-4">Summary / Extra Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {customer.payments.map((p) => {
                  const dateStr = p.date ? new Date(p.date).toISOString().split('T')[0] : ''
                  const payTypeLabel =
                    p.paymentType === 'CASH'
                      ? 'Cash'
                      : p.paymentType === 'CHEQUE'
                      ? 'Cheque'
                      : p.paymentType === 'UPI'
                      ? 'UPI'
                      : 'Bank Transfer'

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-700 font-semibold">{dateStr}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 font-bold text-[10px] px-2.5 py-0.5 rounded-full ${
                          p.paymentType === 'CASH'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : p.paymentType === 'CHEQUE'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : p.paymentType === 'UPI'
                            ? 'bg-purple-100 text-purple-800 border border-purple-300'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}>
                          {payTypeLabel}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-extrabold text-emerald-700 text-sm">
                        ₹ {(p.amount || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {p.appliedBillNo ? (
                          <span className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-md text-slate-700 border border-slate-200">
                            <Receipt className="w-3 h-3 text-amber-700 shrink-0" />
                            <span>{p.appliedBillNo}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 font-italic">General Account Credit</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {p.note || '-'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: PAYMENT RECEIVE FORM */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Payment Receive Form</h3>
                  <p className="text-[11px] text-slate-500">Record payment received for {customer.customerName}</p>
                </div>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReceivePaymentSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                {/* 1. Date */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    1. Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600 font-mono"
                  />
                </div>

                {/* 2. Customer Name (Disabled display) */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    2. Customer Name
                  </label>
                  <input
                    type="text"
                    disabled
                    value={customer.customerName}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-700 bg-slate-100 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* 3. Payment Type Select */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    3. Payment Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600 bg-white font-medium"
                  >
                    <option value="CASH">Cash</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="UPI">UPI</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </select>
                </div>

                {/* 4. Amount Received */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    4. Amount Received (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="1"
                    placeholder="e.g. 15000"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600 font-mono font-bold text-emerald-700"
                  />
                </div>
              </div>

              {/* Target Bill (Optional) */}
              {customer.transactions && customer.transactions.length > 0 && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Target Bill to Reduce Balance (Optional)
                  </label>
                  <select
                    value={paymentTargetBillNo}
                    onChange={(e) => setPaymentTargetBillNo(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600 bg-white font-medium"
                  >
                    <option value="">Auto-allocate across oldest unpaid bills (FIFO)</option>
                    {customer.transactions
                      .filter((t) => t.balanceAmount > 0 || t.paymentStatus !== 'PAID')
                      .map((t) => (
                        <option key={t.id} value={t.billNumber}>
                          Bill #{t.billNumber} ({t.date ? t.date.split('T')[0] : ''}) - Balance Due: ₹{t.balanceAmount.toLocaleString()}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* 5. Summary / Extra Note */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  5. Summary / Extra Note
                </label>
                <textarea
                  rows={2}
                  placeholder="Enter transaction reference, cheque no., or note..."
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600 resize-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-100">
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
                  className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2 rounded-xl font-bold shadow-md transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Confirm & Receive Payment</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Debt Bill Transaction */}
      {showAddBillModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <h3 className="font-extrabold text-base text-slate-900">Add Debt Bill / Sale</h3>
                <p className="text-[11px] text-slate-500">Record products given on debt to {customer.customerName}.</p>
              </div>
              <button onClick={() => setShowAddBillModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBillSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Bill / Invoice No. <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. INV-2026-101"
                    value={billNumber}
                    onChange={(e) => setBillNumber(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={billDate}
                    onChange={(e) => setBillDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Product / Items Given on Debt <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. 500 Kg Refined Hydrated Lime @ ₹55/Kg"
                  value={itemsSummary}
                  onChange={(e) => setItemsSummary(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-600 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Total Bill Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0"
                    placeholder="e.g. 27500"
                    value={billAmount}
                    onChange={(e) => setBillAmount(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amount Paid Upfront (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-600 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-100">
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
                  className="btn-gold px-5 py-2 shadow-sm font-bold flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save Bill</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
