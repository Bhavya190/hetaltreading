'use client'

import { useState, useEffect } from 'react'
import { Receipt, Plus, Eye, Printer, Download, CheckCircle2, Clock, AlertCircle, X, Loader2 } from 'lucide-react'

export interface BillRecord {
  id: string
  billNumber?: string
  customer: string
  date: string
  dueDate?: string
  amount: number
  paidAmount: number
  balanceAmount?: number
  status: 'PAID' | 'PARTIAL' | 'PENDING' | 'UNPAID'
}

export default function BillsPage() {
  const [bills, setBills] = useState<BillRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeInvoice, setActiveInvoice] = useState<BillRecord | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  // Form State
  const [customer, setCustomer] = useState('')
  const [amount, setAmount] = useState('')
  const [paidAmount, setPaidAmount] = useState('')

  const SAMPLE_BILLS: BillRecord[] = [
    {
      id: 'INV-2026-101',
      billNumber: 'INV-2026-101',
      customer: 'Rajesh Mehta (Mehta Chemical Industries)',
      date: '2026-09-03',
      amount: 45000,
      paidAmount: 45000,
      balanceAmount: 0,
      status: 'PAID',
    },
    {
      id: 'INV-2026-102',
      billNumber: 'INV-2026-102',
      customer: 'Suresh Patel (Patel Agri Commodities)',
      date: '2026-09-03',
      amount: 105000,
      paidAmount: 50000,
      balanceAmount: 55000,
      status: 'PARTIAL',
    },
  ]

  const fetchBills = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/bills')
      const data = await res.json()
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setBills(
          data.data.map((b: any) => ({
            id: b.id,
            billNumber: b.billNumber || b.id,
            customer: b.customer,
            date: b.date ? new Date(b.date).toISOString().split('T')[0] : '2026-09-03',
            amount: b.amount || 0,
            paidAmount: b.paidAmount || 0,
            balanceAmount: b.balanceAmount || 0,
            status: b.status || 'PAID',
          }))
        )
      } else {
        setBills(SAMPLE_BILLS)
      }
    } catch (err) {
      console.error('Error loading bills:', err)
      setBills(SAMPLE_BILLS)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBills()
  }, [])

  const handleAddBill = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customer || !amount) return

    setSaving(true)
    try {
      const res = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer,
          amount: parseFloat(amount) || 0,
          paidAmount: parseFloat(paidAmount) || 0,
        }),
      })
      const data = await res.json()

      if (data.success && data.data) {
        const b = data.data
        const newBill: BillRecord = {
          id: b.id,
          billNumber: b.billNumber || b.id,
          customer: b.customer,
          date: b.date ? new Date(b.date).toISOString().split('T')[0] : '2026-09-03',
          amount: b.amount || 0,
          paidAmount: b.paidAmount || 0,
          balanceAmount: b.balanceAmount || 0,
          status: b.status || 'PAID',
        }
        setBills([newBill, ...bills])
      } else {
        const totalAmt = parseFloat(amount) || 0
        const paid = parseFloat(paidAmount) || 0
        const newBill: BillRecord = {
          id: `INV-2026-${Date.now().toString().slice(-3)}`,
          billNumber: `INV-2026-${Date.now().toString().slice(-3)}`,
          customer,
          date: new Date().toISOString().split('T')[0],
          amount: totalAmt,
          paidAmount: paid,
          balanceAmount: Math.max(0, totalAmt - paid),
          status: paid >= totalAmt ? 'PAID' : paid > 0 ? 'PARTIAL' : 'PENDING',
        }
        setBills([newBill, ...bills])
      }
    } catch (err) {
      console.error('Error adding bill:', err)
      const totalAmt = parseFloat(amount) || 0
      const paid = parseFloat(paidAmount) || 0
      const newBill: BillRecord = {
        id: `INV-2026-${Date.now().toString().slice(-3)}`,
        billNumber: `INV-2026-${Date.now().toString().slice(-3)}`,
        customer,
        date: new Date().toISOString().split('T')[0],
        amount: totalAmt,
        paidAmount: paid,
        balanceAmount: Math.max(0, totalAmt - paid),
        status: paid >= totalAmt ? 'PAID' : paid > 0 ? 'PARTIAL' : 'PENDING',
      }
      setBills([newBill, ...bills])
    } finally {
      setSaving(false)
      setCustomer('')
      setAmount('')
      setPaidAmount('')
      setShowAddModal(false)
    }
  }

  const totalInvoiced = bills.reduce((acc, curr) => acc + (curr.amount || 0), 0)
  const totalCollected = bills.reduce((acc, curr) => acc + (curr.paidAmount || 0), 0)
  const outstandingReceivables = Math.max(0, totalInvoiced - totalCollected)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-amber-800 text-[11px] font-extrabold uppercase tracking-wider bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
            <Receipt className="w-3.5 h-3.5 text-amber-700" />
            <span>Billing & Invoicing Ledger</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Billing & Invoices</h1>
          <p className="text-xs text-slate-500">
            Generate commercial tax invoices, track receivables, and manage billing statements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setShowAddModal(true)} className="btn-navy text-xs py-2.5 px-4 shadow-sm">
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Generate New Bill</span>
          </button>
        </div>
      </div>

      {/* Invoice Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-slate-500 text-xs font-bold">Total Invoiced</span>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">₹ {totalInvoiced.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500">{bills.length} Commercial invoices</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-slate-500 text-xs font-bold">Total Collected (Paid)</span>
          <div className="text-2xl font-extrabold text-emerald-700 font-mono">₹ {totalCollected.toLocaleString()}</div>
          <div className="text-[11px] text-emerald-600 font-semibold">
            {totalInvoiced > 0 ? `${((totalCollected / totalInvoiced) * 100).toFixed(1)}% Collection rate` : 'No invoices yet'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-slate-500 text-xs font-bold">Outstanding Receivables</span>
          <div className="text-2xl font-extrabold text-rose-700 font-mono">₹ {outstandingReceivables.toLocaleString()}</div>
          <div className="text-[11px] text-rose-600 font-semibold">Pending collections</div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="font-bold text-slate-900 text-sm">Generated Invoices ({bills.length})</div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            <span className="text-xs font-semibold">Loading bills from database...</span>
          </div>
        ) : bills.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Receipt className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-slate-800">No Bills Issued</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Click <strong>"Generate New Bill"</strong> above to log customer invoices.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 font-extrabold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Invoice Number</th>
                  <th className="py-3 px-4">Billed Customer</th>
                  <th className="py-3 px-4">Invoice Date</th>
                  <th className="py-3 px-4">Invoice Amount</th>
                  <th className="py-3 px-4">Paid Amount</th>
                  <th className="py-3 px-4 text-right">Payment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                {bills.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{b.billNumber || b.id}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{b.customer}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{b.date}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">₹ {b.amount.toLocaleString()}</td>
                    <td className="py-3.5 px-4 font-mono text-emerald-700 font-bold">₹ {b.paidAmount.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-right">
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                          b.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : b.status === 'PARTIAL'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Bill Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900">Generate Commercial Bill / Invoice</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBill} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Customer / Client Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Mehta (Mehta Chemical Industries)"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Bill Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 45000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amount Paid (₹)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-600 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-navy px-4 py-2 shadow-sm flex items-center gap-1.5"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin text-amber-400" /> : <span className="text-white">Save Bill</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
