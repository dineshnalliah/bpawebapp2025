import pool from '../lib/db';
import { addTypeAndGoalNumberToPersonalTasks } from './add_type_and_goal_number_to_personal_tasks';

export async function addPersonalTasks() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if the personal_tasks table already exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'personal_tasks'
      );
    `);

    if (!tableExists.rows[0].exists) {
      // Create personal_tasks table
      await client.query(`
        CREATE TABLE personal_tasks (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          type VARCHAR(50) NOT NULL,
          goal_number NUMERIC NOT NULL,
          current_progress NUMERIC NOT NULL DEFAULT 0,
          due_date DATE,
          status VARCHAR(50) NOT NULL,
          is_recurring BOOLEAN DEFAULT FALSE,
          recurrence_pattern VARCHAR(50),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log('Created personal_tasks table');
    } else {
      console.log('personal_tasks table already exists');
    }

    await addTypeAndGoalNumberToPersonalTasks();
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error in addPersonalTasks migration:', e);
    throw e;
  } finally {
    client.release();
  }
}

