'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import DateRangeFilter, { DateFilterMode, filterRecordsByDate } from '@/components/DateRangeFilter'
import { 
  LayoutDashboard, 
  Database, 
  MessageSquare, 
  FileText, 
  Clock, 
  Building2, 
  Mail, 
  Phone, 
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Users,
  DollarSign,
  PackageCheck,
  Search,
  Filter,
  Eye,
  X,
  Sparkles,
  ArrowUpRight,
  ChevronDown
} from 'lucide-react'

export default function AdminInquiriesPage() {
  const [activeTab, setActiveTab] = useState<'quotes' | 'inquiries' | 'overview'>('quotes')
  const [quotes, setQuotes] = useState<any[]>([])
  const [inquiries, setInquiries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dataSource, setDataSource] = useState<string>('database')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedLead, setSelectedLead] = useState<any | null>(null)

  // Date Filter States
  const todayStr = new Date().toISOString().split('T')[0]
  const [dateFilterMode, setDateFilterMode] = useState<DateFilterMode>('ALL')
  const [startDate, setStartDate] = useState(todayStr)
  const [endDate, setEndDate] = useState(todayStr)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [resQuotes, resInquiries] = await Promise.all([
        fetch('/api/quotes'),
        fetch('/api/inquiries'),
      ])

      const dataQ = await resQuotes.json()
      const dataI = await resInquiries.json()

      if (dataQ.success) setQuotes(dataQ.data || [])
      if (dataI.success) setInquiries(dataI.data || [])

      setDataSource(dataQ.source || 'database')
    } catch (error) {
      console.error('Error fetching CRM dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Filtered lists
  const dateFilteredQuotes = filterRecordsByDate(
    quotes,
    (q) => (q.createdAt ? new Date(q.createdAt).toISOString().split('T')[0] : q.date || todayStr),
    dateFilterMode,
    startDate,
    endDate
  )

  const dateFilteredInquiries = filterRecordsByDate(
    inquiries,
    (i) => (i.createdAt ? new Date(i.createdAt).toISOString().split('T')[0] : i.date || todayStr),
    dateFilterMode,
    startDate,
    endDate
  )

  const filteredQuotes = dateFilteredQuotes.filter((q) => {
    const matchesStatus = statusFilter === 'ALL' || (q.status || 'PENDING') === statusFilter
    const matchesSearch =
      !searchQuery ||
      q.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const filteredInquiries = dateFilteredInquiries.filter((inq) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      inq.name?.toLowerCase().includes(q) ||
      inq.email?.toLowerCase().includes(q) ||
      inq.subject?.toLowerCase().includes(q) ||
      inq.message?.toLowerCase().includes(q)
    )
  })

  const allLeads = [...quotes, ...inquiries]
  const todayLeadCount = allLeads.filter((item) => {
    const d = item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : item.date
    return d === todayStr
  }).length

  // Calculation metrics
  const totalLeads = quotes.length + inquiries.length
  const totalQuantityTon = quotes.reduce((acc, curr) => acc + (parseInt(curr.quantity) || 0), 0)
  const pendingCount = quotes.filter((q) => !q.status || q.status === 'PENDING').length

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-amber-100 selection:text-amber-900">
      <Navbar />

      {/* CRM Header Banner */}
      <section className="bg-slate-900 text-white py-10 border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Shop CRM & Order Management</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Hetal Trading CRM Control Desk
              </h1>
              <p className="text-slate-400 text-xs">
                Real-time lead tracking, customer inquiries, and RFQ quote processing.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchData}
                disabled={loading}
                className="btn-gold text-xs py-2 px-3.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh CRM Data</span>
              </button>
            </div>
          </div>

          {/* CRM Metric KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Total Shop Leads</span>
                <Users className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-extrabold text-white font-mono">{totalLeads}</div>
              <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> +100% active queries
              </div>
            </div>

            <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Pending RFQ Quotes</span>
                <FileText className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-extrabold text-amber-400 font-mono">{pendingCount}</div>
              <div className="text-[10px] text-amber-300">Requires desk review</div>
            </div>

            <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Total Volume Demanded</span>
                <PackageCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-extrabold text-white font-mono">{totalQuantityTon.toLocaleString()} MT</div>
              <div className="text-[10px] text-slate-400">Bulk trade requests</div>
            </div>

            <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>General Messages</span>
                <MessageSquare className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-extrabold text-white font-mono">{inquiries.length}</div>
              <div className="text-[10px] text-slate-400">Direct inquiries</div>
            </div>
          </div>
        </div>
      </section>

      {/* CRM Main Workspace */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-6">
        
        {/* Controls & Tab Bar: 2 Rows */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
          {/* ROW 1: Tabs on Left, Status Filter on Right */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-100 w-full">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('quotes')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-extrabold transition-all ${
                  activeTab === 'quotes'
                    ? 'bg-slate-900 text-amber-400 shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>RFQs & Quotes ({quotes.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('inquiries')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-extrabold transition-all ${
                  activeTab === 'inquiries'
                    ? 'bg-slate-900 text-amber-400 shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Client Inquiries ({inquiries.length})</span>
              </button>
            </div>

            {activeTab === 'quotes' && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-600"
              >
                <option value="ALL">Status: All</option>
                <option value="PENDING">Pending</option>
                <option value="QUOTED">Quoted</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="CLOSED">Closed</option>
              </select>
            )}
          </div>

          {/* ROW 2: Date Range Filter on Left, Search Bar on Right */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 w-full">
            <DateRangeFilter
              mode={dateFilterMode}
              startDate={startDate}
              endDate={endDate}
              onModeChange={setDateFilterMode}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              todayCount={todayLeadCount}
              totalCount={allLeads.length}
            />

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search leads, clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-amber-600"
              />
            </div>
          </div>
        </div>

        {/* CRM Quotes Lead Table */}
        {activeTab === 'quotes' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            {filteredQuotes.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs space-y-2">
                <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                <div className="font-bold text-slate-700">No CRM RFQ leads match your criteria</div>
                <div>Try clearing your search query or status filter.</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 text-slate-700 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-200">
                      <th className="py-3 px-4">Client / Company</th>
                      <th className="py-3 px-4">Commodity Product</th>
                      <th className="py-3 px-4">Quantity</th>
                      <th className="py-3 px-4">Delivery Port</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Date Logged</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs text-slate-800 font-medium">
                    {filteredQuotes.map((q) => (
                      <tr key={q.id} className="hover:bg-amber-50/40 transition-colors group">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{q.clientName}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-amber-700" />
                            {q.companyName || 'Individual Buyer'}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-amber-900 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                            {q.productName}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {q.quantity} {q.unit}
                        </td>

                        <td className="py-3.5 px-4 text-slate-600">
                          {q.deliveryLocation || 'Mundra Port / Local'}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                            {q.status || 'PENDING'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                          {new Date(q.createdAt).toLocaleDateString()}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedLead(q)}
                            className="btn-outline-navy text-[11px] py-1 px-2.5 shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5 text-amber-700" />
                            <span>Inspect Lead</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* CRM General Inquiries List */}
        {activeTab === 'inquiries' && (
          <div className="space-y-4">
            {filteredInquiries.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-500 text-xs">
                No general inquiries match your date or search filter.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredInquiries.map((inq) => (
                  <div key={inq.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="font-bold text-slate-900 text-base flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-amber-700" />
                        <span>{inq.subject}</span>
                      </div>
                      <span className="text-slate-500 text-xs font-mono">
                        {new Date(inq.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1">
                        <div className="font-bold text-slate-900 text-sm">{inq.name}</div>
                        <div className="text-slate-600 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-amber-700" /> {inq.email}</div>
                        {inq.phone && <div className="text-slate-600 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-amber-700" /> {inq.phone}</div>}
                        {inq.company && <div className="text-slate-600 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-amber-700" /> {inq.company}</div>}
                      </div>

                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-700 text-xs leading-relaxed">
                        {inq.message}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </section>

      {/* CRM Lead Modal Drawer */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-300 max-w-xl w-full p-6 space-y-6 shadow-2xl relative animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setSelectedLead(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 border-b border-slate-200 pb-3">
              <div className="inline-flex items-center gap-1.5 text-amber-800 text-[10px] font-extrabold uppercase tracking-widest bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                <span>CRM RFQ Record ID: {selectedLead.id}</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">{selectedLead.productName}</h2>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Client Name</span>
                <div className="font-extrabold text-slate-900 text-sm">{selectedLead.clientName}</div>
                <div className="text-slate-600">{selectedLead.email}</div>
                <div className="text-slate-600">{selectedLead.phone}</div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Company & Location</span>
                <div className="font-bold text-slate-900">{selectedLead.companyName || 'Individual Trade'}</div>
                <div className="text-slate-600">Port: {selectedLead.deliveryLocation || 'Mundra Port'}</div>
              </div>
            </div>

            <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 space-y-2 text-xs">
              <div className="flex justify-between font-bold text-slate-900 border-b border-amber-200/80 pb-1.5">
                <span>Order Volume Required:</span>
                <span className="text-amber-900 font-mono text-sm">{selectedLead.quantity} {selectedLead.unit}</span>
              </div>
              {selectedLead.notes && (
                <div className="text-slate-700 pt-1 leading-relaxed">
                  <strong>Notes / Specs:</strong> {selectedLead.notes}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setSelectedLead(null)}
                className="btn-outline-navy text-xs"
              >
                Close Drawer
              </button>
              <a
                href={`mailto:${selectedLead.email}?subject=Official Quote for ${encodeURIComponent(selectedLead.productName)} - Hetal Trading`}
                className="btn-gold text-xs"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Issue Quote Email</span>
              </a>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
