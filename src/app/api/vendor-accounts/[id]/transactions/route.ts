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

    const transactions = await (prisma as any).vendorDebtTransaction.findMany({
      where: { vendorAccountId: id },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json({ success: true, data: transactions })
  } catch (error: any) {
    console.error('Error fetching vendor debt transactions:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch vendor debt transactions' },
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
    const { billNumber, date, itemsSummary, billAmount, initialPaid } = body

    const numericAmount = parseFloat(billAmount)
    if (!billNumber || isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid Bill Number and Amount are required.' },
        { status: 400 }
      )
    }

    const initialPaidAmt = parseFloat(initialPaid) || 0

    const transaction = await (prisma as any).vendorDebtTransaction.create({
      data: {
        vendorAccountId: id,
        billNumber,
        date: date ? new Date(date) : new Date(),
        itemsSummary: itemsSummary || 'Purchase Order',
        billAmount: numericAmount,
        paidAmount: initialPaidAmt,
        balanceAmount: Math.max(0, numericAmount - initialPaidAmt),
        paymentStatus: initialPaidAmt >= numericAmount ? 'PAID' : initialPaidAmt > 0 ? 'PARTIAL' : 'PENDING',
      },
    })

    if (initialPaidAmt > 0) {
      try {
        await (prisma as any).vendorDebtPayment.create({
          data: {
            vendorAccountId: id,
            date: date ? new Date(date) : new Date(),
            paymentType: 'CASH',
            amount: initialPaidAmt,
            note: 'Initial payment during purchase entry creation',
            appliedBillNo: `PO #${billNumber}`,
          },
        })
      } catch (pErr) {
        console.warn('Failed to log initial payment for vendor transaction:', pErr)
      }
    }

    const updatedAccount = await recalculateVendorAccountLedger(id)

    return NextResponse.json({
      success: true,
      data: transaction,
      account: updatedAccount,
    })
  } catch (error: any) {
    console.error('Error creating vendor debt transaction:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create vendor debt transaction' },
      { status: 500 }
    )
  }
}
