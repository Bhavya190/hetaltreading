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
      updated = await (prisma as any).vendor.update({
        where: { id },
        data: {
          name: body.name,
          contactPerson: body.contactPerson,
          phone: body.phone,
          city: body.city || '',
          status: body.status || 'ACTIVE',
        },
      })
    } catch (e) {
      updated = await (prisma as any).vendor.upsert({
        where: { id },
        update: {
          name: body.name,
          contactPerson: body.contactPerson,
          phone: body.phone,
          city: body.city || '',
          status: body.status || 'ACTIVE',
        },
        create: {
          id,
          vendorCode: id,
          name: body.name,
          contactPerson: body.contactPerson,
          phone: body.phone,
          city: body.city || '',
          status: body.status || 'ACTIVE',
        },
      })
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    console.error('Error updating vendor:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update vendor' },
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

    const result = await (prisma as any).vendor.deleteMany({
      where: { id },
    })

    return NextResponse.json({ success: true, count: result.count, message: 'Vendor deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting vendor:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete vendor' },
      { status: 500 }
    )
  }
}
