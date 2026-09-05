import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rawParams = await params
    const id = decodeURIComponent(rawParams.id)

    // 1. Try finding DailySale by id or billNumber
    let dailySale = await (prisma as any).dailySale.findUnique({
      where: { id },
      include: { items: true },
    })

    if (!dailySale) {
      dailySale = await (prisma as any).dailySale.findFirst({
        where: { billNumber: id },
        include: { items: true },
      })
    }

    if (dailySale) {
      return NextResponse.json({
        success: true,
        type: 'SALES',
        data: {
          id: dailySale.id,
          billNumber: dailySale.billNumber,
          date: dailySale.date ? new Date(dailySale.date).toISOString().split('T')[0] : '',
          customerName: dailySale.customerName,
          subtotal: dailySale.subtotal || 0,
          extraCharges: dailySale.extraCharges || 0,
          grandTotal: dailySale.grandTotal || 0,
          status: dailySale.status || 'COMPLETED',
          items: Array.isArray(dailySale.items) ? dailySale.items : [],
        },
      })
    }

    // 2. Try finding in Commercial Bill table
    let bill = await (prisma as any).bill.findUnique({
      where: { id },
    })

    if (!bill) {
      bill = await (prisma as any).bill.findFirst({
        where: { billNumber: id },
      })
    }

    if (bill) {
      const items = [
        {
          id: bill.id,
          productName: 'Commercial Invoice Item',
          serialNumber: '-',
          gstRate: '18',
          unit: 'Lot',
          quantity: 1,
          unitPrice: bill.amount || 0,
          amount: bill.amount || 0,
          discount: 0,
          netTotal: bill.amount || 0,
        },
      ]

      return NextResponse.json({
        success: true,
        type: 'SALES',
        data: {
          id: bill.id,
          billNumber: bill.billNumber || bill.id,
          date: bill.date ? new Date(bill.date).toISOString().split('T')[0] : '',
          customerName: bill.customer || 'Customer',
          subtotal: bill.amount || 0,
          extraCharges: 0,
          grandTotal: bill.amount || 0,
          status: bill.status || 'PAID',
          items,
        },
      })
    }

    // 3. Try finding in PurchaseOrder table
    let purchase = await (prisma as any).purchaseOrder.findUnique({
      where: { id },
    })

    if (!purchase) {
      purchase = await (prisma as any).purchaseOrder.findFirst({
        where: { orderNumber: id },
      })
    }

    if (purchase) {
      const qty = purchase.quantity || 1
      const unitPrice = qty > 0 ? (purchase.totalAmount || 0) / qty : purchase.totalAmount || 0
      const items = [
        {
          id: purchase.id,
          productName: purchase.item || 'Purchase Consignment Item',
          serialNumber: '-',
          gstRate: String(purchase.extraChargesGst || '18'),
          unit: 'Lot',
          quantity: qty,
          unitPrice: unitPrice,
          amount: purchase.totalAmount || 0,
          discount: purchase.discount || 0,
          netTotal: purchase.totalAmount || 0,
        },
      ]

      return NextResponse.json({
        success: true,
        type: 'PURCHASE',
        data: {
          id: purchase.id,
          billNumber: purchase.orderNumber || purchase.id,
          date: purchase.date ? new Date(purchase.date).toISOString().split('T')[0] : '',
          customerName: purchase.vendor || 'Supplier Vendor',
          subtotal: purchase.totalAmount || 0,
          extraCharges: purchase.extraCharges || 0,
          grandTotal: (purchase.totalAmount || 0) + (purchase.extraCharges || 0),
          status: purchase.status || 'DELIVERED',
          items,
        },
      })
    }

    return NextResponse.json(
      { success: false, error: 'Bill record not found' },
      { status: 404 }
    )
  } catch (error: any) {
    console.error('Error fetching bill details:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch bill details' },
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
