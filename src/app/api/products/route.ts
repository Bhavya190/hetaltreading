import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { MOCK_PRODUCTS } from '@/lib/mockData'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const categorySlug = searchParams.get('category')
  const search = searchParams.get('search')?.toLowerCase()

  try {
    const products = await prisma.product.findMany({
      where: {
        ...(categorySlug ? { category: { slug: categorySlug } } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, source: 'database', data: products })
  } catch (error) {
    console.warn('Prisma database connection fallback to static data:', error)
    
    // Filter fallback mock data
    let filtered = MOCK_PRODUCTS
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
    const { serialNumber, name, purchasePrice, unit, inventoryStock, sellingPrice, gstRate } = body

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

    const productData: any = {
      serialNumber: serialNumber || `SN-${Date.now().toString().slice(-6)}`,
      name,
      slug: body.slug || uniqueSlug,
      description: body.description || '',
      categoryId: body.categoryId || null,
      purchasePrice: parsedPurchasePrice,
      unit: unit || 'Kg',
      inventoryStock: parsedStock,
      sellingPrice: parsedSellingPrice,
      gstRate: parsedGst,
      price: parsedSellingPrice,
      inStock: parsedStock > 0,
      imageUrl: body.imageUrl || null,
    }

    const product = await prisma.product.create({
      data: productData,
    })
    return NextResponse.json({ success: true, data: product }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create product' },
      { status: 500 }
    )
  }
}
