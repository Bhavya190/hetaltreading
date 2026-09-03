import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import QuickQuoteForm from '@/components/QuickQuoteForm'
import { MOCK_PRODUCTS, MOCK_CATEGORIES } from '@/lib/mockData'
import { 
  Globe2, 
  ShieldCheck, 
  Truck, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  TrendingUp,
  Boxes,
  LayoutDashboard
} from 'lucide-react'

export const revalidate = 60

export default function HomePage() {
  redirect('/admin/login')

  const featuredProducts = MOCK_PRODUCTS.filter((p) => p.featured)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-amber-100 selection:text-amber-900">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-16 md:pb-28 bg-gradient-to-b from-amber-50/60 via-slate-50 to-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Hero Text Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-amber-200 text-amber-900 text-xs font-bold shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Premier B2B Impex & Supply Chain Enterprise</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
                Global Commodities & Impex with <span className="text-gradient-gold">Hetal Trading</span>
              </h1>

              <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Your trusted B2B partner for high-purity industrial chemicals, raw minerals, agricultural commodities, and metal hardware. Integrated with our digital Shop CRM system.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link href="/inquire" className="w-full sm:w-auto btn-gold py-3.5 px-7 text-sm shadow-md">
                  <span>Request Bulk Quote</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/admin/inquiries" className="w-full sm:w-auto btn-navy py-3.5 px-7 text-sm shadow-md">
                  <LayoutDashboard className="w-4 h-4 text-amber-400" />
                  <span>Shop CRM Dashboard</span>
                </Link>
              </div>

              {/* Key Trust Badges */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-200 max-w-xl mx-auto lg:mx-0 text-left">
                <div className="space-y-0.5">
                  <div className="text-2xl font-extrabold text-slate-900 font-mono">15+ Years</div>
                  <div className="text-xs text-slate-500 font-medium">Trade Excellence</div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-2xl font-extrabold text-amber-700 font-mono">50K+ MT</div>
                  <div className="text-xs text-slate-500 font-medium">Shipped Annually</div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-2xl font-extrabold text-slate-900 font-mono">100%</div>
                  <div className="text-xs text-slate-500 font-medium">Quality Verified</div>
                </div>
              </div>
            </div>

            {/* Right Hero Logo & Visual Card */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-md bg-white rounded-2xl p-8 text-center space-y-6 border border-slate-200 shadow-xl">
                <div className="relative w-48 h-48 mx-auto bg-slate-900 rounded-2xl p-4 border border-amber-500/40 shadow-md flex items-center justify-center overflow-hidden">
                  <Image
                    src="/logo.png"
                    alt="Hetal Trading Company Corporate Logo"
                    width={180}
                    height={180}
                    className="object-contain rounded-xl hover:scale-105 transition-transform duration-300"
                    priority
                  />
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-extrabold text-slate-900 tracking-wide">HETAL TRADING COMPANY</h3>
                  <p className="text-xs text-amber-700 uppercase font-bold tracking-widest">
                    REGISTERED IMPEX & COMMODITIES
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-around text-xs text-slate-700 font-medium">
                  <span className="flex items-center gap-1 text-emerald-700 font-bold">
                    <CheckCircle2 className="w-4 h-4" /> ISO Certified
                  </span>
                  <span className="flex items-center gap-1 text-slate-900 font-bold">
                    <Globe2 className="w-4 h-4 text-amber-600" /> Global Shipping
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Core Trading Categories */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <div className="text-xs font-bold text-amber-700 tracking-widest uppercase">Specialized Portfolios</div>
          <h2 className="text-3xl font-extrabold text-slate-900">Core Commodity Categories</h2>
          <p className="text-slate-600 text-sm">
            We supply high-grade raw materials directly from verified factories & mines to global destinations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {MOCK_CATEGORIES.map((cat) => (
            <div key={cat.id} className="glass-card p-6 flex flex-col justify-between space-y-4 group bg-white border-slate-200">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <Boxes className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-slate-600 text-xs leading-relaxed">
                  {cat.description}
                </p>
              </div>
              <Link
                href={`/products?category=${cat.slug}`}
                className="text-xs font-bold text-amber-700 flex items-center gap-1 pt-2 group-hover:translate-x-1 transition-transform"
              >
                <span>Explore Items</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-white border-y border-slate-200 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs font-bold text-amber-700 tracking-widest uppercase">Verified Quality</span>
              <h2 className="text-3xl font-extrabold text-slate-900 mt-1">Featured Shop Commodities</h2>
            </div>
            <Link href="/products" className="btn-outline-gold text-xs w-fit">
              <span>Browse Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredProducts.map((product) => (
              <div key={product.id} className="glass-card overflow-hidden flex flex-col justify-between group bg-white border-slate-200">
                <div className="relative h-48 w-full bg-slate-100">
                  <Image
                    src={product.imageUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-amber-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded uppercase tracking-wider shadow-xs">
                    Featured
                  </div>
                  {product.inStock && (
                    <div className="absolute top-3 right-3 bg-emerald-600 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 shadow-xs">
                      <CheckCircle2 className="w-3 h-3" /> Ready Stock
                    </div>
                  )}
                </div>

                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-amber-800 font-bold uppercase tracking-wider">
                      {product.categoryName}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-amber-700 transition-colors line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  {product.specs && (
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1 text-xs">
                      {Object.entries(product.specs).slice(0, 2).map(([key, val]) => (
                        <div key={key} className="flex justify-between text-slate-700">
                          <span className="text-slate-500 font-medium">{key}:</span>
                          <span className="font-bold text-slate-900">{val}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between border-t border-slate-200">
                    <div>
                      <div className="text-[10px] text-slate-500">Min. Order</div>
                      <div className="text-xs font-bold text-slate-900">{product.minOrderQty} {product.unit}s</div>
                    </div>
                    <Link
                      href={`/inquire?product=${encodeURIComponent(product.name)}`}
                      className="btn-gold text-xs py-2 px-3"
                    >
                      <span>Inquire Now</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote Request Section */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 text-amber-800 text-xs font-bold uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              <TrendingUp className="w-4 h-4 text-amber-700" />
              <span>Direct Factory & Mine Pricing</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Get an Official Quotation for Your Orders
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Whether you need regular monthly supply contracts or bulk spot deliveries, Hetal Trading Company ensures competitive pricing, SGS inspection compliance, and complete logistics support.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Strict Quality Assurance</h4>
                  <p className="text-xs text-slate-600">Certificates of Analysis (COA) provided with every single shipment batch.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800 shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Global Impex & Port Logistics</h4>
                  <p className="text-xs text-slate-600">Containerized, bulk vessel, and road transport logistics to your port of destination.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <QuickQuoteForm />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
