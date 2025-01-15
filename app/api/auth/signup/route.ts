import { NextResponse } from 'next/server'
import { signUp } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { email, password, name, role } = await request.json()
    const user = await signUp(email, password, name, role)
    return NextResponse.json(user)
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'Failed to sign up' }, { status: 500 })
  }
}

