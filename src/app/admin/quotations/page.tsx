'use client'

import { useState, useEffect } from 'react'
import { FileText, Plus, Search, Eye, Mail, Building2, CheckCircle2, Clock, X, Loader2, Pencil, Trash2, Share2 } from 'lucide-react'
import ExportActionBar from '@/components/ExportActionBar'
import { exportToExcel, exportToPDF, printReport, shareOnWhatsApp } from '@/lib/exportUtils'

export interface QuoteRecord {
  id: string
  clientName: string
  company: string
  product: string
  qty: string
  delivery: string
  status: 'PENDING' | 'QUOTED' | 'ACCEPTED'
  date: string
}

export default function QuotationsPage() {
  const [quotes, setQuotes] = useState<QuoteRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingQuote, setEditingQuote] = useState<QuoteRecord | null>(null)
  const [deletingQuoteId, setDeletingQuoteId] = useState<string | null>(null)

  // Form State
  const [clientName, setClientName] = useState('')
  const [company, setCompany] = useState('')
  const [product, setProduct] = useState('')
  const [qty, setQty] = useState('')
  const [delivery, setDelivery] = useState('')
  const [status, setStatus] = useState<'PENDING' | 'QUOTED' | 'ACCEPTED'>('PENDING')

  const SAMPLE_QUOTES: QuoteRecord[] = [
    {
      id: 'RFQ-8001',
      clientName: 'Rajesh Mehta',
      company: 'Mehta Chemical Industries',
      product: 'Soda Ash Dense (Light Grade)',
      qty: '50 Metric Tons',
      delivery: 'Mundra Port, Gujarat',
      status: 'PENDING',
      date: '2026-09-03',
    },
    {
      id: 'RFQ-8002',
      clientName: 'Suresh Patel',
      company: 'Patel Agri Commodities',
      product: 'PP Woven Jumbo Bags (1 MT)',
      qty: '500 Pieces',
      delivery: 'Kandla Port, Gujarat',
      status: 'QUOTED',
      date: '2026-09-03',
    },
  ]

  const fetchQuotes = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/quotes')
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setQuotes(
          data.data.map((q: any) => ({
            id: q.id,
            clientName: q.clientName,
            company: q.companyName || q.clientName,
            product: q.productName,
            qty: `${q.quantity} ${q.unit || 'Kg'}`,
            delivery: q.deliveryLocation || 'Mundra Port, Gujarat',
            status: q.status || 'PENDING',
            date: q.createdAt ? new Date(q.createdAt).toISOString().split('T')[0] : '2026-09-03',
          }))
        )
      } else {
        setQuotes([])
      }
    } catch (err) {
      console.error('Error fetching quotes:', err)
      setQuotes([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuotes()
  }, [])

  const resetForm = () => {
    setClientName('')
    setCompany('')
    setProduct('')
    setQty('')
    setDelivery('')
    setStatus('PENDING')
  }

  const handleAddQuote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientName || !product || !qty) return

    setSaving(true)
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          companyName: company,
          productName: product,
          quantity: parseInt(qty, 10) || 1,
          unit: 'Kg',
          deliveryLocation: delivery,
          status,
        }),
      })
      const data = await res.json()
      if (data.success && data.data) {
        fetchQuotes()
      } else {
        fetchQuotes()
      }
    } catch (err) {
      console.error('Error adding quote:', err)
    } finally {
      setSaving(false)
      setShowAddModal(false)
      resetForm()
    }
  }

  const openEditModal = (q: QuoteRecord) => {
    setEditingQuote(q)
    setClientName(q.clientName || '')
    setCompany(q.company || '')
    setProduct(q.product || '')
    setQty(q.qty ? q.qty.replace(/[^0-9]/g, '') : '')
    setDelivery(q.delivery || '')
    setStatus(q.status || 'PENDING')
  }

  const handleUpdateQuote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingQuote) return

    setSaving(true)
    try {
      const res = await fetch(`/api/quotes/${editingQuote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          companyName: company,
          productName: product,
          quantity: parseInt(qty, 10) || 1,
          deliveryLocation: delivery,
          status,
        }),
      })
      const data = await res.json()
      if (data.success && data.data) {
        setQuotes(quotes.map((q) => (q.id === editingQuote.id ? data.data : q)))
      } else {
        fetchQuotes()
      }
    } catch (err) {
      console.error('Error updating quotation:', err)
    } finally {
      setSaving(false)
      setEditingQuote(null)
      resetForm()
    }
  }

  const handleDeleteQuote = async (id: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/quotes/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setQuotes(quotes.filter((q) => q.id !== id))
      } else {
        fetchQuotes()
      }
    } catch (err) {
      console.error('Error deleting quotation:', err)
    } finally {
      setSaving(false)
      setDeletingQuoteId(null)
    }
  }

  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(quotes.map((q) => q.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const getExportQuotes = () => {
    return selectedIds.length > 0
      ? quotes.filter((q) => selectedIds.includes(q.id))
      : quotes
  }

  const handleExportPDF = () => {
    const exportItems = getExportQuotes()
    exportToPDF({
      title: 'Quotations & RFQs Report',
      headers: ['RFQ ID', 'Date', 'Client Name', 'Company', 'Product Requested', 'Quantity', 'Destination', 'Status'],
      data: exportItems.map((q) => [q.id, q.date, q.clientName, q.company, q.product, q.qty, q.delivery, q.status]),
      filename: 'Quotations_Report',
    })
  }

  const handleExportExcel = () => {
    const exportItems = getExportQuotes()
    exportToExcel({
      filename: 'Quotations_Report',
      headers: ['RFQ ID', 'Date', 'Client Name', 'Company', 'Product Requested', 'Quantity', 'Destination', 'Status'],
      rows: exportItems.map((q) => [q.id, q.date, q.clientName, q.company, q.product, q.qty, q.delivery, q.status]),
    })
  }

  const handlePrint = () => {
    const exportItems = getExportQuotes()
    printReport({
      title: 'Quotations & RFQs Report',
      headers: ['RFQ ID', 'Date', 'Client Name', 'Company', 'Product Requested', 'Quantity', 'Destination', 'Status'],
      data: exportItems.map((q) => [q.id, q.date, q.clientName, q.company, q.product, q.qty, q.delivery, q.status]),
    })
  }

  const handleShareWhatsApp = () => {
    const exportItems = getExportQuotes()
    const summary =
      `📄 *Quotations & RFQs Pipeline*\nTotal Quotes: ${exportItems.length}\n\n*Recent Quotes:*\n` +
      exportItems
        .slice(0, 10)
        .map((q) => `• ${q.id} | ${q.clientName} (${q.company}) | ${q.product} (${q.qty}) - Status: ${q.status}`)
        .join('\n')
    shareOnWhatsApp(summary)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-amber-800 text-[11px] font-extrabold uppercase tracking-wider bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
            <FileText className="w-3.5 h-3.5 text-amber-700" />
            <span>RFQ & Quotation Processing Desk</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Quotations & RFQs</h1>
          <p className="text-xs text-slate-500">
            Manage client quotation requests, generate proforma invoices, and track quote pipelines.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setShowAddModal(true)} className="btn-gold text-xs py-2.5 px-4 shadow-sm font-bold flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>Create New Quotation</span>
          </button>
        </div>
      </div>

      {/* Quotations Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col lg:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="font-bold text-slate-900 text-sm">Quotations Pipeline ({quotes.length})</div>
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
            <span className="text-xs font-semibold">Loading quotations from database...</span>
          </div>
        ) : quotes.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-slate-800">No Quotations Created</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Click <strong>"Create New Quotation"</strong> above to issue formal RFQ quotes.
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
                      checked={quotes.length > 0 && selectedIds.length === quotes.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-4">RFQ ID</th>
                  <th className="py-3 px-4">Client / Company</th>
                  <th className="py-3 px-4">Product Requested</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                {quotes.map((q) => (
                  <tr key={q.id} className={`hover:bg-slate-50 ${selectedIds.includes(q.id) ? 'bg-amber-50/40' : ''}`}>
                    <td className="py-3.5 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(q.id)}
                        onChange={() => handleToggleSelect(q.id)}
                        className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{q.id}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{q.clientName}</div>
                      <div className="text-[11px] text-slate-500">{q.company}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{q.product}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">{q.qty}</td>
                    <td className="py-3.5 px-4 text-slate-600">{q.delivery}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                          q.status === 'ACCEPTED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : q.status === 'QUOTED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {q.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => {
                          const msg = `📄 *Quotation Details*\nRFQ ID: ${q.id}\nClient: ${q.clientName}\nCompany: ${q.company}\nProduct: ${q.product}\nQuantity: ${q.qty}\nDelivery: ${q.delivery}\nStatus: ${q.status}`
                          shareOnWhatsApp(msg)
                        }}
                        className="p-1.5 text-emerald-600 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors"
                        title="Share on WhatsApp"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(q)}
                        className="p-1.5 text-slate-600 hover:text-amber-600 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Edit Quotation"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingQuoteId(q.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Delete Quotation"
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

      {/* Add / Edit Quotation Modal */}
      {(showAddModal || editingQuote) && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900">
                {editingQuote ? 'Edit Quotation Details' : 'Create New Quotation / RFQ'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setEditingQuote(null)
                  resetForm()
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editingQuote ? handleUpdateQuote : handleAddQuote} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Client Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Mehta"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Company / Organization</label>
                <input
                  type="text"
                  placeholder="e.g. Mehta Chemical Industries"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Product Requested *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Soda Ash Light Grade"
                    value={product}
                    onChange={(e) => setProduct(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quantity *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 50"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Delivery Destination</label>
                <input
                  type="text"
                  placeholder="e.g. Mundra Port, Gujarat"
                  value={delivery}
                  onChange={(e) => setDelivery(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Quote Status *</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-600 bg-white font-semibold"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="QUOTED">QUOTED</option>
                  <option value="ACCEPTED">ACCEPTED</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingQuote(null)
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
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>{editingQuote ? 'Update Quotation' : 'Save Quotation'}</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Quotation Confirmation Dialog */}
      {deletingQuoteId && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 border border-slate-200 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">Delete Quotation?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to delete this quotation request? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setDeletingQuoteId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteQuote(deletingQuoteId)}
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
