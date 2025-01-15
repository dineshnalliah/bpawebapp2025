import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUser } from '@/lib/auth';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const notificationId = params.id;

  const client = await pool.connect();
  try {
    // Delete the notification
    const result = await client.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
      [notificationId, user.id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Notification not found or not authorized to delete' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Notification dismissed successfully' });
  } catch (error) {
    console.error('Error dismissing notification:', error);
    return NextResponse.json({ error: 'Failed to dismiss notification' }, { status: 500 });
  } finally {
    client.release();
  }
}

