import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUser } from '@/lib/auth';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const teamId = params.id;
  const { email, role } = await request.json();

  const client = await pool.connect();
  try {
    // Check if the current user is a team captain
    const roleCheck = await client.query(`
      SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2
    `, [teamId, user.id]);

    if (roleCheck.rows.length === 0 || roleCheck.rows[0].role !== 'captain') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if the email is registered
    const userCheck = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if an active invitation already exists
    const invitationCheck = await client.query(`
      SELECT * FROM invitations 
      WHERE team_id = $1 AND invitee_email = $2 AND status = 'pending'
    `, [teamId, email]);

    if (invitationCheck.rows.length > 0) {
      return NextResponse.json({ error: 'An active invitation already exists for this user' }, { status: 400 });
    }

    // Check if the user is already a member of the team
    const memberCheck = await client.query('SELECT * FROM team_members WHERE team_id = $1 AND user_id = (SELECT id FROM users WHERE email = $2)', [teamId, email]);

    if (memberCheck.rows.length > 0) {
      return NextResponse.json({ error: 'User is already a member of this team' }, { status: 400 });
    }


    // Create the invitation
    const result = await client.query(`
      INSERT INTO invitations (team_id, inviter_id, invitee_email, role, status)
      VALUES ($1, $2, $3, $4, 'pending')
      RETURNING *
    `, [teamId, user.id, email, role]);

    // Get team name for notification
    const team = await client.query(`SELECT name FROM teams WHERE id = $1`, [teamId]);

    // Create a notification for the invited user
    const invitedUserId = userCheck.rows[0].id;
    await client.query(`
      INSERT INTO notifications (user_id, type, message, team_id)
      VALUES ($1, 'team_invitation', $2, $3)
    `, [invitedUserId, `You have been invited to join team ${team.rows[0].name} as ${role}`, teamId]);

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error sending invitation:', error);
    return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 });
  } finally {
    client.release();
  }
}

