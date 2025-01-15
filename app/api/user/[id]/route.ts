import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import pool from '@/lib/db'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const currentUser = await getUser()
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = params.id

  // Only allow users to access their own data, or admins to access any data
  if (currentUser.id.toString() !== userId && currentUser.role !== 'contest_administrator') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const client = await pool.connect()
  try {
    const userResult = await client.query(`
      SELECT u.id, u.name, u.email, u.role,
             COUNT(DISTINCT ub.badge_id) as badges_earned,
             COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks
      FROM users u
      LEFT JOIN user_badges ub ON u.id = ub.user_id
      LEFT JOIN tasks t ON u.id = t.user_id
      WHERE u.id = $1
      GROUP BY u.id
    `, [userId])

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(userResult.rows[0])
  } catch (error) {
    console.error('Error fetching user data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    client.release()
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const currentUser = await getUser()
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = params.id

  // Only allow users to update their own data, or admins to update any data
  if (currentUser.id.toString() !== userId && currentUser.role !== 'contest_administrator') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { name, email } = await request.json()

  const client = await pool.connect()
  try {
    const result = await client.query(
      'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING id, name, email, role',
      [name, email, userId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Error updating user data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    client.release()
  }
}

