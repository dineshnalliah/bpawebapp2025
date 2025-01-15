import pool from '../lib/db';

export async function addTypeToTasks() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if the column already exists
    const checkColumnExists = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='tasks' AND column_name='type'
    `);

    if (checkColumnExists.rows.length === 0) {
      // Add the type column if it doesn't exist
      await client.query(`
        ALTER TABLE tasks
        ADD COLUMN type VARCHAR(50) NOT NULL DEFAULT 'Exercise'
      `);
      console.log('Added type column to tasks table');
    } else {
      console.log('Type column already exists in tasks table');
    }

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error in addTypeToTasks migration:', e);
    throw e;
  } finally {
    client.release();
  }
}

