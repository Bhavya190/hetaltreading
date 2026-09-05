import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rawParams = await params
    const id = decodeURIComponent(rawParams.id)
    const account = await (prisma as any).deptAccount.findUnique({
      where: { id },
      include: {
        transactions: {
          orderBy: { date: 'desc' },
        },
        payments: {
          orderBy: { date: 'desc' },
        },
      },
    })

    if (!account) {
      return NextResponse.json(
        { success: false, error: 'Debt account not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: account })
  } catch (error: any) {
    console.error('Error fetching debt account by ID:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch debt account' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rawParams = await params
    const id = decodeURIComponent(rawParams.id)
    const body = await request.json()

    const parsedDays = (body.creditLimitDays !== undefined && body.creditLimitDays !== null && body.creditLimitDays !== '')
      ? parseInt(String(body.creditLimitDays), 10)
      : 30
    const creditLimitDays = isNaN(parsedDays) ? 30 : parsedDays

    let updated
    try {
      updated = await (prisma as any).deptAccount.update({
        where: { id },
        data: {
          customerName: body.customerName,
          mobileNumber: body.mobileNumber,
          billingAddress: body.billingAddress,
          creditLimitDays,
        },
      })
    } catch (e) {
      updated = await (prisma as any).deptAccount.upsert({
        where: { id },
        update: {
          customerName: body.customerName,
          mobileNumber: body.mobileNumber,
          billingAddress: body.billingAddress,
          creditLimitDays,
        },
        create: {
          id,
          customerName: body.customerName,
          mobileNumber: body.mobileNumber,
          billingAddress: body.billingAddress,
          creditLimitDays,
          totalDebtAmount: 0,
          totalPaidAmount: 0,
          balanceDue: 0,
          status: 'ACTIVE',
        },
      })
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    console.error('Error updating debt account:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update debt account' },
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
    
    // Delete child transactions first to prevent foreign key constraints
    await (prisma as any).debtTransaction.deleteMany({
      where: { deptAccountId: id },
    })

    // Safe deleteMany parent deptAccount (never throws P2025 if not found)
    const result = await (prisma as any).deptAccount.deleteMany({
      where: { id },
    })

    return NextResponse.json({ success: true, count: result.count, message: 'Debt account deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting debt account:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete debt account' },
      { status: 500 }
    )
  }
}
