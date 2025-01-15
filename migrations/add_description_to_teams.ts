import pool from '../lib/db';

export async function addDescriptionToTeams() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if the column already exists
    const checkColumnExists = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='teams' AND column_name='description'
    `);

    if (checkColumnExists.rows.length === 0) {
      // Add the description column if it doesn't exist
      await client.query(`
        ALTER TABLE teams
        ADD COLUMN description TEXT
      `);
      console.log('Added description column to teams table');
    } else {
      console.log('Description column already exists in teams table');
    }

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error in addDescriptionToTeams migration:', e);
    throw e;
  } finally {
    client.release();
  }
}

