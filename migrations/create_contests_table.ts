import pool from '../lib/db';

export async function createContestsTable() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if the contests table already exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'contests'
      );
    `);

    if (!tableExists.rows[0].exists) {
      // Create contests table
      await client.query(`
        CREATE TABLE contests (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          status VARCHAR(50) NOT NULL,
          created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log('Created contests table');
    } else {
      console.log('contests table already exists');
    }

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error in createContestsTable migration:', e);
    throw e;
  } finally {
    client.release();
  }
}

