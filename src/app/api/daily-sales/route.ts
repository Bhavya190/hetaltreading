import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const sales = await (prisma as any).dailySale.findMany({
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ success: true, data: sales })
  } catch (error: any) {
    console.error('Error fetching daily sales:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch daily sales' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { billNumber, date, customerName, items, extraCharges } = body

    if (!billNumber || !customerName || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Bill Number, Customer Name, and at least 1 Product item are required.' },
        { status: 400 }
      )
    }

    const parsedExtra = parseFloat(extraCharges) || 0

    // Compute line items
    const lineItems = items.map((item: any) => {
      const qty = parseFloat(item.quantity) || 1
      const price = parseFloat(item.unitPrice) || 0
      const amt = qty * price
      const disc = parseFloat(item.discount) || 0
      const net = Math.max(0, amt - disc)

      return {
        productId: item.productId || null,
        productName: item.productName || 'Custom Item',
        serialNumber: item.serialNumber || '-',
        gstRate: String(item.gstRate || '18'),
        unit: item.unit || 'Kg',
        quantity: qty,
        unitPrice: price,
        amount: amt,
        discount: disc,
        netTotal: net,
      }
    })

    const subtotal = lineItems.reduce((sum: number, it: any) => sum + it.netTotal, 0)
    const grandTotal = subtotal + parsedExtra

    const sale = await (prisma as any).dailySale.create({
      data: {
        billNumber,
        date: date ? new Date(date) : new Date(),
        customerName,
        subtotal,
        extraCharges: parsedExtra,
        grandTotal,
        status: 'COMPLETED',
        items: {
          create: lineItems,
        },
      },
      include: {
        items: true,
      },
    })

    return NextResponse.json({ success: true, data: sale }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating daily sale entry:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create daily sale entry' },
      { status: 500 }
    )
  }
}
