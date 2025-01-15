import { cookies } from 'next/headers'
import pool from './db'
import bcrypt from 'bcrypt'

export async function signUp(email: string, password: string, name: string, role: string) {
  const client = await pool.connect()
  try {
    const hashedPassword = await bcrypt.hash(password, 10)
    const result = await client.query(
      'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role',
      [email, hashedPassword, name, role]
    )
    return result.rows[0]
  } finally {
    client.release()
  }
}

export async function signIn(email: string, password: string) {
  const client = await pool.connect()
  try {
    const result = await client.query('SELECT * FROM users WHERE email = $1', [email])
    const user = result.rows[0]
    if (user && await bcrypt.compare(password, user.password_hash)) {
      const { password_hash, ...userWithoutPassword } = user
      return userWithoutPassword
    }
    return null
  } finally {
    client.release()
  }
}

export async function getUser() {
  const cookieStore = cookies()
  const userId = cookieStore.get('userId')?.value
  if (!userId) return null

  const client = await pool.connect()
  try {
    const result = await client.query('SELECT id, email, name, role FROM users WHERE id = $1', [userId])
    return result.rows[0] || null
  } finally {
    client.release()
  }
}

export async function isAuthenticated() {
  const user = await getUser()
  return !!user
}

