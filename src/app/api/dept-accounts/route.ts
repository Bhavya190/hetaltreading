import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    let deptAccounts
    try {
      deptAccounts = await (prisma as any).deptAccount.findMany({
        include: {
          transactions: {
            orderBy: { createdAt: 'desc' },
          },
          payments: {
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    } catch (includeErr) {
      console.warn('Fallback fetching deptAccounts without payments relation:', includeErr)
      deptAccounts = await (prisma as any).deptAccount.findMany({
        include: {
          transactions: {
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      let allPayments: any[] = []
      try {
        allPayments = await (prisma as any).debtPayment.findMany({
          orderBy: { date: 'desc' },
        })
      } catch (e) {
        console.warn('debtPayment table not accessible yet:', e)
      }

      deptAccounts = deptAccounts.map((acc: any) => ({
        ...acc,
        payments: allPayments.filter((p: any) => p.deptAccountId === acc.id),
      }))
    }

    return NextResponse.json({ success: true, source: 'database', data: deptAccounts })
  } catch (error: any) {
    console.error('Error fetching Dept accounts:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch Dept accounts' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { customerName, mobileNumber, billingAddress, creditLimitDays } = body

    if (!customerName || !mobileNumber || !billingAddress) {
      return NextResponse.json(
        { success: false, error: 'Customer Name, Mobile Number, and Billing Address are required.' },
        { status: 400 }
      )
    }

    const parsedDays = (creditLimitDays !== undefined && creditLimitDays !== null && creditLimitDays !== '')
      ? parseInt(String(creditLimitDays), 10)
      : 30

    const deptAccount = await (prisma as any).deptAccount.create({
      data: {
        customerName,
        mobileNumber,
        billingAddress,
        creditLimitDays: isNaN(parsedDays) ? 30 : parsedDays,
        totalDebtAmount: 0,
        totalPaidAmount: 0,
        balanceDue: 0,
        status: 'ACTIVE',
      },
      include: {
        transactions: true,
      },
    })

    return NextResponse.json({ success: true, source: 'database', data: deptAccount }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating Dept account:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to register Dept account' },
      { status: 500 }
    )
  }
}
