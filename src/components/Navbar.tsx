'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { 
  Building2, 
  Package, 
  Briefcase, 
  MessageSquareQuote, 
  LayoutDashboard, 
  Menu, 
  X,
  Database,
  ArrowRight,
  ShieldCheck,
  ChevronRight
} from 'lucide-react'

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const navLinks = [
    { name: 'Home', href: '/', icon: Building2 },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Services', href: '/services', icon: Briefcase },
    { name: 'Request Quote', href: '/inquire', icon: MessageSquareQuote },
    { name: 'Shop CRM Dashboard', href: '/admin/inquiries', icon: LayoutDashboard, isCrm: true },
  ]

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Top Banner Notice */}
      <div className="bg-slate-900 text-slate-200 text-xs py-1.5 px-4 flex items-center justify-between border-b border-slate-800">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-amber-500/30">
              B2B Shop CRM
            </span>
            <span className="hidden sm:inline text-slate-400">|</span>
            <span className="hidden sm:inline text-xs text-slate-300">Hetal Trading Company Impex & Commodity System</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-300">
            <Link href="/admin/inquiries" className="hover:text-amber-400 font-medium flex items-center gap-0.5">
              <span>Admin Portal</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand Name */}
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="relative w-12 h-12 rounded-xl bg-slate-900 p-1.5 border border-amber-500/40 shadow-sm group-hover:border-amber-500 transition-colors shrink-0">
              <Image
                src="/logo.png"
                alt="Hetal Trading Company Logo"
                fill
                sizes="48px"
                className="object-contain p-0.5 rounded-lg"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight text-slate-900 group-hover:text-amber-600 transition-colors">
                HETAL TRADING
              </span>
              <span className="text-[10px] tracking-widest uppercase text-amber-700 font-bold">
                COMPANY • GLOBAL COMMODITIES & IMPEX
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200/80">
            {navLinks.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? link.isCrm
                        ? 'bg-slate-900 text-amber-400 shadow-xs'
                        : 'bg-white text-amber-700 shadow-xs border border-slate-200 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? (link.isCrm ? 'text-amber-400' : 'text-amber-600') : 'text-slate-500'}`} />
                  {link.name}
                </Link>
              )
            })}
          </nav>

          {/* Action CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/admin/inquiries"
              className="btn-navy text-xs py-2.5 px-4 shadow-sm"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-amber-400" />
              <span>CRM Portal</span>
            </Link>
            <Link
              href="/inquire"
              className="btn-gold text-xs py-2.5 px-4 shadow-sm"
            >
              <span>Instant RFQ</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-2 shadow-lg animate-in slide-in-from-top-2">
          {navLinks.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-5 h-5 text-amber-600" />
                {link.name}
              </Link>
            )
          })}
          <div className="pt-2 grid grid-cols-2 gap-2">
            <Link
              href="/admin/inquiries"
              onClick={() => setMobileMenuOpen(false)}
              className="btn-navy justify-center text-xs py-3"
            >
              <LayoutDashboard className="w-4 h-4 text-amber-400" />
              <span>CRM Dashboard</span>
            </Link>
            <Link
              href="/inquire"
              onClick={() => setMobileMenuOpen(false)}
              className="btn-gold justify-center text-xs py-3"
            >
              <span>Submit RFQ</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
