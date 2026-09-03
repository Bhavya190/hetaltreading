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
    const { vendor, item, quantity, totalAmount, status } = body

    if (!vendor || !item || !totalAmount) {
      return NextResponse.json(
        { success: false, error: 'Vendor, Item, and Total Amount are required.' },
        { status: 400 }
      )
    }

    const totalCount = await (prisma as any).purchaseOrder.count()
    const orderNumber = `PO-2026-${String(totalCount + 101).padStart(3, '0')}`

    const order = await (prisma as any).purchaseOrder.create({
      data: {
        orderNumber,
        date: new Date(),
        vendor,
        item,
        quantity: parseInt(quantity, 10) || 1,
        totalAmount: parseFloat(totalAmount) || 0,
        status: status || 'DELIVERED',
      },
    })

    return NextResponse.json({ success: true, data: order }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating purchase order:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create purchase order' },
      { status: 500 }
    )
  }
}
