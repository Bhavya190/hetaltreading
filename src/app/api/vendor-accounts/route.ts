import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { prisma as defaultPrisma } from '@/lib/prisma'
import { recalculateVendorAccountLedger } from '@/lib/vendorAccountUtils'

function getDb(): any {
  return (defaultPrisma as any).vendorAccount ? defaultPrisma : new PrismaClient()
}

export async function GET() {
  try {
    const prisma = getDb()
    let vendorAccounts: any[] = []
    try {
      vendorAccounts = await prisma.vendorAccount.findMany({
        include: {
          transactions: { orderBy: { date: 'desc' } },
          payments: { orderBy: { date: 'desc' } },
        },
        orderBy: { createdAt: 'desc' },
      })
    } catch (includeErr) {
      console.warn('Fallback fetching vendorAccounts:', includeErr)
      vendorAccounts = await prisma.vendorAccount.findMany({
        orderBy: { createdAt: 'desc' },
      })
    }

    // 1. Auto-sync all existing vendors from Vendor table
    const existingVendors = await prisma.vendor.findMany()
    for (const v of existingVendors) {

      const match = vendorAccounts.find(
        (acc) => acc.vendorName.toLowerCase() === v.name.toLowerCase() || (v.vendorCode && acc.vendorCode === v.vendorCode)
      )
      if (!match) {
        try {
          const createdAcc = await (prisma as any).vendorAccount.create({
            data: {
              vendorName: v.name,
              vendorCode: v.vendorCode,
              contactPerson: v.contactPerson || '',
              phone: v.phone || '',
              city: v.city || '',
              totalDebtAmount: 0,
              totalPaidAmount: 0,
              balanceDue: 0,
              status: v.status || 'ACTIVE',
            },
          })
          vendorAccounts.push(createdAcc)
        } catch (e) {
          console.warn('Failed to auto-create vendor account:', e)
        }
      }
    }

    // 2. Auto-sync all existing purchase orders from PurchaseOrder table
    const existingOrders = await (prisma as any).purchaseOrder.findMany()
    for (const po of existingOrders) {
      if (!po.vendor) continue

      let vAcc = vendorAccounts.find(
        (acc) => acc.vendorName.toLowerCase() === po.vendor.toLowerCase() || (po.vendorId && acc.id === po.vendorId)
      )

      if (!vAcc) {
        try {
          const matchedVendor = existingVendors.find(
            (v: any) => v.name.toLowerCase() === po.vendor.toLowerCase() || v.id === po.vendorId
          )
          vAcc = await (prisma as any).vendorAccount.create({
            data: {
              vendorName: po.vendor,
              vendorCode: matchedVendor?.vendorCode || (po.vendorId ? `VEND-${po.vendorId.slice(0, 4)}` : `VEND-${Math.floor(100 + Math.random() * 900)}`),
              contactPerson: matchedVendor?.contactPerson || '',
              phone: matchedVendor?.phone || '',
              city: matchedVendor?.city || '',
              totalDebtAmount: 0,
              totalPaidAmount: 0,
              balanceDue: 0,
              status: 'ACTIVE',
            },
          })
          vendorAccounts.push(vAcc)
        } catch (e) {
          console.warn('Failed to create vendor account for purchase order:', e)
          continue
        }
      }

      // Check if a transaction for this purchase order already exists under the vendor account
      const existingTxns = vAcc.transactions || []
      const txnMatch = existingTxns.find(
        (t: any) => t.billNumber.toLowerCase() === po.orderNumber.toLowerCase()
      )

      if (!txnMatch) {
        try {
          const totAmt = po.totalAmount || 0
          const createdTxn = await (prisma as any).vendorDebtTransaction.create({
            data: {
              vendorAccountId: vAcc.id,
              billNumber: po.orderNumber,
              date: po.date ? new Date(po.date) : new Date(),
              itemsSummary: po.item || 'Purchase Order',
              billAmount: totAmt,
              paidAmount: 0,
              balanceAmount: totAmt,
              paymentStatus: 'PENDING',
            },
          })
          if (!vAcc.transactions) vAcc.transactions = []
          vAcc.transactions.push(createdTxn)
        } catch (e) {
          console.warn(`Failed to sync purchase order ${po.orderNumber} to vendor debt:`, e)
        }
      }
    }

    // 3. Purge orphaned VendorAccounts (deleted from vendors directory and having no purchase bills)
    const validVendorNames = existingVendors.map((v: any) => v.name.toLowerCase())
    const validPONames = existingOrders.map((po: any) => po.vendor.toLowerCase())

    const cleanAccounts: any[] = []
    for (const acc of vendorAccounts) {
      const hasPurchases = (acc.transactions && acc.transactions.length > 0) || (acc.totalDebtAmount || 0) > 0 || validPONames.includes(acc.vendorName.toLowerCase())
      const isExistingVendor = validVendorNames.includes(acc.vendorName.toLowerCase())

      if (!isExistingVendor && !hasPurchases) {
        try {
          await prisma.vendorDebtPayment.deleteMany({ where: { vendorAccountId: acc.id } }).catch(() => null)
          await prisma.vendorDebtTransaction.deleteMany({ where: { vendorAccountId: acc.id } }).catch(() => null)
          await prisma.vendorAccount.delete({ where: { id: acc.id } }).catch(() => null)
        } catch (e) {
          console.warn(`Failed to purge vendor account ${acc.id}:`, e)
        }
      } else {
        cleanAccounts.push(acc)
      }
    }
    vendorAccounts = cleanAccounts

    // 4. Recalculate ledgers
    const updatedAccounts = await Promise.all(
      vendorAccounts.map(async (acc) => {
        const recalculated = await recalculateVendorAccountLedger(acc.id)
        return recalculated || acc
      })
    )

    return NextResponse.json({ success: true, data: updatedAccounts })
  } catch (error: any) {
    console.error('Error fetching vendor accounts:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch vendor accounts' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const prisma = getDb()
    const body = await request.json()
    const { vendorName, vendorCode, contactPerson, phone, city } = body

    if (!vendorName) {
      return NextResponse.json(
        { success: false, error: 'Vendor Name is required.' },
        { status: 400 }
      )
    }

    const generatedCode = vendorCode || `VEND-${Math.floor(100 + Math.random() * 900)}`

    // Create record in Vendor table if not present
    try {
      const existing = await prisma.vendor.findFirst({
        where: { name: { equals: vendorName, mode: 'insensitive' } },
      })
      if (!existing) {
        await prisma.vendor.create({
          data: {
            name: vendorName,
            vendorCode: generatedCode,
            contactPerson: contactPerson || 'Sales Desk',
            phone: phone || '',
            city: city || '',
            status: 'ACTIVE',
          },
        })
      }
    } catch (vErr) {
      console.warn('Vendor table sync warning:', vErr)
    }

    const vendorAccount = await prisma.vendorAccount.create({
      data: {
        vendorName,
        vendorCode: generatedCode,
        contactPerson: contactPerson || '',
        phone: phone || '',
        city: city || '',
        totalDebtAmount: 0,
        totalPaidAmount: 0,
        balanceDue: 0,
        status: 'ACTIVE',
      },
    })

    return NextResponse.json({ success: true, data: vendorAccount }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating vendor account:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create vendor account' },
      { status: 500 }
    )
  }
}
