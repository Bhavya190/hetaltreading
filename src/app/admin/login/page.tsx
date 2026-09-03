'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle, Loader2, KeyRound } from 'lucide-react'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (data.success) {
        router.push('/admin/dashboard')
        router.refresh()
      } else {
        setErrorMsg(data.error || 'Authentication failed.')
      }
    } catch (err) {
      setErrorMsg('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fillDemoCredentials = () => {
    setEmail('admin@hetaltrading.com')
    setPassword('admin123')
    setErrorMsg('')
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* Background Decorator */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      <div className="max-w-md w-full relative z-10 space-y-6">
        
        {/* Logo & Portal Branding */}
        <div className="text-center space-y-3">
          <div className="relative w-16 h-16 rounded-2xl bg-slate-950 p-2 border border-amber-500/40 shadow-xl mx-auto flex items-center justify-center overflow-hidden">
            <Image
              src="/logo.png"
              alt="Hetal Trading Logo"
              width={56}
              height={56}
              className="object-contain rounded-xl"
              priority
            />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">HETAL TRADING CRM</h1>
            <p className="text-xs text-amber-400 font-bold uppercase tracking-widest mt-0.5">
              Admin & Shop Management Portal
            </p>
          </div>
        </div>

        {/* Demo Credentials Quick Fill Card */}
        <div className="bg-slate-800/90 border border-amber-500/30 p-4 rounded-xl space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-amber-300 font-bold flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" /> Default Demo Credentials
            </span>
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold px-2 py-0.5 rounded transition-colors"
            >
              Fill Demo Login
            </button>
          </div>
          <div className="font-mono text-slate-300 space-y-0.5 text-[11px]">
            <div>Email: <strong className="text-white">admin@hetaltrading.com</strong></div>
            <div>Password: <strong className="text-white">admin123</strong></div>
          </div>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
          <div className="space-y-1 border-b border-slate-100 pb-3">
            <h2 className="text-lg font-extrabold text-slate-900">Sign In to Admin CRM</h2>
            <p className="text-xs text-slate-500">Enter your administrator credentials to manage shop operations.</p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Admin Email *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="admin@hetaltrading.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-gold py-3 text-sm shadow-md disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center">
            <Link href="/" className="text-xs text-slate-500 hover:text-amber-700 font-medium">
              ← Return to Main Website
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
