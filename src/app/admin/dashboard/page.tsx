'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  LayoutDashboard, 
  TrendingUp, 
  ShoppingBag, 
  Receipt, 
  Truck, 
  Wallet,
  BookOpen, 
  Package, 
  Users, 
  ArrowUpRight, 
  Plus, 
  Loader2
} from 'lucide-react'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    todaySales: 0,
    totalPurchases: 0,
    customerDebtDue: 0,
    vendorDebtDue: 0,
  })

  const [recentSales, setRecentSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true)
      try {
        const todayStr = new Date().toISOString().split('T')[0]

        // 1. Today's Sale Amount & Recent Sales Logs
        const resSales = await fetch('/api/daily-sales').catch(() => null)
        let salesList: any[] = []
        if (resSales && resSales.ok) {
          const dataSales = await resSales.json()
          if (dataSales.success && Array.isArray(dataSales.data)) {
            salesList = dataSales.data
          }
        }

        const todaySales = salesList.filter((s: any) => {
          const sDate = s.date ? new Date(s.date).toISOString().split('T')[0] : ''
          return sDate === todayStr
        })
        const todaySalesSum = Math.round(
          todaySales.reduce((acc: number, curr: any) => acc + (curr.netTotal || curr.totalAmount || 0), 0)
        )

        // 2. Total Purchase Amount
        const resPurchases = await fetch('/api/purchase').catch(() => null)
        let purchaseList: any[] = []
        if (resPurchases && resPurchases.ok) {
          const dataPurchases = await resPurchases.json()
          if (dataPurchases.success && Array.isArray(dataPurchases.data)) {
            purchaseList = dataPurchases.data
          }
        }
        const totalPurchasesSum = Math.round(
          purchaseList.reduce((acc: number, curr: any) => acc + (curr.totalAmount || 0), 0)
        )

        // 3. Total Due Payments from Debt Customers
        const resCustDebt = await fetch('/api/dept-accounts').catch(() => null)
        let custDebtList: any[] = []
        if (resCustDebt && resCustDebt.ok) {
          const dataCustDebt = await resCustDebt.json()
          if (dataCustDebt.success && Array.isArray(dataCustDebt.data)) {
            custDebtList = dataCustDebt.data
          }
        }
        const customerDebtDue = Math.round(
          custDebtList.reduce((acc: number, curr: any) => acc + (curr.balanceDue || 0), 0)
        )

        // 4. Total Due Payment to Pay to Vendors
        const resVendDebt = await fetch('/api/vendor-accounts').catch(() => null)
        let vendDebtList: any[] = []
        if (resVendDebt && resVendDebt.ok) {
          const dataVendDebt = await resVendDebt.json()
          if (dataVendDebt.success && Array.isArray(dataVendDebt.data)) {
            vendDebtList = dataVendDebt.data
          }
        }
        const vendorDebtDue = Math.round(
          vendDebtList.reduce((acc: number, curr: any) => acc + (curr.balanceDue || 0), 0)
        )

        setStats({
          todaySales: todaySalesSum,
          totalPurchases: totalPurchasesSum,
          customerDebtDue,
          vendorDebtDue,
        })

        // Sort sales by date desc and take recent 4 logs
        const sortedSales = [...salesList].sort(
          (a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime()
        )
        setRecentSales(sortedSales.slice(0, 4))
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-amber-800 text-[11px] font-extrabold uppercase tracking-wider bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
            <LayoutDashboard className="w-3.5 h-3.5 text-amber-700" />
            <span>Shop CRM Overview</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">CRM Dashboard</h1>
          <p className="text-xs text-slate-500 font-medium">
            Live summary of sales, purchases, customer debt receivables, and vendor payables.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/daily-sale" className="btn-gold text-xs py-2 px-3.5 shadow-2xs font-bold">
            <Plus className="w-3.5 h-3.5" />
            <span>New Sale Entry</span>
          </Link>
          <Link href="/admin/bills" className="btn-navy text-xs py-2 px-3.5 shadow-2xs font-bold">
            <Receipt className="w-3.5 h-3.5 text-amber-400" />
            <span>Create Bill</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid (4 Live Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Today's Sale Amount */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Today's Sale Amount</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 font-mono">
            ₹{stats.todaySales.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold">Total sales entries today</div>
        </div>

        {/* 2. Total Purchase Amount */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Total Purchase Amount</span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            ₹{stats.totalPurchases.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">Cumulative purchase orders</div>
        </div>

        {/* 3. Total Due Payments from Debt Customer */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Due From Debt Customers</span>
            <div className="p-2 bg-purple-50 text-purple-700 rounded-xl">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-700 font-mono">
            ₹{stats.customerDebtDue.toLocaleString()}
          </div>
          <div className="text-[11px] text-purple-700 font-semibold">Outstanding customer balance</div>
        </div>

        {/* 4. Total Due Payment to Pay to Vendors */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Due Payable to Vendors</span>
            <div className="p-2 bg-rose-50 text-rose-700 rounded-xl">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 font-mono">
            ₹{stats.vendorDebtDue.toLocaleString()}
          </div>
          <div className="text-[11px] text-rose-700 font-semibold">Remaining owed to vendors</div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 5. Daily Sales Log (3 or 4 Logs with View All Link) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Recent Daily Sales Logs</h2>
              <p className="text-xs text-slate-500 font-medium">Latest sales register entries</p>
            </div>
            <Link
              href="/admin/daily-sale"
              className="text-xs text-amber-700 font-extrabold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-600" />
              <p className="text-xs font-semibold">Loading daily sales logs...</p>
            </div>
          ) : recentSales.length === 0 ? (
            <div className="p-8 text-center space-y-2 bg-slate-50 rounded-2xl border border-slate-200">
              <p className="text-xs font-bold text-slate-700">No Sales Recorded Today</p>
              <p className="text-[11px] text-slate-500">Click below to log your daily sales transactions.</p>
              <Link
                href="/admin/daily-sale"
                className="inline-block mt-2 px-3.5 py-1.5 bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-xs"
              >
                Go to Daily Sale
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentSales.map((sale) => (
                <div key={sale.id} className="py-3.5 flex items-center justify-between text-xs">
                  <div className="space-y-1">
                    <div className="font-extrabold text-slate-900 text-sm">
                      {sale.customerName || sale.customer || 'Walk-in Customer'}
                    </div>
                    <div className="text-slate-600 text-xs font-medium">
                      {sale.itemsSummary || sale.productName || sale.item || 'Sale Entry'}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      #{sale.saleNumber || sale.id.slice(0, 10)} • {sale.date ? new Date(sale.date).toLocaleDateString() : 'Today'}
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <div className="font-mono font-black text-slate-900 text-sm">
                      ₹{Math.round(sale.netTotal || sale.totalAmount || 0).toLocaleString()}
                    </div>
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full inline-block ${
                        sale.paymentStatus === 'PAID' || sale.status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {sale.paymentStatus || sale.status || 'PAID'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 6. CRM Management Modules Card */}
        <div>
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">
              CRM Management Modules
            </h2>

            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <Link
                href="/admin/daily-sale"
                className="p-3 bg-slate-50 hover:bg-emerald-50/70 border border-slate-200/80 hover:border-emerald-300 rounded-2xl text-slate-800 flex items-center gap-2.5 transition-all group"
              >
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl group-hover:scale-105 transition-transform">
                  <TrendingUp className="w-4 h-4 shrink-0" />
                </div>
                <span>Daily Sale</span>
              </Link>

              <Link
                href="/admin/purchase"
                className="p-3 bg-slate-50 hover:bg-amber-50/70 border border-slate-200/80 hover:border-amber-300 rounded-2xl text-slate-800 flex items-center gap-2.5 transition-all group"
              >
                <div className="p-2 bg-amber-100 text-amber-700 rounded-xl group-hover:scale-105 transition-transform">
                  <ShoppingBag className="w-4 h-4 shrink-0" />
                </div>
                <span>Purchase</span>
              </Link>

              <Link
                href="/admin/vendor-debt"
                className="p-3 bg-slate-50 hover:bg-rose-50/70 border border-slate-200/80 hover:border-rose-300 rounded-2xl text-slate-800 flex items-center gap-2.5 transition-all group"
              >
                <div className="p-2 bg-rose-100 text-rose-700 rounded-xl group-hover:scale-105 transition-transform">
                  <Wallet className="w-4 h-4 shrink-0" />
                </div>
                <span>Vendor Debt</span>
              </Link>

              <Link
                href="/admin/debt"
                className="p-3 bg-slate-50 hover:bg-purple-50/70 border border-slate-200/80 hover:border-purple-300 rounded-2xl text-slate-800 flex items-center gap-2.5 transition-all group"
              >
                <div className="p-2 bg-purple-100 text-purple-700 rounded-xl group-hover:scale-105 transition-transform">
                  <BookOpen className="w-4 h-4 shrink-0" />
                </div>
                <span>Customer Debt</span>
              </Link>

              <Link
                href="/admin/bills"
                className="p-3 bg-slate-50 hover:bg-indigo-50/70 border border-slate-200/80 hover:border-indigo-300 rounded-2xl text-slate-800 flex items-center gap-2.5 transition-all group"
              >
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl group-hover:scale-105 transition-transform">
                  <Receipt className="w-4 h-4 shrink-0" />
                </div>
                <span>Bills</span>
              </Link>

              <Link
                href="/admin/products"
                className="p-3 bg-slate-50 hover:bg-amber-50/70 border border-slate-200/80 hover:border-amber-300 rounded-2xl text-slate-800 flex items-center gap-2.5 transition-all group"
              >
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl group-hover:scale-105 transition-transform">
                  <Package className="w-4 h-4 shrink-0" />
                </div>
                <span>Products</span>
              </Link>

              <Link
                href="/admin/customers"
                className="p-3 bg-slate-50 hover:bg-emerald-50/70 border border-slate-200/80 hover:border-emerald-300 rounded-2xl text-slate-800 flex items-center gap-2.5 transition-all group"
              >
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl group-hover:scale-105 transition-transform">
                  <Users className="w-4 h-4 shrink-0" />
                </div>
                <span>Customers</span>
              </Link>

              <Link
                href="/admin/vendors"
                className="p-3 bg-slate-50 hover:bg-blue-50/70 border border-slate-200/80 hover:border-blue-300 rounded-2xl text-slate-800 flex items-center gap-2.5 transition-all group"
              >
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl group-hover:scale-105 transition-transform">
                  <Truck className="w-4 h-4 shrink-0" />
                </div>
                <span>Vendors</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
