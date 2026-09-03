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

    const parsedDays = (body.creditLimitDays !== undefined && body.creditLimitDays !== null && body.creditLimitDays !== '')
      ? parseInt(String(body.creditLimitDays), 10)
      : 30
    const creditLimitDays = isNaN(parsedDays) ? 30 : parsedDays

    let updated
    try {
      updated = await (prisma as any).customer.update({
        where: { id },
        data: {
          name: body.name,
          mobileNumber: body.mobileNumber,
          billingAddress: body.billingAddress,
          creditLimitDays,
          status: body.status || 'ACTIVE',
        },
      })
    } catch (e) {
      updated = await (prisma as any).customer.upsert({
        where: { id },
        update: {
          name: body.name,
          mobileNumber: body.mobileNumber,
          billingAddress: body.billingAddress,
          creditLimitDays,
          status: body.status || 'ACTIVE',
        },
        create: {
          id,
          name: body.name,
          mobileNumber: body.mobileNumber,
          billingAddress: body.billingAddress,
          creditLimitDays,
          status: body.status || 'ACTIVE',
        },
      })
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    console.error('Error updating customer:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update customer' },
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

    const result = await (prisma as any).customer.deleteMany({
      where: { id },
    })

    return NextResponse.json({ success: true, count: result.count, message: 'Customer deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting customer:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete customer' },
      { status: 500 }
    )
  }
}
