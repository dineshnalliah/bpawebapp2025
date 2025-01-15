import pool from '../lib/db';

export async function addTeamIdToNotifications() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if the column already exists
    const checkColumnExists = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='notifications' AND column_name='team_id'
    `);

    if (checkColumnExists.rows.length === 0) {
      // Add the team_id column if it doesn't exist
      await client.query(`
        ALTER TABLE notifications
        ADD COLUMN team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE
      `);
      console.log('Added team_id column to notifications table');
    } else {
      console.log('team_id column already exists in notifications table');
    }

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error in addTeamIdToNotifications migration:', e);
    throw e;
  } finally {
    client.release();
  }
}

