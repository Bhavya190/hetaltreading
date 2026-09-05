import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { recalculateDeptAccountLedger } from '@/lib/deptAccountUtils'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rawParams = await params
    const id = decodeURIComponent(rawParams.id)
    const payments = await (prisma as any).debtPayment.findMany({
      where: { deptAccountId: id },
      orderBy: { date: 'desc' },
    })
    return NextResponse.json({ success: true, data: payments })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch payment logs for customer' },
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
    const { date, paymentType, amount, note, targetBillNo } = body

    const pAmount = parseFloat(amount) || 0
    if (pAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid payment amount is required.' },
        { status: 400 }
      )
    }

    const account = await (prisma as any).deptAccount.findUnique({
      where: { id },
    })

    if (!account) {
      return NextResponse.json(
        { success: false, error: 'Debt customer account not found.' },
        { status: 404 }
      )
    }

    let appliedBillStr = targetBillNo ? `Bill #${targetBillNo}` : 'Account Balance Credit'

    // Create the DebtPayment log
    const paymentLog = await (prisma as any).debtPayment.create({
      data: {
        deptAccountId: id,
        date: date ? new Date(date) : new Date(),
        paymentType: paymentType || 'CASH',
        amount: pAmount,
        note: note || '',
        appliedBillNo: appliedBillStr,
      },
    })

    // Recalculate full ledger
    const updatedAccount = await recalculateDeptAccountLedger(id)

    return NextResponse.json(
      {
        success: true,
        data: paymentLog,
        account: updatedAccount,
        message: `Payment of ₹${pAmount.toLocaleString()} received and logged successfully!`,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error recording debt payment:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to record payment' },
      { status: 500 }
    )
  }
}
