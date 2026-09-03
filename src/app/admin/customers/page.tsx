'use client'

import { useState, useEffect } from 'react'
import { Users, Plus, Phone, MapPin, Clock, X, Search, ShieldCheck, Loader2, Pencil, Trash2 } from 'lucide-react'

export interface CustomerRecord {
  id: string
  name: string
  mobileNumber: string
  billingAddress: string
  creditLimitDays: number
  status: 'ACTIVE' | 'INACTIVE'
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<CustomerRecord | null>(null)
  const [deletingCustomerId, setDeletingCustomerId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Form State
  const [name, setName] = useState('')
  const [mobileNumber, setMobileNumber] = useState('')
  const [billingAddress, setBillingAddress] = useState('')
  const [creditLimitDays, setCreditLimitDays] = useState('30')

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/customers')
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setCustomers(data.data)
      } else {
        setCustomers([])
      }
    } catch (err) {
      console.error('Failed to fetch customer data from API:', err)
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  const resetForm = () => {
    setName('')
    setMobileNumber('')
    setBillingAddress('')
    setCreditLimitDays('30')
  }

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !mobileNumber || !billingAddress) return

    setSaving(true)
    const parsedDays = creditLimitDays !== '' ? parseInt(creditLimitDays, 10) : 30
    const finalDays = isNaN(parsedDays) ? 30 : parsedDays

    const payload = {
      name,
      mobileNumber,
      billingAddress,
      creditLimitDays: finalDays,
    }

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success && data.data) {
        setCustomers([data.data, ...customers])
      } else {
        fetchCustomers()
      }
    } catch (err) {
      console.error('Error adding customer:', err)
    } finally {
      setSaving(false)
      setShowAddModal(false)
      resetForm()
    }
  }

  const openEditModal = (cust: CustomerRecord) => {
    setEditingCustomer(cust)
    setName(cust.name || '')
    setMobileNumber(cust.mobileNumber || '')
    setBillingAddress(cust.billingAddress || '')
    setCreditLimitDays(cust.creditLimitDays !== undefined && cust.creditLimitDays !== null ? String(cust.creditLimitDays) : '30')
  }

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCustomer) return

    setSaving(true)
    const parsedDays = creditLimitDays !== '' ? parseInt(creditLimitDays, 10) : 30
    const finalDays = isNaN(parsedDays) ? 30 : parsedDays

    const payload = {
      name,
      mobileNumber,
      billingAddress,
      creditLimitDays: finalDays,
    }

    try {
      const res = await fetch(`/api/customers/${editingCustomer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success && data.data) {
        setCustomers(customers.map((c) => (c.id === editingCustomer.id ? data.data : c)))
      } else {
        fetchCustomers()
      }
    } catch (err) {
      console.error('Error updating customer:', err)
    } finally {
      setSaving(false)
      setEditingCustomer(null)
      resetForm()
    }
  }

  const handleDeleteCustomer = async (id: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setCustomers(customers.filter((c) => c.id !== id))
      } else {
        fetchCustomers()
      }
    } catch (err) {
      console.error('Error deleting customer:', err)
    } finally {
      setSaving(false)
      setDeletingCustomerId(null)
    }
  }

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.mobileNumber.includes(searchTerm) ||
      c.billingAddress.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-emerald-800 text-[11px] font-extrabold uppercase tracking-wider bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
            <Users className="w-3.5 h-3.5 text-emerald-700" />
            <span>Customer Master Directory</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Customers Directory</h1>
          <p className="text-xs text-slate-500">
            Manage buyer accounts, mobile contacts, verified billing addresses, and credit limit terms.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-gold text-xs py-2.5 px-4 shadow-sm font-bold flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Customer</span>
          </button>
        </div>
      </div>

      {/* Customer Directory Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="font-bold text-slate-900 text-sm">Active Buyers Directory ({filteredCustomers.length})</div>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search customer name or mobile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:border-amber-600 text-slate-900"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            <span className="text-xs font-semibold">Loading customers from database...</span>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-slate-800">No Customers Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Click <strong>"Add New Customer"</strong> above to register buyers.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 font-extrabold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Mobile Number</th>
                  <th className="py-3 px-4">Billing Address</th>
                  <th className="py-3 px-4">Credit Limit</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                {filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{cust.name}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">{cust.mobileNumber}</td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">{cust.billingAddress}</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">{cust.creditLimitDays} Days</td>
                    <td className="py-3.5 px-4">
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                        {cust.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => openEditModal(cust)}
                        className="p-1.5 text-slate-600 hover:text-amber-600 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Edit Customer"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingCustomerId(cust.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Delete Customer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Customer Modal */}
      {(showAddModal || editingCustomer) && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900">
                {editingCustomer ? 'Edit Customer Details' : 'Add New Customer'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setEditingCustomer(null)
                  resetForm()
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editingCustomer ? handleUpdateCustomer : handleAddCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Mehta"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98250 12345"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/[^0-9+]/g, ''))}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-600 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Billing Address *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Plot 42, GIDC Industrial Estate, Surat, Gujarat"
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Credit Limit Days *</label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="30"
                  value={creditLimitDays}
                  onChange={(e) => setCreditLimitDays(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-600 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingCustomer(null)
                    resetForm()
                  }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-gold px-4 py-2 shadow-sm flex items-center gap-1.5 font-bold"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>{editingCustomer ? 'Update Customer' : 'Save Customer'}</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingCustomerId && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 border border-slate-200 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">Delete Customer?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to delete this customer record? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setDeletingCustomerId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteCustomer(deletingCustomerId)}
                disabled={saving}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1.5"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Delete</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
