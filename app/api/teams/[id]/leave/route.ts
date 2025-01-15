import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUser } from '@/lib/auth';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const teamId = params.id;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if the user is a member of the team
    const memberCheck = await client.query(
      'SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, user.id]
    );

    if (memberCheck.rows.length === 0) {
      throw new Error('You are not a member of this team');
    }

    if (memberCheck.rows[0].role === 'captain') {
      throw new Error('Team captains cannot leave the team. Transfer ownership first.');
    }

    // Remove the user from the team
    await client.query(
      'DELETE FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, user.id]
    );

    // Remove any existing invitations for this user to this team
    await client.query('DELETE FROM invitations WHERE team_id = $1 AND invitee_email = (SELECT email FROM users WHERE id = $2)', [teamId, user.id]);

    // Create a notification for team captains
    const captains = await client.query(
      'SELECT user_id FROM team_members WHERE team_id = $1 AND role = $2',
      [teamId, 'captain']
    );

    for (const captain of captains.rows) {
      await client.query(
        'INSERT INTO notifications (user_id, type, message, team_id) VALUES ($1, $2, $3, $4)',
        [captain.user_id, 'member_left', `${user.name} has left the team`, teamId]
      );
    }

    await client.query('COMMIT');

    return NextResponse.json({ message: 'Successfully left the team' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error leaving team:', error);
    return NextResponse.json({ error: error.message || 'Failed to leave team' }, { status: 500 });
  } finally {
    client.release();
  }
}

