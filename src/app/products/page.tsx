'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { MOCK_PRODUCTS, MOCK_CATEGORIES, ProductItem } from '@/lib/mockData'
import { Search, CheckCircle2, Package, ArrowRight, X } from 'lucide-react'

export default function ProductsPage() {
  const [products] = useState<ProductItem[]>(MOCK_PRODUCTS)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [activeModalProduct, setActiveModalProduct] = useState<ProductItem | null>(null)

  const filteredProducts = products.filter((product) => {
    const matchesCat =
      selectedCategory === 'all' ||
      product.categoryId === selectedCategory ||
      product.categoryName?.toLowerCase().includes(selectedCategory.toLowerCase())

    const matchesSearch =
      !searchQuery ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesCat && matchesSearch
  })

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-amber-100 selection:text-amber-900">
      <Navbar />

      {/* Header Banner */}
      <section className="py-12 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3 text-center md:text-left">
          <div className="inline-flex items-center gap-2 text-amber-800 text-xs font-bold uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-200 w-fit mx-auto md:mx-0">
            <Package className="w-3.5 h-3.5 text-amber-700" />
            <span>Industrial Commodity Catalog</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Explore Commodity Inventory & Products
          </h1>
          <p className="text-slate-600 text-sm max-w-2xl">
            Browse certified industrial chemicals, hydrated lime, raw minerals, agricultural grains, and hardware components available for bulk trade.
          </p>
        </div>
      </section>

      {/* Search and Category Filters */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6 flex-1">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products, specs, chemicals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-colors shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-amber-50'
              }`}
            >
              All Items ({products.length})
            </button>
            {MOCK_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-amber-50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-4 my-8 shadow-xs">
            <Package className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900">No products match your filter</h3>
            <p className="text-xs text-slate-500">Try adjusting your search query or category selection.</p>
            <button
              onClick={() => {
                setSelectedCategory('all')
                setSearchQuery('')
              }}
              className="btn-outline-gold text-xs py-2 px-4"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 py-4">
            {filteredProducts.map((product) => (
              <div key={product.id} className="glass-card overflow-hidden flex flex-col justify-between group bg-white border-slate-200">
                <div className="relative h-52 w-full bg-slate-100">
                  <Image
                    src={product.imageUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-white/95 text-amber-900 border border-amber-200 text-[10px] font-extrabold px-2.5 py-1 rounded uppercase tracking-wider shadow-xs">
                    {product.categoryName || 'Commodity'}
                  </div>
                  {product.inStock && (
                    <div className="absolute top-3 right-3 bg-emerald-600 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 shadow-xs">
                      <CheckCircle2 className="w-3 h-3" /> Ready Stock
                    </div>
                  )}
                </div>

                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  {product.specs && (
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5 text-xs">
                      {Object.entries(product.specs).map(([key, val]) => (
                        <div key={key} className="flex justify-between text-slate-700">
                          <span className="text-slate-500 font-medium">{key}:</span>
                          <span className="font-bold text-slate-900">{val}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[10px] text-slate-500">Min Order Qty</div>
                      <div className="text-xs font-extrabold text-slate-900">
                        {product.minOrderQty} {product.unit}s
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveModalProduct(product)}
                        className="btn-outline-navy text-xs py-1.5 px-3"
                      >
                        Specs
                      </button>
                      <Link
                        href={`/inquire?product=${encodeURIComponent(product.name)}`}
                        className="btn-gold text-xs py-1.5 px-3"
                      >
                        Request Quote
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Product Details Modal */}
      {activeModalProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setActiveModalProduct(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] text-amber-800 font-extrabold uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {activeModalProduct.categoryName}
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 pt-1">{activeModalProduct.name}</h2>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              {activeModalProduct.description}
            </p>

            {activeModalProduct.specs && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Technical Specifications</h4>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                  {Object.entries(activeModalProduct.specs).map(([k, v]) => (
                    <div key={k} className="flex justify-between border-b border-slate-200 pb-1.5 last:border-none last:pb-0">
                      <span className="text-slate-500 font-medium">{k}</span>
                      <span className="font-bold text-slate-900">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                onClick={() => setActiveModalProduct(null)}
                className="btn-outline-navy text-xs"
              >
                Close
              </button>
              <Link
                href={`/inquire?product=${encodeURIComponent(activeModalProduct.name)}`}
                className="btn-gold text-xs"
                onClick={() => setActiveModalProduct(null)}
              >
                <span>Proceed to RFQ</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
