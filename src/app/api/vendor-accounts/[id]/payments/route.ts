import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { recalculateVendorAccountLedger } from '@/lib/vendorAccountUtils'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rawParams = await params
    const id = decodeURIComponent(rawParams.id)

    const payments = await (prisma as any).vendorDebtPayment.findMany({
      where: { vendorAccountId: id },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json({ success: true, data: payments })
  } catch (error: any) {
    console.error('Error fetching vendor payments:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch vendor payments' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rawParams = await params
    const id = decodeURIComponent(rawParams.id)
    const body = await request.json()
    const { date, paymentType, amount, note, appliedBillNo } = body

    const numericAmount = parseFloat(amount)
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid payment amount is required.' },
        { status: 400 }
      )
    }

    const account = await (prisma as any).vendorAccount.findUnique({
      where: { id },
    })

    if (!account) {
      return NextResponse.json(
        { success: false, error: 'Vendor Account not found.' },
        { status: 404 }
      )
    }

    const paymentLog = await (prisma as any).vendorDebtPayment.create({
      data: {
        vendorAccountId: id,
        date: date ? new Date(date) : new Date(),
        paymentType: paymentType || 'CASH',
        amount: numericAmount,
        note: note || '',
        appliedBillNo: appliedBillNo || null,
      },
    })

    const updatedAccount = await recalculateVendorAccountLedger(id)

    return NextResponse.json({
      success: true,
      data: paymentLog,
      account: updatedAccount,
    })
  } catch (error: any) {
    console.error('Error recording vendor payment:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to record vendor payment' },
      { status: 500 }
    )
  }
}
