import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const orders = await (prisma as any).purchaseOrder.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ success: true, data: orders })
  } catch (error: any) {
    console.error('Error fetching purchase orders:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch purchase orders' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      date,
      vendor,
      vendorId,
      item,
      productId,
      quantity,
      discount,
      totalAmount,
      extraCharges,
      extraChargesGst,
      status,
      items,
    } = body

    if (!vendor || !item) {
      return NextResponse.json(
        { success: false, error: 'Vendor and Product Item are required.' },
        { status: 400 }
      )
    }

    const totalCount = await (prisma as any).purchaseOrder.count()
    const orderNumber = `PO-2026-${String(totalCount + 101).padStart(3, '0')}`

    const order = await (prisma as any).purchaseOrder.create({
      data: {
        orderNumber,
        date: date ? new Date(date) : new Date(),
        vendor,
        vendorId: vendorId || null,
        item,
        productId: productId || null,
        quantity: parseFloat(quantity) || 1,
        discount: parseFloat(discount) || 0,
        totalAmount: parseFloat(totalAmount) || 0,
        extraCharges: parseFloat(extraCharges) || 0,
        extraChargesGst: parseFloat(extraChargesGst) || 18,
        status: status || 'DELIVERED',
      },
    })

    // Automatically update Product Inventory Stock in database!
    const itemsToUpdate = Array.isArray(items) && items.length > 0
      ? items
      : [{ productId, productName: item, quantity }]

    for (const line of itemsToUpdate) {
      const lineQty = Math.round(parseFloat(line.quantity) || 0)
      if (lineQty <= 0) continue

      let targetProdId = line.productId
      if (!targetProdId && line.productName) {
        const cleanName = line.productName.split('(')[0].trim()
        const matched = await (prisma as any).product.findFirst({
          where: { name: { equals: cleanName, mode: 'insensitive' } },
        })
        if (matched) targetProdId = matched.id
      }

      if (targetProdId) {
        try {
          await (prisma as any).product.update({
            where: { id: targetProdId },
            data: {
              inventoryStock: { increment: lineQty },
              inStock: true,
            },
          })
        } catch (e) {
          console.error(`Failed to update stock for product ${targetProdId}:`, e)
        }
      }
    }

    return NextResponse.json({ success: true, data: order }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating purchase order:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create purchase order' },
      { status: 500 }
    )
  }
}
