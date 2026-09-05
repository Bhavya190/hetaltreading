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
    unit: 'Kilogram',
    targetPrice: '',
    deliveryLocation: '',
    notes: '',
  })

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit RFQ. Please try again.')
      }

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
      
      <div className="flex items-center space-x-2 text-amber-800 mb-2">
        <Sparkles className="w-5 h-5" />
        <span className="text-xs font-bold uppercase tracking-wider">Instant Quotation Engine</span>
      </div>

      <h3 className="text-2xl font-black text-slate-900 mb-2">
        Request Official B2B Quote
      </h3>
      <p className="text-slate-600 text-sm mb-6">
        Submit item specs & target pricing. Receive a formal GST-compliant commercial invoice proposal.
      </p>

      {success ? (
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-6 text-center space-y-4">
          <CheckCircle2 className="w-12 h-12 text-amber-600 mx-auto" />
          <h4 className="text-lg font-bold text-slate-900">Request Dispatched!</h4>
          <p className="text-sm text-slate-700">
            Thank you, <span className="text-amber-800 font-bold">{formData.clientName}</span>. Your RFQ for <span className="text-slate-900 font-semibold">{formData.productName} ({formData.quantity} {formData.unit})</span> has been stored in our CRM database. Our sales desk will issue official pricing within 24 hours.
          </p>
          <button
            onClick={() => {
              setSuccess(false)
              setFormData({
                clientName: '',
                email: '',
                phone: '',
                companyName: '',
                productName: 'Refined Hydrated Lime',
                quantity: '100',
                unit: 'Kilogram',
                targetPrice: '',
                deliveryLocation: '',
                notes: '',
              })
            }}
            className="text-xs font-bold text-amber-800 underline hover:text-amber-900"
          >
            Submit Another RFQ
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                placeholder="e.g. Rajesh Kumar"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Phone / WhatsApp <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="rajesh@company.com"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Company Name (Optional)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="e.g. Apex Minerals Pvt Ltd"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-colors"
                />
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-colors font-mono"
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
                <option value="Kilogram">Kilogram</option>
                <option value="Gram">Gram</option>
                <option value="Meter">Meter</option>
                <option value="Liter">Liter</option>
                <option value="Milileter">Milileter</option>
                <option value="Pieces">Pieces</option>
                <option value="Bags">Bags</option>
              </select>
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Destination / Port of Delivery
            </label>
            <input
              type="text"
              placeholder="e.g. Mundra Port, Gujarat"
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
              placeholder="Specify purity, inspection standards, or specific deadlines..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Submit RFQ</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  )
}
