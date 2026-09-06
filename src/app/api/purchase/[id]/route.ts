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

    const updateData = {
      date: body.date ? new Date(body.date) : undefined,
      vendor: body.vendor,
      vendorId: body.vendorId || null,
      item: body.item,
      productId: body.productId || null,
      quantity: parseFloat(body.quantity) || 1,
      discount: Math.max(0, parseFloat(body.discount) || 0),
      totalAmount: parseFloat(body.totalAmount) || 0,
      extraCharges: parseFloat(body.extraCharges) || 0,
      extraChargesGst: Math.max(0, parseFloat(body.extraChargesGst) || 0),
      status: body.status || 'DELIVERED',
    }

    let updated
    try {
      updated = await (prisma as any).purchaseOrder.update({
        where: { id },
        data: updateData,
      })
    } catch (e) {
      updated = await (prisma as any).purchaseOrder.upsert({
        where: { id },
        update: updateData,
        create: {
          id,
          orderNumber: id,
          ...updateData,
          date: body.date ? new Date(body.date) : new Date(),
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

    // Fetch existing purchase order to decrement product inventory stock on deletion
    const existing = await (prisma as any).purchaseOrder.findFirst({
      where: { OR: [{ id }, { orderNumber: id }] },
    })

    if (existing) {
      const lineQty = Math.round(parseFloat(existing.quantity) || 0)
      let targetProdId = existing.productId

      if (!targetProdId && existing.item) {
        const cleanName = existing.item.split('(')[0].trim()
        const matched = await (prisma as any).product.findFirst({
          where: { name: { equals: cleanName, mode: 'insensitive' } },
        })
        if (matched) targetProdId = matched.id
      }

      if (targetProdId && lineQty > 0) {
        try {
          await (prisma as any).product.update({
            where: { id: targetProdId },
            data: {
              inventoryStock: { decrement: lineQty },
            },
          })
        } catch (e) {
          console.error(`Failed to decrement stock for product ${targetProdId}:`, e)
        }
      }
    }

    const result = await (prisma as any).purchaseOrder.deleteMany({
      where: { OR: [{ id }, { orderNumber: id }] },
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
