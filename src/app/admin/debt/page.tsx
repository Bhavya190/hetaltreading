'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  Plus,
  Search,
  Phone,
  MapPin,
  Clock,
  X,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Clock3,
  DollarSign,
  TrendingDown,
  ChevronRight,
  Loader2,
  FileText,
  Pencil,
  Trash2,
  Share2,
  Wallet,
  CreditCard,
  Building,
  Calendar,
} from 'lucide-react'
import ExportActionBar from '@/components/ExportActionBar'
import DateRangeFilter, { DateFilterMode, filterRecordsByDate } from '@/components/DateRangeFilter'
import { exportToExcel, printReport, exportToPDF, shareOnWhatsApp } from '@/lib/exportUtils'

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

export default function DebtPage() {
  const [deptAccounts, setDeptAccounts] = useState<DeptAccountRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Date Filter States
  const todayStr = new Date().toISOString().split('T')[0]
  const [dateFilterMode, setDateFilterMode] = useState<DateFilterMode>('ALL')
  const [startDate, setStartDate] = useState(todayStr)
  const [endDate, setEndDate] = useState(todayStr)

  // Customer Drill-down Tab State: 'bills' | 'payments'
  const [activeTab, setActiveTab] = useState<'bills' | 'payments'>('bills')

  // Modals
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false)
  const [editingAccount, setEditingAccount] = useState<DeptAccountRecord | null>(null)
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<DeptAccountRecord | null>(null)
  const [showAddBillModal, setShowAddBillModal] = useState(false)

  // Payment Receive Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentCustomerId, setPaymentCustomerId] = useState('')
  const [paymentDate, setPaymentDate] = useState(todayStr)
  const [paymentType, setPaymentType] = useState<'CASH' | 'CHEQUE' | 'UPI' | 'BANK_TRANSFER'>('CASH')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentNote, setPaymentNote] = useState('')
  const [paymentTargetBillNo, setPaymentTargetBillNo] = useState('')

  // Register Customer Form State
  const [customerName, setCustomerName] = useState('')
  const [mobileNumber, setMobileNumber] = useState('')
  const [billingAddress, setBillingAddress] = useState('')
  const [creditLimitDays, setCreditLimitDays] = useState('30')

  // Add Bill Form State
  const [billNumber, setBillNumber] = useState('')
  const [billDate, setBillDate] = useState(todayStr)
  const [itemsSummary, setItemsSummary] = useState('')
  const [billAmount, setBillAmount] = useState('')
  const [paidAmount, setPaidAmount] = useState('0')

  const fetchDeptAccounts = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/dept-accounts')
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setDeptAccounts(data.data)
        // If customer is selected, update selectedCustomer with fresh data
        if (selectedCustomer) {
          const fresh = data.data.find((a: DeptAccountRecord) => a.id === selectedCustomer.id)
          if (fresh) setSelectedCustomer(fresh)
        }
      } else {
        setDeptAccounts([])
      }
    } catch (err) {
      console.error('Failed to fetch Dept accounts:', err)
      setDeptAccounts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDeptAccounts()
  }, [])

  // Open Payment Receive Modal for specific customer or general
  const handleOpenPaymentModal = (cust?: DeptAccountRecord) => {
    const targetId = cust ? cust.id : deptAccounts[0]?.id || ''
    setPaymentCustomerId(targetId)
    setPaymentDate(todayStr)
    setPaymentType('CASH')
    setPaymentAmount('')
    setPaymentNote('')
    setPaymentTargetBillNo('')
    setShowPaymentModal(true)
  }

  // Register New Debt Customer Account
  const handleRegisterCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerName || !mobileNumber || !billingAddress) return

    setSaving(true)
    const parsedDays = creditLimitDays !== '' ? parseInt(creditLimitDays, 10) : 30
    const finalDays = isNaN(parsedDays) ? 30 : parsedDays

    const payload = {
      customerName,
      mobileNumber,
      billingAddress,
      creditLimitDays: finalDays,
    }

    try {
      const res = await fetch('/api/dept-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (data.success && data.data) {
        setDeptAccounts([data.data, ...deptAccounts])
      } else {
        await fetchDeptAccounts()
      }
    } catch (err) {
      console.error('Error creating Dept customer account:', err)
      await fetchDeptAccounts()
    } finally {
      setSaving(false)
      setShowAddCustomerModal(false)
      setCustomerName('')
      setMobileNumber('')
      setBillingAddress('')
      setCreditLimitDays('30')
    }
  }

  // Record Received Payment
  const handleReceivePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!paymentCustomerId || !paymentAmount || parseFloat(paymentAmount) <= 0) return

    setSaving(true)
    try {
      const res = await fetch(`/api/dept-accounts/${paymentCustomerId}/payments`, {
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
        await fetchDeptAccounts()
        // Switch view to payments log tab if customer drilldown is open
        setActiveTab('payments')
      } else {
        alert(data.error || 'Failed to record payment')
      }
    } catch (err) {
      console.error('Error submitting payment:', err)
      alert('An error occurred while submitting the payment.')
    } finally {
      setSaving(false)
    }
  }

  // Add Debt Bill Transaction
  const handleAddBill = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomer) return
    setSaving(true)
    const amount = parseFloat(billAmount) || 0
    const paid = parseFloat(paidAmount) || 0
    const newTxn: DebtTransactionRecord = {
      id: `TXN-${Date.now()}`,
      billNumber,
      date: billDate,
      itemsSummary,
      billAmount: amount,
      paidAmount: paid,
      balanceAmount: amount - paid,
      paymentStatus: (amount - paid) === 0 ? 'PAID' : (paid > 0 ? 'PARTIAL' : 'PENDING')
    }
    const updatedAccounts = deptAccounts.map(acc => {
      if (acc.id === selectedCustomer.id) {
        return {
          ...acc,
          transactions: [...(acc.transactions || []), newTxn],
          totalDebtAmount: (acc.totalDebtAmount || 0) + amount,
          totalPaidAmount: (acc.totalPaidAmount || 0) + paid,
          balanceDue: (acc.balanceDue || 0) + (amount - paid)
        }
      }
      return acc
    })
    setDeptAccounts(updatedAccounts)
    setSelectedCustomer(updatedAccounts.find(a => a.id === selectedCustomer.id) || null)
    setSaving(false)
    setShowAddBillModal(false)
    setBillNumber('')
    setItemsSummary('')
    setBillAmount('')
    setPaidAmount('0')
  }

  const handleDeleteDebtAccount = async (id: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/dept-accounts/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setDeptAccounts(deptAccounts.filter(a => a.id !== id))
      } else {
        setDeptAccounts(deptAccounts.filter(a => a.id !== id))
      }
    } catch (err) {
      console.error('Error deleting debt account:', err)
      setDeptAccounts(deptAccounts.filter(a => a.id !== id))
    } finally {
      setSaving(false)
      setDeletingAccountId(null)
    }
  }

  const allTransactions = deptAccounts.flatMap((a) => a.transactions || [])
  const todayTxnCount = allTransactions.filter(
    (t) => (t.date ? t.date.split('T')[0] : '') === todayStr
  ).length

  const filteredAccounts = deptAccounts
    .map((acc) => {
      const txns = acc.transactions || []
      const dateFilteredTxns = filterRecordsByDate(
        txns,
        (t) => t.date,
        dateFilterMode,
        startDate,
        endDate
      )
      return {
        ...acc,
        filteredTransactions: dateFilteredTxns,
      }
    })
    .filter((acc) => {
      const matchesSearch =
        acc.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.mobileNumber.includes(searchTerm) ||
        acc.billingAddress.toLowerCase().includes(searchTerm.toLowerCase())

      if (!matchesSearch) return false

      if (dateFilterMode === 'ALL') return true
      return acc.filteredTransactions.length > 0
    })

  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredAccounts.map((a) => a.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const getExportAccounts = () => {
    return selectedIds.length > 0
      ? filteredAccounts.filter((a) => selectedIds.includes(a.id))
      : filteredAccounts
  }

  const handleExportPDF = () => {
    const exportItems = getExportAccounts()
    exportToPDF({
      title: 'Udhaar / Debt Ledger Report',
      headers: ['Customer Name', 'Mobile Number', 'Billing Address', 'Credit Limit', 'Total Billed', 'Paid Amount', 'Balance Due'],
      data: exportItems.map((a) => [
        a.customerName,
        a.mobileNumber,
        a.billingAddress,
        `${a.creditLimitDays} Days`,
        `₹ ${a.totalDebtAmount.toLocaleString()}`,
        `₹ ${a.totalPaidAmount.toLocaleString()}`,
        `₹ ${a.balanceDue.toLocaleString()}`,
      ]),
      filename: 'Udhaar_Report',
    })
  }

  const handleExportExcel = () => {
    const exportItems = getExportAccounts()
    exportToExcel({
      filename: 'Udhaar_Report',
      headers: ['Customer Name', 'Mobile Number', 'Billing Address', 'Credit Limit Days', 'Total Billed', 'Paid Amount', 'Balance Due'],
      rows: exportItems.map((a) => [
        a.customerName,
        a.mobileNumber,
        a.billingAddress,
        a.creditLimitDays,
        a.totalDebtAmount,
        a.totalPaidAmount,
        a.balanceDue,
      ]),
    })
  }

  const handlePrint = () => {
    const exportItems = getExportAccounts()
    printReport({
      title: 'Udhaar / Debt Ledger Report',
      headers: ['Customer Name', 'Mobile Number', 'Billing Address', 'Credit Limit', 'Total Billed', 'Paid Amount', 'Balance Due'],
      data: exportItems.map((a) => [
        a.customerName,
        a.mobileNumber,
        a.billingAddress,
        `${a.creditLimitDays} Days`,
        `₹ ${a.totalDebtAmount.toLocaleString()}`,
        `₹ ${a.totalPaidAmount.toLocaleString()}`,
        `₹ ${a.balanceDue.toLocaleString()}`,
      ]),
    })
  }

  const handleShareWhatsApp = () => {
    const exportItems = getExportAccounts()
    const totalDue = exportItems.reduce((acc, curr) => acc + curr.balanceDue, 0)
    const summary =
      `📒 *Udhaar / Debt Ledger Summary*\nTotal Accounts: ${exportItems.length}\nTotal Outstanding Balance: ₹${totalDue.toLocaleString()}\n\n*Accounts:*\n` +
      exportItems.slice(0, 10).map((a) => `• ${a.customerName} | Due: ₹${a.balanceDue.toLocaleString()}`).join('\n')
    shareOnWhatsApp(summary)
  }

  // Selected customer helper for active payment target
  const currentPaymentCustomer = deptAccounts.find((a) => a.id === paymentCustomerId)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-slate-900">Udhaar / Debt Management</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenPaymentModal()}
            className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-md transition-colors flex items-center gap-2"
          >
            <Wallet className="w-4 h-4" />
            <span>+ Receive Payment</span>
          </button>
          <button
            onClick={() => setShowAddCustomerModal(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-md transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Register Customer</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Top Action Bar: 2 Rows */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 space-y-3">
          {/* ROW 1: Title on Left, Export Actions on Right */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-200/80 w-full">
            <div className="flex items-center gap-3">
              <div className="font-bold text-slate-900 text-sm">Debtors Ledger ({filteredAccounts.length})</div>
              {selectedIds.length > 0 && (
                <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {selectedIds.length} Selected
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <ExportActionBar
                onExportPDF={handleExportPDF}
                onExportExcel={handleExportExcel}
                onPrint={handlePrint}
                onShareWhatsApp={handleShareWhatsApp}
                selectedCount={selectedIds.length}
              />
            </div>
          </div>

          {/* ROW 2: Date Range Filter on Left, Search Bar on Right */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 w-full">
            <DateRangeFilter
              mode={dateFilterMode}
              startDate={startDate}
              endDate={endDate}
              onModeChange={setDateFilterMode}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              todayCount={todayTxnCount}
              totalCount={allTransactions.length}
            />

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            <p className="text-xs font-medium">Loading debt accounts & ledger...</p>
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-700">No Debt Customers Found</p>
            <p className="text-xs">Register new debt customers or adjust filter terms.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filteredAccounts.length > 0 && selectedIds.length === filteredAccounts.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="p-4 font-bold text-slate-700">Customer</th>
                <th className="p-4 font-bold text-slate-700">Mobile</th>
                <th className="p-4 font-bold text-slate-700">Total Billed</th>
                <th className="p-4 font-bold text-slate-700">Total Received</th>
                <th className="p-4 font-bold text-slate-700">Balance Due</th>
                <th className="p-4 font-bold text-slate-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAccounts.map((acc) => (
                <tr key={acc.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.includes(acc.id) ? 'bg-amber-50/40' : ''}`}>
                  <td className="p-4 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(acc.id)}
                      onChange={() => handleToggleSelect(acc.id)}
                      className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                    />
                  </td>
                  <td className="p-4 font-bold text-slate-900">
                    <Link
                      href={`/admin/debt/${encodeURIComponent(acc.id)}`}
                      className="hover:text-amber-700 hover:underline transition-colors"
                    >
                      {acc.customerName}
                    </Link>
                  </td>
                  <td className="p-4 font-mono text-slate-600">{acc.mobileNumber}</td>
                  <td className="p-4 font-mono font-bold text-slate-800">₹{(acc.totalDebtAmount || 0).toLocaleString()}</td>
                  <td className="p-4 font-mono font-bold text-emerald-700">₹{(acc.totalPaidAmount || 0).toLocaleString()}</td>
                  <td className="p-4 font-mono font-bold text-rose-700">₹{(acc.balanceDue || 0).toLocaleString()}</td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button
                      onClick={() => handleOpenPaymentModal(acc)}
                      title="Receive Payment"
                      className="px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg font-bold flex items-center gap-1 transition-colors"
                    >
                      <Wallet className="w-3.5 h-3.5" />
                      <span>Pay</span>
                    </button>
                    <button
                      onClick={() => shareOnWhatsApp(acc.mobileNumber, `Hi ${acc.customerName}, your current outstanding balance is ₹${acc.balanceDue}. Please clear it at your earliest.`)}
                      className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                      title="Share Outstanding on WhatsApp"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <Link
                      href={`/admin/debt/${encodeURIComponent(acc.id)}`}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold inline-block"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete Account Modal */}
      {deletingAccountId && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl w-80 shadow-2xl">
            <h3 className="font-bold text-slate-900 mb-2">Delete Account?</h3>
            <p className="text-xs text-slate-500 mb-4">Are you sure? This action cannot be undone.</p>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setDeletingAccountId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteDebtAccount(deletingAccountId)}
                disabled={saving}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1.5"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Delete</span>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Register Customer */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900">Register New Debt Customer</h3>
              <button onClick={() => setShowAddCustomerModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterCustomer} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Customer / Business Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Mehta (Mehta Chemical Industries)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98250 12345"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Credit Terms (Days)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="30"
                    value={creditLimitDays}
                    onChange={(e) => setCreditLimitDays(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Billing Address <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Plot 42, GIDC Industrial Area..."
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-600 resize-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-gold px-5 py-2 shadow-sm font-bold flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save Customer</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  <p className="text-[11px] text-slate-500">Record payments received from debt customer</p>
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

                {/* 2. Customer Name Select */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    2. Customer Name <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={paymentCustomerId}
                    onChange={(e) => {
                      setPaymentCustomerId(e.target.value)
                      setPaymentTargetBillNo('')
                    }}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-600 bg-white font-medium"
                  >
                    <option value="" disabled>-- Select Customer --</option>
                    {deptAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.customerName} (Due: ₹{acc.balanceDue.toLocaleString()})
                      </option>
                    ))}
                  </select>
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
              {currentPaymentCustomer && currentPaymentCustomer.transactions && currentPaymentCustomer.transactions.length > 0 && (
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
                    {currentPaymentCustomer.transactions
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

      {/* Selected Customer Drill-down Bills List & Payment Logs View */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden">
            {/* Customer Detail Header */}
            <div className="p-6 border-b border-slate-200 bg-slate-900 text-white flex items-start justify-between">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-amber-400 text-[10px] font-extrabold uppercase tracking-wider bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  <span>Account ID: {selectedCustomer.id}</span>
                </div>
                <h2 className="text-xl font-extrabold text-white">{selectedCustomer.customerName}</h2>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
                  <div className="flex items-center gap-1 font-mono">
                    <Phone className="w-3.5 h-3.5 text-amber-400" />
                    <span>{selectedCustomer.mobileNumber}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Credit Terms: {selectedCustomer.creditLimitDays} Days</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedCustomer.billingAddress}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenPaymentModal(selectedCustomer)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>+ Receive Payment</span>
                </button>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Financial Balance Summary Bar */}
            <div className="bg-slate-50 p-4 border-b border-slate-200 grid grid-cols-3 gap-4 text-xs">
              <div className="space-y-0.5 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-slate-500 font-bold">Total Credit Debt</div>
                <div className="font-mono font-extrabold text-slate-900 text-base">
                  ₹ {(selectedCustomer.totalDebtAmount || 0).toLocaleString()}
                </div>
              </div>
              <div className="space-y-0.5 bg-emerald-50/50 p-3 rounded-xl border border-emerald-200/80 shadow-2xs">
                <div className="text-emerald-700 font-bold">Total Received Payments</div>
                <div className="font-mono font-extrabold text-emerald-700 text-base">
                  ₹ {(selectedCustomer.totalPaidAmount || 0).toLocaleString()}
                </div>
              </div>
              <div className="space-y-0.5 bg-rose-50/50 p-3 rounded-xl border border-rose-200/80 shadow-2xs">
                <div className="text-rose-700 font-bold">Outstanding Udhaar Due</div>
                <div className="font-mono font-extrabold text-rose-700 text-base">
                  ₹ {(selectedCustomer.balanceDue || 0).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-100/60 px-6 gap-2 pt-2">
              <button
                onClick={() => setActiveTab('bills')}
                className={`px-4 py-2.5 font-extrabold text-xs rounded-t-xl transition-colors flex items-center gap-2 border-b-2 ${
                  activeTab === 'bills'
                    ? 'bg-white text-slate-900 border-amber-600 shadow-2xs'
                    : 'text-slate-600 border-transparent hover:text-slate-900'
                }`}
              >
                <Receipt className="w-4 h-4 text-amber-700" />
                <span>Debt Bills & Invoices ({selectedCustomer.transactions?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab('payments')}
                className={`px-4 py-2.5 font-extrabold text-xs rounded-t-xl transition-colors flex items-center gap-2 border-b-2 ${
                  activeTab === 'payments'
                    ? 'bg-white text-slate-900 border-emerald-600 shadow-2xs'
                    : 'text-slate-600 border-transparent hover:text-slate-900'
                }`}
              >
                <Wallet className="w-4 h-4 text-emerald-700" />
                <span>Payment Received Logs ({selectedCustomer.payments?.length || 0})</span>
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {activeTab === 'bills' ? (
                /* TAB 1: Bills & Invoices */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-sm text-slate-900">Bills Issued on Debt</h3>
                    <button
                      onClick={() => setShowAddBillModal(true)}
                      className="btn-gold py-1.5 px-3 text-xs font-bold shadow-xs flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Debt Bill / Sale</span>
                    </button>
                  </div>

                  {!selectedCustomer.transactions || selectedCustomer.transactions.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <Receipt className="w-8 h-8 text-slate-400 mx-auto" />
                      <div className="font-bold text-slate-800">No Debt Bills Issued Yet</div>
                      <p className="text-[11px] text-slate-500">
                        Click <strong>"Add Debt Bill / Sale"</strong> to record products issued on credit to this customer.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase tracking-wider border-b border-slate-200">
                            <th className="py-2.5 px-3">Bill No.</th>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Product / Items Summary</th>
                            <th className="py-2.5 px-3">Bill Total</th>
                            <th className="py-2.5 px-3">Paid Amount</th>
                            <th className="py-2.5 px-3">Balance Due</th>
                            <th className="py-2.5 px-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-slate-800">
                          {selectedCustomer.transactions.map((txn) => (
                            <tr key={txn.id} className="hover:bg-slate-50">
                              <td className="py-3 px-3 font-mono font-bold text-amber-900">{txn.billNumber}</td>
                              <td className="py-3 px-3 text-slate-600">{txn.date ? txn.date.split('T')[0] : ''}</td>
                              <td className="py-3 px-3 font-semibold text-slate-900">{txn.itemsSummary}</td>
                              <td className="py-3 px-3 font-mono font-bold text-slate-900">
                                ₹ {(txn.billAmount || 0).toLocaleString()}
                              </td>
                              <td className="py-3 px-3 font-mono text-emerald-700 font-bold">
                                ₹ {(txn.paidAmount || 0).toLocaleString()}
                              </td>
                              <td className="py-3 px-3 font-mono font-bold text-rose-700">
                                ₹ {(txn.balanceAmount || 0).toLocaleString()}
                              </td>
                              <td className="py-3 px-3 text-right">
                                {txn.paymentStatus === 'PAID' && (
                                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                                    PAID
                                  </span>
                                )}
                                {txn.paymentStatus === 'PARTIAL' && (
                                  <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                                    PARTIAL
                                  </span>
                                )}
                                {txn.paymentStatus === 'PENDING' && (
                                  <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
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
              ) : (
                /* TAB 2: Payment Received Logs */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-emerald-700" />
                      <span>Received Payment Amount Logs</span>
                    </h3>
                    <button
                      onClick={() => handleOpenPaymentModal(selectedCustomer)}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white py-1.5 px-3 text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Wallet className="w-3.5 h-3.5" />
                      <span>+ Record Received Payment</span>
                    </button>
                  </div>

                  {!selectedCustomer.payments || selectedCustomer.payments.length === 0 ? (
                    <div className="p-8 text-center bg-emerald-50/50 rounded-xl border border-emerald-200/80 space-y-2">
                      <Wallet className="w-8 h-8 text-emerald-400 mx-auto" />
                      <div className="font-bold text-slate-800">No Payment Receipt Logs Recorded Yet</div>
                      <p className="text-[11px] text-slate-500">
                        Click <strong>"+ Record Received Payment"</strong> to log cash, cheque, UPI, or bank transfer payments.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase tracking-wider border-b border-slate-200">
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Payment Type</th>
                            <th className="py-2.5 px-3">Amount Received</th>
                            <th className="py-2.5 px-3">Bill Reduction Details</th>
                            <th className="py-2.5 px-3">Summary / Extra Note</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-slate-800">
                          {selectedCustomer.payments.map((p) => {
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
                              <tr key={p.id} className="hover:bg-slate-50">
                                <td className="py-3 px-3 font-mono text-slate-700 font-semibold">{dateStr}</td>
                                <td className="py-3 px-3">
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
                                <td className="py-3 px-3 font-mono font-extrabold text-emerald-700 text-sm">
                                  ₹ {(p.amount || 0).toLocaleString()}
                                </td>
                                <td className="py-3 px-3 font-medium text-slate-800">
                                  {p.appliedBillNo ? (
                                    <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-1 rounded text-slate-700 border border-slate-200">
                                      <Receipt className="w-3 h-3 text-amber-700 shrink-0" />
                                      <span>{p.appliedBillNo}</span>
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 font-italic">General Account Credit</span>
                                  )}
                                </td>
                                <td className="py-3 px-3 text-slate-600">
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
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl"
              >
                Close Customer Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Debt Bill Transaction */}
      {showAddBillModal && selectedCustomer && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <h3 className="font-extrabold text-base text-slate-900">Add Debt Bill / Sale</h3>
                <p className="text-[11px] text-slate-500">Record products given on debt to {selectedCustomer.customerName}.</p>
              </div>
              <button onClick={() => setShowAddBillModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBill} className="space-y-4 text-xs">
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
