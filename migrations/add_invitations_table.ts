import pool from '../lib/db';

export async function addInvitationsTable() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if the invitations table already exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'invitations'
      );
    `);

    if (!tableExists.rows[0].exists) {
      // Create invitations table
      await client.query(`
        CREATE TABLE invitations (
          id SERIAL PRIMARY KEY,
          team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
          inviter_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          invitee_email VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'pending',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log('Created invitations table');
    } else {
      console.log('Invitations table already exists');
    }

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error in addInvitationsTable migration:', e);
    throw e;
  } finally {
    client.release();
  }
}

