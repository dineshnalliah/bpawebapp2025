import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUser } from '@/lib/auth';

export async function GET(request: Request) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const client = await pool.connect()
  try {
    let result;
    if (user.role === 'contest_administrator') {
      // For contest administrators, fetch all teams
      result = await client.query(`
        SELECT t.*, 
               COUNT(DISTINCT tm.user_id) as members_count,
               COUNT(DISTINCT g.id) as total_goals,
               COUNT(DISTINCT CASE WHEN g.current_value >= g.target_value THEN g.id END) as completed_goals,
               u.name as creator_name
        FROM teams t
        LEFT JOIN team_members tm ON t.id = tm.team_id
        LEFT JOIN goals g ON t.id = g.team_id
        LEFT JOIN users u ON t.created_at = u.created_at
        GROUP BY t.id, u.name
        ORDER BY t.name
      `);
    } else {
      // For other users, fetch only their teams
      result = await client.query(`
        SELECT t.*, 
               COUNT(DISTINCT tm.user_id) as members_count,
               COUNT(DISTINCT g.id) as total_goals,
               COUNT(DISTINCT CASE WHEN g.current_value >= g.target_value THEN g.id END) as completed_goals,
               u.name as creator_name
        FROM teams t
        LEFT JOIN team_members tm ON t.id = tm.team_id
        LEFT JOIN goals g ON t.id = g.team_id
        LEFT JOIN users u ON t.created_at = u.created_at
        WHERE tm.user_id = $1
        GROUP BY t.id, u.name
        ORDER BY t.name
      `, [user.id]);
    }
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error fetching teams:', error)
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 })
  } finally {
    client.release()
  }
}

export async function POST(request: Request) {
  const user = await getUser()
  if (!user || (user.role !== 'team_captain' && user.role !== 'team_manager')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const client = await pool.connect();
  try {
    const { name, company, description, avatar_url } = await request.json();
    
    if (!name || !company) {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
    }

    const generateCode = () => {
      return Math.random().toString(36).substring(2, 8).toUpperCase();
    };

    let code;
    let isUnique = false;
    while (!isUnique) {
      code = generateCode();
      const existingTeam = await client.query('SELECT id FROM teams WHERE code = $1', [code]);
      if (existingTeam.rows.length === 0) {
        isUnique = true;
      }
    }

    await client.query('BEGIN');
    
    const teamResult = await client.query(
      'INSERT INTO teams (name, company, code, description, avatar_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, company, code, description, avatar_url]
    );

    await client.query(
      'INSERT INTO team_members (user_id, team_id, role) VALUES ($1, $2, $3)',
      [user.id, teamResult.rows[0].id, 'captain']
    );

    await client.query('COMMIT');
    
    console.log('Team created successfully:', teamResult.rows[0]);
    return NextResponse.json(teamResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating team:', error);
    return NextResponse.json({ error: 'Failed to create team', details: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}

