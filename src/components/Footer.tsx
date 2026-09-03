import Link from 'next/link'
import Image from 'next/image'
import { Building2, Mail, Phone, MapPin, Database, LayoutDashboard } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 text-sm mt-24 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-lg bg-slate-950 p-1 border border-amber-500/40 shrink-0">
                <Image
                  src="/logo.png"
                  alt="Hetal Trading Company"
                  fill
                  sizes="40px"
                  className="object-contain rounded"
                />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-lg tracking-tight">HETAL TRADING</h3>
                <p className="text-[10px] text-amber-400 font-bold tracking-wider uppercase">COMPANY</p>
              </div>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Premier B2B impex partner for industrial chemicals, hydrated lime, raw minerals, agricultural commodities, and hardware supply chains.
            </p>
            <div className="flex items-center gap-2 text-xs text-amber-300 font-semibold bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 w-fit">
              <span>Registered B2B Trading Company</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 className="font-bold text-white mb-4 text-xs tracking-wider uppercase">Quick Navigation</h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li>
                <Link href="/" className="hover:text-amber-400 transition-colors">Home Overview</Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-amber-400 transition-colors">Commodity Catalog</Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-amber-400 transition-colors">Impex Services</Link>
              </li>
              <li>
                <Link href="/inquire" className="hover:text-amber-400 transition-colors">Request Quotation (RFQ)</Link>
              </li>
              <li>
                <Link href="/admin/inquiries" className="hover:text-amber-400 transition-colors font-medium flex items-center gap-1">
                  <LayoutDashboard className="w-3 h-3 text-amber-400" /> Shop CRM Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Product Categories */}
          <div>
            <h4 className="font-bold text-white mb-4 text-xs tracking-wider uppercase">Key Categories</h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li><Link href="/products?category=industrial-chemicals" className="hover:text-amber-400 transition-colors">Industrial Chemicals</Link></li>
              <li><Link href="/products?category=industrial-chemicals" className="hover:text-amber-400 transition-colors">Refined Hydrated Lime</Link></li>
              <li><Link href="/products?category=agri-commodities" className="hover:text-amber-400 transition-colors">Agricultural Grains & Seeds</Link></li>
              <li><Link href="/products?category=metals-hardware" className="hover:text-amber-400 transition-colors">Stainless Steel Hardware</Link></li>
              <li><Link href="/products?category=packaging-textiles" className="hover:text-amber-400 transition-colors">PP Woven Jumbo Bags</Link></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="font-bold text-white mb-4 text-xs tracking-wider uppercase">Corporate Office</h4>
            <ul className="space-y-3 text-xs text-slate-300">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>Hetal Trading Hub, Commercial Zone, GIDC, Gujarat, India</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>+91 (028) 4567-8900</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <span>info@hetaltrading.com</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} Hetal Trading Company. All Rights Reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-200 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-200 cursor-pointer">Terms of Supply</span>
            <span className="hover:text-slate-200 cursor-pointer">Quality Certifications</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
