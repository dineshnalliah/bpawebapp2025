import pool from '../lib/db';

export async function addContestTasksTable() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if the contest_tasks table already exists
    const contestTasksExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'contest_tasks'
      );
    `);

    // Check if the contest_task_progress table already exists
    const contestTaskProgressExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'contest_task_progress'
      );
    `);

    if (!contestTasksExists.rows[0].exists) {
      // Create contest_tasks table
      await client.query(`
        CREATE TABLE contest_tasks (
          id SERIAL PRIMARY KEY,
          contest_id INTEGER REFERENCES contests(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          type VARCHAR(50) NOT NULL,
          goal_number NUMERIC NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Created contest_tasks table');
    } else {
      console.log('contest_tasks table already exists');
    }

    if (!contestTaskProgressExists.rows[0].exists) {
      // Create contest_task_progress table to track individual progress
      await client.query(`
        CREATE TABLE contest_task_progress (
          id SERIAL PRIMARY KEY,
          contest_task_id INTEGER REFERENCES contest_tasks(id) ON DELETE CASCADE,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          current_progress NUMERIC NOT NULL DEFAULT 0,
          completed BOOLEAN DEFAULT false,
          notification_sent BOOLEAN DEFAULT false,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(contest_task_id, user_id)
        )
      `);
      console.log('Created contest_task_progress table');
    } else {
      console.log('contest_task_progress table already exists');
    }

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error in addContestTasksTable migration:', e);
    throw e;
  } finally {
    client.release();
  }
}

