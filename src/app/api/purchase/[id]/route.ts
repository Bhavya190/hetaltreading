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

    let updated
    try {
      updated = await (prisma as any).purchaseOrder.update({
        where: { id },
        data: {
          vendor: body.vendor,
          item: body.item,
          quantity: parseInt(body.quantity, 10) || 1,
          totalAmount: parseFloat(body.totalAmount) || 0,
          status: body.status || 'DELIVERED',
        },
      })
    } catch (e) {
      updated = await (prisma as any).purchaseOrder.upsert({
        where: { id },
        update: {
          vendor: body.vendor,
          item: body.item,
          quantity: parseInt(body.quantity, 10) || 1,
          totalAmount: parseFloat(body.totalAmount) || 0,
          status: body.status || 'DELIVERED',
        },
        create: {
          id,
          orderNumber: id,
          vendor: body.vendor,
          item: body.item,
          quantity: parseInt(body.quantity, 10) || 1,
          totalAmount: parseFloat(body.totalAmount) || 0,
          status: body.status || 'DELIVERED',
        },
      })
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    console.error('Error updating purchase order:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update purchase order' },
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

    const result = await (prisma as any).purchaseOrder.deleteMany({
      where: { id },
    })

    return NextResponse.json({ success: true, count: result.count, message: 'Purchase order deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting purchase order:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete purchase order' },
      { status: 500 }
    )
  }
}
