import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const user = await getUser(request)
    if (user) {
      return NextResponse.json(user)
    } else {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}

