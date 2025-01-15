import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUser } from '@/lib/auth';

export async function POST(request: Request) {
  const user = await getUser()
  if (!user || user.role === 'contest_administrator') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { code } = await request.json();

  if (!code) {
    return NextResponse.json({ error: 'Team code is required' }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Find the team with the given code
    const teamResult = await client.query('SELECT * FROM teams WHERE code = $1', [code]);

    if (teamResult.rows.length === 0) {
      throw new Error('Invalid team code');
    }

    const team = teamResult.rows[0];

    // Check if the user is already a member of the team
    const memberCheck = await client.query('SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2', [team.id, user.id]);

    if (memberCheck.rows.length > 0) {
      throw new Error('You are already a member of this team');
    }

    // Add the user to the team
    await client.query('INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3)', [team.id, user.id, 'member']);

    // Create a notification for contest administrators
    const adminResult = await client.query('SELECT id FROM users WHERE role = $1', ['contest_administrator']);
    for (const admin of adminResult.rows) {
      await client.query(
        'INSERT INTO notifications (user_id, type, message, team_id) VALUES ($1, $2, $3, $4)',
        [admin.id, 'new_member', `${user.name} has joined team ${team.name}`, team.id]
      );
    }

    await client.query('COMMIT');

    return NextResponse.json({ 
      message: 'Team joined successfully',
      teamId: team.id,
      role: 'member'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error joining team:', error);
    return NextResponse.json({ error: error.message || 'Failed to join team' }, { status: 500 });
  } finally {
    client.release();
  }
}

