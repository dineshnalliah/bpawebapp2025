import pool from '../lib/db';

export async function updateBadgesTable() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if the columns already exist
    const columnsExist = await client.query(`
      SELECT 
        EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'badges' AND column_name = 'requirement_type') as requirement_type_exists,
        EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'badges' AND column_name = 'requirement_count') as requirement_count_exists
    `);

    if (!columnsExist.rows[0].requirement_type_exists) {
      await client.query(`
        ALTER TABLE badges
        ADD COLUMN requirement_type VARCHAR(50)
      `);
      console.log('Added requirement_type column to badges table');
    }

    if (!columnsExist.rows[0].requirement_count_exists) {
      await client.query(`
        ALTER TABLE badges
        ADD COLUMN requirement_count INTEGER
      `);
      console.log('Added requirement_count column to badges table');
    }

    // Update existing rows if necessary
    await client.query(`
      UPDATE badges
      SET requirement_type = 'Exercise', requirement_count = 7
      WHERE name = 'Early Bird' AND (requirement_type IS NULL OR requirement_count IS NULL)
    `);

    await client.query(`
      UPDATE badges
      SET requirement_type = 'Water', requirement_count = 30
      WHERE name = 'Hydration Hero' AND (requirement_type IS NULL OR requirement_count IS NULL)
    `);

    await client.query('COMMIT');
    console.log('Badges table updated successfully');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error in updateBadgesTable migration:', e);
    throw e;
  } finally {
    client.release();
  }
}

