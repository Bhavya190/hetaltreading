import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { recalculateDeptAccountLedger } from '@/lib/deptAccountUtils'

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
          hsnCode: '-',
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
          hsnCode: '-',
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

    // 4. Try finding in DebtTransaction table
    let debtTxn = await (prisma as any).debtTransaction.findUnique({
      where: { id },
      include: { deptAccount: true },
    })

    if (!debtTxn) {
      debtTxn = await (prisma as any).debtTransaction.findFirst({
        where: { billNumber: id },
        include: { deptAccount: true },
      })
    }

    if (debtTxn) {
      if (debtTxn.deptAccountId) {
        await recalculateDeptAccountLedger(debtTxn.deptAccountId)
        debtTxn = await (prisma as any).debtTransaction.findUnique({
          where: { id: debtTxn.id },
          include: { deptAccount: true },
        })
      }
    }

    if (debtTxn) {
      // Check if matching dailySale exists by billNumber for full line items
      const matchingDailySale = await (prisma as any).dailySale.findFirst({
        where: { billNumber: debtTxn.billNumber },
        include: { items: true },
      })

      if (matchingDailySale && Array.isArray(matchingDailySale.items) && matchingDailySale.items.length > 0) {
        return NextResponse.json({
          success: true,
          type: 'SALES',
          data: {
            id: debtTxn.id,
            billNumber: debtTxn.billNumber,
            date: debtTxn.date ? new Date(debtTxn.date).toISOString().split('T')[0] : '',
            customerName: debtTxn.deptAccount?.customerName || matchingDailySale.customerName || 'Debt Customer',
            subtotal: matchingDailySale.subtotal || debtTxn.billAmount,
            extraCharges: matchingDailySale.extraCharges || 0,
            grandTotal: matchingDailySale.grandTotal || debtTxn.billAmount,
            status: debtTxn.paymentStatus || 'PENDING',
            paidAmount: debtTxn.paidAmount,
            balanceAmount: debtTxn.balanceAmount,
            items: matchingDailySale.items,
          },
        })
      }

      // Parse itemsSummary into structured items if no matching daily sale items found
      const items: any[] = []
      const rawSummary = debtTxn.itemsSummary || ''
      const parts = rawSummary.split(',').map((s: string) => s.trim()).filter(Boolean)

      if (parts.length > 0) {
        parts.forEach((part: string, idx: number) => {
          const match = part.match(/^(.+?)\s*\(\s*x\s*(\d+(?:\.\d+)?)\s*([^)]*)\)\s*@\s*₹?\s*(\d+(?:\.\d+)?)/i)
          if (match) {
            const pName = match[1].trim()
            const qty = parseFloat(match[2]) || 1
            const unit = match[3].trim() || 'Piece'
            const price = parseFloat(match[4]) || 0
            const amt = qty * price
            items.push({
              id: `${debtTxn.id}-${idx}`,
              productName: pName,
              hsnCode: '-',
              gstRate: '18',
              unit: unit,
              quantity: qty,
              unitPrice: price,
              amount: amt,
              discount: 0,
              netTotal: amt,
            })
          } else {
            const itemShare = debtTxn.billAmount / parts.length
            items.push({
              id: `${debtTxn.id}-${idx}`,
              productName: part,
              hsnCode: '-',
              gstRate: '18',
              unit: 'Unit',
              quantity: 1,
              unitPrice: itemShare,
              amount: itemShare,
              discount: 0,
              netTotal: itemShare,
            })
          }
        })
      }

      if (items.length === 0) {
        items.push({
          id: debtTxn.id,
          productName: debtTxn.itemsSummary || 'Debt Bill Items',
          hsnCode: '-',
          gstRate: '18',
          unit: 'Lot',
          quantity: 1,
          unitPrice: debtTxn.billAmount || 0,
          amount: debtTxn.billAmount || 0,
          discount: 0,
          netTotal: debtTxn.billAmount || 0,
        })
      }

      return NextResponse.json({
        success: true,
        type: 'SALES',
        data: {
          id: debtTxn.id,
          billNumber: debtTxn.billNumber,
          date: debtTxn.date ? new Date(debtTxn.date).toISOString().split('T')[0] : '',
          customerName: debtTxn.deptAccount?.customerName || 'Debt Customer',
          subtotal: debtTxn.billAmount || 0,
          extraCharges: 0,
          grandTotal: debtTxn.billAmount || 0,
          status: debtTxn.paymentStatus || 'PENDING',
          paidAmount: debtTxn.paidAmount,
          balanceAmount: debtTxn.balanceAmount,
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
