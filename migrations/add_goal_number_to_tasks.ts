import pool from '../lib/db';

export async function addGoalNumberToTasks() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if the column already exists
    const checkColumnExists = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='tasks' AND column_name='goal_number'
    `);

    if (checkColumnExists.rows.length === 0) {
      // Add the goal_number column if it doesn't exist
      await client.query(`
        ALTER TABLE tasks
        ADD COLUMN goal_number NUMERIC NOT NULL DEFAULT 0
      `);
      console.log('Added goal_number column to tasks table');
    } else {
      console.log('goal_number column already exists in tasks table');
    }

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error in addGoalNumberToTasks migration:', e);
    throw e;
  } finally {
    client.release();
  }
}

