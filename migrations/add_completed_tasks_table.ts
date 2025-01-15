import pool from '../lib/db';

export async function addCompletedTasksTable() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if the completed_tasks table already exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'completed_tasks'
      );
    `);

    if (!tableExists.rows[0].exists) {
      // Create completed_tasks table
      await client.query(`
        CREATE TABLE completed_tasks (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          task_type VARCHAR(50) NOT NULL,
          completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log('Created completed_tasks table');
    } else {
      console.log('completed_tasks table already exists');
    }

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error in addCompletedTasksTable migration:', e);
    throw e;
  } finally {
    client.release();
  }
}

