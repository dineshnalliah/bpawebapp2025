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
    // Check if the current user is a team captain or admin
    const roleCheck = await client.query(`
      SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2
    `, [teamId, user.id]);

    if (roleCheck.rows.length === 0 || (roleCheck.rows[0].role !== 'captain' && user.role !== 'contest_administrator')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if the user exists
    const userCheck = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = userCheck.rows[0].id;

    // Check if the user is already a member of the team
    const memberCheck = await client.query('SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2', [teamId, userId]);
    if (memberCheck.rows.length > 0) {
      return NextResponse.json({ error: 'User is already a member of this team' }, { status: 400 });
    }

    // Add the user to the team
    await client.query('INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3)', [teamId, userId, role]);

    return NextResponse.json({ message: 'Member added successfully' });
  } catch (error) {
    console.error('Error adding team member:', error);
    return NextResponse.json({ error: 'Failed to add team member' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const teamId = params.id;
  const { memberId } = await request.json();

  const client = await pool.connect();
  try {
    // Check if the current user is a team captain or admin
    const roleCheck = await client.query(`
      SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2
    `, [teamId, user.id]);

    if (roleCheck.rows.length === 0 || (roleCheck.rows[0].role !== 'captain' && user.role !== 'contest_administrator')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Remove the member from the team
    const result = await client.query('DELETE FROM team_members WHERE team_id = $1 AND user_id = $2', [teamId, memberId]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Member not found in the team' }, { status: 404 });
    }

    // Remove any existing invitations for this user to this team
    await client.query('DELETE FROM invitations WHERE team_id = $1 AND invitee_email = (SELECT email FROM users WHERE id = $2)', [teamId, memberId]);

    return NextResponse.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing team member:', error);
    return NextResponse.json({ error: 'Failed to remove team member' }, { status: 500 });
  } finally {
    client.release();
  }
}

