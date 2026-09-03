'use client'

import { useState, useEffect } from 'react'
import { Users, Plus, Phone, MapPin, Clock, X, Search, ShieldCheck, Loader2 } from 'lucide-react'

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
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Form State
  const [name, setName] = useState('')
  const [mobileNumber, setMobileNumber] = useState('')
  const [billingAddress, setBillingAddress] = useState('')
  const [creditLimitDays, setCreditLimitDays] = useState('30')

  // Load customers from Database API
  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/customers')
      const data = await res.json()
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setCustomers(data.data)
      } else {
        // Fallback default sample data if db is empty initially
        setCustomers([
          {
            id: 'CUST-101',
            name: 'Rajesh Mehta',
            mobileNumber: '+91 98250 12345',
            billingAddress: 'Plot 42, GIDC Industrial Estate, Sachin, Surat, Gujarat - 394230',
            creditLimitDays: 30,
            status: 'ACTIVE',
          },
          {
            id: 'CUST-102',
            name: 'Suresh Patel',
            mobileNumber: '+91 99090 67890',
            billingAddress: '102 Harmony Complex, Ring Road, Ahmedabad, Gujarat - 380009',
            creditLimitDays: 45,
            status: 'ACTIVE',
          },
        ])
      }
    } catch (err) {
      console.error('Failed to fetch customer data from API:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !mobileNumber || !billingAddress) return

    setSaving(true)
    const payload = {
      name,
      mobileNumber,
      billingAddress,
      creditLimitDays: parseInt(creditLimitDays, 10) || 30,
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
        // Fallback client-side state append
        const newCustomer: CustomerRecord = {
          id: `CUST-10${1 + customers.length}`,
          name,
          mobileNumber,
          billingAddress,
          creditLimitDays: parseInt(creditLimitDays, 10) || 30,
          status: 'ACTIVE',
        }
        setCustomers([newCustomer, ...customers])
      }
    } catch (err) {
      console.error('Error saving customer:', err)
      const newCustomer: CustomerRecord = {
        id: `CUST-10${1 + customers.length}`,
        name,
        mobileNumber,
        billingAddress,
        creditLimitDays: parseInt(creditLimitDays, 10) || 30,
        status: 'ACTIVE',
      }
      setCustomers([newCustomer, ...customers])
    } finally {
      setSaving(false)
      setName('')
      setMobileNumber('')
      setBillingAddress('')
      setCreditLimitDays('30')
      setShowAddModal(false)
    }
  }

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.mobileNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.billingAddress.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-amber-800 text-[11px] font-extrabold uppercase tracking-wider bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
            <Users className="w-3.5 h-3.5 text-amber-700" />
            <span>Customer Accounts Directory</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Register & Manage Customers</h1>
          <p className="text-xs text-slate-500">
            Maintain client records including contact details, billing addresses, and credit terms.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setShowAddModal(true)} className="btn-gold text-xs py-2.5 px-4 shadow-sm">
            <Plus className="w-4 h-4" />
            <span>Register Customer Account</span>
          </button>
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="font-bold text-slate-900 text-sm">Registered Accounts ({customers.length})</div>
          
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, mobile, address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:border-amber-600 text-slate-900"
            />
          </div>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-slate-800">No Customers Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Click <strong>"Register Customer Account"</strong> above to add customer records.
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
                  <th className="py-3 px-4">Billing Address</th>
                  <th className="py-3 px-4">Credit Limit</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{c.id}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">{c.name}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-mono text-slate-900">
                        <Phone className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span>{c.mobileNumber}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="flex items-start gap-1.5 text-slate-600 leading-relaxed">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="truncate" title={c.billingAddress}>{c.billingAddress}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 font-semibold px-2.5 py-1 rounded-lg border border-amber-200/70">
                        <Clock className="w-3 h-3 text-amber-700" />
                        <span>{c.creditLimitDays} Days</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <h3 className="font-extrabold text-base text-slate-900">Register Customer Account</h3>
                <p className="text-[11px] text-slate-500">Fill in details to set up a new customer account profile.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  1. Customer Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Mehta"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                  placeholder="Enter complete billing address (Street, Area, City, Pincode)..."
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 resize-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-gold px-5 py-2 shadow-sm font-bold flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Customer Account</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

