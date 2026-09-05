import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const vendors = await (prisma as any).vendor.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ success: true, data: vendors })
  } catch (error: any) {
    console.error('Error fetching vendors:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch vendors' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, contactPerson, phone, city } = body

    if (!name || !contactPerson || !phone) {
      return NextResponse.json(
        { success: false, error: 'Name, Contact Person, and Phone are required.' },
        { status: 400 }
      )
    }

    const totalCount = await (prisma as any).vendor.count()
    const vendorCode = `VEN-0${totalCount + 1}`

    const vendor = await (prisma as any).vendor.create({
      data: {
        vendorCode,
        name,
        contactPerson,
        phone,
        city: city || '',
        status: 'ACTIVE',
      },
    })

    return NextResponse.json({ success: true, data: vendor }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating vendor:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create vendor' },
      { status: 500 }
    )
  }
}
