'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ShoppingBag,
  Plus,
  Truck,
  Calendar,
  PackageCheck,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  Pencil,
  Trash2,
  Search,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  Layers,
  Share2,
  Wallet,
} from 'lucide-react'
import ExportActionBar from '@/components/ExportActionBar'
import DateRangeFilter, { DateFilterMode, filterRecordsByDate } from '@/components/DateRangeFilter'
import { shareOnWhatsApp } from '@/lib/exportUtils'

export interface PurchaseRecord {
  id: string
  orderNumber?: string
  date: string
  vendor: string
  vendorId?: string
  item: string
  productId?: string
  quantity: number
  discount: number
  totalAmount: number
  extraCharges: number
  extraChargesGst: number
  status: 'DELIVERED' | 'IN-TRANSIT' | 'PENDING'
}

export interface ProductOption {
  id: string
  name: string
  serialNumber?: string
  purchasePrice: number
  gstRate: number
  unit: string
  inventoryStock: number
}

export interface VendorOption {
  id: string
  name: string
  vendorCode?: string
  contactPerson?: string
  phone?: string
  city?: string
}

export interface PurchaseItemLine {
  id: string
  productId: string
  productName: string
  productSearch: string
  showDropdown: boolean
  quantity: string
  unit: string
  discount: string
  totalAmount: string
}

const createEmptyItemLine = (): PurchaseItemLine => ({
  id: String(Date.now() + Math.random()),
  productId: '',
  productName: '',
  productSearch: '',
  showDropdown: false,
  quantity: '',
  unit: 'Kilogram',
  discount: '',
  totalAmount: '',
})

export interface VendorSummaryItem {
  vendorId: string
  vendorCode: string
  vendorName: string
  totalOrders: number
  totalPurchaseAmount: number
  lastPurchaseDate: string
}

export default function PurchasePage() {
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([])
  const [products, setProducts] = useState<ProductOption[]>([])
  const [vendors, setVendors] = useState<VendorOption[]>([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Vendor View & Search States
  const [selectedVendorNameView, setSelectedVendorNameView] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedVendorSummaryCodes, setSelectedVendorSummaryCodes] = useState<string[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Date Filter States
  const todayStr = new Date().toISOString().split('T')[0]
  const [dateFilterMode, setDateFilterMode] = useState<DateFilterMode>('ALL')
  const [startDate, setStartDate] = useState(todayStr)
  const [endDate, setEndDate] = useState(todayStr)

  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingPurchase, setEditingPurchase] = useState<PurchaseRecord | null>(null)
  const [deletingPurchaseId, setDeletingPurchaseId] = useState<string | null>(null)

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [vendorSearch, setVendorSearch] = useState('')
  const [selectedVendorId, setSelectedVendorId] = useState('')
  const [selectedVendorName, setSelectedVendorName] = useState('')
  const [showVendorDropdown, setShowVendorDropdown] = useState(false)

  // Multi-product Item Lines State
  const [itemLines, setItemLines] = useState<PurchaseItemLine[]>([createEmptyItemLine()])

  const [totalAmount, setTotalAmount] = useState('')
  const [extraCharges, setExtraCharges] = useState('')
  const [extraChargesGst, setExtraChargesGst] = useState('0')

  // Fetch Purchases, Products, and Vendors
  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch Purchases
      const resP = await fetch('/api/purchase')
      const dataP = await resP.json()
      if (dataP.success && Array.isArray(dataP.data)) {
        setPurchases(
          dataP.data.map((p: any) => ({
            id: p.id,
            orderNumber: p.orderNumber || p.id,
            date: p.date ? new Date(p.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            vendor: p.vendor,
            vendorId: p.vendorId || '',
            item: p.item,
            productId: p.productId || '',
            quantity: p.quantity || 1,
            discount: p.discount || 0,
            totalAmount: p.totalAmount || 0,
            extraCharges: p.extraCharges || 0,
            extraChargesGst: p.extraChargesGst !== undefined ? p.extraChargesGst : 0,
            status: p.status || 'DELIVERED',
          }))
        )
      } else {
        setPurchases([])
      }

      // Fetch Products
      const resProd = await fetch('/api/products')
      const dataProd = await resProd.json()
      if (dataProd.success && Array.isArray(dataProd.data)) {
        setProducts(
          dataProd.data.map((p: any) => ({
            id: p.id,
            name: p.name,
            serialNumber: p.serialNumber || '',
            purchasePrice: p.purchasePrice || 0,
            gstRate: p.gstRate || 18,
            unit: p.unit || 'Kg',
            inventoryStock: p.inventoryStock || 0,
          }))
        )
      }

      // Fetch Vendors
      const resVend = await fetch('/api/vendors')
      const dataVend = await resVend.json()
      if (dataVend.success && Array.isArray(dataVend.data)) {
        setVendors(
          dataVend.data.map((v: any) => ({
            id: v.id,
            name: v.name,
            vendorCode: v.vendorCode || '',
            contactPerson: v.contactPerson || '',
            phone: v.phone || '',
            city: v.city || '',
          }))
        )
      }
    } catch (err) {
      console.error('Error fetching purchase data:', err)
      setPurchases([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Currently Selected Vendor Object
  const selectedVend = vendors.find(
    (v) => v.id === selectedVendorId || v.name.toLowerCase() === selectedVendorName.toLowerCase()
  )

  // Item Line Manipulators
  const addItemLine = () => {
    setItemLines((prev) => [...prev, createEmptyItemLine()])
  }

  const removeItemLine = (id: string) => {
    if (itemLines.length <= 1) return
    setItemLines((prev) => prev.filter((item) => item.id !== id))
  }

  const updateItemLine = (id: string, updates: Partial<PurchaseItemLine>) => {
    setItemLines((prev) =>
      prev.map((line) => (line.id === id ? { ...line, ...updates } : line))
    )
  }

  // Calculate detailed financials per item line
  const calculatedLines = itemLines.map((line) => {
    const matchedProduct = products.find(
      (p) => p.id === line.productId || p.name.toLowerCase() === line.productName.toLowerCase()
    )
    const pricePerUnit = matchedProduct ? matchedProduct.purchasePrice : 0
    const prodGstRate = matchedProduct ? matchedProduct.gstRate : 18

    const q = Math.max(0, parseFloat(line.quantity) || 0)
    const d = Math.max(0, parseFloat(line.discount) || 0)

    const rawSubtotal = q * pricePerUnit
    const discAmount = rawSubtotal * (d / 100)
    const netBase = Math.max(0, rawSubtotal - discAmount)
    const gstAmt = netBase * (prodGstRate / 100)
    const lineTotalPaid = Math.round(netBase + gstAmt)

    return {
      ...line,
      matchedProduct,
      pricePerUnit,
      prodGstRate,
      q,
      d,
      rawSubtotal,
      discAmount,
      netBase,
      gstAmt,
      lineTotalPaid,
    }
  })

  // Aggregated Bill Totals Across All Items
  const totalItemsQty = calculatedLines.reduce((acc, curr) => acc + curr.q, 0)
  const totalGrossBase = calculatedLines.reduce((acc, curr) => acc + curr.rawSubtotal, 0)
  const totalDiscountAmt = calculatedLines.reduce((acc, curr) => acc + curr.discAmount, 0)
  const totalNetBase = calculatedLines.reduce((acc, curr) => acc + curr.netBase, 0)
  const totalProductGst = calculatedLines.reduce((acc, curr) => acc + curr.gstAmt, 0)
  const totalProductPaidIncGst = totalNetBase + totalProductGst

  const extrasBase = parseFloat(extraCharges) || 0
  const extrasGstRate = parseFloat(extraChargesGst) || 0
  const extrasGstAmount = extrasBase * (extrasGstRate / 100)
  const totalExtraIncGst = extrasBase + extrasGstAmount

  const calculatedGrandTotal = Math.round(totalProductPaidIncGst + totalExtraIncGst)

  // Auto-calculate Total Paid whenever item lines or extra charges change
  useEffect(() => {
    if (totalItemsQty > 0 || extrasBase > 0) {
      setTotalAmount(String(calculatedGrandTotal))
    }
  }, [itemLines, extraCharges, extraChargesGst, products])

  const resetForm = () => {
    setDate(new Date().toISOString().split('T')[0])
    setVendorSearch(selectedVendorNameView || '')
    setSelectedVendorId('')
    setSelectedVendorName(selectedVendorNameView || '')
    setShowVendorDropdown(false)

    setItemLines([createEmptyItemLine()])
    setTotalAmount('')
    setExtraCharges('')
    setExtraChargesGst('0')
  }

  // Handle Save New Purchase
  const handleAddPurchase = async (e: React.FormEvent) => {
    e.preventDefault()
    const finalVendorName = selectedVendorName || vendorSearch

    const validLines = calculatedLines.filter(
      (l) => l.productName || l.productSearch
    )

    if (!finalVendorName || validLines.length === 0) {
      alert('Please select a Vendor and add at least one Product.')
      return
    }

    const consolidatedItemName = validLines
      .map((l) => `${l.productName || l.productSearch} (x${l.q || 1} ${l.unit || 'Kilogram'})`)
      .join(', ')

    const primaryProductId = validLines[0]?.productId || null

    setSaving(true)
    try {
      const payload = {
        date,
        vendor: finalVendorName,
        vendorId: selectedVendorId || null,
        item: consolidatedItemName,
        productId: primaryProductId,
        quantity: totalItemsQty || 1,
        discount: validLines[0]?.d || 0,
        totalAmount: parseFloat(totalAmount) || calculatedGrandTotal,
        extraCharges: parseFloat(extraCharges) || 0,
        extraChargesGst: parseFloat(extraChargesGst) || 0,
        status: 'DELIVERED',
        items: validLines.map((l) => ({
          productId: l.productId,
          productName: l.productName || l.productSearch,
          quantity: l.q,
          unit: l.unit || 'Kilogram',
        })),
      }

      const res = await fetch('/api/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        fetchData()
      }
    } catch (err) {
      console.error('Error creating purchase order:', err)
    } finally {
      setSaving(false)
      setShowAddModal(false)
      resetForm()
    }
  }

  // Open Edit Modal
  const openEditModal = (p: PurchaseRecord) => {
    setEditingPurchase(p)
    setDate(p.date || new Date().toISOString().split('T')[0])
    setSelectedVendorId(p.vendorId || '')
    setSelectedVendorName(p.vendor || '')
    setVendorSearch(p.vendor || '')

    if (p.item) {
      const rawParts = p.item.split(',').map((s) => s.trim())
      const loadedLines: PurchaseItemLine[] = rawParts.map((part) => {
        const match = part.match(/^(.*?)(?:\s*\(x([\d.]+)\s*(.*?)\))?$/)
        const pName = match ? match[1].trim() : part
        const pQty = match && match[2] ? match[2] : String(p.quantity || 1)
        const pUnit = match && match[3] ? match[3].trim() : ''

        const matchedProd = products.find((prod) => prod.name.toLowerCase() === pName.toLowerCase())

        return {
          id: String(Date.now() + Math.random()),
          productId: matchedProd ? matchedProd.id : '',
          productName: pName,
          productSearch: pName,
          showDropdown: false,
          quantity: pQty,
          unit: pUnit || (matchedProd ? matchedProd.unit : 'Kilogram'),
          discount: p.discount ? String(p.discount) : '',
          totalAmount: '',
        }
      })
      setItemLines(loadedLines.length > 0 ? loadedLines : [createEmptyItemLine()])
    } else {
      setItemLines([createEmptyItemLine()])
    }

    setTotalAmount(p.totalAmount ? String(p.totalAmount) : '')
    setExtraCharges(p.extraCharges ? String(p.extraCharges) : '')
    setExtraChargesGst(p.extraChargesGst !== undefined && p.extraChargesGst !== null ? String(p.extraChargesGst) : '0')
  }

  // Handle Update Purchase
  const handleUpdatePurchase = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPurchase) return

    const finalVendorName = selectedVendorName || vendorSearch
    const validLines = calculatedLines.filter(
      (l) => l.productName || l.productSearch
    )

    if (!finalVendorName || validLines.length === 0) {
      alert('Please select a Vendor and add at least one Product.')
      return
    }

    const consolidatedItemName = validLines
      .map((l) => `${l.productName || l.productSearch} (x${l.q || 1} ${l.unit || 'Kilogram'})`)
      .join(', ')

    setSaving(true)
    try {
      const payload = {
        date,
        vendor: finalVendorName,
        vendorId: selectedVendorId || null,
        item: consolidatedItemName,
        productId: validLines[0]?.productId || null,
        quantity: totalItemsQty || 1,
        discount: validLines[0]?.d || 0,
        totalAmount: parseFloat(totalAmount) || calculatedGrandTotal,
        extraCharges: parseFloat(extraCharges) || 0,
        extraChargesGst: parseFloat(extraChargesGst) || 0,
        status: editingPurchase.status || 'DELIVERED',
      }

      const res = await fetch(`/api/purchase/${editingPurchase.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        fetchData()
      }
    } catch (err) {
      console.error('Error updating purchase order:', err)
    } finally {
      setSaving(false)
      setEditingPurchase(null)
      resetForm()
    }
  }

  // Handle Delete Purchase
  const handleDeletePurchase = async (id: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/purchase/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setPurchases(purchases.filter((p) => p.id !== id))
      }
    } catch (err) {
      console.error('Error deleting purchase order:', err)
    } finally {
      setSaving(false)
      setDeletingPurchaseId(null)
    }
  }

  const dateFilteredPurchases = filterRecordsByDate(
    purchases,
    (p) => p.date,
    dateFilterMode,
    startDate,
    endDate
  )

  const todayPurchasesCount = purchases.filter(
    (p) => (p.date ? p.date.split('T')[0] : '') === todayStr
  ).length

  const totalPurchasesSum = dateFilteredPurchases.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0)

  // Filtered Vendors for Search Dropdown in Modal
  const filteredVendors = vendors.filter((v) =>
    v.name.toLowerCase().includes(vendorSearch.toLowerCase())
  )

  const hasSelectedProducts = calculatedLines.some(
    (l) => l.productName || l.productSearch || l.q > 0
  )

  // Vendor Summary Aggregator
  const getVendorSummaries = (): VendorSummaryItem[] => {
    const summaryMap: { [key: string]: VendorSummaryItem } = {}

    dateFilteredPurchases.forEach((p, idx) => {
      const vName = p.vendor || 'Unknown Vendor'
      const matchedVendor = vendors.find(
        (v) => v.id === p.vendorId || v.name.toLowerCase() === vName.toLowerCase()
      )

      const code =
        matchedVendor?.vendorCode ||
        (p.vendorId ? `VEND-${p.vendorId.slice(0, 4)}` : `VEND-${101 + idx}`)

      const key = vName.toLowerCase()

      if (!summaryMap[key]) {
        summaryMap[key] = {
          vendorId: matchedVendor?.id || p.vendorId || vName,
          vendorCode: code,
          vendorName: vName,
          totalOrders: 0,
          totalPurchaseAmount: 0,
          lastPurchaseDate: p.date,
        }
      }

      summaryMap[key].totalOrders += 1
      summaryMap[key].totalPurchaseAmount += p.totalAmount || 0
      if (p.date > summaryMap[key].lastPurchaseDate) {
        summaryMap[key].lastPurchaseDate = p.date
      }
    })

    return Object.values(summaryMap)
  }

  const vendorSummaries = getVendorSummaries()

  // Filtering for Vendor Summary Table
  const filteredVendorSummaries = vendorSummaries.filter((v) =>
    v.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.vendorCode.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Selected Vendor Purchases
  const selectedVendorPurchases = selectedVendorNameView
    ? dateFilteredPurchases.filter((p) => p.vendor.toLowerCase() === selectedVendorNameView.toLowerCase())
    : dateFilteredPurchases

  // Filtering for Selected Vendor Purchases Table
  const filteredSelectedVendorPurchases = selectedVendorPurchases.filter((p) =>
    (p.orderNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.item.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.date.includes(searchQuery)
  )

  // Selection Checkbox Handlers for Vendor Summaries
  const handleSelectAllVendorSummaries = (checked: boolean) => {
    if (checked) {
      setSelectedVendorSummaryCodes(filteredVendorSummaries.map((v) => v.vendorCode))
    } else {
      setSelectedVendorSummaryCodes([])
    }
  }

  const handleToggleSelectVendorSummary = (code: string) => {
    setSelectedVendorSummaryCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    )
  }

  const exportVendorSummaries = selectedVendorSummaryCodes.length > 0
    ? filteredVendorSummaries.filter((v) => selectedVendorSummaryCodes.includes(v.vendorCode))
    : filteredVendorSummaries

  // Selection Checkbox Handlers for Individual Purchases
  const handleSelectAllPurchases = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredSelectedVendorPurchases.map((p) => p.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleToggleSelectPurchase = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const exportPurchases = selectedIds.length > 0
    ? filteredSelectedVendorPurchases.filter((p) => selectedIds.includes(p.id))
    : filteredSelectedVendorPurchases

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
            Select a vendor to view their purchase history, or log new procurement orders.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/vendor-debt"
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2"
          >
            <Wallet className="w-4 h-4 text-amber-400" />
            <span>Vendor Debt Accounts</span>
          </Link>

          <button
            onClick={() => {
              resetForm()
              setShowAddModal(true)
            }}
            className="btn-gold text-xs py-2.5 px-4 shadow-sm font-bold flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Purchase Order</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-slate-500 text-xs font-bold">Total Purchases Value</span>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            ₹ {totalPurchasesSum.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Logged procurement total</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-slate-500 text-xs font-bold">Total Purchase Orders</span>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">{purchases.length} Orders</div>
          <span className="text-[11px] text-emerald-600 font-medium">All logged invoices</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-slate-500 text-xs font-bold">Active Suppliers Purchased From</span>
          <div className="text-2xl font-extrabold text-amber-800 font-mono">{vendorSummaries.length} Vendors</div>
          <span className="text-[11px] text-amber-700 font-medium">Distinct suppliers with orders</span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Top Toolbar: 2 Rows */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 space-y-3">
          {/* ROW 1: Title / Back Button on Left, Export Action Bar on Right */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-200/80 w-full">
            {selectedVendorNameView ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setSelectedVendorNameView(null)
                    setSelectedIds([])
                    setSearchQuery('')
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 hover:text-amber-950 bg-amber-100/90 hover:bg-amber-200 border border-amber-300 px-3 py-1.5 rounded-xl transition-colors shadow-2xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to All Vendors</span>
                </button>
                <div>
                  <h2 className="font-extrabold text-slate-900 text-sm sm:text-base">
                    {selectedVendorNameView} ({filteredSelectedVendorPurchases.length})
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Total Purchases: ₹ {selectedVendorPurchases.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0).toLocaleString()}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <h2 className="font-extrabold text-slate-900 text-sm sm:text-base whitespace-nowrap">
                  Vendors Purchase Directory ({filteredVendorSummaries.length})
                </h2>
                {selectedVendorSummaryCodes.length > 0 && (
                  <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {selectedVendorSummaryCodes.length} Selected
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {selectedVendorNameView ? (
                <ExportActionBar
                  title={`Purchase Orders - ${selectedVendorNameView}`}
                  filename={`hetal_purchase_orders_${selectedVendorNameView.replace(/\s+/g, '_')}`}
                  data={exportPurchases}
                  selectedCount={selectedIds.length}
                  excelHeaders={[
                    { label: 'Order Number', key: 'orderNumber' },
                    { label: 'Date', key: 'date' },
                    { label: 'Vendor', key: 'vendor' },
                    { label: 'Items Purchased', key: 'item' },
                    { label: 'Quantity', key: 'quantity' },
                    { label: 'Discount (%)', key: 'discount' },
                    { label: 'Extra Charges (₹)', key: 'extraCharges' },
                    { label: 'Extra GST (%)', key: 'extraChargesGst' },
                    { label: 'Total Paid (₹)', key: 'totalAmount' },
                  ]}
                  pdfHeaders={['PO #', 'Date', 'Vendor', 'Items', 'Qty', 'Extra (₹)', 'Total Paid (₹)']}
                  pdfRows={exportPurchases.map((p) => [
                    p.orderNumber || p.id,
                    p.date,
                    p.vendor,
                    p.item,
                    p.quantity,
                    `₹${(p.extraCharges || 0).toLocaleString()}`,
                    `₹${(p.totalAmount || 0).toLocaleString()}`,
                  ])}
                />
              ) : (
                <ExportActionBar
                  title="Vendors Purchase Directory"
                  filename="hetal_trading_vendors_purchase_directory"
                  data={exportVendorSummaries}
                  selectedCount={selectedVendorSummaryCodes.length}
                  excelHeaders={[
                    { label: 'Vendor ID', key: 'vendorCode' },
                    { label: 'Vendor Name', key: 'vendorName' },
                    { label: 'Total Orders', key: 'totalOrders' },
                    { label: 'Total Purchase Amount (₹)', key: 'totalPurchaseAmount' },
                  ]}
                  pdfHeaders={['Vendor ID', 'Vendor Name', 'Total Orders', 'Total Purchase Amount (₹)']}
                  pdfRows={exportVendorSummaries.map((v) => [
                    v.vendorCode,
                    v.vendorName,
                    `${v.totalOrders} Orders`,
                    `₹${v.totalPurchaseAmount.toLocaleString()}`,
                  ])}
                />
              )}
            </div>
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
              todayCount={todayPurchasesCount}
              totalCount={purchases.length}
            />

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={selectedVendorNameView ? "Search PO #, item, date..." : "Search vendor name, ID..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
            <span className="text-sm font-semibold">Loading procurement data from database...</span>
          </div>
        ) : purchases.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-semibold text-sm text-slate-700">No Purchase Orders Recorded Yet</p>
            <p className="text-xs text-slate-500">Click "Create Purchase Order" above to log a new purchase entry.</p>
          </div>
        ) : !selectedVendorNameView ? (
          /* PRIMARY VIEW 1: VENDORS PURCHASE DIRECTORY TABLE */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-[11px] uppercase tracking-wider font-extrabold">
                  <th className="py-3 px-3 lg:px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        filteredVendorSummaries.length > 0 &&
                        selectedVendorSummaryCodes.length === filteredVendorSummaries.length
                      }
                      onChange={(e) => handleSelectAllVendorSummaries(e.target.checked)}
                      className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-3 lg:px-4">Vendor ID</th>
                  <th className="py-3 px-3 lg:px-4">Vendor Name</th>
                  <th className="py-3 px-3 lg:px-4 text-center">Total Orders</th>
                  <th className="py-3 px-3 lg:px-4 text-right">Total Purchase Amount (₹)</th>
                  <th className="py-3 px-3 lg:px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs font-medium text-slate-800">
                {filteredVendorSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 font-medium">
                      No vendor matching "{searchQuery}" found.
                    </td>
                  </tr>
                ) : (
                  filteredVendorSummaries.map((v) => (
                    <tr
                      key={v.vendorCode + v.vendorName}
                      className={`hover:bg-amber-50/60 transition-colors cursor-pointer ${
                        selectedVendorSummaryCodes.includes(v.vendorCode) ? 'bg-amber-50/40' : ''
                      }`}
                      onClick={() => {
                        setSelectedVendorNameView(v.vendorName)
                        setSearchQuery('')
                        setSelectedIds([])
                      }}
                    >
                      <td className="py-3.5 px-3 lg:px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedVendorSummaryCodes.includes(v.vendorCode)}
                          onChange={() => handleToggleSelectVendorSummary(v.vendorCode)}
                          className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 px-3 lg:px-4 whitespace-nowrap font-mono font-extrabold text-amber-800 text-xs">
                        {v.vendorCode}
                      </td>
                      <td className="py-3.5 px-3 lg:px-4 font-bold text-slate-900 text-sm">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-amber-600" />
                          <span>{v.vendorName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 lg:px-4 text-center font-mono font-bold">
                        <span className="bg-slate-100 text-slate-800 border border-slate-200 px-2.5 py-1 rounded-full text-xs">
                          {v.totalOrders} {v.totalOrders === 1 ? 'Order' : 'Orders'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 lg:px-4 text-right font-mono font-extrabold text-slate-900 text-sm whitespace-nowrap">
                        ₹ {v.totalPurchaseAmount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-3 lg:px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedVendorNameView(v.vendorName)
                            setSearchQuery('')
                            setSelectedIds([])
                          }}
                          className="inline-flex items-center gap-1.5 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-2xs transition-colors"
                        >
                          <span>View Purchases</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* DRILL-DOWN VIEW 2: SELECTED VENDOR PURCHASES TABLE */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-[11px] uppercase tracking-wider font-extrabold">
                  <th className="py-3 px-3 lg:px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        filteredSelectedVendorPurchases.length > 0 &&
                        selectedIds.length === filteredSelectedVendorPurchases.length
                      }
                      onChange={(e) => handleSelectAllPurchases(e.target.checked)}
                      className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-3 lg:px-4">Date</th>
                  <th className="py-3 px-3 lg:px-4">Order #</th>
                  <th className="py-3 px-3 lg:px-4">Vendor</th>
                  <th className="py-3 px-3 lg:px-4">Product(s) / Items Purchased</th>
                  <th className="py-3 px-3 lg:px-4 text-center">Total Qty</th>
                  <th className="py-3 px-3 lg:px-4 text-center">Discount</th>
                  <th className="py-3 px-3 lg:px-4 text-right">Extra Charges</th>
                  <th className="py-3 px-3 lg:px-4 text-center">Extra GST</th>
                  <th className="py-3 px-3 lg:px-4 text-right">Total Paid (₹)</th>
                  <th className="py-3 px-3 lg:px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs font-medium text-slate-800">
                {filteredSelectedVendorPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-slate-500 font-medium">
                      No purchase orders matching "{searchQuery}" for vendor {selectedVendorNameView}.
                    </td>
                  </tr>
                ) : (
                  filteredSelectedVendorPurchases.map((p) => (
                    <tr key={p.id} className={`hover:bg-slate-50/80 transition-colors ${selectedIds.includes(p.id) ? 'bg-amber-50/40' : ''}`}>
                      <td className="py-2.5 px-3 lg:px-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(p.id)}
                          onChange={() => handleToggleSelectPurchase(p.id)}
                          className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                        />
                      </td>
                      <td className="py-2.5 px-3 lg:px-4 whitespace-nowrap font-mono text-slate-600">
                        {p.date}
                      </td>
                      <td className="py-2.5 px-3 lg:px-4 whitespace-nowrap font-mono font-extrabold text-amber-700">
                        {p.orderNumber}
                      </td>
                      <td className="py-2.5 px-3 lg:px-4 font-bold text-slate-900 truncate max-w-[140px] xl:max-w-[180px]">
                        {p.vendor}
                      </td>
                      <td className="py-2.5 px-3 lg:px-4 font-semibold text-slate-800 truncate max-w-[220px] xl:max-w-[300px]">
                        {p.item}
                      </td>
                      <td className="py-2.5 px-3 lg:px-4 text-center font-mono font-bold">
                        {p.quantity}
                      </td>
                      <td className="py-2.5 px-3 lg:px-4 text-center font-mono">
                        {p.discount ? `${p.discount}%` : '-'}
                      </td>
                      <td className="py-2.5 px-3 lg:px-4 text-right font-mono text-slate-700 whitespace-nowrap">
                        {p.extraCharges ? `₹${p.extraCharges}` : '-'}
                      </td>
                      <td className="py-2.5 px-3 lg:px-4 text-center font-mono text-amber-800 font-semibold">
                        {p.extraCharges ? `${p.extraChargesGst}%` : '-'}
                      </td>
                      <td className="py-2.5 px-3 lg:px-4 text-right font-mono font-extrabold text-slate-900 text-sm whitespace-nowrap">
                        ₹ {p.totalAmount.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 lg:px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              const msg = `*Hetal Trading Company - Purchase Order*\n📦 Order #: ${p.orderNumber}\n📅 Date: ${p.date}\n🏭 Vendor: ${p.vendor}\n🛍️ Items: ${p.item}\n💰 Total Amount: ₹${p.totalAmount.toLocaleString()}`
                              shareOnWhatsApp(msg)
                            }}
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                            title="Share Purchase Order on WhatsApp"
                          >
                            <Share2 className="w-3.5 h-3.5 text-emerald-700" />
                          </button>
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors"
                            title="Edit Purchase Order"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingPurchaseId(p.id)}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors"
                            title="Delete Purchase Order"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MULTI-PRODUCT PURCHASE MODAL */}
      {(showAddModal || editingPurchase) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  {editingPurchase ? 'Edit Purchase Order' : 'Create Purchase Order'}
                </h3>
                <p className="text-xs text-slate-500">Fill in purchase details, vendor, multiple products and extra charges.</p>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setEditingPurchase(null)
                  resetForm()
                }}
                className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editingPurchase ? handleUpdatePurchase : handleAddPurchase} className="space-y-5">
              {/* Top Row: Date & Vendor Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date */}
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                    PURCHASE DATE
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-hidden bg-white shadow-2xs text-slate-800"
                    required
                  />
                </div>

                {/* SELECT VENDOR Searchable Input */}
                <div className="relative">
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                    SELECT VENDOR
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search vendor name..."
                      value={selectedVendorName ? selectedVendorName : vendorSearch}
                      onChange={(e) => {
                        setVendorSearch(e.target.value)
                        setSelectedVendorName('')
                        setSelectedVendorId('')
                        setShowVendorDropdown(true)
                      }}
                      onFocus={() => setShowVendorDropdown(true)}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-hidden bg-white pr-9 shadow-2xs placeholder:text-slate-400 text-slate-800 font-semibold"
                      required
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                  </div>

                  {showVendorDropdown && (
                    <div className="absolute z-40 left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-xl divide-y divide-slate-100">
                      {filteredVendors.length === 0 ? (
                        <div className="p-3 text-xs text-slate-500 text-center font-medium">
                          No matching vendors found.
                        </div>
                      ) : (
                        filteredVendors.map((v) => (
                          <div
                            key={v.id}
                            onClick={() => {
                              setSelectedVendorId(v.id)
                              setSelectedVendorName(v.name)
                              setVendorSearch(v.name)
                              setShowVendorDropdown(false)
                            }}
                            className="p-3 hover:bg-amber-50 cursor-pointer transition-colors text-xs flex items-center justify-between"
                          >
                            <span className="font-extrabold text-slate-900">{v.name}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* SELECTED VENDOR DETAILS CARD */}
              {selectedVend && (
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs space-y-1 font-medium">
                  <div className="flex justify-between border-b border-slate-200/60 pb-1">
                    <span className="uppercase text-[10px] tracking-wider text-slate-400 font-extrabold">SELECTED VENDOR:</span>
                    <span className="font-extrabold text-slate-900">{selectedVend.name}</span>
                  </div>
                  {selectedVend.contactPerson && (
                    <div className="flex justify-between">
                      <span className="uppercase text-[10px] tracking-wider text-slate-400 font-extrabold">CONTACT PERSON:</span>
                      <span className="font-semibold text-slate-900">{selectedVend.contactPerson}</span>
                    </div>
                  )}
                  {selectedVend.phone && (
                    <div className="flex justify-between">
                      <span className="uppercase text-[10px] tracking-wider text-slate-400 font-extrabold">MOBILE NUMBER:</span>
                      <span className="font-mono font-bold text-slate-800">{selectedVend.phone}</span>
                    </div>
                  )}
                  {selectedVend.city && (
                    <div className="flex justify-between">
                      <span className="uppercase text-[10px] tracking-wider text-slate-400 font-extrabold">ADDRESS / CITY:</span>
                      <span className="font-semibold text-slate-800">{selectedVend.city}</span>
                    </div>
                  )}
                </div>
              )}

              {/* PRODUCTS TO PURCHASE SECTION */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-700" />
                    <span className="font-extrabold text-slate-900 text-sm">
                      Products to Purchase ({itemLines.length})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={addItemLine}
                    className="btn-gold text-xs py-1.5 px-3 rounded-xl shadow-2xs font-extrabold flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Product</span>
                  </button>
                </div>

                {/* ITEM LINES LIST */}
                <div className="space-y-4">
                  {calculatedLines.map((line, index) => {
                    const filteredProds = products.filter(
                      (p) =>
                        p.name.toLowerCase().includes(line.productSearch.toLowerCase()) ||
                        (p.serialNumber &&
                          p.serialNumber.toLowerCase().includes(line.productSearch.toLowerCase()))
                    )

                    return (
                      <div
                        key={line.id}
                        className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3 relative transition-all"
                      >
                        {/* Line Header */}
                        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200">
                            PRODUCT ITEM #{index + 1}
                          </span>
                          {itemLines.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItemLine(line.id)}
                              className="p-1 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                              title="Remove Product Item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* SELECT PRODUCT Searchable Input */}
                        <div className="relative">
                          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                            SELECT PRODUCT
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Search product name or serial number..."
                              value={
                                line.productName
                                  ? line.matchedProduct?.serialNumber
                                    ? `${line.productName} (#${line.matchedProduct.serialNumber})`
                                    : line.productName
                                  : line.productSearch
                              }
                              onChange={(e) => {
                                updateItemLine(line.id, {
                                  productSearch: e.target.value,
                                  productName: '',
                                  productId: '',
                                  showDropdown: true,
                                })
                              }}
                              onFocus={() => updateItemLine(line.id, { showDropdown: true })}
                              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-hidden bg-white pr-9 shadow-2xs text-slate-800 font-semibold"
                              required
                            />
                            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                          </div>

                          {line.showDropdown && (
                            <div className="absolute z-30 left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-xl divide-y divide-slate-100">
                              {filteredProds.length === 0 ? (
                                <div className="p-3 text-xs text-slate-500 text-center font-medium">
                                  No matching products found.
                                </div>
                              ) : (
                                filteredProds.map((p) => (
                                  <div
                                    key={p.id}
                                    onClick={() => {
                                      updateItemLine(line.id, {
                                        productId: p.id,
                                        productName: p.name,
                                        productSearch: p.name,
                                        unit: p.unit || 'Kilogram',
                                        showDropdown: false,
                                      })
                                    }}
                                    className="p-3 hover:bg-amber-50 cursor-pointer transition-colors flex items-center justify-between text-xs"
                                  >
                                    <div>
                                      <div className="font-extrabold text-slate-900">{p.name}</div>
                                      {p.serialNumber && (
                                        <div className="text-[11px] text-slate-500 font-mono">#{p.serialNumber}</div>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <div className="font-mono font-bold text-amber-800">
                                        ₹{p.purchasePrice}/{p.unit}
                                      </div>
                                      <div className="text-[10px] text-slate-400">GST: {p.gstRate}%</div>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>

                        {/* Selected Product Specs Card */}
                        {line.matchedProduct && (
                          <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1 font-medium">
                            <div className="flex justify-between border-b border-slate-100 pb-1">
                              <span className="uppercase text-[10px] tracking-wider text-slate-400 font-extrabold">SKU / SERIAL:</span>
                              <span className="font-mono font-bold text-slate-900">#{line.matchedProduct.serialNumber || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="uppercase text-[10px] tracking-wider text-slate-400 font-extrabold">BASE PRICE (EXCL. GST):</span>
                              <span className="font-mono font-bold text-slate-900">₹{line.matchedProduct.purchasePrice.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="uppercase text-[10px] tracking-wider text-slate-400 font-extrabold">PRODUCT GST RATE:</span>
                              <span className="font-mono font-extrabold text-emerald-600">{line.matchedProduct.gstRate}% GST</span>
                            </div>
                          </div>
                        )}

                        {/* 4-Column Inputs: PURCHASE QTY, UNIT, DISCOUNT (%), LINE TOTAL (₹) */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                              PURCHASE QTY
                            </label>
                            <input
                              type="number"
                              step="any"
                              placeholder="e.g. 50"
                              value={line.quantity}
                              onChange={(e) => updateItemLine(line.id, { quantity: e.target.value })}
                              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-hidden bg-white shadow-2xs font-mono text-slate-900"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                              UNIT
                            </label>
                            <select
                              value={line.unit || (line.matchedProduct ? line.matchedProduct.unit : 'Kilogram')}
                              onChange={(e) => updateItemLine(line.id, { unit: e.target.value })}
                              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-hidden bg-white shadow-2xs text-slate-900"
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

                          <div>
                            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 mb-1">
                              DISCOUNT (%)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              placeholder="e.g. 10"
                              value={line.discount}
                              onChange={(e) => updateItemLine(line.id, { discount: e.target.value.replace(/-/g, '') })}
                              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-hidden bg-white shadow-2xs font-mono text-slate-900"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                              LINE TOTAL (₹)
                            </label>
                            <input
                              type="number"
                              step="any"
                              placeholder="e.g. 2275"
                              value={line.lineTotalPaid ? String(line.lineTotalPaid) : ''}
                              readOnly
                              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold bg-slate-50 font-mono text-slate-900 cursor-not-allowed"
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Add Product Line Button */}
                <button
                  type="button"
                  onClick={addItemLine}
                  className="w-full py-2.5 rounded-2xl border-2 border-dashed border-amber-300/80 hover:border-amber-400 text-amber-800 bg-amber-50/50 hover:bg-amber-50 font-extrabold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4 text-amber-700" />
                  <span>+ Add Another Product</span>
                </button>
              </div>

              {/* 2-Column Row: EXTRA CHARGES (₹), EXTRA CHARGES GST */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-amber-800 mb-1">
                    EXTRA CHARGES (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 200"
                    value={extraCharges}
                    onChange={(e) => setExtraCharges(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-hidden bg-white shadow-2xs font-mono placeholder:text-slate-400 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-amber-800 mb-1">
                    EXTRA CHARGES GST
                  </label>
                  <div className="relative">
                    <select
                      value={extraChargesGst}
                      onChange={(e) => setExtraChargesGst(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-amber-400 text-sm font-bold focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-hidden bg-white shadow-2xs text-slate-900 appearance-none pr-8 cursor-pointer"
                    >
                      <option value="0">0% GST</option>
                      <option value="5">5% GST</option>
                      <option value="12">12% GST</option>
                      <option value="18">18% GST</option>
                      <option value="28">28% GST</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-3.5 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* BILL BREAKDOWN BLUE SUMMARY BOX (Displayed ONLY when products are selected) */}
              {hasSelectedProducts && (
                <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center justify-between font-extrabold text-indigo-900 border-b border-indigo-100/80 pb-2 text-xs uppercase tracking-wider">
                    <span>PURCHASE BILL SUMMARY:</span>
                    <span>{calculatedLines.length} Product Line(s)</span>
                  </div>

                  {totalDiscountAmt > 0 ? (
                    <>
                      <div className="flex items-center justify-between font-semibold text-slate-700">
                        <span>Total Product Gross Subtotal:</span>
                        <span className="font-mono font-bold text-slate-700">₹{totalGrossBase.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between font-bold text-emerald-600">
                        <span>Total Product Discounts (-):</span>
                        <span className="font-mono">- ₹{totalDiscountAmt.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between font-semibold text-slate-900">
                        <span>Total Product Net Base (excl. GST):</span>
                        <span className="font-mono font-extrabold text-slate-900">₹{totalNetBase.toFixed(2)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-between font-semibold text-slate-700">
                      <span>Total Product Base (excl. GST):</span>
                      <span className="font-mono font-extrabold text-slate-900">₹{totalNetBase.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between font-bold text-emerald-600">
                    <span>Total Product GST (+):</span>
                    <span className="font-mono">+ ₹{totalProductGst.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between font-extrabold text-indigo-950 border-b border-indigo-100/80 pb-2">
                    <span>Total Product Paid (inc. GST):</span>
                    <span className="font-mono">₹{totalProductPaidIncGst.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between font-semibold text-amber-900 pt-1">
                    <span>Extra Charges Base:</span>
                    <span className="font-mono font-bold text-amber-900">₹{extrasBase.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between font-bold text-amber-800">
                    <span>Extra Charges GST ({extraChargesGst}%):</span>
                    <span className="font-mono">+ ₹{extrasGstAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between font-extrabold text-amber-950 border-b border-indigo-100/80 pb-2">
                    <span>Total Extra (inc. GST):</span>
                    <span className="font-mono">₹{totalExtraIncGst.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between font-extrabold text-indigo-950 text-sm pt-1">
                    <span>Grand Purchase Bill Total:</span>
                    <span className="font-mono text-indigo-700 text-base font-black">₹{calculatedGrandTotal.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Modal Buttons (Exact reference styling) */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingPurchase(null)
                    resetForm()
                  }}
                  className="w-1/2 py-3 px-4 rounded-2xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-1/2 py-3 px-4 rounded-2xl bg-slate-950 hover:bg-slate-900 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Purchase Order</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deletingPurchaseId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">Delete Purchase Order?</h3>
              <p className="text-xs text-slate-500">
                This action will permanently delete this purchase record from the database.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingPurchaseId(null)}
                className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => handleDeletePurchase(deletingPurchaseId)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {saving ? (
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
