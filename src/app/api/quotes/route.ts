import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const quotes = await (prisma as any).quoteRequest.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ success: true, data: quotes })
  } catch (error: any) {
    console.error('Error fetching quotes:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch quote requests' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.clientName || !body.productName || !body.quantity) {
      return NextResponse.json(
        { success: false, error: 'Client name, product, and quantity are required.' },
        { status: 400 }
      )
    }

    const quote = await (prisma as any).quoteRequest.create({
      data: {
        clientName: body.clientName,
        email: body.email || 'N/A',
        phone: body.phone || '',
        companyName: body.companyName || null,
        productName: body.productName,
        quantity: parseInt(body.quantity, 10) || 1,
        unit: body.unit || 'Kg',
        targetPrice: body.targetPrice ? parseFloat(body.targetPrice) : null,
        deliveryLocation: body.deliveryLocation || null,
        notes: body.notes || null,
        status: body.status || 'PENDING',
      },
    })
    return NextResponse.json({ success: true, data: quote }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating quote request:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
