import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { recalculateDeptAccountLedger } from '@/lib/deptAccountUtils'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const transactions = await (prisma as any).debtTransaction.findMany({
      where: { deptAccountId: id },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ success: true, data: transactions })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch bills for customer' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { billNumber, itemsSummary, billAmount, paidAmount, date } = body

    if (!billNumber || !itemsSummary || billAmount === undefined) {
      return NextResponse.json(
        { success: false, error: 'Bill Number, Items Summary, and Bill Amount are required.' },
        { status: 400 }
      )
    }

    const bAmount = parseFloat(billAmount) || 0
    const pAmount = parseFloat(paidAmount) || 0
    const balAmount = Math.max(0, bAmount - pAmount)
    const status = balAmount === 0 ? 'PAID' : pAmount > 0 ? 'PARTIAL' : 'PENDING'

    // Create debt bill transaction
    const transaction = await (prisma as any).debtTransaction.create({
      data: {
        deptAccountId: id,
        billNumber,
        date: date ? new Date(date) : new Date(),
        itemsSummary,
        billAmount: bAmount,
        paidAmount: pAmount,
        balanceAmount: balAmount,
        paymentStatus: status,
      },
    })

    // Recalculate DeptAccount total balances & allocations
    const updatedAccount = await recalculateDeptAccountLedger(id)

    return NextResponse.json(
      { success: true, data: transaction, account: updatedAccount },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating debt bill transaction:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to add bill transaction' },
      { status: 500 }
    )
  }
}
