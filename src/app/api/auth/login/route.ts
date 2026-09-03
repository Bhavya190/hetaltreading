import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    const validEmail = process.env.ADMIN_EMAIL || 'admin@hetaltrading.com'
    const validPassword = process.env.ADMIN_PASSWORD || 'admin123'

    if (email === validEmail && password === validPassword) {
      const cookieStore = await cookies()
      
      // Set session cookie valid for 7 days
      cookieStore.set({
        name: 'hetal_admin_session',
        value: 'authenticated_session_' + Date.now(),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })

      return NextResponse.json({
        success: true,
        message: 'Admin authenticated successfully',
        user: { name: 'Admin Manager', email: validEmail },
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid admin email or password.' },
        { status: 401 }
      )
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    )
  }
}
