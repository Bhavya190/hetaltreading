'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  TrendingUp, 
  ShoppingBag, 
  Receipt, 
  Truck, 
  Building2,
  BookOpen, 
  Package, 
  Users, 
  FileText, 
  Menu, 
  X, 
  Database, 
  LogOut,
  ChevronRight,
  ShieldCheck,
  ArrowLeft
} from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  const isLoginPage = pathname === '/admin/login'

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/check')
        const data = await res.json()
        if (data.authenticated) {
          setAuthenticated(true)
          if (isLoginPage) {
            router.push('/admin/dashboard')
          }
        } else {
          setAuthenticated(false)
          if (!isLoginPage) {
            router.push('/admin/login')
          }
        }
      } catch (err) {
        setAuthenticated(false)
        if (!isLoginPage) {
          router.push('/admin/login')
        }
      }
    }

    checkAuth()
  }, [pathname, isLoginPage, router])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setAuthenticated(false)
      router.push('/admin/login')
      router.refresh()
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  // If rendering the login page, render clean page without sidebar
  if (isLoginPage) {
    return <>{children}</>
  }

  // Loading state while checking auth
  if (authenticated === null) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <div className="text-xs text-slate-400 font-mono">Verifying Admin Session...</div>
      </div>
    )
  }

  const crmNavItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Daily Sale', href: '/admin/daily-sale', icon: TrendingUp },
    { name: 'Purchase', href: '/admin/purchase', icon: ShoppingBag },
    { name: 'Bills', href: '/admin/bills', icon: Receipt },
    { name: 'Vendors', href: '/admin/vendors', icon: Truck },
    { name: 'Debt', href: '/admin/debt', icon: BookOpen },
    { name: 'Products', href: '/admin/products', icon: Package },
    { name: 'Quotations', href: '/admin/quotations', icon: FileText },
  ]

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900">
      
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white h-16 border-b border-slate-800 flex items-center justify-between px-4 sm:px-6 shadow-md">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
            aria-label="Toggle Sidebar"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 rounded-lg bg-slate-950 p-1 border border-amber-500/40 shrink-0">
              <Image
                src="/logo.png"
                alt="Hetal Trading"
                fill
                sizes="36px"
                className="object-contain rounded"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-white group-hover:text-amber-400 transition-colors">
                HETAL TRADING Co.
              </span>
              <span className="text-[9px] tracking-widest uppercase text-amber-400 font-bold">
                SHOP & B2B CONTROL DESK
              </span>
            </div>
          </Link>
        </div>

        {/* Header Right Tools */}
        <div className="flex items-center gap-4 text-xs">

          <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xs shadow-inner">
              HT
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-slate-300 hover:text-rose-400 font-bold px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-800/80 border border-slate-700 transition-colors"
              title="Logout from Admin CRM"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Body */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Sidebar Navigation */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 flex flex-col justify-between shadow-xs ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-3 space-y-4 overflow-y-auto">
            <div className="pt-1">
              {/* <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3 px-2">
                CRM Management Modules
              </div> */}
              <nav className="space-y-1">
                {crmNavItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || (item.href === '/admin/dashboard' && pathname === '/admin')
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold tracking-tight transition-all ${
                        isActive
                          ? 'bg-slate-900 text-amber-400 shadow-sm border border-slate-800'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                        <span>{item.name}</span>
                      </div>
                      {isActive && <ChevronRight className="w-4 h-4 text-amber-400 shrink-0" />}
                    </Link>
                  )
                })}
              </nav>
            </div>
          </div>

        </aside>

        {/* Main Content Workspace */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50">
          {children}
        </main>

      </div>

    </div>
  )
}
