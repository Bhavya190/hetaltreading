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
  Building2,
  ArrowUpRight,
} from 'lucide-react'
import ExportActionBar from '@/components/ExportActionBar'
import DateRangeFilter, { DateFilterMode, filterRecordsByDate } from '@/components/DateRangeFilter'
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
  createdAt?: string
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

export default function VendorDebtPage() {
  const [vendorAccounts, setVendorAccounts] = useState<VendorAccountRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Date Filter States
  const todayStr = new Date().toISOString().split('T')[0]
  const [dateFilterMode, setDateFilterMode] = useState<DateFilterMode>('ALL')
  const [startDate, setStartDate] = useState(todayStr)
  const [endDate, setEndDate] = useState(todayStr)

  // Tabs: 'bills' | 'payments'
  const [activeTab, setActiveTab] = useState<'bills' | 'payments'>('bills')

  // Modals
  const [showAddVendorModal, setShowAddVendorModal] = useState(false)
  const [editingAccount, setEditingAccount] = useState<VendorAccountRecord | null>(null)
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null)
  const [selectedVendor, setSelectedVendor] = useState<VendorAccountRecord | null>(null)
  const [showAddBillModal, setShowAddBillModal] = useState(false)

  // Payment Form Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentVendorId, setPaymentVendorId] = useState('')
  const [paymentDate, setPaymentDate] = useState(todayStr)
  const [paymentType, setPaymentType] = useState<'CASH' | 'CHEQUE' | 'UPI' | 'BANK_TRANSFER'>('CASH')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentNote, setPaymentNote] = useState('')
  const [paymentTargetBillNo, setPaymentTargetBillNo] = useState('')

  // Add Vendor Form State
  const [newVendorName, setNewVendorName] = useState('')
  const [newVendorCode, setNewVendorCode] = useState('')
  const [newContactPerson, setNewContactPerson] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newCity, setNewCity] = useState('')

  // Add Purchase Bill Form State
  const [newBillNumber, setNewBillNumber] = useState('')
  const [newBillDate, setNewBillDate] = useState(todayStr)
  const [newItemsSummary, setNewItemsSummary] = useState('')
  const [newBillAmount, setNewBillAmount] = useState('')
  const [newInitialPaid, setNewInitialPaid] = useState('')

  const fetchVendorAccounts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/vendor-accounts')
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setVendorAccounts(data.data)
      }
    } catch (err) {
      console.error('Error fetching vendor accounts:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVendorAccounts()
  }, [])

  // Save or Update Vendor Account
  const handleSaveVendorAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newVendorName) {
      alert('Please enter Vendor Name')
      return
    }

    setSaving(true)
    try {
      if (editingAccount) {
        const res = await fetch(`/api/vendor-accounts/${editingAccount.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vendorName: newVendorName,
            contactPerson: newContactPerson,
            phone: newPhone,
            city: newCity,
          }),
        })
        const data = await res.json()
        if (data.success) {
          fetchVendorAccounts()
        }
      } else {
        const res = await fetch('/api/vendor-accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vendorName: newVendorName,
            vendorCode: newVendorCode,
            contactPerson: newContactPerson,
            phone: newPhone,
            city: newCity,
          }),
        })
        const data = await res.json()
        if (data.success) {
          fetchVendorAccounts()
        }
      }
    } catch (err) {
      console.error('Error saving vendor account:', err)
    } finally {
      setSaving(false)
      setShowAddVendorModal(false)
      setEditingAccount(null)
      resetVendorForm()
    }
  }

  const resetVendorForm = () => {
    setNewVendorName('')
    setNewVendorCode('')
    setNewContactPerson('')
    setNewPhone('')
    setNewCity('')
  }

  const handleOpenEditModal = (acc: VendorAccountRecord) => {
    setEditingAccount(acc)
    setNewVendorName(acc.vendorName)
    setNewVendorCode(acc.vendorCode)
    setNewContactPerson(acc.contactPerson || '')
    setNewPhone(acc.phone || '')
    setNewCity(acc.city || '')
    setShowAddVendorModal(true)
  }

  const handleDeleteAccount = async (id: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/vendor-accounts/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setVendorAccounts(vendorAccounts.filter((a) => a.id !== id))
        if (selectedVendor?.id === id) setSelectedVendor(null)
      }
    } catch (err) {
      console.error('Error deleting vendor account:', err)
    } finally {
      setSaving(false)
      setDeletingAccountId(null)
    }
  }

  // Open Payment Modal
  const openPaymentModal = (accId?: string) => {
    setPaymentVendorId(accId || (vendorAccounts[0]?.id || ''))
    setPaymentDate(todayStr)
    setPaymentType('CASH')
    setPaymentAmount('')
    setPaymentNote('')
    setPaymentTargetBillNo('')
    setShowPaymentModal(true)
  }

  // Submit Installment Payment to Vendor
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!paymentVendorId) {
      alert('Please select a Vendor')
      return
    }

    const amt = Math.round(parseFloat(paymentAmount) || 0)
    if (amt <= 0) {
      alert('Please enter a valid payment amount')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/vendor-accounts/${paymentVendorId}/payments`, {
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
        fetchVendorAccounts()
        if (selectedVendor && selectedVendor.id === paymentVendorId) {
          const updated = await fetch(`/api/vendor-accounts/${paymentVendorId}`).then((r) => r.json())
          if (updated.success) setSelectedVendor(updated.data)
        }
      } else {
        alert(data.error || 'Failed to record vendor payment')
      }
    } catch (err) {
      console.error('Error submitting vendor payment:', err)
      alert('Network error while recording vendor payment')
    } finally {
      setSaving(false)
    }
  }

  // Submit Direct Purchase Bill
  const handleAddPurchaseBill = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedVendor) return

    const bAmt = Math.round(parseFloat(newBillAmount) || 0)
    if (!newBillNumber || bAmt <= 0) {
      alert('Please enter a valid Bill Number and Amount')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/vendor-accounts/${selectedVendor.id}/transactions`, {
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
        fetchVendorAccounts()
        const updated = await fetch(`/api/vendor-accounts/${selectedVendor.id}`).then((r) => r.json())
        if (updated.success) setSelectedVendor(updated.data)
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

  // Filter Accounts
  const filteredAccounts = vendorAccounts.filter(
    (acc) =>
      acc.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.vendorCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.phone.includes(searchTerm)
  )

  // Overall Financial Aggregates
  const totalDebtSum = Math.round(vendorAccounts.reduce((acc, curr) => acc + (curr.totalDebtAmount || 0), 0))
  const totalPaidSum = Math.round(vendorAccounts.reduce((acc, curr) => acc + (curr.totalPaidAmount || 0), 0))
  const totalBalanceDue = Math.round(vendorAccounts.reduce((acc, curr) => acc + (curr.balanceDue || 0), 0))
  const activeVendorsCount = vendorAccounts.filter((acc) => acc.balanceDue > 0).length

  // All Payment Logs Aggregated across Vendors
  const allPayments = vendorAccounts.flatMap((acc) =>
    (acc.payments || []).map((p) => ({
      ...p,
      vendorName: acc.vendorName,
      vendorCode: acc.vendorCode,
    }))
  )

  const filteredPayments = filterRecordsByDate(
    allPayments,
    (p) => p.date,
    dateFilterMode,
    startDate,
    endDate
  )

  const handleExportExcel = () => {
    exportToExcel({
      filename: 'Vendor_Payables_Ledger',
      headers: ['Vendor Code', 'Vendor Name', 'Phone', 'City', 'Total Purchases', 'Total Paid', 'Balance Payable', 'Status'],
      rows: filteredAccounts.map((acc) => [
        acc.vendorCode,
        acc.vendorName,
        acc.phone || '-',
        acc.city || '-',
        acc.totalDebtAmount,
        acc.totalPaidAmount,
        acc.balanceDue,
        acc.balanceDue > 0 ? 'PAYABLE DUE' : 'CLEAR',
      ]),
    })
  }

  const handlePrint = () => {
    printReport({
      title: 'Vendor Payables Ledger Report',
      headers: ['Vendor Code', 'Vendor Name', 'Phone', 'City', 'Total Purchases', 'Total Paid', 'Balance Payable'],
      data: filteredAccounts.map((acc) => [
        acc.vendorCode,
        acc.vendorName,
        acc.phone || '-',
        acc.city || '-',
        `₹ ${Math.round(acc.totalDebtAmount).toLocaleString()}`,
        `₹ ${Math.round(acc.totalPaidAmount).toLocaleString()}`,
        `₹ ${Math.round(acc.balanceDue).toLocaleString()}`,
      ]),
    })
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-800 rounded-full text-xs font-extrabold mb-2 border border-amber-200">
            <Building2 className="w-3.5 h-3.5" />
            <span>Vendor Debt & Accounts (વેપારી ઉધાર ખાતા)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Vendor Payables Ledger
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Track product purchases on credit, record installment payments, and manage vendor balances.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => openPaymentModal()}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-98"
          >
            <Wallet className="w-4 h-4" />
            <span>+ Record Vendor Payment</span>
          </button>

          <button
            onClick={() => {
              setEditingAccount(null)
              resetVendorForm()
              setShowAddVendorModal(true)
            }}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Vendor Account</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">TOTAL PURCHASES DEBT</span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
            ₹{totalDebtSum.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">Cumulative Purchase Bills</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">TOTAL PAID TO VENDORS</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2 font-mono">
            ₹{totalPaidSum.toLocaleString()}
          </div>
          <div className="text-xs text-emerald-700 mt-1 font-semibold">Cleared via Installments</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">NET BALANCE PAYABLE</span>
            <div className="p-2 bg-rose-50 text-rose-700 rounded-xl">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2 font-mono">
            ₹{totalBalanceDue.toLocaleString()}
          </div>
          <div className="text-xs text-rose-700 mt-1 font-semibold">Remaining Owed to Vendors</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">VENDORS WITH DUE</span>
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {activeVendorsCount}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">Out of {vendorAccounts.length} Total Vendors</div>
        </div>
      </div>

      {/* Action Bar & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by vendor name, code, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-amber-600 focus:bg-white transition-all"
          />
        </div>

        <ExportActionBar
          onExportExcel={handleExportExcel}
          onExportPDF={handleExportExcel}
          onPrint={handlePrint}
          onShareWhatsApp={() => shareOnWhatsApp(`Vendor Payables Summary: Net Balance Payable ₹${totalBalanceDue}`)}
        />
      </div>

      {/* Main Vendor Accounts Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-600" />
            <h2 className="font-extrabold text-slate-900">Vendor Debt Accounts ({filteredAccounts.length})</h2>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-600" />
            <p className="text-sm font-medium">Loading Vendor Debt Ledgers...</p>
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Building2 className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-base font-bold text-slate-700">No Vendor Accounts Found</p>
            <p className="text-xs">Add a vendor account or create a purchase entry to track vendor payables.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                <tr>
                  <th className="py-3.5 px-4">VENDOR</th>
                  <th className="py-3.5 px-4">CONTACT / CITY</th>
                  <th className="py-3.5 px-4 text-right">TOTAL PURCHASES (₹)</th>
                  <th className="py-3.5 px-4 text-right">TOTAL PAID (₹)</th>
                  <th className="py-3.5 px-4 text-right">BALANCE PAYABLE (₹)</th>
                  <th className="py-3.5 px-4 text-center">STATUS</th>
                  <th className="py-3.5 px-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredAccounts.map((acc) => {
                  const bal = Math.round(acc.balanceDue)
                  return (
                    <tr key={acc.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <Link
                            href={`/admin/vendor-debt/${acc.id}`}
                            className="text-slate-900 hover:text-amber-600 transition-colors font-extrabold hover:underline"
                          >
                            {acc.vendorName}
                          </Link>
                        </div>
                        <div className="text-[11px] font-mono font-bold text-amber-800">
                          #{acc.vendorCode || 'VEND-101'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {acc.contactPerson && <div className="font-bold text-slate-800">{acc.contactPerson}</div>}
                        <div>{acc.phone || 'No Phone'}</div>
                        <div className="text-[11px] text-slate-400">{acc.city || 'N/A'}</div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        ₹{Math.round(acc.totalDebtAmount).toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600">
                        ₹{Math.round(acc.totalPaidAmount).toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-extrabold">
                        {bal > 0 ? (
                          <span className="text-rose-600">₹{bal.toLocaleString()}</span>
                        ) : (
                          <span className="text-slate-400">₹0</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {bal > 0 ? (
                          <span className="px-2.5 py-1 bg-rose-50 text-rose-700 rounded-full text-[11px] font-extrabold border border-rose-200 inline-block">
                            PAYABLE DUE
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-extrabold border border-emerald-200 inline-block">
                            ALL CLEARED
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openPaymentModal(acc.id)}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                            title="Record Installment Payment"
                          >
                            <Wallet className="w-3.5 h-3.5" />
                            <span>Pay</span>
                          </button>

                          <button
                            onClick={() => handleOpenEditModal(acc)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                            title="Edit Vendor Info"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setDeletingAccountId(acc.id)}
                            className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors"
                            title="Delete Account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Vendor Detailed Ledger Drawer / Modal */}
      {selectedVendor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-3xl h-full shadow-2xl flex flex-col overflow-hidden">
            {/* Drawer Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-extrabold">{selectedVendor.vendorName}</h2>
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 font-mono text-xs rounded-md border border-amber-500/30">
                    #{selectedVendor.vendorCode}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                  <span>Phone: {selectedVendor.phone || 'N/A'}</span>
                  <span>•</span>
                  <span>City: {selectedVendor.city || 'N/A'}</span>
                </p>
              </div>

              <button
                onClick={() => setSelectedVendor(null)}
                className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Financial Summary Strip */}
            <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-200 text-center p-4">
              <div>
                <div className="text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">TOTAL PURCHASES</div>
                <div className="text-lg font-black text-slate-900 font-mono mt-0.5">
                  ₹{Math.round(selectedVendor.totalDebtAmount).toLocaleString()}
                </div>
              </div>
              <div className="border-x border-slate-200">
                <div className="text-[11px] font-extrabold uppercase text-emerald-700 tracking-wider">TOTAL PAID</div>
                <div className="text-lg font-black text-emerald-600 font-mono mt-0.5">
                  ₹{Math.round(selectedVendor.totalPaidAmount).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-extrabold uppercase text-rose-700 tracking-wider">BALANCE PAYABLE</div>
                <div className="text-lg font-black text-rose-600 font-mono mt-0.5">
                  ₹{Math.round(selectedVendor.balanceDue).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('bills')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    activeTab === 'bills' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Purchase Bills ({selectedVendor.transactions?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('payments')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    activeTab === 'payments' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Installment Payments ({selectedVendor.payments?.length || 0})
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openPaymentModal(selectedVendor.id)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Pay Installment</span>
                </button>

                <button
                  onClick={() => setShowAddBillModal(true)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Bill</span>
                </button>
              </div>
            </div>

            {/* Detailed History List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {activeTab === 'bills' ? (
                <div>
                  {!selectedVendor.transactions || selectedVendor.transactions.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="text-sm font-bold text-slate-600">No Purchase Bills Recorded</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedVendor.transactions.map((txn) => (
                        <div
                          key={txn.id}
                          className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-900 text-sm font-mono">
                                #{txn.billNumber}
                              </span>
                              <span
                                className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md ${
                                  txn.paymentStatus === 'PAID'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : txn.paymentStatus === 'PARTIAL'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {txn.paymentStatus}
                              </span>
                            </div>
                            <div className="text-xs text-slate-600 mt-1 font-medium">
                              {txn.itemsSummary}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              Date: {new Date(txn.date).toLocaleDateString()}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="font-mono font-black text-slate-900 text-base">
                              ₹{Math.round(txn.billAmount).toLocaleString()}
                            </div>
                            <div className="text-xs font-mono font-bold text-emerald-600">
                              Paid: ₹{Math.round(txn.paidAmount).toLocaleString()}
                            </div>
                            <div className="text-xs font-mono font-bold text-rose-600">
                              Due: ₹{Math.round(txn.balanceAmount).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  {!selectedVendor.payments || selectedVendor.payments.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <Wallet className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="text-sm font-bold text-slate-600">No Installment Payments Logged</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedVendor.payments.map((p) => (
                        <div
                          key={p.id}
                          className="p-4 bg-emerald-50/50 border border-emerald-200/80 rounded-2xl flex items-center justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-emerald-900 text-sm">
                                {p.paymentType} Payment
                              </span>
                              {p.appliedBillNo && (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold rounded-md">
                                  {p.appliedBillNo}
                                </span>
                              )}
                            </div>
                            {p.note && (
                              <div className="text-xs text-slate-600 mt-1 font-medium">
                                Note: {p.note}
                              </div>
                            )}
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              Date: {new Date(p.date).toLocaleDateString()}
                            </div>
                          </div>

                          <div className="font-mono font-black text-emerald-700 text-lg">
                            +₹{Math.round(p.amount).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Record Vendor Payment Modal */}
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
                  <p className="text-xs text-slate-500 font-medium">Pay vendor installment</p>
                </div>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-4 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1">SELECT VENDOR *</label>
                <select
                  value={paymentVendorId}
                  onChange={(e) => setPaymentVendorId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 bg-white"
                  required
                >
                  <option value="" disabled>-- Select Vendor --</option>
                  {vendorAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.vendorName} (Due: ₹{Math.round(acc.balanceDue).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

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
                  placeholder="e.g. Paid cash installment via shop desk"
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

      {/* Add / Edit Vendor Account Modal */}
      {showAddVendorModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">
                {editingAccount ? 'Edit Vendor Account' : 'Add Vendor Account'}
              </h3>
              <button onClick={() => setShowAddVendorModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVendorAccount} className="space-y-3.5 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1">COMPANY NAME *</label>
                <input
                  type="text"
                  placeholder="e.g. Gujarat Quarries Ltd"
                  value={newVendorName}
                  onChange={(e) => setNewVendorName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">KEY CONTACT PERSON</label>
                  <input
                    type="text"
                    placeholder="e.g. Vikram Patel"
                    value={newContactPerson}
                    onChange={(e) => setNewContactPerson(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block mb-1">PHONE NUMBER *</label>
                  <input
                    type="tel"
                    placeholder="+91 98250 11223"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value.replace(/[^0-9+]/g, ''))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 bg-white font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1">CITY / LOCATION</label>
                <input
                  type="text"
                  placeholder="e.g. Porbandar, Gujarat"
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 bg-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddVendorModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingAccount ? 'Update Account' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Purchase Bill Modal */}
      {showAddBillModal && selectedVendor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">
                Add Purchase Bill for {selectedVendor.vendorName}
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

      {/* Delete Confirmation Modal */}
      {deletingAccountId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">Delete Vendor Account?</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                This will permanently delete this vendor's debt account, purchase transactions, and payment history.
              </p>
            </div>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setDeletingAccountId(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteAccount(deletingAccountId)}
                className="px-4 py-2 bg-rose-600 text-white font-bold rounded-xl text-xs"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
