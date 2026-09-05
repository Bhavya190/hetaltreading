'use client'

import { useState, useEffect } from 'react'
import { Truck, Plus, Mail, Phone, MapPin, Building2, CheckCircle2, X, Loader2, Pencil, Trash2, Share2 } from 'lucide-react'
import ExportActionBar from '@/components/ExportActionBar'
import { exportToExcel, exportToPDF, printReport, shareOnWhatsApp } from '@/lib/exportUtils'

export interface VendorRecord {
  id: string
  vendorCode?: string
  name: string
  contactPerson: string
  phone: string
  city: string
  status: 'ACTIVE' | 'INACTIVE'
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<VendorRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingVendor, setEditingVendor] = useState<VendorRecord | null>(null)
  const [deletingVendorId, setDeletingVendorId] = useState<string | null>(null)

  // Form State
  const [name, setName] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')

  const fetchVendors = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/vendors')
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setVendors(data.data)
      } else {
        setVendors([])
      }
    } catch (err) {
      console.error('Error loading vendors:', err)
      setVendors([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVendors()
  }, [])

  const resetForm = () => {
    setName('')
    setContactPerson('')
    setPhone('')
    setCity('')
  }

  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !contactPerson || !phone) return

    setSaving(true)
    try {
      const res = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, contactPerson, phone, city }),
      })
      const data = await res.json()
      if (data.success && data.data) {
        setVendors([data.data, ...vendors])
      } else {
        fetchVendors()
      }
    } catch (err) {
      console.error('Error adding vendor:', err)
    } finally {
      setSaving(false)
      setShowAddModal(false)
      resetForm()
    }
  }

  const openEditModal = (v: VendorRecord) => {
    setEditingVendor(v)
    setName(v.name || '')
    setContactPerson(v.contactPerson || '')
    setPhone(v.phone || '')
    setCity(v.city || '')
  }

  const handleUpdateVendor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingVendor) return

    setSaving(true)
    try {
      const res = await fetch(`/api/vendors/${editingVendor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, contactPerson, phone, city }),
      })
      const data = await res.json()
      if (data.success && data.data) {
        setVendors(vendors.map((v) => (v.id === editingVendor.id ? data.data : v)))
      } else {
        fetchVendors()
      }
    } catch (err) {
      console.error('Error updating vendor:', err)
    } finally {
      setSaving(false)
      setEditingVendor(null)
      resetForm()
    }
  }

  const handleDeleteVendor = async (id: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/vendors/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setVendors(vendors.filter((v) => v.id !== id))
      } else {
        fetchVendors()
      }
    } catch (err) {
      console.error('Error deleting vendor:', err)
    } finally {
      setSaving(false)
      setDeletingVendorId(null)
    }
  }

  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(vendors.map((v) => v.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const getExportVendors = () => {
    return selectedIds.length > 0
      ? vendors.filter((v) => selectedIds.includes(v.id))
      : vendors
  }

  const handleExportPDF = () => {
    const exportItems = getExportVendors()
    exportToPDF({
      title: 'Vendors & Suppliers Directory Report',
      headers: ['Vendor Code', 'Company Name', 'Key Contact', 'Phone', 'Location'],
      data: exportItems.map((v) => [
        v.vendorCode || v.id,
        v.name,
        v.contactPerson,
        v.phone,
        v.city || '-',
      ]),
      filename: 'Vendors_Directory',
    })
  }

  const handleExportExcel = () => {
    const exportItems = getExportVendors()
    exportToExcel({
      filename: 'Vendors_Directory',
      headers: ['Vendor Code', 'Company Name', 'Key Contact', 'Phone', 'City'],
      rows: exportItems.map((v) => [
        v.vendorCode || v.id,
        v.name,
        v.contactPerson,
        v.phone,
        v.city || '-',
      ]),
    })
  }

  const handlePrint = () => {
    const exportItems = getExportVendors()
    printReport({
      title: 'Vendors & Suppliers Directory Report',
      headers: ['Vendor Code', 'Company Name', 'Key Contact', 'Phone', 'Location'],
      data: exportItems.map((v) => [
        v.vendorCode || v.id,
        v.name,
        v.contactPerson,
        v.phone,
        v.city || '-',
      ]),
    })
  }

  const handleShareWhatsApp = () => {
    const exportItems = getExportVendors()
    const summary =
      `🚚 *Vendors & Suppliers Directory*\nTotal Vendors: ${exportItems.length}\n\n*Recent Suppliers:*\n` +
      exportItems
        .slice(0, 10)
        .map((v) => `• ${v.name} | Contact: ${v.contactPerson} (${v.phone})`)
        .join('\n')
    shareOnWhatsApp(summary)
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
          <p className="text-xs text-slate-500">
            Manage raw material suppliers, mine operators, manufacturers, and logistics partners.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setShowAddModal(true)} className="btn-gold text-xs py-2.5 px-4 shadow-sm font-bold flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>Add New Vendor</span>
          </button>
        </div>
      </div>

      {/* Vendors Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col lg:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="font-bold text-slate-900 text-sm">Active Suppliers & Vendors ({vendors.length})</div>
            {selectedIds.length > 0 && (
              <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
                {selectedIds.length} Selected
              </span>
            )}
          </div>
          <ExportActionBar
            onExportPDF={handleExportPDF}
            onExportExcel={handleExportExcel}
            onPrint={handlePrint}
            onShareWhatsApp={handleShareWhatsApp}
            selectedCount={selectedIds.length}
          />
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
                  <th className="py-3 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={vendors.length > 0 && selectedIds.length === vendors.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-4">Vendor ID</th>
                  <th className="py-3 px-4">Company Name</th>
                  <th className="py-3 px-4">Key Contact</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                {vendors.map((v) => (
                  <tr key={v.id} className={`hover:bg-slate-50 ${selectedIds.includes(v.id) ? 'bg-amber-50/40' : ''}`}>
                    <td className="py-3.5 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(v.id)}
                        onChange={() => handleToggleSelect(v.id)}
                        className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{v.vendorCode || v.id}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{v.name}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{v.contactPerson}</div>
                      <div className="text-[11px] text-slate-500">{v.phone}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" /> {v.city || '-'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => {
                          const msg = `🚚 *Vendor Contact Details*\nVendor Code: ${v.vendorCode || v.id}\nCompany: ${v.name}\nContact Person: ${v.contactPerson}\nPhone: ${v.phone}\nLocation: ${v.city || '-'}`
                          shareOnWhatsApp(msg, v.phone)
                        }}
                        className="p-1.5 text-emerald-600 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors"
                        title="Share Contact on WhatsApp"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(v)}
                        className="p-1.5 text-slate-600 hover:text-amber-600 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Edit Vendor"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingVendorId(v.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Delete Vendor"
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

      {/* Add / Edit Vendor Modal */}
      {(showAddModal || editingVendor) && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900">
                {editingVendor ? 'Edit Vendor Details' : 'Register New Supplier / Vendor'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setEditingVendor(null)
                  resetForm()
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editingVendor ? handleUpdateVendor : handleAddVendor} className="space-y-3 text-xs">
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
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingVendor(null)
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
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>{editingVendor ? 'Update Vendor' : 'Save Vendor'}</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Vendor Confirmation Dialog */}
      {deletingVendorId && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 border border-slate-200 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">Delete Vendor?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to delete this supplier record? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setDeletingVendorId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteVendor(deletingVendorId)}
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
