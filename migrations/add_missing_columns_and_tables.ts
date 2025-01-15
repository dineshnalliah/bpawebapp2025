import pool from '../lib/db';

export async function addMissingColumnsAndTables() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if contest_tasks table exists
    const contestTasksExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'contest_tasks'
      );
    `);

    if (!contestTasksExists.rows[0].exists) {
      // Create contest_tasks table if it doesn't exist
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
    }

    // Check if contest_task_progress table exists
    const contestTaskProgressExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'contest_task_progress'
      );
    `);

    if (!contestTaskProgressExists.rows[0].exists) {
      // Create contest_task_progress table if it doesn't exist
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
      // Check if required columns exist in contest_task_progress table
      const columnsExist = await client.query(`
        SELECT 
          EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'contest_task_progress' AND column_name = 'contest_task_id') AS contest_task_id_exists,
          EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'contest_task_progress' AND column_name = 'user_id') AS user_id_exists,
          EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'contest_task_progress' AND column_name = 'current_progress') AS current_progress_exists
      `);

      if (!columnsExist.rows[0].contest_task_id_exists) {
        await client.query(`
          ALTER TABLE contest_task_progress
          ADD COLUMN contest_task_id INTEGER REFERENCES contest_tasks(id) ON DELETE CASCADE
        `);
        console.log('Added contest_task_id column to contest_task_progress table');
      }

      if (!columnsExist.rows[0].user_id_exists) {
        await client.query(`
          ALTER TABLE contest_task_progress
          ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
        `);
        console.log('Added user_id column to contest_task_progress table');
      }

      if (!columnsExist.rows[0].current_progress_exists) {
        await client.query(`
          ALTER TABLE contest_task_progress
          ADD COLUMN current_progress NUMERIC NOT NULL DEFAULT 0
        `);
        console.log('Added current_progress column to contest_task_progress table');
      }
    }

    // Add total_tasks column to contests table
    const totalTasksColumnExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'contests' AND column_name = 'total_tasks'
      );
    `);

    if (!totalTasksColumnExists.rows[0].exists) {
      await client.query(`
        ALTER TABLE contests
        ADD COLUMN total_tasks INTEGER DEFAULT 0
      `);
      console.log('Added total_tasks column to contests table');
    }

    // Add completed_tasks column to contest_teams table
    const completedTasksColumnExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'contest_teams' AND column_name = 'completed_tasks'
      );
    `);

    if (!completedTasksColumnExists.rows[0].exists) {
      await client.query(`
        ALTER TABLE contest_teams
        ADD COLUMN completed_tasks INTEGER DEFAULT 0
      `);
      console.log('Added completed_tasks column to contest_teams table');
    }

    // Create personal_tasks table if it doesn't exist
    const personalTasksTableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'personal_tasks'
      );
    `);

    if (!personalTasksTableExists.rows[0].exists) {
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

    // Check and add other potentially missing columns
    const columnsToCheck = [
      { table: 'contests', column: 'created_by', type: 'INTEGER REFERENCES users(id) ON DELETE SET NULL' },
      { table: 'tasks', column: 'type', type: 'VARCHAR(50)' },
      { table: 'tasks', column: 'goal_number', type: 'NUMERIC' },
      { table: 'tasks', column: 'current_progress', type: 'NUMERIC' },
      { table: 'personal_tasks', column: 'type', type: 'VARCHAR(50)' },
      { table: 'personal_tasks', column: 'goal_number', type: 'NUMERIC' },
      { table: 'personal_tasks', column: 'current_progress', type: 'NUMERIC' },
    ];

    for (const { table, column, type } of columnsToCheck) {
      const columnExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = $1 AND column_name = $2
        );
      `, [table, column]);

      if (!columnExists.rows[0].exists) {
        await client.query(`
          ALTER TABLE ${table}
          ADD COLUMN ${column} ${type}
        `);
        console.log(`Added ${column} column to ${table} table`);
      }
    }

    await client.query('COMMIT');
    console.log('Migration completed successfully');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error in addMissingColumnsAndTables migration:', e);
    throw e;
  } finally {
    client.release();
  }
}

