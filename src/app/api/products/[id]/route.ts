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
      updated = await (prisma as any).product.update({
        where: { id },
        data: {
          serialNumber: body.serialNumber,
          name: body.name,
          purchasePrice: parseFloat(body.purchasePrice) || 0,
          unit: body.unit || 'Kg',
          inventoryStock: parseInt(body.inventoryStock, 10) || 0,
          sellingPrice: parseFloat(body.sellingPrice) || 0,
          gstRate: parseFloat(body.gstRate) || 18,
        },
      })
    } catch (e) {
      updated = await (prisma as any).product.upsert({
        where: { id },
        update: {
          serialNumber: body.serialNumber,
          name: body.name,
          purchasePrice: parseFloat(body.purchasePrice) || 0,
          unit: body.unit || 'Kg',
          inventoryStock: parseInt(body.inventoryStock, 10) || 0,
          sellingPrice: parseFloat(body.sellingPrice) || 0,
          gstRate: parseFloat(body.gstRate) || 18,
        },
        create: {
          id,
          serialNumber: body.serialNumber,
          name: body.name,
          slug: body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4),
          purchasePrice: parseFloat(body.purchasePrice) || 0,
          unit: body.unit || 'Kg',
          inventoryStock: parseInt(body.inventoryStock, 10) || 0,
          sellingPrice: parseFloat(body.sellingPrice) || 0,
          gstRate: parseFloat(body.gstRate) || 18,
        },
      })
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update product' },
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

    const result = await (prisma as any).product.deleteMany({
      where: { id },
    })

    return NextResponse.json({ success: true, count: result.count, message: 'Product deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete product' },
      { status: 500 }
    )
  }
}
