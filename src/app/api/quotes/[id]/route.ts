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
      updated = await (prisma as any).quoteRequest.update({
        where: { id },
        data: {
          clientName: body.clientName,
          companyName: body.companyName || body.clientName,
          productName: body.productName,
          quantity: parseInt(body.quantity, 10) || 1,
          deliveryLocation: body.deliveryLocation || null,
          status: body.status || 'PENDING',
        },
      })
    } catch (e) {
      updated = await (prisma as any).quoteRequest.upsert({
        where: { id },
        update: {
          clientName: body.clientName,
          companyName: body.companyName || body.clientName,
          productName: body.productName,
          quantity: parseInt(body.quantity, 10) || 1,
          deliveryLocation: body.deliveryLocation || null,
          status: body.status || 'PENDING',
        },
        create: {
          id,
          clientName: body.clientName,
          companyName: body.companyName || body.clientName,
          email: body.email || 'client@example.com',
          phone: body.phone || '+91 98250 00000',
          productName: body.productName,
          quantity: parseInt(body.quantity, 10) || 1,
          deliveryLocation: body.deliveryLocation || null,
          status: body.status || 'PENDING',
        },
      })
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    console.error('Error updating quotation request:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update quotation request' },
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

    const result = await (prisma as any).quoteRequest.deleteMany({
      where: { id },
    })

    return NextResponse.json({ success: true, count: result.count, message: 'Quotation deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting quotation request:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete quotation request' },
      { status: 500 }
    )
  }
}
