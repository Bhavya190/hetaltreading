import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { prisma as defaultPrisma } from '@/lib/prisma'
import { recalculateVendorAccountLedger } from '@/lib/vendorAccountUtils'

function getDb(): any {
  return (defaultPrisma as any).vendorAccount ? defaultPrisma : new PrismaClient()
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = getDb()
    const rawParams = await params
    const id = decodeURIComponent(rawParams.id)

    await recalculateVendorAccountLedger(id)

    let account = await prisma.vendorAccount.findUnique({
      where: { id },
      include: {
        transactions: { orderBy: { date: 'desc' } },
        payments: { orderBy: { date: 'desc' } },
      },
    })

    if (!account) {
      account = await prisma.vendorAccount.findFirst({
        where: {
          OR: [{ vendorCode: id }, { vendorName: { equals: id, mode: 'insensitive' } }],
        },
        include: {
          transactions: { orderBy: { date: 'desc' } },
          payments: { orderBy: { date: 'desc' } },
        },
      })
    }

    if (!account) {
      return NextResponse.json(
        { success: false, error: 'Vendor account not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: account })
  } catch (error: any) {
    console.error('Error fetching vendor account:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch vendor account' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = getDb()
    const rawParams = await params
    const id = decodeURIComponent(rawParams.id)
    const body = await request.json()
    const { vendorName, contactPerson, phone, city, status } = body

    const updated = await prisma.vendorAccount.update({
      where: { id },
      data: {
        ...(vendorName && { vendorName }),
        ...(contactPerson !== undefined && { contactPerson }),
        ...(phone !== undefined && { phone }),
        ...(city !== undefined && { city }),
        ...(status && { status }),
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    console.error('Error updating vendor account:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update vendor account' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = getDb()
    const rawParams = await params
    const id = decodeURIComponent(rawParams.id)

    const targetAccount = await prisma.vendorAccount.findFirst({
      where: { id },
    })

    await prisma.vendorDebtPayment.deleteMany({ where: { vendorAccountId: id } }).catch(() => null)
    await prisma.vendorDebtTransaction.deleteMany({ where: { vendorAccountId: id } }).catch(() => null)
    const result = await prisma.vendorAccount.deleteMany({ where: { id } })

    if (targetAccount) {
      await prisma.vendor.deleteMany({
        where: {
          OR: [
            { name: { equals: targetAccount.vendorName, mode: 'insensitive' } },
            ...(targetAccount.vendorCode ? [{ vendorCode: targetAccount.vendorCode }] : []),
          ],
        },
      }).catch(() => null)
    }

    return NextResponse.json({ success: true, count: result.count })
  } catch (error: any) {
    console.error('Error deleting vendor account:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete vendor account' },
      { status: 500 }
    )
  }
}

