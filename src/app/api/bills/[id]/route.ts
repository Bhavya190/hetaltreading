import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rawParams = await params
    const id = decodeURIComponent(rawParams.id)
    const body = await request.json()

    const parsedAmt = parseFloat(body.amount) || 0
    const parsedPaid = parseFloat(body.paidAmount) || 0
    const balanceAmt = Math.max(0, parsedAmt - parsedPaid)
    const computedStatus = body.status || (balanceAmt === 0 ? 'PAID' : parsedPaid > 0 ? 'PARTIAL' : 'PENDING')

    let updated
    try {
      updated = await (prisma as any).bill.update({
        where: { id },
        data: {
          customer: body.customer,
          amount: parsedAmt,
          paidAmount: parsedPaid,
          balanceAmount: balanceAmt,
          status: computedStatus,
        },
      })
    } catch (e) {
      updated = await (prisma as any).bill.upsert({
        where: { id },
        update: {
          customer: body.customer,
          amount: parsedAmt,
          paidAmount: parsedPaid,
          balanceAmount: balanceAmt,
          status: computedStatus,
        },
        create: {
          id,
          billNumber: id,
          customer: body.customer,
          amount: parsedAmt,
          paidAmount: parsedPaid,
          balanceAmount: balanceAmt,
          status: computedStatus,
        },
      })
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    console.error('Error updating bill:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update bill' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rawParams = await params
    const id = decodeURIComponent(rawParams.id)

    const result = await (prisma as any).bill.deleteMany({
      where: { id },
    })

    return NextResponse.json({ success: true, count: result.count, message: 'Bill deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting bill:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete bill' },
      { status: 500 }
    )
  }
}
