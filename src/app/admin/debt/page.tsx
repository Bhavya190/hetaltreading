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
} from 'lucide-react'

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

  // Modals
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false)
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
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setDeptAccounts(data.data)
      } else {
        setDeptAccounts(SAMPLE_ACCOUNTS)
      }
    } catch (err) {
      console.error('Failed to fetch Dept accounts:', err)
      setDeptAccounts(SAMPLE_ACCOUNTS)
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
    const payload = {
      customerName,
      mobileNumber,
      billingAddress,
      creditLimitDays: parseInt(creditLimitDays, 10) || 30,
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
          creditLimitDays: parseInt(creditLimitDays, 10) || 30,
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
        creditLimitDays: parseInt(creditLimitDays, 10) || 30,
        totalDebtAmount: 0,
        totalPaidAmount: 0,
        balanceDue: 0,
        status: 'ACTIVE',
        transactions: [],
      }
      setDeptAccounts([newAcc, ...deptAccounts])
    } finally {
      setSaving(false)
      setCustomerName('')
      setMobileNumber('')
      setBillingAddress('')
      setCreditLimitDays('30')
      setShowAddCustomerModal(false)
    }
  }

  // Add Debt Bill Transaction for Selected Customer
  const handleAddBill = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomer || !billNumber || !itemsSummary || !billAmount) return

    setSaving(true)
    const bAmt = parseFloat(billAmount) || 0
    const pAmt = parseFloat(paidAmount) || 0
    const balAmt = Math.max(0, bAmt - pAmt)
    const status: 'PAID' | 'PARTIAL' | 'PENDING' =
      balAmt === 0 ? 'PAID' : pAmt > 0 ? 'PARTIAL' : 'PENDING'

    const payload = {
      billNumber,
      date: billDate,
      itemsSummary,
      billAmount: bAmt,
      paidAmount: pAmt,
    }

    try {
      const res = await fetch(`/api/dept-accounts/${selectedCustomer.id}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (data.success && data.account) {
        // Update local state
        const updatedList = deptAccounts.map((acc) =>
          acc.id === selectedCustomer.id ? data.account : acc
        )
        setDeptAccounts(updatedList)
        setSelectedCustomer(data.account)
      } else {
        // Fallback local update
        const newTxn: DebtTransactionRecord = {
          id: `TXN-${Date.now().toString().slice(-4)}`,
          billNumber,
          date: billDate,
          itemsSummary,
          billAmount: bAmt,
          paidAmount: pAmt,
          balanceAmount: balAmt,
          paymentStatus: status,
        }
        const updatedTransactions = [newTxn, ...(selectedCustomer.transactions || [])]
        const newTotalDebt = updatedTransactions.reduce((a, b) => a + b.billAmount, 0)
        const newTotalPaid = updatedTransactions.reduce((a, b) => a + b.paidAmount, 0)
        const newBalance = Math.max(0, newTotalDebt - newTotalPaid)

        const updatedCust: DeptAccountRecord = {
          ...selectedCustomer,
          totalDebtAmount: newTotalDebt,
          totalPaidAmount: newTotalPaid,
          balanceDue: newBalance,
          transactions: updatedTransactions,
        }

        setDeptAccounts(deptAccounts.map((a) => (a.id === selectedCustomer.id ? updatedCust : a)))
        setSelectedCustomer(updatedCust)
      }
    } catch (err) {
      console.error('Error adding debt bill transaction:', err)
    } finally {
      setSaving(false)
      setBillNumber('')
      setItemsSummary('')
      setBillAmount('')
      setPaidAmount('0')
      setShowAddBillModal(false)
    }
  }

  // Filter Accounts
  const filteredAccounts = deptAccounts.filter(
    (a) =>
      a.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.mobileNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.billingAddress.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Metrics
  const totalDebtIssued = deptAccounts.reduce((acc, curr) => acc + (curr.totalDebtAmount || 0), 0)
  const totalPaidCollected = deptAccounts.reduce((acc, curr) => acc + (curr.totalPaidAmount || 0), 0)
  const totalOutstandingDue = deptAccounts.reduce((acc, curr) => acc + (curr.balanceDue || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-amber-800 text-[11px] font-extrabold uppercase tracking-wider bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
            <BookOpen className="w-3.5 h-3.5 text-amber-700" />
            <span>Debt / Udhaar Customer Ledger</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Debt Accounts & Credit Ledger</h1>
          <p className="text-xs text-slate-500">
            Manage customers with debt / credit payment terms, track product bills issued on credit, and collect pending balance payments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddCustomerModal(true)}
            className="btn-gold text-xs py-2.5 px-4 shadow-sm font-bold flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Register Debt Customer</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Total Credit Debt Issued</div>
          <div className="text-xl font-extrabold text-slate-900 font-mono">
            ₹ {totalDebtIssued.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400">Sum of all debt bills</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs space-y-1">
          <div className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider">Total Amount Collected</div>
          <div className="text-xl font-extrabold text-emerald-700 font-mono">
            ₹ {totalPaidCollected.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600">Cleared payment transactions</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-200 bg-rose-50/30 shadow-xs space-y-1">
          <div className="text-[11px] font-extrabold text-rose-800 uppercase tracking-wider">Outstanding Udhaar Balance</div>
          <div className="text-xl font-extrabold text-rose-700 font-mono">
            ₹ {totalOutstandingDue.toLocaleString()}
          </div>
          <div className="text-[11px] text-rose-600">Pending debt clearance</div>
        </div>
      </div>

      {/* Debt Customer Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="font-bold text-slate-900 text-sm">Debt Customer Accounts ({deptAccounts.length})</div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by customer name, mobile, address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:border-amber-600 text-slate-900"
            />
          </div>
        </div>

        {filteredAccounts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-slate-800">No Debt Customers Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Click <strong>"Register Debt Customer"</strong> above to add debtor customer profiles.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 font-extrabold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Account ID</th>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Mobile Number</th>
                  <th className="py-3 px-4">Total Debt</th>
                  <th className="py-3 px-4">Paid Amount</th>
                  <th className="py-3 px-4">Balance Due (Udhaar)</th>
                  <th className="py-3 px-4">Credit Limit</th>
                  <th className="py-3 px-4 text-right">Bills & Sales Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                {filteredAccounts.map((acc, index) => (
                  <tr
                    key={acc.id}
                    onClick={() => setSelectedCustomer(acc)}
                    className="hover:bg-amber-50/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      DEBT - {String(index + 1).padStart(2, '0')}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">{acc.customerName}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate max-w-xs">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{acc.billingAddress}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-900">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span>{acc.mobileNumber}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                      ₹ {acc.totalDebtAmount ? acc.totalDebtAmount.toLocaleString() : 0}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                      ₹ {acc.totalPaidAmount ? acc.totalPaidAmount.toLocaleString() : 0}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {acc.balanceDue > 0 ? (
                        <span className="bg-rose-100 text-rose-800 font-extrabold px-2.5 py-1 rounded-lg border border-rose-200">
                          ₹ {acc.balanceDue.toLocaleString()} DUE
                        </span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-1 rounded-lg">
                          CLEARED (₹0)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      <span className="bg-slate-100 px-2 py-1 rounded border border-slate-200">
                        {acc.creditLimitDays} Days
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedCustomer(acc)
                        }}
                        className="btn-gold text-[11px] py-1.5 px-3 font-bold inline-flex items-center gap-1 shadow-xs"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>View Bills & Sales ({acc.transactions?.length || 0})</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal 1: Register Debt Customer Account */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <h3 className="font-extrabold text-base text-slate-900">Register Debt Customer Account</h3>
                <p className="text-[11px] text-slate-500">Register debtor customer profile for credit sales & payment terms.</p>
              </div>
              <button onClick={() => setShowAddCustomerModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterCustomer} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  1. Customer Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Mehta (Mehta Chemicals)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    2. Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 98765 43210"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/[^0-9+]/g, ''))}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    3. Credit Limit (Days) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 30"
                    value={creditLimitDays}
                    onChange={(e) => setCreditLimitDays(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  4. Billing Address <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Enter complete billing address..."
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 resize-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-gold px-5 py-2 shadow-sm font-bold flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save Debt Customer</span>}
                </button>
              </div>
            </form>
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
