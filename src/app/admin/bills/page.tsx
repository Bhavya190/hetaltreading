'use client'

import { useState, useEffect } from 'react'
import {
  Receipt,
  FileText,
  TrendingUp,
  ShoppingBag,
  Search,
  Loader2,
  Eye,
  Trash2,
  X,
  Printer,
  AlertCircle,
  Share2
} from 'lucide-react'
import ExportActionBar from '@/components/ExportActionBar'
import DateRangeFilter, { DateFilterMode, filterRecordsByDate } from '@/components/DateRangeFilter'
import { exportToExcel, exportToPDF, printReport, shareOnWhatsApp } from '@/lib/exportUtils'

export interface UnifiedBillRecord {
  id: string
  type: 'SALES' | 'PURCHASE'
  billNumber: string
  date: string
  partyName: string
  itemsSummary: string
  amount: number
  paidAmount: number
  balanceAmount: number
  status: string
  rawRecord?: any
}

export default function BillsPage() {
  const [bills, setBills] = useState<UnifiedBillRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'ALL' | 'SALES' | 'PURCHASE'>('ALL')
  const [searchTerm, setSearchTerm] = useState('')

  // Date Filter States
  const todayStr = new Date().toISOString().split('T')[0]
  const [dateFilterMode, setDateFilterMode] = useState<DateFilterMode>('ALL')
  const [startDate, setStartDate] = useState(todayStr)
  const [endDate, setEndDate] = useState(todayStr)

  // View Detail Modal
  const [viewingBill, setViewingBill] = useState<UnifiedBillRecord | null>(null)
  const [deletingBillId, setDeletingBillId] = useState<{ id: string; type: 'SALES' | 'PURCHASE' } | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Fetch Sales Bills and Purchase Bills from Database
  const fetchAllBills = async () => {
    try {
      setLoading(true)

      const unifiedList: UnifiedBillRecord[] = []

      // 1. Fetch Sales Bills (from /api/daily-sales)
      try {
        const resSales = await fetch('/api/daily-sales')
        const dataSales = await resSales.json()
        if (dataSales.success && Array.isArray(dataSales.data)) {
          dataSales.data.forEach((s: any) => {
            const itemsStr = Array.isArray(s.items) && s.items.length > 0
              ? s.items.map((i: any) => `${i.productName || 'Item'} (x${i.quantity || 1})`).join(', ')
              : 'Sales Entry'

            unifiedList.push({
              id: s.id,
              type: 'SALES',
              billNumber: s.billNumber || s.id,
              date: s.date ? new Date(s.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              partyName: s.customerName || 'Walk-in Customer',
              itemsSummary: itemsStr,
              amount: s.grandTotal || s.subtotal || 0,
              paidAmount: s.grandTotal || 0,
              balanceAmount: 0,
              status: s.status || 'COMPLETED',
              rawRecord: s,
            })
          })
        }
      } catch (e) {
        console.error('Error loading sales bills:', e)
      }

      // 2. Fetch Commercial Bills (from /api/bills)
      try {
        const resComm = await fetch('/api/bills')
        const dataComm = await resComm.json()
        if (dataComm.success && Array.isArray(dataComm.data)) {
          dataComm.data.forEach((b: any) => {
            // Avoid duplicate if billNumber already added from daily-sales
            if (!unifiedList.some((existing) => existing.billNumber === (b.billNumber || b.id))) {
              unifiedList.push({
                id: b.id,
                type: 'SALES',
                billNumber: b.billNumber || b.id,
                date: b.date ? new Date(b.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                partyName: b.customer || 'Customer',
                itemsSummary: 'Commercial Invoice',
                amount: b.amount || 0,
                paidAmount: b.paidAmount || 0,
                balanceAmount: b.balanceAmount || 0,
                status: b.status || 'PAID',
                rawRecord: b,
              })
            }
          })
        }
      } catch (e) {
        console.error('Error loading commercial bills:', e)
      }

      // 3. Fetch Purchase Orders / Vendor Bills (from /api/purchase)
      try {
        const resPur = await fetch('/api/purchase')
        const dataPur = await resPur.json()
        if (dataPur.success && Array.isArray(dataPur.data)) {
          dataPur.data.forEach((p: any) => {
            unifiedList.push({
              id: p.id,
              type: 'PURCHASE',
              billNumber: p.orderNumber || p.id,
              date: p.date ? new Date(p.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              partyName: p.vendor || 'Supplier Vendor',
              itemsSummary: p.item || 'Purchase Consignment',
              amount: p.totalAmount || 0,
              paidAmount: p.totalAmount || 0,
              balanceAmount: 0,
              status: p.status || 'DELIVERED',
              rawRecord: p,
            })
          })
        }
      } catch (e) {
        console.error('Error loading purchase bills:', e)
      }

      // Sort all bills by date descending
      unifiedList.sort((a, b) => (a.date < b.date ? 1 : -1))

      setBills(unifiedList)
    } catch (err) {
      console.error('Error fetching all bills:', err)
      setBills([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllBills()
  }, [])

  // Delete Bill Entry
  const handleDeleteBill = async () => {
    if (!deletingBillId) return
    setDeleting(true)

    const endpoint =
      deletingBillId.type === 'PURCHASE'
        ? `/api/purchase/${deletingBillId.id}`
        : `/api/daily-sales/${deletingBillId.id}`

    try {
      const res = await fetch(endpoint, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setBills(bills.filter((b) => b.id !== deletingBillId.id))
      } else {
        fetchAllBills()
      }
    } catch (err) {
      console.error('Error deleting bill:', err)
    } finally {
      setDeleting(false)
      setDeletingBillId(null)
    }
  }

  // Filtered Bills by Date Range, Tab and Search Term
  const filteredByDateBills = filterRecordsByDate(bills, (b) => b.date, dateFilterMode, startDate, endDate)

  const filteredBills = filteredByDateBills.filter((b) => {
    const matchesTab =
      activeTab === 'ALL'
        ? true
        : activeTab === 'SALES'
        ? b.type === 'SALES'
        : b.type === 'PURCHASE'

    const matchesSearch =
      b.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.itemsSummary.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesTab && matchesSearch
  })

  // KPI Calculations
  const salesBillsList = bills.filter((b) => b.type === 'SALES')
  const purchaseBillsList = bills.filter((b) => b.type === 'PURCHASE')

  const totalSalesAmount = salesBillsList.reduce((acc, curr) => acc + curr.amount, 0)
  const totalPurchaseAmount = purchaseBillsList.reduce((acc, curr) => acc + curr.amount, 0)

  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredBills.map((b) => b.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const getExportBills = () => {
    return selectedIds.length > 0
      ? filteredBills.filter((b) => selectedIds.includes(b.id))
      : filteredBills
  }

  const handleExportPDF = () => {
    const exportItems = getExportBills()
    exportToPDF({
      title: 'Commercial & Purchase Bills Report',
      headers: ['Type', 'Date', 'Bill / PO #', 'Party Name', 'Items Summary', 'Status', 'Total Amount (₹)'],
      data: exportItems.map((b) => [
        b.type,
        b.date,
        b.billNumber,
        b.partyName,
        b.itemsSummary,
        b.status,
        `₹ ${b.amount.toLocaleString()}`,
      ]),
      filename: 'Bills_Report',
    })
  }

  const handleExportExcel = () => {
    const exportItems = getExportBills()
    exportToExcel({
      filename: 'Bills_Report',
      headers: ['Type', 'Date', 'Bill Number', 'Party Name', 'Items Summary', 'Status', 'Total Amount'],
      rows: exportItems.map((b) => [
        b.type,
        b.date,
        b.billNumber,
        b.partyName,
        b.itemsSummary,
        b.status,
        b.amount,
      ]),
    })
  }

  const handlePrint = () => {
    const exportItems = getExportBills()
    printReport({
      title: 'Commercial & Purchase Bills Report',
      headers: ['Type', 'Date', 'Bill / PO #', 'Party Name', 'Items Summary', 'Status', 'Total Amount (₹)'],
      data: exportItems.map((b) => [
        b.type,
        b.date,
        b.billNumber,
        b.partyName,
        b.itemsSummary,
        b.status,
        `₹ ${b.amount.toLocaleString()}`,
      ]),
    })
  }

  const handleShareWhatsApp = () => {
    const exportItems = getExportBills()
    const summary =
      `🧾 *Commercial & Purchase Bills Summary*\nTotal Bills: ${exportItems.length}\n\n*Recent Bills:*\n` +
      exportItems
        .slice(0, 10)
        .map((b) => `• ${b.billNumber} | ${b.partyName} | ₹${b.amount.toLocaleString()} (${b.type})`)
        .join('\n')
    shareOnWhatsApp(summary)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-blue-800 text-[11px] font-extrabold uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
            <Receipt className="w-3.5 h-3.5 text-blue-700" />
            <span>Master Invoices & Bills Hub</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Commercial & Purchase Bills</h1>
          <p className="text-xs text-slate-500">
            View and manage all customer sales bills and vendor purchase invoices in one centralized ledger.
          </p>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Bills Logged</span>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">{bills.length} Bills</div>
          <div className="text-[11px] text-slate-400 font-medium">Combined sales & purchase invoices</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs space-y-1">
          <span className="text-emerald-800 text-xs font-bold uppercase tracking-wider">Total Sales Invoices</span>
          <div className="text-2xl font-extrabold text-emerald-700 font-mono">
            ₹ {totalSalesAmount.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold">{salesBillsList.length} Customer Bills</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/30 shadow-xs space-y-1">
          <span className="text-amber-800 text-xs font-bold uppercase tracking-wider">Total Purchase Invoices</span>
          <div className="text-2xl font-extrabold text-amber-800 font-mono">
            ₹ {totalPurchaseAmount.toLocaleString()}
          </div>
          <div className="text-[11px] text-amber-700 font-semibold">{purchaseBillsList.length} Vendor Bills</div>
        </div>
      </div>

      {/* Main Table Card with Tab Switching & Search */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Top Action Bar: Tabs & Search Input */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* TAB SWITCHING CONTROLS */}
          <div className="flex items-center bg-slate-200/70 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>All Bills ({bills.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('SALES')}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'SALES'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Sales Bills ({salesBillsList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('PURCHASE')}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'PURCHASE'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Purchase Bills ({purchaseBillsList.length})</span>
            </button>
          </div>

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pt-2 border-t border-slate-200 w-full">
            <DateRangeFilter
              mode={dateFilterMode}
              startDate={startDate}
              endDate={endDate}
              onModeChange={setDateFilterMode}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              todayCount={bills.filter((b) => (b.date || '').split('T')[0] === todayStr).length}
              totalCount={bills.length}
            />

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
              {selectedIds.length > 0 && (
                <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {selectedIds.length} Selected
                </span>
              )}
              <ExportActionBar
                onExportPDF={handleExportPDF}
                onExportExcel={handleExportExcel}
                onPrint={handlePrint}
                onShareWhatsApp={handleShareWhatsApp}
                selectedCount={selectedIds.length}
              />

              {/* Search Input */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search bill #, party, or items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:border-blue-600 text-slate-900 font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* TABLE DISPLAY */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-sm font-semibold">Loading bills and invoices...</span>
          </div>
        ) : filteredBills.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-semibold text-sm text-slate-700">No Invoices Found</p>
            <p className="text-xs text-slate-500">
              {activeTab === 'SALES'
                ? 'No customer sales entries recorded yet. Add entries in Daily Sales.'
                : activeTab === 'PURCHASE'
                ? 'No vendor purchase orders recorded yet. Add entries in Procurement.'
                : 'No invoices logged in the system.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-[11px] uppercase tracking-wider font-extrabold">
                  <th className="py-3 px-3 lg:px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={filteredBills.length > 0 && selectedIds.length === filteredBills.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-3 lg:px-4">Type</th>
                  <th className="py-3 px-3 lg:px-4">Date</th>
                  <th className="py-3 px-3 lg:px-4">Bill / PO #</th>
                  <th className="py-3 px-3 lg:px-4">Party Name</th>
                  <th className="py-3 px-3 lg:px-4">Items Summary</th>
                  <th className="py-3 px-3 lg:px-4 text-center">Status</th>
                  <th className="py-3 px-3 lg:px-4 text-right">Total Amount (₹)</th>
                  <th className="py-3 px-3 lg:px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs font-medium text-slate-800">
                {filteredBills.map((b) => (
                  <tr key={b.id} className={`hover:bg-slate-50/80 transition-colors ${selectedIds.includes(b.id) ? 'bg-amber-50/40' : ''}`}>
                    <td className="py-2.5 px-3 lg:px-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(b.id)}
                        onChange={() => handleToggleSelect(b.id)}
                        className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                      />
                    </td>
                    {/* Type Badge */}
                    <td className="py-2.5 px-3 lg:px-4 whitespace-nowrap">
                      {b.type === 'SALES' ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                          <TrendingUp className="w-3 h-3 text-emerald-700" />
                          <span>SALES</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                          <ShoppingBag className="w-3 h-3 text-amber-800" />
                          <span>PURCHASE</span>
                        </span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-2.5 px-3 lg:px-4 whitespace-nowrap font-mono text-slate-600">
                      {b.date}
                    </td>

                    {/* Bill # */}
                    <td className="py-2.5 px-3 lg:px-4 whitespace-nowrap font-mono font-extrabold text-blue-700">
                      {b.billNumber}
                    </td>

                    {/* Party Name */}
                    <td className="py-2.5 px-3 lg:px-4 font-bold text-slate-900 truncate max-w-[160px] xl:max-w-[220px]">
                      {b.partyName}
                    </td>

                    {/* Items Summary */}
                    <td className="py-2.5 px-3 lg:px-4 text-slate-700 truncate max-w-[200px] xl:max-w-[280px]">
                      {b.itemsSummary}
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-3 lg:px-4 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-slate-200 uppercase">
                        {b.status}
                      </span>
                    </td>

                    {/* Total Amount */}
                    <td className="py-2.5 px-3 lg:px-4 text-right font-mono font-extrabold text-slate-900 text-sm whitespace-nowrap">
                      ₹ {b.amount.toLocaleString()}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 lg:px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setViewingBill(b)}
                          className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
                          title="View Invoice Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            const msg = `🧾 *Bill Details*\nType: ${b.type}\nBill #: ${b.billNumber}\nDate: ${b.date}\nParty: ${b.partyName}\nItems: ${b.itemsSummary}\nAmount: ₹${b.amount.toLocaleString()}\nStatus: ${b.status}`
                            shareOnWhatsApp(msg)
                          }}
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                          title="Share on WhatsApp"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingBillId({ id: b.id, type: b.type })}
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors"
                          title="Delete Invoice Entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* INVOICE DETAIL VIEW MODAL */}
      {viewingBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                {viewingBill.type === 'SALES' ? (
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-extrabold px-2.5 py-1 rounded-md border border-emerald-200 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>SALES INVOICE</span>
                  </span>
                ) : (
                  <span className="bg-amber-100 text-amber-900 text-xs font-extrabold px-2.5 py-1 rounded-md border border-amber-200 flex items-center gap-1">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>PURCHASE INVOICE</span>
                  </span>
                )}
                <span className="font-mono font-extrabold text-slate-900 text-base">
                  {viewingBill.billNumber}
                </span>
              </div>
              <button
                onClick={() => setViewingBill(null)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Bill Info Card */}
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="uppercase text-[10px] tracking-wider text-slate-400 font-extrabold">DATE:</span>
                <span className="font-mono font-bold text-slate-900">{viewingBill.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="uppercase text-[10px] tracking-wider text-slate-400 font-extrabold">
                  {viewingBill.type === 'SALES' ? 'BUYER / CUSTOMER:' : 'VENDOR / SUPPLIER:'}
                </span>
                <span className="font-extrabold text-slate-900">{viewingBill.partyName}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200/60">
                <span className="uppercase text-[10px] tracking-wider text-slate-400 font-extrabold">ITEMS LOGGED:</span>
                <span className="font-semibold text-slate-800 text-right max-w-[280px]">{viewingBill.itemsSummary}</span>
              </div>
            </div>

            {/* Total Amount Card */}
            <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-900">GRAND INVOICE TOTAL</span>
                <div className="text-xs text-blue-700 font-semibold">Inclusive of all taxes & charges</div>
              </div>
              <div className="text-2xl font-black text-blue-950 font-mono">
                ₹ {viewingBill.amount.toLocaleString()}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setViewingBill(null)}
                className="w-1/2 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="w-1/2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deletingBillId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">Delete Invoice Entry?</h3>
              <p className="text-xs text-slate-500">
                This action will permanently remove this invoice record from the database.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingBillId(null)}
                className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteBill}
                className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
