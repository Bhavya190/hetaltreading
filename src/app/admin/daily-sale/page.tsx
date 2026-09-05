'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  TrendingUp,
  Plus,
  Calendar,
  Search,
  CheckCircle2,
  Trash2,
  X,
  Receipt,
  Loader2,
  ChevronRight,
  ChevronDown,
  Package,
  Pencil,
  User,
  Hash,
  Share2,
} from 'lucide-react'
import ExportActionBar from '@/components/ExportActionBar'
import DateRangeFilter from '@/components/DateRangeFilter'
import { shareOnWhatsApp } from '@/lib/exportUtils'

export interface SalesGridRow {
  id: string
  productId: string
  productName: string
  serialNumber: string
  gstRate: string
  unit: string
  quantity: string
  unitPrice: number
  amount: string | number
  discount: string
  discountedTotal: number
}

export interface DailySaleItemRecord {
  id: string
  productId?: string
  productName: string
  serialNumber?: string
  gstRate: string
  unit: string
  quantity: number
  unitPrice: number
  amount: number
  discount: number
  netTotal: number
}

export interface DailySaleRecord {
  id: string
  billNumber: string
  date: string
  customerName: string
  subtotal: number
  extraCharges: number
  grandTotal: number
  status: string
  items: DailySaleItemRecord[]
}

export interface ProductOption {
  id: string
  name: string
  serialNumber: string
  gstRate: string
  unit: string
  sellingPrice: number
}

export interface DebtCustomerOption {
  id: string
  customerName: string
  mobileNumber: string
}

const DEFAULT_DEBT_CUSTOMERS: DebtCustomerOption[] = [
  { id: 'DEBT - 01', customerName: 'Rajesh Mehta (Mehta Chemical Industries)', mobileNumber: '+91 98250 12345' },
  { id: 'DEBT - 02', customerName: 'Suresh Patel (Patel Agri Commodities)', mobileNumber: '+91 99090 67890' },
]

export default function DailySalePage() {
  const router = useRouter()
  const [sales, setSales] = useState<DailySaleRecord[]>([])
  const [products, setProducts] = useState<ProductOption[]>([])
  const [debtCustomers, setDebtCustomers] = useState<DebtCustomerOption[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const customerDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        customerDropdownRef.current &&
        !customerDropdownRef.current.contains(event.target as Node)
      ) {
        setShowCustomerDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])
  const [selectedSaleDetail, setSelectedSaleDetail] = useState<DailySaleRecord | null>(null)
  const [deletingSaleId, setDeletingSaleId] = useState<string | null>(null)

  const handleDeleteDailySale = async (id: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/daily-sales/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setSales(sales.filter((s) => s.id !== id))
      } else {
        fetchData()
      }
    } catch (err) {
      console.error('Error deleting daily sale entry:', err)
    } finally {
      setSaving(false)
      setDeletingSaleId(null)
    }
  }

  // Header Fields State
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0])
  const [customerName, setCustomerName] = useState('')
  const [billNumber, setBillNumber] = useState('')
  const [extraCharges, setExtraCharges] = useState('0')
  const [isDebtSale, setIsDebtSale] = useState(false)
  const [selectedDebtAccountId, setSelectedDebtAccountId] = useState<string | null>(null)

  // Product Grid Rows State
  const [gridRows, setGridRows] = useState<SalesGridRow[]>([
    {
      id: `row-1`,
      productId: '',
      productName: '',
      serialNumber: '-',
      gstRate: '18%',
      unit: 'Kg',
      quantity: '1',
      unitPrice: 0,
      amount: 0,
      discount: '0',
      discountedTotal: 0,
    },
  ])

  // Sample Data Fallback
  const SAMPLE_SALES: DailySaleRecord[] = [
    {
      id: 'SALE-101',
      billNumber: 'BILL-2026-001',
      date: '2026-09-03',
      customerName: 'Rajesh Mehta (Mehta Chemical Industries)',
      subtotal: 45000,
      extraCharges: 500,
      grandTotal: 45500,
      status: 'COMPLETED',
      items: [
        {
          id: 'ITEM-1',
          productName: 'Soda Ash Dense (Light Grade)',
          serialNumber: 'SN-SODA-01',
          gstRate: '18%',
          unit: 'Metric Ton',
          quantity: 2,
          unitPrice: 21000,
          amount: 42000,
          discount: 0,
          netTotal: 42000,
        },
        {
          id: 'ITEM-2',
          productName: 'Hydrated Lime Refined',
          serialNumber: 'SN-LIME-05',
          gstRate: '18%',
          unit: 'Kg',
          quantity: 60,
          unitPrice: 50,
          amount: 3000,
          discount: 0,
          netTotal: 3000,
        },
      ],
    },
    {
      id: 'SALE-102',
      billNumber: 'BILL-2026-002',
      date: '2026-09-03',
      customerName: 'Suresh Patel (Patel Agri Commodities)',
      subtotal: 105000,
      extraCharges: 1200,
      grandTotal: 106200,
      status: 'COMPLETED',
      items: [
        {
          id: 'ITEM-3',
          productName: 'PP Woven Jumbo Bags (1 MT Capacity)',
          serialNumber: 'SN-BAG-99',
          gstRate: '18%',
          unit: 'Piece',
          quantity: 300,
          unitPrice: 350,
          amount: 105000,
          discount: 0,
          netTotal: 105000,
        },
      ],
    },
  ]

  // Fetch Sales, Products, & Debt Customers
  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch Products
      const resProd = await fetch('/api/products')
      const dataProd = await resProd.json()
      if (dataProd.success && Array.isArray(dataProd.data)) {
        setProducts(
          dataProd.data.map((p: any) => ({
            id: p.id,
            name: p.name,
            serialNumber: p.serialNumber || 'SN-N/A',
            gstRate: `${p.gstRate || '18'}%`,
            unit: p.unit || 'Kg',
            sellingPrice: p.sellingPrice || 0,
          }))
        )
      }

      // Fetch Debt Customers
      const resCust = await fetch('/api/dept-accounts')
      const dataCust = await resCust.json()
      if (dataCust.success && Array.isArray(dataCust.data)) {
        setDebtCustomers(
          dataCust.data.map((c: any) => ({
            id: c.id,
            customerName: c.customerName,
            mobileNumber: c.mobileNumber,
          }))
        )
      } else {
        setDebtCustomers([])
      }

      // Fetch Daily Sales
      const resSales = await fetch('/api/daily-sales')
      const dataSales = await resSales.json()
      if (dataSales.success && Array.isArray(dataSales.data)) {
        setSales(
          dataSales.data.map((s: any) => ({
            ...s,
            date: s.date ? s.date.split('T')[0] : new Date().toISOString().split('T')[0],
          }))
        )
      } else {
        setSales([])
      }
    } catch (err) {
      console.error('Failed to load daily sales data:', err)
      setSales([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Auto-generate Bill Number when modal opens
  const openNewSalesModal = () => {
    const nextBillNum = `BILL-2026-${String(sales.length + 1).padStart(3, '0')}`
    setBillNumber(nextBillNum)
    setEntryDate(new Date().toISOString().split('T')[0])
    setCustomerName('')
    setIsDebtSale(false)
    setSelectedDebtAccountId(null)
    setExtraCharges('0')
    setGridRows([
      {
        id: `row-1`,
        productId: '',
        productName: '',
        serialNumber: '-',
        gstRate: '18%',
        unit: 'Kg',
        quantity: '1',
        unitPrice: 0,
        amount: 0,
        discount: '0',
        discountedTotal: 0,
      },
    ])
    setShowAddModal(true)
  }

  // Handle Product Selection in a Grid Row
  const handleSelectProductInRow = (rowId: string, selectedProdId: string) => {
    const foundProd = products.find((p) => p.id === selectedProdId)

    setGridRows((prevRows) =>
      prevRows.map((row) => {
        if (row.id !== rowId) return row

        if (!foundProd) {
          return {
            ...row,
            productId: '',
            productName: '',
            serialNumber: '-',
            gstRate: '18%',
            unit: 'Kg',
            unitPrice: 0,
            amount: 0,
            discountedTotal: 0,
          }
        }

        const qty = parseFloat(row.quantity) || 1
        const price = foundProd.sellingPrice || 0
        const amt = qty * price
        const disc = parseFloat(row.discount) || 0
        const net = Math.max(0, amt - disc)

        return {
          ...row,
          productId: foundProd.id,
          productName: foundProd.name,
          serialNumber: foundProd.serialNumber,
          gstRate: foundProd.gstRate,
          unit: foundProd.unit,
          unitPrice: price,
          amount: amt,
          discountedTotal: net,
        }
      })
    )
  }

  // Handle Quantity Change in a Grid Row
  const handleQuantityChange = (rowId: string, val: string) => {
    const cleanVal = val.replace(/[^0-9.]/g, '')
    const qty = parseFloat(cleanVal) || 0

    setGridRows((prevRows) =>
      prevRows.map((row) => {
        if (row.id !== rowId) return row

        const amt = qty * row.unitPrice
        const disc = parseFloat(row.discount) || 0
        const net = Math.max(0, amt - disc)

        return {
          ...row,
          quantity: cleanVal,
          amount: amt,
          discountedTotal: net,
        }
      })
    )
  }

  // Handle Manual Amount Change in a Grid Row
  const handleAmountChange = (rowId: string, val: string) => {
    const cleanVal = val.replace(/[^0-9.]/g, '')
    const amt = parseFloat(cleanVal) || 0

    setGridRows((prevRows) =>
      prevRows.map((row) => {
        if (row.id !== rowId) return row

        const disc = parseFloat(row.discount) || 0
        const net = Math.max(0, amt - disc)

        return {
          ...row,
          amount: cleanVal,
          discountedTotal: net,
        }
      })
    )
  }

  // Handle Discount Change in a Grid Row
  const handleDiscountChange = (rowId: string, val: string) => {
    const cleanVal = val.replace(/[^0-9.]/g, '')
    const disc = parseFloat(cleanVal) || 0

    setGridRows((prevRows) =>
      prevRows.map((row) => {
        if (row.id !== rowId) return row

        const amt = parseFloat(String(row.amount)) || 0
        const net = Math.max(0, amt - disc)

        return {
          ...row,
          discount: cleanVal,
          discountedTotal: net,
        }
      })
    )
  }

  // Add Product Row to Grid
  const handleAddProductRow = () => {
    const newRow: SalesGridRow = {
      id: `row-${Date.now()}`,
      productId: '',
      productName: '',
      serialNumber: '-',
      gstRate: '18%',
      unit: 'Kg',
      quantity: '1',
      unitPrice: 0,
      amount: 0,
      discount: '0',
      discountedTotal: 0,
    }
    setGridRows([...gridRows, newRow])
  }

  // Remove Product Row from Grid
  const handleRemoveProductRow = (rowId: string) => {
    if (gridRows.length <= 1) return
    setGridRows(gridRows.filter((r) => r.id !== rowId))
  }

  // Calculate Totals
  const subtotal = gridRows.reduce((acc, row) => acc + (row.discountedTotal || 0), 0)
  const parsedExtraCharges = parseFloat(extraCharges) || 0
  const grandTotal = subtotal + parsedExtraCharges

  // Submit Daily Sale Form
  const handleSaveDailySale = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerName || !billNumber) return

    // Ensure at least one product row has details
    const validRows = gridRows.filter((r) => r.productName || r.productId)
    if (validRows.length === 0) {
      alert('Please select at least 1 product in the sales entry grid table.')
      return
    }

    setSaving(true)

    // Check if this sale is for a Debt Customer
    const isDebt =
      isDebtSale ||
      selectedDebtAccountId !== null ||
      debtCustomers.some((c) => c.customerName.toLowerCase() === customerName.trim().toLowerCase())

    if (isDebt) {
      let targetDebtId = selectedDebtAccountId
      if (!targetDebtId) {
        const found = debtCustomers.find((c) => c.customerName.toLowerCase() === customerName.trim().toLowerCase())
        if (found) {
          targetDebtId = found.id
        }
      }

      // If debt account does not exist in DB yet, auto-register debt customer
      if (!targetDebtId) {
        try {
          const resCust = await fetch('/api/dept-accounts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customerName: customerName.trim(),
              mobileNumber: '+91 N/A',
              billingAddress: 'GIDC / Local Market',
              creditLimitDays: 30,
            }),
          })
          const dataCust = await resCust.json()
          if (dataCust.success && dataCust.data) {
            targetDebtId = dataCust.data.id
          }
        } catch (e) {
          console.error('Error creating debt account:', e)
        }
      }

      const itemsSummaryStr = validRows
        .map((r) => `${r.productName || 'Product'} (x${r.quantity} ${r.unit}) @ ₹${r.unitPrice}`)
        .join(', ')

      const txnPayload = {
        billNumber,
        date: entryDate,
        itemsSummary: itemsSummaryStr,
        billAmount: grandTotal,
        paidAmount: 0,
      }

      try {
        if (targetDebtId) {
          await fetch(`/api/dept-accounts/${targetDebtId}/transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(txnPayload),
          })
        }
      } catch (err) {
        console.error('Error adding bill to debt account:', err)
      } finally {
        setSaving(false)
        setShowAddModal(false)
        fetchData() // Refresh debt customers & sales
      }
      return
    }

    const payload = {
      billNumber,
      date: entryDate,
      customerName,
      extraCharges: parsedExtraCharges,
      items: validRows.map((r) => ({
        productId: r.productId || null,
        productName: r.productName || 'Custom Product',
        serialNumber: r.serialNumber || '-',
        gstRate: r.gstRate.replace('%', ''),
        unit: r.unit || 'Kg',
        quantity: parseFloat(r.quantity) || 1,
        unitPrice: r.unitPrice || 0,
        discount: parseFloat(r.discount) || 0,
      })),
    }

    try {
      const res = await fetch('/api/daily-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (data.success && data.data) {
        setSales([data.data, ...sales])
      } else {
        // Fallback local update
        const newSale: DailySaleRecord = {
          id: `SALE-${Date.now().toString().slice(-4)}`,
          billNumber,
          date: entryDate,
          customerName,
          subtotal,
          extraCharges: parsedExtraCharges,
          grandTotal,
          status: 'COMPLETED',
          items: validRows.map((r, i) => ({
            id: `ITEM-${i + 1}`,
            productName: r.productName || 'Custom Item',
            serialNumber: r.serialNumber || '-',
            gstRate: r.gstRate,
            unit: r.unit,
            quantity: parseFloat(r.quantity) || 1,
            unitPrice: r.unitPrice,
            amount: parseFloat(String(r.amount)) || 0,
            discount: parseFloat(r.discount) || 0,
            netTotal: r.discountedTotal,
          })),
        }
        setSales([newSale, ...sales])
      }
    } catch (err) {
      console.error('Error creating daily sale:', err)
      const newSale: DailySaleRecord = {
        id: `SALE-${Date.now().toString().slice(-4)}`,
        billNumber,
        date: entryDate,
        customerName,
        subtotal,
        extraCharges: parsedExtraCharges,
        grandTotal,
        status: 'COMPLETED',
        items: validRows.map((r, i) => ({
          id: `ITEM-${i + 1}`,
          productName: r.productName || 'Custom Item',
          serialNumber: r.serialNumber || '-',
          gstRate: r.gstRate,
          unit: r.unit,
          quantity: parseFloat(r.quantity) || 1,
          unitPrice: r.unitPrice,
          amount: parseFloat(String(r.amount)) || 0,
          discount: parseFloat(r.discount) || 0,
          netTotal: r.discountedTotal,
        })),
      }
      setSales([newSale, ...sales])
    } finally {
      setSaving(false)
      setShowAddModal(false)
    }
  }

  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Date Filter States (Default: Today)
  const todayStr = new Date().toISOString().split('T')[0]
  const [dateFilterMode, setDateFilterMode] = useState<'TODAY' | 'RANGE' | 'ALL'>('TODAY')
  const [startDate, setStartDate] = useState(todayStr)
  const [endDate, setEndDate] = useState(todayStr)

  const formatDateLabel = (dStr: string) => {
    if (!dStr) return '-'
    const clean = dStr.split('T')[0]
    const parts = clean.split('-')
    if (parts.length === 3) {
      const [y, m, d] = parts
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const monthName = months[parseInt(m, 10) - 1] || m
      return `${d} ${monthName} ${y}`
    }
    return clean
  }

  const handleQuickPreset = (preset: '7days' | 'month') => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    setEndDate(today)
    if (preset === '7days') {
      const past = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000)
      setStartDate(past.toISOString().split('T')[0])
    } else if (preset === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      setStartDate(firstDay.toISOString().split('T')[0])
    }
  }

  // Filter Sales Directory by Date Range & Search Query
  const filteredByDateSales = sales.filter((s) => {
    const cleanSaleDate = (s.date || '').split('T')[0]
    if (dateFilterMode === 'TODAY') {
      return cleanSaleDate === todayStr
    }
    if (dateFilterMode === 'RANGE') {
      if (startDate && endDate) {
        return cleanSaleDate >= startDate && cleanSaleDate <= endDate
      } else if (startDate) {
        return cleanSaleDate >= startDate
      } else if (endDate) {
        return cleanSaleDate <= endDate
      }
      return true
    }
    return true // 'ALL'
  })

  const filteredSales = filteredByDateSales.filter(
    (s) =>
      s.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredSales.map((s) => s.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const exportSales = selectedIds.length > 0
    ? filteredSales.filter((s) => selectedIds.includes(s.id))
    : filteredSales

  const activeSalesRevenue = filteredByDateSales.reduce((acc, curr) => acc + (curr.grandTotal || 0), 0)
  const todaySalesCount = sales.filter((s) => (s.date || '').split('T')[0] === todayStr).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-emerald-800 text-[11px] font-extrabold uppercase tracking-wider bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
            <span>Daily Sales & Revenue Ledger</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Daily Sales Register</h1>
          <p className="text-xs text-slate-500">
            Record daily product sales entries, generate customer bills, track GST, and manage itemized line totals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openNewSalesModal}
            className="btn-gold text-xs py-2.5 px-4 shadow-sm font-bold flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Daily Sales Entry</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">
            {dateFilterMode === 'TODAY'
              ? "Today's Sales Revenue"
              : dateFilterMode === 'RANGE'
              ? startDate === endDate
                ? `Sales Revenue (${formatDateLabel(startDate)})`
                : `Sales Revenue (${formatDateLabel(startDate)} to ${formatDateLabel(endDate)})`
              : 'All-Time Sales Revenue'}
          </span>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            ₹ {activeSalesRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold">
            {filteredByDateSales.length} sales bills logged
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs space-y-1">
          <span className="text-emerald-800 text-xs font-bold uppercase tracking-wider">Active Products Catalogue</span>
          <div className="text-2xl font-extrabold text-emerald-700 font-mono">{products.length} Items</div>
          <div className="text-[11px] text-emerald-600">Available for sales billing</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/30 shadow-xs space-y-1">
          <span className="text-amber-800 text-xs font-bold uppercase tracking-wider">Registered Debt Customers</span>
          <div className="text-2xl font-extrabold text-amber-800 font-mono">{debtCustomers.length} Debtors</div>
        <div className="text-[11px] text-amber-700 font-semibold">Available for credit billing</div>
        </div>
      </div>

      {/* Daily Sales Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Top Action Bar: 2 Rows */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 space-y-3">
          {/* ROW 1: Title on Left, Export Actions on Right */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-200/80 w-full">
            <div className="flex items-center gap-3">
              <div className="font-bold text-slate-900 text-sm whitespace-nowrap">
                Daily Sales Register ({filteredSales.length})
              </div>
              {selectedIds.length > 0 && (
                <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {selectedIds.length} Selected
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <ExportActionBar
                title={`Daily Sales Register - ${
                  dateFilterMode === 'TODAY'
                    ? `Today (${formatDateLabel(todayStr)})`
                    : dateFilterMode === 'RANGE'
                    ? `${formatDateLabel(startDate)} to ${formatDateLabel(endDate)}`
                    : 'All Entries'
                }`}
                filename={`hetal_daily_sales_${
                  dateFilterMode === 'TODAY' ? 'today' : dateFilterMode === 'RANGE' ? `${startDate}_to_${endDate}` : 'all'
                }`}
                data={exportSales}
                selectedCount={selectedIds.length}
                excelHeaders={[
                  { label: 'Bill Number', key: 'billNumber' },
                  { label: 'Date', key: 'date' },
                  { label: 'Customer Name', key: 'customerName' },
                  { label: 'Subtotal (₹)', key: 'subtotal' },
                  { label: 'Extra Charges (₹)', key: 'extraCharges' },
                  { label: 'Grand Total (₹)', key: 'grandTotal' },
                ]}
                pdfHeaders={['Bill #', 'Date', 'Customer Name', 'Subtotal', 'Extra (₹)', 'Grand Total (₹)']}
                pdfRows={exportSales.map((s) => [
                  s.billNumber,
                  formatDateLabel(s.date),
                  s.customerName,
                  `₹${(s.subtotal || 0).toLocaleString()}`,
                  `₹${(s.extraCharges || 0).toLocaleString()}`,
                  `₹${(s.grandTotal || 0).toLocaleString()}`,
                ])}
              />
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
              todayCount={todaySalesCount}
              totalCount={sales.length}
            />

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by bill number or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:border-amber-600 text-slate-900 font-medium"
              />
            </div>
          </div>
        </div>

        {filteredSales.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-amber-700" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-slate-800">
                {dateFilterMode === 'TODAY'
                  ? "No Sales Entries Recorded for Today"
                  : dateFilterMode === 'RANGE'
                  ? `No Sales Entries Found from ${formatDateLabel(startDate)} to ${formatDateLabel(endDate)}`
                  : 'No Sales Records Found'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {dateFilterMode === 'TODAY' ? (
                  <>
                    Click <strong>"Add Daily Sales Entry"</strong> above to record today's sales, or click <strong>"All Sales"</strong> or <strong>"Date Range"</strong> to inspect previous entries.
                  </>
                ) : (
                  <>Try adjusting your date range or search keyword, or log a new sales entry.</>
                )}
              </p>
            </div>
            {dateFilterMode !== 'ALL' && (
              <button
                type="button"
                onClick={() => setDateFilterMode('ALL')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-3 py-1.5 rounded-xl transition-colors mt-2"
              >
                <span>Show All Time Sales Entries ({sales.length})</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 font-extrabold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={filteredSales.length > 0 && selectedIds.length === filteredSales.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-4">Bill Number</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Items Count</th>
                  <th className="py-3 px-4">Subtotal</th>
                  <th className="py-3 px-4">Extra Charges</th>
                  <th className="py-3 px-4">Grand Total</th>
                  <th className="py-3 px-4 text-right">View Bill</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                {filteredSales.map((sale) => (
                  <tr
                    key={sale.id}
                    onClick={() => router.push(`/admin/daily-sale/${encodeURIComponent(sale.id)}`)}
                    className={`hover:bg-amber-50/40 cursor-pointer transition-colors ${selectedIds.includes(sale.id) ? 'bg-amber-50/60' : ''}`}
                  >
                    <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(sale.id)}
                        onChange={(e) => handleToggleSelect(sale.id, e as any)}
                        className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-900 bg-amber-50/40 rounded-lg">
                      <Link
                        href={`/admin/daily-sale/${encodeURIComponent(sale.id)}`}
                        className="hover:underline hover:text-amber-800"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {sale.billNumber}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-mono font-semibold">
                      {formatDateLabel(sale.date)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <Link
                        href={`/admin/daily-sale/${encodeURIComponent(sale.id)}`}
                        className="hover:underline hover:text-amber-800"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {sale.customerName}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      <span className="bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                        {sale.items?.length || 0} Products
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                      ₹ {sale.subtotal ? sale.subtotal.toLocaleString() : 0}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      ₹ {sale.extraCharges ? sale.extraCharges.toLocaleString() : 0}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-extrabold text-emerald-700 text-sm">
                      ₹ {sale.grandTotal ? sale.grandTotal.toLocaleString() : 0}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          const msg = `*Hetal Trading Company - Sales Bill*\n📄 Bill #: ${sale.billNumber}\n📅 Date: ${formatDateLabel(sale.date)}\n👤 Customer: ${sale.customerName}\n💰 Grand Total: ₹${(sale.grandTotal || 0).toLocaleString()}`
                          shareOnWhatsApp(msg)
                        }}
                        className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                        title="Share Bill on WhatsApp"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <Link
                        href={`/admin/daily-sale/${encodeURIComponent(sale.id)}`}
                        className="btn-gold text-[11px] py-1 px-3 shadow-2xs font-bold inline-block"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View Details
                      </Link>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeletingSaleId(sale.id)
                        }}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Sales Record"
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

      {/* NEW SALES POPUP MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden my-auto">
            {/* Modal Top Title Bar */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-white">
              <h2 className="text-base font-extrabold text-slate-900 tracking-wide uppercase">NEW SALES</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDailySale} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1 bg-slate-50/50">
                {(isDebtSale || selectedDebtAccountId !== null || debtCustomers.some(c => c.customerName.toLowerCase() === customerName.trim().toLowerCase())) && (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-950 text-xs font-semibold flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>
                      <strong>Udhaar / Debt Sale Active:</strong> This sale bill will be posted directly into <strong>{customerName || 'Debt Customer'}</strong>'s Debt Customer Ledger and will <strong>NOT</strong> display in Daily Sales.
                    </span>
                  </div>
                )}

                {/* 1. Header Card (Select Customer, Date, Manual Bill Number) */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* ENTRY DATE */}
                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                        ENTRY DATE
                      </label>
                      <input
                        type="date"
                        required
                        value={entryDate}
                        onChange={(e) => setEntryDate(e.target.value)}
                        className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono bg-white focus:outline-none focus:border-amber-600"
                      />
                    </div>

                    {/* SELECT CUSTOMER */}
                    <div className="relative" ref={customerDropdownRef}>
                      <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                        SELECT CUSTOMER
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="Search or type customer name..."
                          value={customerName}
                          onClick={() => setShowCustomerDropdown(true)}
                          onFocus={() => setShowCustomerDropdown(true)}
                          onChange={(e) => {
                            setCustomerName(e.target.value)
                            setShowCustomerDropdown(true)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape' || e.key === 'Enter' || e.key === 'Tab') {
                              setShowCustomerDropdown(false)
                            }
                          }}
                          className="w-full border border-slate-300 rounded-xl pl-3.5 pr-8 py-2 text-xs text-slate-900 bg-white focus:outline-none focus:border-amber-600 font-semibold"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Searchable Floating Customer Dropdown Menu (Only shown when open and has matching debt customers) */}
                      {showCustomerDropdown && (
                        (() => {
                          const matchingDebtCustomers = debtCustomers.filter((c) =>
                            c.customerName.toLowerCase().includes(customerName.toLowerCase())
                          )

                          if (matchingDebtCustomers.length === 0) return null

                          return (
                            <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-xl max-h-52 overflow-y-auto divide-y divide-slate-100">
                              {matchingDebtCustomers.map((cust) => (
                                <button
                                  key={cust.id}
                                  type="button"
                                  onClick={() => {
                                    setCustomerName(cust.customerName)
                                    setSelectedDebtAccountId(cust.id)
                                    setIsDebtSale(true)
                                    setShowCustomerDropdown(false)
                                  }}
                                  className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-amber-50 hover:text-amber-900 transition-colors flex items-center justify-between"
                                >
                                  <div>
                                    <div className="font-bold text-slate-800">{cust.customerName}</div>
                                    <div className="text-[10px] font-mono text-slate-400">{cust.mobileNumber}</div>
                                  </div>
                                  <span className="text-[10px] font-extrabold bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                                    Debt Customer
                                  </span>
                                </button>
                              ))}
                            </div>
                          )
                        })()
                      )}

                      {/* Udhaar / Debt Sale Checkbox */}
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="isDebtSaleToggle"
                          checked={isDebtSale || selectedDebtAccountId !== null}
                          onChange={(e) => {
                            setIsDebtSale(e.target.checked)
                            if (!e.target.checked) setSelectedDebtAccountId(null)
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                        />
                        <label htmlFor="isDebtSaleToggle" className="text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-1.5">
                          <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold px-1.5 py-0.2 rounded">
                            Udhaar / Debt Sale
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* MANUAL BILL NUMBER */}
                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                        MANUAL BILL NUMBER
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Enter Bill Number manually..."
                        value={billNumber}
                        onChange={(e) => setBillNumber(e.target.value)}
                        className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono bg-white focus:outline-none focus:border-amber-600"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Product Sales Entry Grid Table Card */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
                    <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                      SELLS ENTRY GRID TABLE
                    </h3>
                    <button
                      type="button"
                      onClick={handleAddProductRow}
                      className="border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-xl font-extrabold text-xs inline-flex items-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Product</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-200">
                          <th className="py-3 px-3 min-w-[200px]">PRODUCT SPECIFICATIONS</th>
                          <th className="py-3 px-3">SERIAL / SKU</th>
                          <th className="py-3 px-3">GST %</th>
                          <th className="py-3 px-3 min-w-[120px]">QTY</th>
                          <th className="py-3 px-3 font-right">AMOUNT (₹)</th>
                          <th className="py-3 px-3 min-w-[110px]">DISCOUNT (₹)</th>
                          <th className="py-3 px-3">DISCOUNTED TOTAL</th>
                          <th className="py-3 px-3 text-center">ACTION</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800">
                        {gridRows.map((row, idx) => (
                          <tr key={row.id} className="hover:bg-slate-50/50">
                            {/* Product Specifications Dropdown */}
                            <td className="py-3 px-3">
                              <select
                                value={row.productId}
                                onChange={(e) => handleSelectProductInRow(row.id, e.target.value)}
                                className="w-full border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 bg-white focus:outline-none focus:border-amber-600"
                              >
                                <option value="">Search & choose product...</option>
                                {products.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} (₹{p.sellingPrice.toLocaleString()}/{p.unit})
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* Serial / SKU */}
                            <td className="py-3 px-3 font-mono text-slate-600 font-semibold">
                              {row.serialNumber}
                            </td>

                            {/* GST % */}
                            <td className="py-3 px-3 font-semibold text-slate-700">
                              {row.gstRate}
                            </td>

                            {/* QTY + Unit Badge */}
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  placeholder="1"
                                  value={row.quantity}
                                  onChange={(e) => handleQuantityChange(row.id, e.target.value)}
                                  className="w-16 border border-slate-300 rounded-xl px-2 py-1 text-xs text-slate-900 font-mono text-center focus:outline-none focus:border-amber-600"
                                />
                                <span className="text-[10px] font-extrabold uppercase text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                  {row.unit}
                                </span>
                              </div>
                            </td>

                            {/* AMOUNT (₹) - Auto-calculated but editable */}
                            <td className="py-3 px-3">
                              <div className="relative flex items-center">
                                <span className="absolute left-2.5 text-xs text-slate-400 font-mono">₹</span>
                                <input
                                  type="text"
                                  placeholder="0"
                                  value={row.amount}
                                  onChange={(e) => handleAmountChange(row.id, e.target.value)}
                                  className="w-24 border border-slate-300 rounded-xl pl-6 pr-2 py-1 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-amber-600 bg-white"
                                />
                              </div>
                            </td>

                            {/* DISCOUNT (₹) */}
                            <td className="py-3 px-3">
                              <input
                                type="text"
                                placeholder="0"
                                value={row.discount}
                                onChange={(e) => handleDiscountChange(row.id, e.target.value)}
                                className="w-20 border border-slate-300 rounded-xl px-2 py-1 text-xs text-slate-900 font-mono focus:outline-none focus:border-amber-600"
                              />
                            </td>

                            {/* DISCOUNTED TOTAL */}
                            <td className="py-3 px-3 font-mono font-extrabold text-emerald-700">
                              ₹{row.discountedTotal.toLocaleString()}
                            </td>

                            {/* ACTION */}
                            <td className="py-3 px-3 text-center">
                              <button
                                type="button"
                                disabled={gridRows.length <= 1}
                                onClick={() => handleRemoveProductRow(row.id)}
                                className="text-rose-500 hover:text-rose-700 disabled:opacity-30 p-1 rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Table Bottom Action Bar & Extra Charges */}
                  <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={handleAddProductRow}
                      className="border border-purple-200 text-purple-700 bg-white hover:bg-purple-50 px-3.5 py-1.5 rounded-xl font-extrabold text-xs inline-flex items-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Product</span>
                    </button>

                    {/* Extra Charges Input */}
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                        EXTRA CHARGES (₹):
                      </label>
                      <input
                        type="text"
                        placeholder="0"
                        value={extraCharges}
                        onChange={(e) => setExtraCharges(e.target.value.replace(/[^0-9.]/g, ''))}
                        className="w-28 border border-slate-300 rounded-xl px-3 py-1 text-xs text-slate-900 font-mono focus:outline-none focus:border-amber-600 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Footer Summary Bar */}
              <div className="p-4 sm:p-5 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
                  <div>Subtotal: <span className="font-mono font-bold text-slate-900">₹{subtotal.toLocaleString()}</span></div>
                  <div>Extra Charges: <span className="font-mono font-bold text-slate-900">₹{parsedExtraCharges.toLocaleString()}</span></div>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-right space-y-0.5">
                    <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">GRAND TOTAL</div>
                    <div className="text-2xl font-extrabold text-emerald-600 font-mono leading-none">
                      ₹{grandTotal.toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2 rounded-xl text-xs font-bold shadow-md transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save</span>}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sale Detail Popup Modal */}
      {selectedSaleDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-slate-900 text-white flex items-start justify-between">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-amber-400 text-[10px] font-extrabold uppercase tracking-wider bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  <span>Bill No: {selectedSaleDetail.billNumber}</span>
                </div>
                <h2 className="text-xl font-extrabold text-white">{selectedSaleDetail.customerName}</h2>
                <div className="text-xs text-slate-300">Date: {selectedSaleDetail.date}</div>
              </div>
              <button
                onClick={() => setSelectedSaleDetail(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="font-bold text-slate-900 text-sm">Product Line Items ({selectedSaleDetail.items?.length || 0})</div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase tracking-wider border-b border-slate-200 text-[10px]">
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3">SKU / Serial</th>
                      <th className="py-2.5 px-3">Qty</th>
                      <th className="py-2.5 px-3">Unit Price</th>
                      <th className="py-2.5 px-3">Discount</th>
                      <th className="py-2.5 px-3 text-right">Net Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    {selectedSaleDetail.items?.map((it) => (
                      <tr key={it.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{it.productName}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{it.serialNumber || '-'}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {it.quantity} {it.unit}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-700">₹{it.unitPrice.toLocaleString()}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">₹{it.discount.toLocaleString()}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-700 text-right">
                          ₹{it.netTotal.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-2 border-t border-slate-200 space-y-1 text-right font-mono text-xs">
                <div>Subtotal: <span className="font-bold">₹{selectedSaleDetail.subtotal?.toLocaleString()}</span></div>
                <div>Extra Charges: <span className="font-bold">₹{selectedSaleDetail.extraCharges?.toLocaleString()}</span></div>
                <div className="text-base font-extrabold text-emerald-700 pt-1">
                  Grand Total: ₹{selectedSaleDetail.grandTotal?.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedSaleDetail(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl"
              >
                Close Bill Details
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Daily Sale Confirmation Dialog */}
      {deletingSaleId && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 border border-slate-200 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">Delete Sales Record?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to delete this daily sale bill and all line items?
              </p>
            </div>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setDeletingSaleId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteDailySale(deletingSaleId)}
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
