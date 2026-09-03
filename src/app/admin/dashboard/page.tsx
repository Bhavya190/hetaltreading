'use client'

import { useState } from 'react'
import Link from 'next/link'
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
  ArrowUpRight, 
  Plus, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertCircle
} from 'lucide-react'

export default function DashboardPage() {
  const [stats] = useState({
    todaySales: '₹ 0',
    totalPurchases: '₹ 0',
    pendingBills: 0,
    totalProducts: 0,
    activeVendors: 0,
    activeCustomers: 0,
    pendingQuotes: 0,
  })

  const recentSales: any[] = []
  const recentQuotes: any[] = []

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-amber-800 text-[11px] font-extrabold uppercase tracking-wider bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
            <LayoutDashboard className="w-3.5 h-3.5 text-amber-700" />
            <span>Shop CRM Overview</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">CRM Dashboard Overview</h1>
          <p className="text-xs text-slate-500">Live summary of sales, purchases, inventory, bills, and pending customer quotations.</p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/daily-sale" className="btn-gold text-xs py-2 px-3.5 shadow-2xs">
            <Plus className="w-3.5 h-3.5" />
            <span>New Sale Entry</span>
          </Link>
          <Link href="/admin/bills" className="btn-navy text-xs py-2 px-3.5 shadow-2xs">
            <Receipt className="w-3.5 h-3.5 text-amber-400" />
            <span>Create Bill</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Today's Sales</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">{stats.todaySales}</div>
          <div className="text-[11px] text-slate-500 font-medium">Ready for entries</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Total Purchase Log</span>
            <ShoppingBag className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">{stats.totalPurchases}</div>
          <div className="text-[11px] text-slate-500 font-medium">0 Orders Pending</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Pending Bills</span>
            <Receipt className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">{stats.pendingBills} Bills</div>
          <div className="text-[11px] text-slate-500 font-medium">No pending follow-ups</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Pending RFQ Quotes</span>
            <FileText className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-800 font-mono">{stats.pendingQuotes} RFQs</div>
          <div className="text-[11px] text-amber-700 font-semibold">Active quotes</div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Sales Log */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Recent Sales Transactions</h2>
              <p className="text-xs text-slate-500">Latest customer receipts and shop register entries</p>
            </div>
            <Link href="/admin/daily-sale" className="text-xs text-amber-700 font-bold hover:underline flex items-center gap-1">
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentSales.length === 0 ? (
            <div className="p-8 text-center space-y-2 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-xs font-bold text-slate-700">No Sales Recorded Today</p>
              <p className="text-[11px] text-slate-500">Go to Daily Sale page to log your shop transactions.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentSales.map((sale) => (
                <div key={sale.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900">{sale.customer}</div>
                    <div className="text-slate-500 font-mono text-[11px]">{sale.id} • {sale.mode}</div>
                  </div>
                  <div className="text-right space-y-0.5">
                    <div className="font-mono font-extrabold text-slate-900">{sale.amount}</div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      sale.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {sale.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Module Navigation & Quick Quote Queue */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">CRM Management Modules</h2>
            
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <Link href="/admin/daily-sale" className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Daily Sale</span>
              </Link>

              <Link href="/admin/purchase" className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-slate-800 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Purchase</span>
              </Link>

              <Link href="/admin/bills" className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-slate-800 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Bills</span>
              </Link>

              <Link href="/admin/vendors" className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-slate-800 flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Vendors</span>
              </Link>

              <Link href="/admin/debt" className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-slate-800 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Debt</span>
              </Link>

              <Link href="/admin/products" className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-slate-800 flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Products</span>
              </Link>

              <Link href="/admin/customers" className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-slate-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Customers</span>
              </Link>

              <Link href="/admin/quotations" className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Quotations</span>
              </Link>
            </div>
          </div>
        </div>

      </div>

    </div>
  )
}
