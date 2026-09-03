'use client'

import { useState, useEffect } from 'react'
import { ShoppingBag, Plus, Truck, Calendar, PackageCheck, AlertCircle, CheckCircle2, X, Loader2, Pencil, Trash2 } from 'lucide-react'

export interface PurchaseRecord {
  id: string
  orderNumber?: string
  vendor: string
  item: string
  quantity: number
  totalAmount: number
  date: string
  status: 'DELIVERED' | 'IN-TRANSIT' | 'PENDING'
}

export default function PurchasePage() {
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingPurchase, setEditingPurchase] = useState<PurchaseRecord | null>(null)
  const [deletingPurchaseId, setDeletingPurchaseId] = useState<string | null>(null)

  // Form State
  const [vendor, setVendor] = useState('')
  const [item, setItem] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [totalAmount, setTotalAmount] = useState('')
  const [status, setStatus] = useState<'DELIVERED' | 'IN-TRANSIT' | 'PENDING'>('DELIVERED')

  const SAMPLE_PURCHASES: PurchaseRecord[] = [
    {
      id: 'PO-2026-101',
      orderNumber: 'PO-2026-101',
      vendor: 'Gujarat Chemicals & Minerals Corp',
      item: 'Raw Soda Ash Boulders',
      quantity: 50,
      totalAmount: 450000,
      date: '2026-09-03',
      status: 'DELIVERED',
    },
    {
      id: 'PO-2026-102',
      orderNumber: 'PO-2026-102',
      vendor: 'Saurashtra Lime & Gypsum Mines',
      item: 'Refined Calcium Lime',
      quantity: 100,
      totalAmount: 180000,
      date: '2026-09-03',
      status: 'DELIVERED',
    },
  ]

  const fetchPurchases = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/purchase')
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setPurchases(
          data.data.map((p: any) => ({
            id: p.id,
            orderNumber: p.orderNumber || p.id,
            vendor: p.vendor,
            item: p.item,
            quantity: p.quantity || 1,
            totalAmount: p.totalAmount || 0,
            date: p.date ? new Date(p.date).toISOString().split('T')[0] : '2026-09-03',
            status: p.status || 'DELIVERED',
          }))
        )
      } else {
        setPurchases([])
      }
    } catch (err) {
      console.error('Error fetching purchases:', err)
      setPurchases([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPurchases()
  }, [])

  const resetForm = () => {
    setVendor('')
    setItem('')
    setQuantity('1')
    setTotalAmount('')
    setStatus('DELIVERED')
  }

  const handleAddPurchase = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vendor || !item || !totalAmount) return

    setSaving(true)
    try {
      const res = await fetch('/api/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor,
          item,
          quantity: parseInt(quantity, 10) || 1,
          totalAmount: parseFloat(totalAmount) || 0,
          status,
        }),
      })
      const data = await res.json()
      if (data.success && data.data) {
        fetchPurchases()
      } else {
        fetchPurchases()
      }
    } catch (err) {
      console.error('Error creating purchase:', err)
    } finally {
      setSaving(false)
      setShowAddModal(false)
      resetForm()
    }
  }

  const openEditModal = (p: PurchaseRecord) => {
    setEditingPurchase(p)
    setVendor(p.vendor || '')
    setItem(p.item || '')
    setQuantity(p.quantity ? String(p.quantity) : '1')
    setTotalAmount(p.totalAmount ? String(p.totalAmount) : '')
    setStatus(p.status || 'DELIVERED')
  }

  const handleUpdatePurchase = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPurchase) return

    setSaving(true)
    try {
      const res = await fetch(`/api/purchase/${editingPurchase.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor,
          item,
          quantity: parseInt(quantity, 10) || 1,
          totalAmount: parseFloat(totalAmount) || 0,
          status,
        }),
      })
      const data = await res.json()
      if (data.success && data.data) {
        setPurchases(purchases.map((p) => (p.id === editingPurchase.id ? data.data : p)))
      } else {
        fetchPurchases()
      }
    } catch (err) {
      console.error('Error updating purchase order:', err)
    } finally {
      setSaving(false)
      setEditingPurchase(null)
      resetForm()
    }
  }

  const handleDeletePurchase = async (id: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/purchase/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setPurchases(purchases.filter((p) => p.id !== id))
      } else {
        fetchPurchases()
      }
    } catch (err) {
      console.error('Error deleting purchase order:', err)
    } finally {
      setSaving(false)
      setDeletingPurchaseId(null)
    }
  }

  const totalPurchasesSum = purchases.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0)
  const inTransitCount = purchases.filter((p) => p.status === 'IN-TRANSIT').length
  const deliveredCount = purchases.filter((p) => p.status === 'DELIVERED').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-amber-800 text-[11px] font-extrabold uppercase tracking-wider bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
            <ShoppingBag className="w-3.5 h-3.5 text-amber-700" />
            <span>Material Procurement & Purchase Orders</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Purchase Orders & Procurement</h1>
          <p className="text-xs text-slate-500">
            Manage supplier purchase orders, raw material consignments, and inward inventory logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setShowAddModal(true)} className="btn-gold text-xs py-2.5 px-4 shadow-sm font-bold flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>Create Purchase Order</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-slate-500 text-xs font-bold">Total Purchases Value</span>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">₹ {totalPurchasesSum.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500">{purchases.length} consignments logged</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-slate-500 text-xs font-bold">In-Transit Freight</span>
          <div className="text-2xl font-extrabold text-amber-800 font-mono">{inTransitCount} Shipments</div>
          <div className="text-[11px] text-amber-700 font-semibold">Active freight</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-slate-500 text-xs font-bold">Inventory Received</span>
          <div className="text-2xl font-extrabold text-emerald-700 font-mono">{deliveredCount} Completed</div>
          <div className="text-[11px] text-emerald-600 font-semibold">Inspected & cleared</div>
        </div>
      </div>

      {/* Purchase Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="font-bold text-slate-900 text-sm">Purchase Order Register ({purchases.length})</div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            <span className="text-xs font-semibold">Loading purchase orders from database...</span>
          </div>
        ) : purchases.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-slate-800">No Purchase Orders Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Click <strong>"Create Purchase Order"</strong> above to log material procurement orders.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 font-extrabold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">PO Number</th>
                  <th className="py-3 px-4">Vendor</th>
                  <th className="py-3 px-4">Item & Quantity</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                {purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-900 bg-amber-50/50 rounded-lg">
                      {p.orderNumber || p.id}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{p.vendor}</td>
                    <td className="py-3.5 px-4 text-slate-800 font-medium">
                      {p.item} ({p.quantity} units)
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{p.date}</td>
                    <td className="py-3.5 px-4 font-mono font-extrabold text-slate-900">
                      ₹ {p.totalAmount ? p.totalAmount.toLocaleString() : 0}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                          p.status === 'DELIVERED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.status === 'IN-TRANSIT'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => openEditModal(p)}
                        className="p-1.5 text-slate-600 hover:text-amber-600 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Edit Purchase Order"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingPurchaseId(p.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Delete Purchase Order"
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

      {/* Add / Edit PO Modal */}
      {(showAddModal || editingPurchase) && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900">
                {editingPurchase ? 'Edit Purchase Order' : 'Create New Purchase Order'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setEditingPurchase(null)
                  resetForm()
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editingPurchase ? handleUpdatePurchase : handleAddPurchase} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Vendor / Supplier Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gujarat Chemicals Corp"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Material / Item Specification *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Soda Ash Light Grade (25 MT)"
                  value={item}
                  onChange={(e) => setItem(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quantity *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 450000"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Freight Status *</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-600 bg-white"
                >
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="IN-TRANSIT">IN-TRANSIT</option>
                  <option value="PENDING">PENDING</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingPurchase(null)
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
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>{editingPurchase ? 'Update Purchase Order' : 'Save Purchase Order'}</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete PO Confirmation Dialog */}
      {deletingPurchaseId && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 border border-slate-200 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">Delete Purchase Order?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to delete this purchase order record? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setDeletingPurchaseId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeletePurchase(deletingPurchaseId)}
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
