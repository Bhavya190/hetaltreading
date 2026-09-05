import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rawParams = await params
    const id = decodeURIComponent(rawParams.id)
    const sale = await (prisma as any).dailySale.findFirst({
      where: {
        OR: [{ id }, { billNumber: id }],
      },
      include: {
        items: true,
      },
    })

    if (!sale) {
      return NextResponse.json(
        { success: false, error: 'Daily sale bill not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: sale })
  } catch (error: any) {
    console.error('Error fetching daily sale bill by ID:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch daily sale bill' },
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
    const { customerName, extraCharges, items } = body

    const parsedExtra = parseFloat(extraCharges) || 0

    let subtotal = 0
    const lineItemsData = Array.isArray(items)
      ? items.map((item: any) => {
          const qty = parseFloat(item.quantity) || 1
          const price = parseFloat(item.unitPrice) || 0
          const amt = qty * price
          const disc = parseFloat(item.discount) || 0
          const net = Math.max(0, amt - disc)
          subtotal += net

          return {
            productId: item.productId || null,
            productName: item.productName || 'Custom Item',
            hsnCode: item.hsnCode || item.serialNumber || '-',
            gstRate: String(item.gstRate || '18'),
            unit: item.unit || 'Kg',
            quantity: qty,
            unitPrice: price,
            amount: amt,
            discount: disc,
            netTotal: net,
          }
        })
      : []

    const grandTotal = subtotal + parsedExtra

    let updated
    try {
      await (prisma as any).dailySaleItem.deleteMany({ where: { dailySaleId: id } })
      updated = await (prisma as any).dailySale.update({
        where: { id },
        data: {
          customerName,
          subtotal,
          extraCharges: parsedExtra,
          grandTotal,
          items: {
            create: lineItemsData,
          },
        },
        include: {
          items: true,
        },
      })
    } catch (e) {
      updated = await (prisma as any).dailySale.upsert({
        where: { id },
        update: {
          customerName,
          subtotal,
          extraCharges: parsedExtra,
          grandTotal,
        },
        create: {
          id,
          billNumber: id,
          customerName,
          subtotal,
          extraCharges: parsedExtra,
          grandTotal,
          items: {
            create: lineItemsData,
          },
        },
        include: {
          items: true,
        },
      })
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    console.error('Error updating daily sale entry:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update daily sale entry' },
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

    // Delete child line items first
    await (prisma as any).dailySaleItem.deleteMany({
      where: { dailySaleId: id },
    })

    // Safe deleteMany parent daily sale record
    const result = await (prisma as any).dailySale.deleteMany({
      where: { id },
    })

    return NextResponse.json({ success: true, count: result.count, message: 'Daily sale entry deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting daily sale entry:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete daily sale entry' },
      { status: 500 }
    )
  }
}
