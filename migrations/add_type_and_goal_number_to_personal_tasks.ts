import pool from '../lib/db';

export async function addTypeAndGoalNumberToPersonalTasks() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if the columns already exist
    const checkColumnsExist = await client.query(`
      SELECT 
        COUNT(*) as column_count
      FROM 
        information_schema.columns
      WHERE 
        table_name = 'personal_tasks'
        AND column_name IN ('type', 'goal_number', 'current_progress')
    `);

    if (checkColumnsExist.rows[0].column_count < 3) {
      // Add the missing columns if they don't exist
      await client.query(`
        ALTER TABLE personal_tasks
        ADD COLUMN IF NOT EXISTS type VARCHAR(50) NOT NULL DEFAULT 'exercise',
        ADD COLUMN IF NOT EXISTS goal_number NUMERIC NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS current_progress NUMERIC NOT NULL DEFAULT 0
      `);
      console.log('Added type, goal_number, and current_progress columns to personal_tasks table');
    } else {
      console.log('type, goal_number, and current_progress columns already exist in personal_tasks table');
    }

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error in addTypeAndGoalNumberToPersonalTasks migration:', e);
    throw e;
  } finally {
    client.release();
  }
}

