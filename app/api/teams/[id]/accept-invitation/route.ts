import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUser } from '@/lib/auth';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user) {
    console.log('Unauthorized: User not found');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const teamId = parseInt(params.id, 10);
  if (isNaN(teamId)) {
    console.log('Invalid team ID:', params.id);
    return NextResponse.json({ error: 'Invalid team ID' }, { status: 400 });
  }

  const { notificationId } = await request.json();
  if (typeof notificationId !== 'number' || isNaN(notificationId)) {
    console.log('Invalid notification ID:', notificationId);
    return NextResponse.json({ error: 'Invalid notification ID' }, { status: 400 });
  }

  console.log(`Accepting invitation: teamId=${teamId}, notificationId=${notificationId}, user=${user.email}`);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get the invitation details
    const invitationResult = await client.query(`
      SELECT * FROM invitations 
      WHERE team_id = $1 AND invitee_email = $2 AND status = 'pending'
    `, [teamId, user.email]);

    if (invitationResult.rows.length === 0) {
      console.log(`Invitation not found for team ${teamId} and user ${user.email}`);
      throw new Error('Invitation not found');
    }

    const invitation = invitationResult.rows[0];
    console.log('Found invitation:', invitation);

    // Add the user to the team
    await client.query(`
      INSERT INTO team_members (team_id, user_id, role)
      VALUES ($1, $2, $3)
    `, [teamId, user.id, invitation.role]);
    console.log(`User ${user.id} added to team ${teamId} with role ${invitation.role}`);

    // Update the invitation status
    await client.query(`
      UPDATE invitations
      SET status = 'accepted', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [invitation.id]);
    console.log(`Invitation ${invitation.id} marked as accepted`);

    // Delete the notification
    const deleteResult = await client.query(`
      DELETE FROM notifications
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `, [notificationId, user.id]);
    console.log(`Deleted notification: ${deleteResult.rows.length > 0 ? 'success' : 'not found'}`);

    // Fetch the updated team data
    const teamResult = await client.query(`
      SELECT t.*, 
             COUNT(DISTINCT tm.user_id) as members_count,
             COUNT(DISTINCT g.id) as total_goals,
             COUNT(DISTINCT CASE WHEN g.current_value >= g.target_value THEN g.id END) as completed_goals,
             u.name as creator_name
      FROM teams t
      LEFT JOIN team_members tm ON t.id = tm.team_id
      LEFT JOIN goals g ON t.id = g.team_id
      LEFT JOIN users u ON t.created_at = u.created_at
      WHERE t.id = $1
      GROUP BY t.id, u.name
    `, [teamId]);

    await client.query('COMMIT');

    console.log('Invitation accepted successfully');
    return NextResponse.json({ 
      message: 'Invitation accepted successfully',
      team: teamResult.rows[0],
      role: invitation.role
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error accepting invitation:', error);
    return NextResponse.json({ error: 'Failed to accept invitation', details: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}

