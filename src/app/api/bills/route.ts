import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const bills = await (prisma as any).bill.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ success: true, data: bills })
  } catch (error: any) {
    console.error('Error fetching bills:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch bills' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { customer, amount, paidAmount, status } = body

    if (!customer || !amount) {
      return NextResponse.json(
        { success: false, error: 'Customer Name and Bill Amount are required.' },
        { status: 400 }
      )
    }

    const parsedAmt = parseFloat(amount) || 0
    const parsedPaid = parseFloat(paidAmount) || 0
    const balanceAmt = Math.max(0, parsedAmt - parsedPaid)

    const totalCount = await (prisma as any).bill.count()
    const billNumber = `INV-2026-${String(totalCount + 101).padStart(3, '0')}`

    const computedStatus = status || (balanceAmt === 0 ? 'PAID' : parsedPaid > 0 ? 'PARTIAL' : 'PENDING')

    const bill = await (prisma as any).bill.create({
      data: {
        billNumber,
        date: new Date(),
        customer,
        amount: parsedAmt,
        paidAmount: parsedPaid,
        balanceAmount: balanceAmt,
        status: computedStatus,
      },
    })

    return NextResponse.json({ success: true, data: bill }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating bill:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create bill' },
      { status: 500 }
    )
  }
}
