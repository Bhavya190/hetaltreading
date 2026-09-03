'use client'

import { useState } from 'react'
import { Send, CheckCircle2, AlertCircle, Loader2, Sparkles, Building2 } from 'lucide-react'

export default function QuickQuoteForm({ defaultProduct = '' }: { defaultProduct?: string }) {
  const [formData, setFormData] = useState({
    clientName: '',
    email: '',
    phone: '',
    companyName: '',
    productName: defaultProduct || 'Refined Hydrated Lime',
    quantity: '100',
    unit: 'Metric Ton',
    targetPrice: '',
    deliveryLocation: '',
    notes: '',
  })

  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (data.success) {
        setSubmitted(true)
      } else {
        setErrorMsg(data.error || 'Failed to submit quote request.')
      }
    } catch (err: any) {
      setErrorMsg('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="glass-card p-8 text-center space-y-4 border-emerald-200 bg-emerald-50/40 animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-emerald-100 border border-emerald-300 rounded-full flex items-center justify-center mx-auto text-emerald-700">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h3 className="text-2xl font-extrabold text-slate-900">RFQ Logged into Shop CRM!</h3>
        <p className="text-slate-700 text-sm max-w-md mx-auto leading-relaxed">
          Thank you, <span className="text-amber-800 font-bold">{formData.clientName}</span>. Your RFQ for <span className="text-slate-900 font-semibold">{formData.productName} ({formData.quantity} {formData.unit})</span> has been stored in our CRM database. Our sales desk will issue official pricing within 24 hours.
        </p>
        <button
          onClick={() => {
            setSubmitted(false)
            setFormData({
              clientName: '',
              email: '',
              phone: '',
              companyName: '',
              productName: 'Refined Hydrated Lime',
              quantity: '100',
              unit: 'Metric Ton',
              targetPrice: '',
              deliveryLocation: '',
              notes: '',
            })
          }}
          className="btn-outline-navy text-xs mt-4"
        >
          Submit Another Request
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card p-6 sm:p-8 space-y-6 border-slate-200 shadow-md">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 uppercase tracking-wider bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
          <Building2 className="w-3.5 h-3.5" />
          <span>B2B Quotation Engine</span>
        </div>
        <h3 className="text-xl font-extrabold text-slate-900">
          Request Bulk Trade Quote (RFQ)
        </h3>
        <p className="text-xs text-slate-600">
          Direct factory pricing and custom specs logged automatically into our shop CRM desk.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Rajesh Shah"
            value={formData.clientName}
            onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Business Email *
          </label>
          <input
            type="email"
            required
            placeholder="name@company.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Phone / WhatsApp *
          </label>
          <input
            type="tel"
            required
            placeholder="+91 98765 43210"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/[^0-9+]/g, '') })}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Company Name
          </label>
          <input
            type="text"
            placeholder="e.g. Shah Industries Pvt Ltd"
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-colors"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Product / Commodity Required *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Refined Hydrated Lime / Basmati Rice / Stainless Steel Fasteners"
            value={formData.productName}
            onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Order Quantity *
          </label>
          <input
            type="number"
            required
            min="1"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Unit
          </label>
          <select
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-colors"
          >
            <option value="Metric Ton">Metric Ton (MT)</option>
            <option value="Kg">Kilogram (Kg)</option>
            <option value="Piece">Piece / Unit</option>
            <option value="Container (20ft)">Container (20ft)</option>
            <option value="Container (40ft)">Container (40ft)</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Destination / Port of Delivery
          </label>
          <input
            type="text"
            placeholder="e.g. Mundra Port, Gujarat / ICD Ahmedabad / CIF Dubai"
            value={formData.deliveryLocation}
            onChange={(e) => setFormData({ ...formData, deliveryLocation: e.target.value })}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-colors"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Additional Specifications / Notes
          </label>
          <textarea
            rows={3}
            placeholder="Specify purity, mesh size, custom packaging, or inspection standards..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-colors"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full btn-gold py-3.5 text-sm shadow-md shadow-amber-600/20 disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Storing RFQ in Database...</span>
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            <span>Submit Quotation Request</span>
          </>
        )}
      </button>
    </form>
  )
}
