'use client'

import { useState, useEffect } from 'react'
import { Truck, Plus, Mail, Phone, MapPin, Building2, CheckCircle2, X, Loader2 } from 'lucide-react'

export interface VendorRecord {
  id: string
  vendorCode?: string
  name: string
  category: string
  contactPerson: string
  phone: string
  city: string
  status: 'ACTIVE' | 'INACTIVE'
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<VendorRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  // Form State
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Industrial Chemicals & Minerals')
  const [contactPerson, setContactPerson] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')

  const SAMPLE_VENDORS: VendorRecord[] = [
    {
      id: 'VEN-01',
      vendorCode: 'VEN-01',
      name: 'Gujarat Chemicals & Minerals Corp',
      category: 'Industrial Chemicals & Minerals',
      contactPerson: 'Kishorebhai Patel',
      phone: '+91 98250 11223',
      city: 'Ahmedabad, Gujarat',
      status: 'ACTIVE',
    },
    {
      id: 'VEN-02',
      vendorCode: 'VEN-02',
      name: 'Saurashtra Lime & Gypsum Mines',
      category: 'Industrial Chemicals & Minerals',
      contactPerson: 'Ramesh Sundaram',
      phone: '+91 99090 44556',
      city: 'Porbandar, Gujarat',
      status: 'ACTIVE',
    },
  ]

  const fetchVendors = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/vendors')
      const data = await res.json()
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setVendors(data.data)
      } else {
        setVendors(SAMPLE_VENDORS)
      }
    } catch (err) {
      console.error('Error loading vendors:', err)
      setVendors(SAMPLE_VENDORS)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVendors()
  }, [])

  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !contactPerson || !phone) return

    setSaving(true)
    try {
      const res = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category, contactPerson, phone, city }),
      })
      const data = await res.json()

      if (data.success && data.data) {
        setVendors([data.data, ...vendors])
      } else {
        const newVendor: VendorRecord = {
          id: `VEN-0${1 + vendors.length}`,
          vendorCode: `VEN-0${1 + vendors.length}`,
          name,
          category,
          contactPerson,
          phone,
          city,
          status: 'ACTIVE',
        }
        setVendors([newVendor, ...vendors])
      }
    } catch (err) {
      console.error('Error adding vendor:', err)
      const newVendor: VendorRecord = {
        id: `VEN-0${1 + vendors.length}`,
        vendorCode: `VEN-0${1 + vendors.length}`,
        name,
        category,
        contactPerson,
        phone,
        city,
        status: 'ACTIVE',
      }
      setVendors([newVendor, ...vendors])
    } finally {
      setSaving(false)
      setName('')
      setContactPerson('')
      setPhone('')
      setCity('')
      setShowAddModal(false)
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-amber-800 text-[11px] font-extrabold uppercase tracking-wider bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
            <Truck className="w-3.5 h-3.5 text-amber-700" />
            <span>Supplier Directory & Vendor CRM</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Vendors & Suppliers Directory</h1>
          <p className="text-xs text-slate-500">Manage raw material suppliers, mine operators, manufacturers, and logistics partners.</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setShowAddModal(true)} className="btn-gold text-xs py-2.5 px-4 shadow-sm">
            <Plus className="w-4 h-4" />
            <span>Add New Vendor</span>
          </button>
        </div>
      </div>

      {/* Vendors Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="font-bold text-slate-900 text-sm">Active Suppliers & Vendors ({vendors.length})</div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            <span className="text-xs font-semibold">Loading vendors from database...</span>
          </div>
        ) : vendors.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Truck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-slate-800">No Vendors Registered</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Click <strong>"Add New Vendor"</strong> above to register suppliers and raw material partners.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 font-extrabold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Vendor ID</th>
                  <th className="py-3 px-4">Company Name</th>
                  <th className="py-3 px-4">Supply Category</th>
                  <th className="py-3 px-4">Key Contact</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                {vendors.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{v.vendorCode || v.id}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{v.name}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-amber-900">
                      <span className="bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {v.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{v.contactPerson}</div>
                      <div className="text-[11px] text-slate-500">{v.phone}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400" /> {v.city || '-'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Vendor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900">Register New Supplier / Vendor</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddVendor} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gujarat Quarries Ltd"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Supply Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-600 bg-white"
                >
                  <option value="Industrial Chemicals & Minerals">Industrial Chemicals & Minerals</option>
                  <option value="Agricultural Commodities">Agricultural Commodities</option>
                  <option value="Metals & Hardware">Metals & Hardware</option>
                  <option value="Packaging & Logistics">Packaging & Logistics</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Key Contact Person *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikram Patel"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98250 11223"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9+]/g, ''))}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">City / Location</label>
                <input
                  type="text"
                  placeholder="e.g. Porbandar, Gujarat"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-600"
                />
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
                  className="btn-gold px-4 py-2 shadow-sm flex items-center gap-1.5"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save Vendor</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
