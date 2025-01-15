import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUser } from '@/lib/auth';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user) {
    console.log('Unauthorized: User not found');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const teamId = params.id;
  const { notificationId } = await request.json();

  console.log(`Declining invitation: teamId=${teamId}, notificationId=${notificationId}, user=${user.email}`);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Update the invitation status
    const result = await client.query(`
      UPDATE invitations
      SET status = 'declined', updated_at = CURRENT_TIMESTAMP
      WHERE team_id = $1 AND invitee_email = $2 AND status = 'pending'
      RETURNING id
    `, [teamId, user.email]);

    if (result.rows.length === 0) {
      console.log(`Invitation not found for team ${teamId} and user ${user.email}`);
      throw new Error('Invitation not found');
    }

    console.log(`Invitation ${result.rows[0].id} marked as declined`);

    // Delete the notification
    const deleteResult = await client.query(`
      DELETE FROM notifications
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `, [notificationId, user.id]);

    console.log(`Deleted notification: ${deleteResult.rows.length > 0 ? 'success' : 'not found'}`);

    await client.query('COMMIT');

    console.log('Invitation declined successfully');
    return NextResponse.json({ message: 'Invitation declined successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error declining invitation:', error);
    return NextResponse.json({ error: 'Failed to decline invitation', details: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}

