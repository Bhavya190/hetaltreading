import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const inquiries = await prisma.inquiry.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ success: true, source: 'database', data: inquiries })
  } catch (error) {
    return NextResponse.json({
      success: true,
      source: 'mock',
      notice: 'Database connection clean slate.',
      data: [],
    })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    if (!body.name || !body.email || !body.message) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and message are required fields.' },
        { status: 400 }
      )
    }

    try {
      const inquiry = await prisma.inquiry.create({
        data: {
          name: body.name,
          email: body.email,
          phone: body.phone || null,
          company: body.company || null,
          subject: body.subject || 'General Trade Inquiry',
          message: body.message,
        },
      })
      return NextResponse.json({ success: true, source: 'database', data: inquiry }, { status: 201 })
    } catch (dbError) {
      return NextResponse.json(
        {
          success: true,
          source: 'simulated',
          message: 'Inquiry received successfully!',
          data: {
            id: 'inq-' + Date.now(),
            ...body,
            status: 'PENDING',
            createdAt: new Date().toISOString(),
          },
        },
        { status: 201 }
      )
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
