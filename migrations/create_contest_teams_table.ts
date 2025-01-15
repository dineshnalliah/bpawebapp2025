import pool from '../lib/db';

export async function createContestTeamsTable() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if the contest_teams table already exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'contest_teams'
      );
    `);

    if (!tableExists.rows[0].exists) {
      // Create contest_teams table
      await client.query(`
        CREATE TABLE contest_teams (
          id SERIAL PRIMARY KEY,
          contest_id INTEGER REFERENCES contests(id) ON DELETE CASCADE,
          team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(contest_id, team_id)
        )
      `);

      console.log('Created contest_teams table');
    } else {
      console.log('contest_teams table already exists');
    }

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error in createContestTeamsTable migration:', e);
    throw e;
  } finally {
    client.release();
  }
}

