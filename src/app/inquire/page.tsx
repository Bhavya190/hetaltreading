'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import QuickQuoteForm from '@/components/QuickQuoteForm'
import { Mail, Phone, MapPin, Clock, MessageSquare, Send, CheckCircle2, AlertCircle, Loader2, Building2 } from 'lucide-react'

function InquireFormContent() {
  const searchParams = useSearchParams()
  const defaultProduct = searchParams.get('product') || ''

  const [contactData, setContactData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    subject: 'General Trade Inquiry',
    message: '',
  })

  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData),
      })

      const data = await res.json()
      if (data.success) {
        setSubmitted(true)
      } else {
        setErrorMsg(data.error || 'Failed to submit inquiry.')
      }
    } catch (err) {
      setErrorMsg('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full space-y-12 flex-1">
      
      {/* Page Header */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 text-amber-800 text-xs font-bold uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
          <MessageSquare className="w-3.5 h-3.5 text-amber-700" />
          <span>Direct Trade Inquiry & RFQ</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
          Contact Hetal Trading Company
        </h1>
        <p className="text-slate-600 text-sm">
          Submit commodity quote requests or send direct inquiry messages logged into our Shop CRM.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Left Column: Quick Quote Form */}
        <div className="lg:col-span-7">
          <QuickQuoteForm defaultProduct={defaultProduct} />
        </div>

        {/* Right Column: Direct Contact Info & Inquiry Form */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Contact Details Card */}
          <div className="glass-card p-6 space-y-6 bg-white border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-700" />
              <span>Corporate Office & Contacts</span>
            </h3>

            <ul className="space-y-4 text-xs text-slate-700">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">Hetal Trading Hub</div>
                  <div className="text-slate-600">Commercial Zone, GIDC Industrial Estate, Gujarat, India</div>
                </div>
              </li>

              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-amber-700 shrink-0" />
                <div>
                  <div className="font-bold text-slate-900">Trade Support Helpline</div>
                  <div className="text-slate-600">+91 (028) 4567-8900 / +91 98765 43210</div>
                </div>
              </li>

              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-amber-700 shrink-0" />
                <div>
                  <div className="font-bold text-slate-900">Email Address</div>
                  <div className="text-slate-600">info@hetaltrading.com / sales@hetaltrading.com</div>
                </div>
              </li>

              <li className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-700 shrink-0" />
                <div>
                  <div className="font-bold text-slate-900">Business Working Hours</div>
                  <div className="text-slate-600">Mon - Sat: 9:00 AM - 7:00 PM IST (24/7 Online RFQ)</div>
                </div>
              </li>
            </ul>
          </div>

          {/* Quick General Inquiry */}
          <div className="glass-card p-6 space-y-4 bg-white border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-900">Send Direct Message</h3>

            {submitted ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl space-y-2 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <div className="font-bold text-slate-900">Message Logged into CRM!</div>
                <div>Our team will review your inquiry and get back to you shortly.</div>
                <button
                  onClick={() => setSubmitted(false)}
                  className="btn-outline-navy text-[11px] py-1 px-3 mt-2"
                >
                  Send Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-3">
                {errorMsg && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Name"
                    value={contactData.name}
                    onChange={(e) => setContactData({ ...contactData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="email@domain.com"
                    value={contactData.email}
                    onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Message *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Write your query or message here..."
                    value={contactData.message}
                    onChange={(e) => setContactData({ ...contactData, message: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-amber-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-gold py-2.5 text-xs shadow-xs disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
                  ) : (
                    <span className="flex items-center justify-center gap-1.5">
                      <Send className="w-3.5 h-3.5" /> Send Message
                    </span>
                  )}
                </button>
              </form>
            )}
          </div>

        </div>

      </div>

    </div>
  )
}

export default function InquirePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-amber-100 selection:text-amber-900">
      <Navbar />
      <Suspense fallback={<div className="p-12 text-center text-slate-500 text-sm">Loading inquiry form...</div>}>
        <InquireFormContent />
      </Suspense>
      <Footer />
    </div>
  )
}
