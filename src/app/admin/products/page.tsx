'use client'

import { useState, useEffect } from 'react'
import { Package, Plus, Search, X, Loader2, Tag, Percent, ArrowUpRight } from 'lucide-react'

export interface ProductRecord {
  id: string
  serialNumber: string
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
  const [showAddModal, setShowAddModal] = useState(false)

  // Form State for 7 required product fields
  const [serialNumber, setSerialNumber] = useState('')
  const [name, setName] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [unit, setUnit] = useState('Kg')
  const [inventoryStock, setInventoryStock] = useState('')
  const [sellingPrice, setSellingPrice] = useState('')
  const [gstRate, setGstRate] = useState('18')

  // Fetch products from database API
  const fetchProducts = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/products')
      const data = await res.json()
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setProducts(data.data)
      } else {
        // Sample initial dataset with exact 7 fields
        setProducts([
          {
            id: 'prod-101',
            serialNumber: 'SN-1001',
            name: 'Refined Hydrated Lime (92%+ Purity)',
            purchasePrice: 42,
            unit: 'Kg',
            inventoryStock: 850,
            sellingPrice: 55,
            gstRate: 18,
            inStock: true,
          },
          {
            id: 'prod-102',
            serialNumber: 'SN-1002',
            name: 'Industrial Grade Soda Ash Dense',
            purchasePrice: 16500,
            unit: 'Metric Ton',
            inventoryStock: 120,
            sellingPrice: 21000,
            gstRate: 18,
            inStock: true,
          },
          {
            id: 'prod-103',
            serialNumber: 'SN-1003',
            name: 'Polypropylene Woven Jumbo Bags (1 Ton)',
            purchasePrice: 280,
            unit: 'Piece',
            inventoryStock: 1500,
            sellingPrice: 350,
            gstRate: 5,
            inStock: true,
          },
        ])
      }
    } catch (err) {
      console.error('Failed to fetch products:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !serialNumber) return

    setSaving(true)
    const payload = {
      serialNumber,
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
        const newProd: ProductRecord = {
          id: `prod-${101 + products.length}`,
          serialNumber,
          name,
          purchasePrice: parseFloat(purchasePrice) || 0,
          unit,
          inventoryStock: parseInt(inventoryStock, 10) || 0,
          sellingPrice: parseFloat(sellingPrice) || 0,
          gstRate: parseFloat(gstRate) || 18,
          inStock: (parseInt(inventoryStock, 10) || 0) > 0,
        }
        setProducts([newProd, ...products])
      }
    } catch (err) {
      console.error('Error saving product:', err)
      const newProd: ProductRecord = {
        id: `prod-${101 + products.length}`,
        serialNumber,
        name,
        purchasePrice: parseFloat(purchasePrice) || 0,
        unit,
        inventoryStock: parseInt(inventoryStock, 10) || 0,
        sellingPrice: parseFloat(sellingPrice) || 0,
        gstRate: parseFloat(gstRate) || 18,
        inStock: (parseInt(inventoryStock, 10) || 0) > 0,
      }
      setProducts([newProd, ...products])
    } finally {
      setSaving(false)
      setSerialNumber('')
      setName('')
      setPurchasePrice('')
      setSellingPrice('')
      setInventoryStock('')
      setUnit('Kg')
      setGstRate('18')
      setShowAddModal(false)
    }
  }

  const filtered = products.filter(
    (p) =>
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.serialNumber && p.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-amber-800 text-[11px] font-extrabold uppercase tracking-wider bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
            <Package className="w-3.5 h-3.5 text-amber-700" />
            <span>Product Inventory CRM</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Products & Stock Control</h1>
          <p className="text-xs text-slate-500">
            Manage product serial numbers, unit purchase & selling rates, inventory stock levels, and GST slab rates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setShowAddModal(true)} className="btn-gold text-xs py-2.5 px-4 shadow-sm">
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Table & Search Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="font-bold text-slate-900 text-sm">Product Catalog ({products.length})</div>

          <div className="w-full sm:w-72 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by serial number or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-amber-600"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
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
                <tr className="bg-slate-100/80 text-slate-700 font-extrabold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">S.No / Serial No</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Purchase Price</th>
                  <th className="py-3 px-4">Selling Price</th>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4">Inventory Stock</th>
                  <th className="py-3 px-4">GST Rate</th>
                  <th className="py-3 px-4 text-right">Stock Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                {filtered.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-900 bg-amber-50/50 rounded-lg">
                      {prod.serialNumber || 'SN-N/A'}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                      {prod.name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      ₹ {prod.purchasePrice ? prod.purchasePrice.toLocaleString() : 0}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-800">
                      ₹ {prod.sellingPrice ? prod.sellingPrice.toLocaleString() : 0}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {prod.unit}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {prod.inventoryStock ? prod.inventoryStock.toLocaleString() : 0} {prod.unit}s
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="bg-amber-100 text-amber-900 font-extrabold px-2.5 py-0.5 rounded-full inline-block whitespace-nowrap">
                        {prod.gstRate}% GST
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {prod.inventoryStock > 0 ? (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                          In Stock
                        </span>
                      ) : (
                        <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                          Out of Stock
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Product Modal Form */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <h3 className="font-extrabold text-base text-slate-900">Add New Product</h3>
                <p className="text-[11px] text-slate-500">Fill in product details, pricing per unit, inventory stock, and GST rate.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-4 text-xs">
              {/* Product Name - Full Width */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  1. Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Refined Hydrated Lime (92%+ Purity)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
                />
              </div>

              {/* Serial Number & GST (%) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    2. Serial Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SN-1001"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    3. GST (%) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={gstRate}
                    onChange={(e) => setGstRate(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 bg-white font-mono"
                  >
                    <option value="0">0% (Exempt)</option>
                    <option value="5">5% (Concessional)</option>
                    <option value="18">18% (Standard Industrial)</option>
                  </select>
                </div>
              </div>

              {/* Purchase Price & Selling Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    4. Purchase Price / Unit (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0"
                    placeholder="e.g. 42.00"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    5. Selling Price (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0"
                    placeholder="e.g. 55.00"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 font-mono"
                  />
                </div>
              </div>

              {/* Measuring Unit & Inventory Stock */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    6. Measuring Unit <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 bg-white"
                  >
                    <option value="Kg">Kg</option>
                    <option value="Metric Ton">Metric Ton</option>
                    <option value="Litre">Litre</option>
                    <option value="Box">Box</option>
                    <option value="Piece">Piece</option>
                    <option value="Bag">Bag</option>
                    <option value="Bale">Bale</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    7. Inventory Stock <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 500"
                    value={inventoryStock}
                    onChange={(e) => setInventoryStock(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-gold px-5 py-2 shadow-sm font-bold flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Product</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
