'use client'

import { useState, useEffect } from 'react'
import { Package, Plus, Search, X, Loader2, Tag, Percent, Pencil, Trash2, Share2 } from 'lucide-react'
import ExportActionBar from '@/components/ExportActionBar'
import { exportToExcel, exportToPDF, printReport, shareOnWhatsApp } from '@/lib/exportUtils'

export interface ProductRecord {
  id: string
  hsnCode?: string
  serialNumber?: string
  name: string
  purchasePrice: number
  unit: string
  inventoryStock: number
  sellingPrice: number
  gstRate: number
  inStock?: boolean
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductRecord | null>(null)
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null)

  // Form State
  const [hsnCode, setHsnCode] = useState('')
  const [name, setName] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [unit, setUnit] = useState('Kilogram')
  const [inventoryStock, setInventoryStock] = useState('')
  const [sellingPrice, setSellingPrice] = useState('')
  const [gstRate, setGstRate] = useState('18')

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/products')
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setProducts(data.data)
      } else {
        setProducts([])
      }
    } catch (err) {
      console.error('Failed to fetch products:', err)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const resetForm = () => {
    setHsnCode('')
    setName('')
    setPurchasePrice('')
    setUnit('Kilogram')
    setInventoryStock('')
    setSellingPrice('')
    setGstRate('18')
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return

    setSaving(true)
    const payload = {
      hsnCode: hsnCode || '2804',
      name,
      purchasePrice,
      unit,
      inventoryStock,
      sellingPrice,
      gstRate,
    }

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success && data.data) {
        setProducts([data.data, ...products])
      } else {
        fetchProducts()
      }
    } catch (err) {
      console.error('Error adding product:', err)
    } finally {
      setSaving(false)
      setShowAddModal(false)
      resetForm()
    }
  }

  const openEditModal = (prod: ProductRecord) => {
    setEditingProduct(prod)
    setHsnCode(prod.hsnCode || prod.serialNumber || '')
    setName(prod.name || '')
    setPurchasePrice(prod.purchasePrice ? String(prod.purchasePrice) : '')
    setUnit(prod.unit || 'Kg')
    setInventoryStock(prod.inventoryStock ? String(prod.inventoryStock) : '')
    setSellingPrice(prod.sellingPrice ? String(prod.sellingPrice) : '')
    setGstRate(prod.gstRate ? String(prod.gstRate) : '18')
  }

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProduct) return

    setSaving(true)
    const payload = {
      hsnCode: hsnCode || '2804',
      name,
      purchasePrice,
      unit,
      inventoryStock,
      sellingPrice,
      gstRate,
    }

    try {
      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success && data.data) {
        setProducts(products.map((p) => (p.id === editingProduct.id ? data.data : p)))
      } else {
        fetchProducts()
      }
    } catch (err) {
      console.error('Error updating product:', err)
    } finally {
      setSaving(false)
      setEditingProduct(null)
      resetForm()
    }
  }

  const handleDeleteProduct = async (id: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setProducts(products.filter((p) => p.id !== id))
      } else {
        fetchProducts()
      }
    } catch (err) {
      console.error('Error deleting product:', err)
    } finally {
      setSaving(false)
      setDeletingProductId(null)
    }
  }

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.serialNumber && p.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredProducts.map((p) => p.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const getExportProducts = () => {
    return selectedIds.length > 0
      ? filteredProducts.filter((p) => selectedIds.includes(p.id))
      : filteredProducts
  }

  const handleExportPDF = () => {
    const exportItems = getExportProducts()
    exportToPDF({
      title: 'Products Directory & Stock Inventory Report',
      headers: ['HSN Code', 'Product Name', 'Purchase Price', 'Selling Price', 'GST Rate', 'Current Stock'],
      data: exportItems.map((p) => [
        p.hsnCode || p.serialNumber || '-',
        p.name,
        `₹ ${p.purchasePrice ? p.purchasePrice.toLocaleString() : 0} / ${p.unit}`,
        `₹ ${p.sellingPrice ? p.sellingPrice.toLocaleString() : 0} / ${p.unit}`,
        `${p.gstRate}%`,
        `${p.inventoryStock || 0} ${p.unit}`,
      ]),
      filename: 'Products_Directory',
    })
  }

  const handleExportExcel = () => {
    const exportItems = getExportProducts()
    exportToExcel({
      filename: 'Products_Directory',
      headers: ['HSN Code', 'Product Name', 'Purchase Price', 'Selling Price', 'Unit', 'GST Rate (%)', 'Inventory Stock'],
      rows: exportItems.map((p) => [
        p.hsnCode || p.serialNumber || '-',
        p.name,
        p.purchasePrice || 0,
        p.sellingPrice || 0,
        p.unit,
        p.gstRate,
        p.inventoryStock || 0,
      ]),
    })
  }

  const handlePrint = () => {
    const exportItems = getExportProducts()
    printReport({
      title: 'Products Directory & Stock Inventory Report',
      headers: ['HSN Code', 'Product Name', 'Purchase Price', 'Selling Price', 'GST Rate', 'Current Stock'],
      data: exportItems.map((p) => [
        p.hsnCode || p.serialNumber || '-',
        p.name,
        `₹ ${p.purchasePrice ? p.purchasePrice.toLocaleString() : 0} / ${p.unit}`,
        `₹ ${p.sellingPrice ? p.sellingPrice.toLocaleString() : 0} / ${p.unit}`,
        `${p.gstRate}%`,
        `${p.inventoryStock || 0} ${p.unit}`,
      ]),
    })
  }

  const handleShareWhatsApp = () => {
    const exportItems = getExportProducts()
    const summary =
      `📦 *Products & Inventory Catalogue*\nTotal Products: ${exportItems.length}\n\n*Top Products:*\n` +
      exportItems
        .slice(0, 10)
        .map((p) => `• ${p.name} (${p.serialNumber}) | Sell Price: ₹${p.sellingPrice}/${p.unit} | Stock: ${p.inventoryStock || 0} ${p.unit}`)
        .join('\n')
    shareOnWhatsApp(summary)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-amber-800 text-[11px] font-extrabold uppercase tracking-wider bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
            <Package className="w-3.5 h-3.5 text-amber-700" />
            <span>Inventory & Product Catalogue</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Products Directory</h1>
          <p className="text-xs text-slate-500">
            Manage raw chemical products, serial SKUs, purchase/selling pricing, GST rates, and inventory stock.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setShowAddModal(true)} className="btn-gold text-xs py-2.5 px-4 shadow-sm font-bold flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Product Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col lg:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-start">
            <div className="font-bold text-slate-900 text-sm">Product Catalogue ({filteredProducts.length})</div>
            {selectedIds.length > 0 && (
              <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
                {selectedIds.length} Selected
              </span>
            )}
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <ExportActionBar
              onExportPDF={handleExportPDF}
              onExportExcel={handleExportExcel}
              onPrint={handlePrint}
              onShareWhatsApp={handleShareWhatsApp}
              selectedCount={selectedIds.length}
            />
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search HSN code or product name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:border-amber-600 text-slate-900"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            <span className="text-xs font-semibold">Loading products from database...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-slate-800">No Products Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Click <strong>"Add New Product"</strong> above to register inventory items.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 font-extrabold uppercase tracking-wider border-b border-slate-200 text-[11px] whitespace-nowrap">
                  <th className="py-3 px-4 w-10 text-center whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={filteredProducts.length > 0 && selectedIds.length === filteredProducts.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-4 whitespace-nowrap">HSN Code</th>
                  <th className="py-3 px-4 whitespace-nowrap">Product Name</th>
                  <th className="py-3 px-4 whitespace-nowrap">Purchase Price</th>
                  <th className="py-3 px-4 whitespace-nowrap">Selling Price</th>
                  <th className="py-3 px-4 whitespace-nowrap">GST Rate</th>
                  <th className="py-3 px-4 whitespace-nowrap">Stock</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                {filteredProducts.map((prod) => (
                  <tr key={prod.id} className={`hover:bg-slate-50 whitespace-nowrap ${selectedIds.includes(prod.id) ? 'bg-amber-50/40' : ''}`}>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(prod.id)}
                        onChange={() => handleToggleSelect(prod.id)}
                        className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">{prod.hsnCode || prod.serialNumber || '-'}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">{prod.name}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">₹ {prod.purchasePrice ? prod.purchasePrice.toLocaleString() : 0} / {prod.unit}</td>
                    <td className="py-3.5 px-4 font-mono font-extrabold text-emerald-700 whitespace-nowrap">₹ {prod.sellingPrice ? prod.sellingPrice.toLocaleString() : 0} / {prod.unit}</td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="bg-purple-100 text-purple-800 text-[10px] font-extrabold px-2 py-0.5 rounded whitespace-nowrap">
                        {prod.gstRate}% GST
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800 whitespace-nowrap">
                      {prod.inventoryStock !== undefined && prod.inventoryStock !== null ? `${prod.inventoryStock.toLocaleString()} ${prod.unit}` : `0 ${prod.unit}`}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1 whitespace-nowrap">
                      <button
                        onClick={() => {
                          const msg = `📦 *Product Specification*\nHSN Code: ${prod.hsnCode || prod.serialNumber || '-'}\nName: ${prod.name}\nPurchase Price: ₹${prod.purchasePrice}/${prod.unit}\nSelling Price: ₹${prod.sellingPrice}/${prod.unit}\nGST Rate: ${prod.gstRate}%\nCurrent Stock: ${prod.inventoryStock || 0} ${prod.unit}`
                          shareOnWhatsApp(msg)
                        }}
                        className="p-1.5 text-emerald-600 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors"
                        title="Share Product on WhatsApp"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(prod)}
                        className="p-1.5 text-slate-600 hover:text-amber-600 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Edit Product"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingProductId(prod.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
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

      {/* Add / Edit Product Modal */}
      {(showAddModal || editingProduct) && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900">
                {editingProduct ? 'Edit Product Details' : 'Add New Product'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setEditingProduct(null)
                  resetForm()
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Soda Ash Dense"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">HSN Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2804, 2815, 2902"
                  value={hsnCode}
                  onChange={(e) => setHsnCode(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-600 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Purchase Price (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 16500"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 21000"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-600 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-600 bg-white"
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
                  <label className="block font-bold text-slate-700 mb-1">GST Rate (%)</label>
                  <select
                    value={gstRate}
                    onChange={(e) => setGstRate(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-600 bg-white"
                  >
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="18">18%</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stock (Optional)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={inventoryStock}
                    onChange={(e) => setInventoryStock(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-600 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingProduct(null)
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
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>{editingProduct ? 'Update Product' : 'Save Product'}</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingProductId && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 border border-slate-200 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">Delete Product?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to delete this product? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setDeletingProductId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteProduct(deletingProductId)}
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
