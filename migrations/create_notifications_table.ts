import pool from '../lib/db';

export async function createNotificationsTable() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if the notifications table already exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'notifications'
      );
    `);

    if (!tableExists.rows[0].exists) {
      // Create notifications table
      await client.query(`
        CREATE TABLE notifications (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          type VARCHAR(50) NOT NULL,
          message TEXT NOT NULL,
          is_read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log('Created notifications table');
    } else {
      console.log('Notifications table already exists');
    }

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error in createNotificationsTable migration:', e);
    throw e;
  } finally {
    client.release();
  }
}

