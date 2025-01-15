import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUser } from '@/lib/auth';

export async function GET(request: Request) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');

  if (search) {
    const client = await pool.connect();
    try {
      let query = 'SELECT id, name, company FROM teams';
      let values: any[] = [];

      if (search) {
        query += ' WHERE name ILIKE $1';
        values.push(`%${search}%`);
      }

      query += ' ORDER BY name LIMIT 10';

      const result = await client.query(query, values);
      return NextResponse.json(result.rows);
    } catch (error) {
      console.error('Error searching teams:', error);
      return NextResponse.json({ error: 'Failed to search teams' }, { status: 500 });
    } finally {
      client.release();
    }
  } else {
    const client = await pool.connect();
    try {
      const result = await client.query(`
  SELECT c.*, array_agg(t.id) as team_ids, array_agg(t.name) as team_names
  FROM contests c
  LEFT JOIN contest_teams ct ON c.id = ct.contest_id
  LEFT JOIN teams t ON ct.team_id = t.id
  WHERE c.created_by = $1
  GROUP BY c.id
  ORDER BY c.start_date DESC
`, [user.id]);
      return NextResponse.json(result.rows);
    } catch (error) {
      console.error('Error fetching contests:', error);
      return NextResponse.json({ error: 'Failed to fetch contests' }, { status: 500 });
    } finally {
      client.release();
    }
  }
}

export async function POST(request: Request) {
  const user = await getUser()
  if (!user || user.role !== 'contest_administrator') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const client = await pool.connect();
  try {
    const { name, description, startDate, endDate, teamIds } = await request.json();
    
    if (!name || !startDate || !endDate || !teamIds || !Array.isArray(teamIds)) {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
    }

    const status = new Date(startDate) > new Date() ? 'upcoming' : 'active';

    await client.query('BEGIN');

    const contestResult = await client.query(
      'INSERT INTO contests (name, description, start_date, end_date, status, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, description, startDate, endDate, status, user.id]
    );

    const contestId = contestResult.rows[0].id;

    for (const teamId of teamIds) {
      await client.query(
        'INSERT INTO contest_teams (contest_id, team_id) VALUES ($1, $2)',
        [contestId, teamId]
      );
    }

    await client.query('COMMIT');

    return NextResponse.json(contestResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating contest:', error);
    return NextResponse.json({ error: 'Failed to create contest' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function PUT(request: Request) {
  const user = await getUser()
  if (!user || user.role !== 'contest_administrator') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const client = await pool.connect();
  try {
    const { id, name, description, startDate, endDate, teamIds } = await request.json();
    
    if (!id || !name || !startDate || !endDate || !teamIds || !Array.isArray(teamIds)) {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
    }

    const status = new Date(startDate) > new Date() ? 'upcoming' : (new Date(endDate) < new Date() ? 'completed' : 'active');

    await client.query('BEGIN');

    const contestResult = await client.query(
      'UPDATE contests SET name = $1, description = $2, start_date = $3, end_date = $4, status = $5, created_by = $6 WHERE id = $7 RETURNING *',
      [name, description, startDate, endDate, status, user.id, id]
    );

    if (contestResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Contest not found' }, { status: 404 });
    }

    await client.query('DELETE FROM contest_teams WHERE contest_id = $1', [id]);

    for (const teamId of teamIds) {
      await client.query(
        'INSERT INTO contest_teams (contest_id, team_id) VALUES ($1, $2)',
        [id, teamId]
      );
    }

    await client.query('COMMIT');

    return NextResponse.json(contestResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating contest:', error);
    return NextResponse.json({ error: 'Failed to update contest' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(request: Request) {
  const user = await getUser()
  if (!user || user.role !== 'contest_administrator') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Contest ID is required' }, { status: 400 })
  }

  const client = await pool.connect();
  try {
    const result = await client.query('DELETE FROM contests WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Contest not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Contest deleted successfully', id: result.rows[0].id });
  } catch (error) {
    console.error('Error deleting contest:', error);
    return NextResponse.json({ error: 'Failed to delete contest' }, { status: 500 });
  } finally {
    client.release();
  }
}

