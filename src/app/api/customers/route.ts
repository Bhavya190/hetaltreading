import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ success: true, source: 'database', data: customers })
  } catch (error: any) {
    console.error('Error fetching customers from database:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch customer records' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, mobileNumber, billingAddress, creditLimitDays } = body

    if (!name || !mobileNumber || !billingAddress) {
      return NextResponse.json(
        { success: false, error: 'Customer Name, Mobile Number, and Billing Address are required.' },
        { status: 400 }
      )
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        mobileNumber,
        billingAddress,
        creditLimitDays: parseInt(creditLimitDays, 10) || 30,
        status: 'ACTIVE',
      },
    })

    return NextResponse.json({ success: true, source: 'database', data: customer }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating customer record in database:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to register customer account' },
      { status: 500 }
    )
  }
}
