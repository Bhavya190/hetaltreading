'use client'

import { useState, useEffect } from 'react'
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

  // Modals
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false)
  const [editingAccount, setEditingAccount] = useState<DeptAccountRecord | null>(null)
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<DeptAccountRecord | null>(null)
  const [showAddBillModal, setShowAddBillModal] = useState(false)

  // Register Customer Form State
  const [customerName, setCustomerName] = useState('')
  const [mobileNumber, setMobileNumber] = useState('')
  const [billingAddress, setBillingAddress] = useState('')
  const [creditLimitDays, setCreditLimitDays] = useState('30')

  // Add Bill Form State
  const [billNumber, setBillNumber] = useState('')
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0])
  const [itemsSummary, setItemsSummary] = useState('')
  const [billAmount, setBillAmount] = useState('')
  const [paidAmount, setPaidAmount] = useState('0')

  // Initial Sample Data Fallback
  const SAMPLE_ACCOUNTS: DeptAccountRecord[] = [
    {
      id: 'DEBT - 01',
      customerName: 'Rajesh Mehta (Mehta Chemical Industries)',
      mobileNumber: '+91 98250 12345',
      billingAddress: 'Plot 42, GIDC Industrial Area, Sachin, Surat - 394230',
      creditLimitDays: 30,
      totalDebtAmount: 75000,
      totalPaidAmount: 30000,
      balanceDue: 45000,
      status: 'ACTIVE',
      transactions: [
        {
          id: 'TXN-501',
          billNumber: 'INV-2026-089',
          date: '2026-08-25',
          itemsSummary: '10 Metric Ton Soda Ash Dense @ ₹21,000/MT + GST',
          billAmount: 50000,
          paidAmount: 20000,
          balanceAmount: 30000,
          paymentStatus: 'PARTIAL',
        },
        {
          id: 'TXN-502',
          billNumber: 'INV-2026-094',
          date: '2026-08-28',
          itemsSummary: '500 Kg Refined Hydrated Lime @ ₹55/Kg',
          billAmount: 25000,
          paidAmount: 10000,
          balanceAmount: 15000,
          paymentStatus: 'PARTIAL',
        },
      ],
    },
    {
      id: 'DEBT - 02',
      customerName: 'Suresh Patel (Patel Agri Commodities)',
      mobileNumber: '+91 99090 67890',
      billingAddress: '102 Harmony Complex, Ring Road, Ahmedabad - 380009',
      creditLimitDays: 45,
      totalDebtAmount: 120000,
      totalPaidAmount: 120000,
      balanceDue: 0,
      status: 'ACTIVE',
      transactions: [
        {
          id: 'TXN-503',
          billNumber: 'INV-2026-071',
          date: '2026-08-10',
          itemsSummary: '1,000 PP Woven Jumbo Bags @ ₹350/Piece',
          billAmount: 120000,
          paidAmount: 120000,
          balanceAmount: 0,
          paymentStatus: 'PAID',
        },
      ],
    },
  ]

  const fetchDeptAccounts = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/dept-accounts')
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setDeptAccounts(data.data)
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
        const newAcc: DeptAccountRecord = {
          id: `DEBT - ${String(1 + deptAccounts.length).padStart(2, '0')}`,
          customerName,
          mobileNumber,
          billingAddress,
          creditLimitDays: finalDays,
          totalDebtAmount: 0,
          totalPaidAmount: 0,
          balanceDue: 0,
          status: 'ACTIVE',
          transactions: [],
        }
        setDeptAccounts([newAcc, ...deptAccounts])
      }
    } catch (err) {
      console.error('Error creating Dept customer account:', err)
      const newAcc: DeptAccountRecord = {
        id: `DEBT - ${String(1 + deptAccounts.length).padStart(2, '0')}`,
        customerName,
        mobileNumber,
        billingAddress,
        creditLimitDays: finalDays,
        totalDebtAmount: 0,
        totalPaidAmount: 0,
        balanceDue: 0,
        status: 'ACTIVE',
        transactions: [],
      }
      setDeptAccounts([newAcc, ...deptAccounts])
    } finally {
      setSaving(false)
      setDeletingAccountId(null)
    }
  }

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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-slate-900">Udhaar / Debt Management</h1>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowAddCustomerModal(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-md transition-colors"
          >
            + Register Customer
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col lg:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="font-bold text-slate-900 text-sm">Debtors Ledger ({filteredAccounts.length})</div>
            {selectedIds.length > 0 && (
              <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
                {selectedIds.length} Selected
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
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

            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <ExportActionBar
              onExportPDF={handleExportPDF}
              onExportExcel={handleExportExcel}
              onPrint={handlePrint}
              onShareWhatsApp={handleShareWhatsApp}
              selectedCount={selectedIds.length}
            />
          </div>
        </div>
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
                <td className="p-4 font-bold text-slate-900">{acc.customerName}</td>
                <td className="p-4 font-mono text-slate-600">{acc.mobileNumber}</td>
                <td className="p-4 font-mono font-bold text-rose-700">₹{acc.balanceDue.toLocaleString()}</td>
                <td className="p-4 text-right flex justify-end gap-2">
                  <button onClick={() => shareOnWhatsApp(acc.mobileNumber, `Hi ${acc.customerName}, your current outstanding balance is ₹${acc.balanceDue}. Please clear it at your earliest.`)} className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"><Share2 className="w-4 h-4" /></button>
                  <button onClick={() => setSelectedCustomer(acc)} className="px-3 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 font-bold">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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

      {/* Modal 2: Selected Customer Bills & Sales Details View */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden">
            {/* Customer Detail Header */}
            <div className="p-6 border-b border-slate-200 bg-slate-900 text-white flex items-start justify-between">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-amber-400 text-[10px] font-extrabold uppercase tracking-wider bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  <span>Account ID: DEBT - {String(Math.max(0, deptAccounts.findIndex(a => a.id === selectedCustomer.id)) + 1).padStart(2, '0')}</span>
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
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Financial Balance Summary Bar */}
            <div className="bg-slate-50 p-4 border-b border-slate-200 grid grid-cols-3 gap-4 text-xs">
              <div className="space-y-0.5">
                <div className="text-slate-500 font-bold">Total Credit Debt</div>
                <div className="font-mono font-extrabold text-slate-900 text-sm">
                  ₹ {selectedCustomer.totalDebtAmount ? selectedCustomer.totalDebtAmount.toLocaleString() : 0}
                </div>
              </div>
              <div className="space-y-0.5">
                <div className="text-emerald-700 font-bold">Total Paid / Cleared</div>
                <div className="font-mono font-extrabold text-emerald-700 text-sm">
                  ₹ {selectedCustomer.totalPaidAmount ? selectedCustomer.totalPaidAmount.toLocaleString() : 0}
                </div>
              </div>
              <div className="space-y-0.5">
                <div className="text-rose-700 font-bold">Outstanding Udhaar Due</div>
                <div className="font-mono font-extrabold text-rose-700 text-sm">
                  ₹ {selectedCustomer.balanceDue ? selectedCustomer.balanceDue.toLocaleString() : 0}
                </div>
              </div>
            </div>

            {/* Content Body: Bills & Sales Transactions */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-amber-700" />
                  <span>Bills & Sales Transactions ({selectedCustomer.transactions?.length || 0})</span>
                </h3>
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
                          <td className="py-3 px-3 text-slate-600">{txn.date}</td>
                          <td className="py-3 px-3 font-semibold text-slate-900">{txn.itemsSummary}</td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">
                            ₹ {txn.billAmount ? txn.billAmount.toLocaleString() : 0}
                          </td>
                          <td className="py-3 px-3 font-mono text-emerald-700 font-bold">
                            ₹ {txn.paidAmount ? txn.paidAmount.toLocaleString() : 0}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-rose-700">
                            ₹ {txn.balanceAmount ? txn.balanceAmount.toLocaleString() : 0}
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

      {/* Modal 3: Add Debt Bill Transaction for Customer */}
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
