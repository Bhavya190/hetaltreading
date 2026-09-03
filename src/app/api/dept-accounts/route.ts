import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const deptAccounts = await (prisma as any).deptAccount.findMany({
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
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

    const deptAccount = await (prisma as any).deptAccount.create({
      data: {
        customerName,
        mobileNumber,
        billingAddress,
        creditLimitDays: parseInt(creditLimitDays, 10) || 30,
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
