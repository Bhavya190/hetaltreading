import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Hetal Trading Company | Global Impex & Commodity Trading',
  description: 'Premier B2B impex partner for industrial chemicals, hydrated lime, raw minerals, agricultural commodities, and hardware supply chains.',
  icons: {
    icon: '/logo-transparent.png',
    shortcut: '/logo-transparent.png',
    apple: '/logo-transparent.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <body className="bg-[var(--bg-dark)] text-slate-100 min-h-screen flex flex-col font-sans">
        {children}
      </body>
    </html>
  )
}
