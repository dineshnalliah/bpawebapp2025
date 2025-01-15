import pool from '../lib/db';

export async function addCurrentProgressToTasks() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if the column already exists
    const checkColumnExists = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='tasks' AND column_name='current_progress'
    `);

    if (checkColumnExists.rows.length === 0) {
      // Add the current_progress column if it doesn't exist
      await client.query(`
        ALTER TABLE tasks
        ADD COLUMN current_progress NUMERIC NOT NULL DEFAULT 0
      `);
      console.log('Added current_progress column to tasks table');
    } else {
      console.log('current_progress column already exists in tasks table');
    }

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error in addCurrentProgressToTasks migration:', e);
    throw e;
  } finally {
    client.release();
  }
}

