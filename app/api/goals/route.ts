import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get('teamId');

  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM goals WHERE team_id = $1', [teamId]);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching goals:', error);
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function POST(request: Request) {
  const client = await pool.connect();
  try {
    const { teamId, name, description, targetValue, unit, startDate, endDate } = await request.json();
    const result = await client.query(
      'INSERT INTO goals (team_id, name, description, target_value, unit, start_date, end_date) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [teamId, name, description, targetValue, unit, startDate, endDate]
    );
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating goal:', error);
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
  } finally {
    client.release();
  }
}

