import pool from '../lib/db';

export async function addAvatarUrlToTeams() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if the column already exists
    const checkColumnExists = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='teams' AND column_name='avatar_url'
    `);

    if (checkColumnExists.rows.length === 0) {
      // Add the avatar_url column if it doesn't exist
      await client.query(`
        ALTER TABLE teams
        ADD COLUMN avatar_url TEXT
      `);
      console.log('Added avatar_url column to teams table');
    } else {
      console.log('avatar_url column already exists in teams table');
    }

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error in addAvatarUrlToTeams migration:', e);
    throw e;
  } finally {
    client.release();
  }
}

