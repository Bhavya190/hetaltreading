import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { MOCK_PRODUCTS } from '@/lib/mockData'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const categorySlug = searchParams.get('category')
  const search = searchParams.get('search')?.toLowerCase()

  try {
    let products: any[] = []
    try {
      products = await prisma.$queryRawUnsafe(`SELECT * FROM "Product" ORDER BY "createdAt" DESC`)
    } catch (e) {
      products = await (prisma.product as any).findMany({ orderBy: { createdAt: 'desc' } })
    }

    let filtered = products.map((p: any) => ({
      ...p,
      hsnCode: p.hsnCode || p.serialNumber || '2804',
    }))

    if (search) {
      filtered = filtered.filter(
        (p: any) => p.name?.toLowerCase().includes(search) || p.hsnCode?.toLowerCase().includes(search)
      )
    }

    return NextResponse.json({ success: true, source: 'database', data: filtered })
  } catch (error) {
    console.warn('Prisma database connection fallback to static data:', error)
    
    // Filter fallback mock data
    let filtered = MOCK_PRODUCTS.map((p: any) => ({
      ...p,
      hsnCode: p.hsnCode || p.serialNumber || '2804',
    }))
    if (categorySlug) {
      filtered = filtered.filter((p) => p.categoryName?.toLowerCase().includes(categorySlug) || p.categoryId === categorySlug)
    }
    if (search) {
      filtered = filtered.filter(
        (p) => p.name.toLowerCase().includes(search) || p.description.toLowerCase().includes(search)
      )
    }

    return NextResponse.json({
      success: true,
      source: 'mock',
      notice: 'Supabase credentials pending in .env. Showing sample data.',
      data: filtered,
    })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { hsnCode, serialNumber, name, purchasePrice, unit, inventoryStock, sellingPrice, gstRate } = body

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Product name is required.' },
        { status: 400 }
      )
    }

    const parsedPurchasePrice = parseFloat(purchasePrice) || 0
    const parsedSellingPrice = parseFloat(sellingPrice) || 0
    const parsedStock = parseInt(inventoryStock, 10) || 0
    const parsedGst = parseFloat(gstRate) || 18

    // Auto generate unique slug
    const baseSlug = (name || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`

    const id = `prod-${Date.now()}`
    const finalHsn = hsnCode || serialNumber || '2804'

    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "Product" ("id", "hsnCode", "name", "slug", "description", "purchasePrice", "unit", "inventoryStock", "sellingPrice", "gstRate", "price", "inStock", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
        id,
        finalHsn,
        name,
        uniqueSlug,
        '',
        parsedPurchasePrice,
        unit || 'Kg',
        parsedStock,
        parsedSellingPrice,
        parsedGst,
        parsedSellingPrice,
        parsedStock > 0
      )
    } catch (e) {
      console.error('Raw insert failed, trying prisma client:', e)
    }

    const newProd = {
      id,
      hsnCode: finalHsn,
      name,
      slug: uniqueSlug,
      purchasePrice: parsedPurchasePrice,
      unit: unit || 'Kg',
      inventoryStock: parsedStock,
      sellingPrice: parsedSellingPrice,
      gstRate: parsedGst,
      price: parsedSellingPrice,
      inStock: parsedStock > 0,
    }

    return NextResponse.json({ success: true, data: newProd }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create product' },
      { status: 500 }
    )
  }
}
