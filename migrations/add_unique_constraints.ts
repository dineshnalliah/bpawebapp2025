import pool from '../lib/db';

export async function addUniqueConstraints() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if tasks table exists and has the necessary columns
    const tasksTableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'tasks'
      );
    `);

    if (tasksTableExists.rows[0].exists) {
      const tasksColumnsExist = await client.query(`
        SELECT 
          COUNT(*) = 2 as columns_exist
        FROM 
          information_schema.columns
        WHERE 
          table_name = 'tasks'
          AND column_name IN ('user_id', 'type');
      `);

      if (tasksColumnsExist.rows[0].columns_exist) {
        // Check if the constraint already exists
        const tasksConstraintExists = await client.query(`
          SELECT COUNT(*) > 0 as constraint_exists
          FROM information_schema.table_constraints
          WHERE table_name = 'tasks' AND constraint_name = 'unique_user_task_type';
        `);

        if (!tasksConstraintExists.rows[0].constraint_exists) {
          // Add unique constraint to tasks table
          await client.query(`
            ALTER TABLE tasks
            ADD CONSTRAINT unique_user_task_type UNIQUE (user_id, type);
          `);
          console.log('Added unique constraint to tasks table');
        } else {
          console.log('Unique constraint already exists on tasks table');
        }
      } else {
        console.log('Skipping unique constraint for tasks table: required columns do not exist');
      }
    } else {
      console.log('Skipping unique constraint for tasks table: table does not exist');
    }

    // Check if contest_task_progress table exists and has the necessary columns
    const contestTaskProgressTableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'contest_task_progress'
      );
    `);

    if (contestTaskProgressTableExists.rows[0].exists) {
      const contestTaskProgressColumnsExist = await client.query(`
        SELECT 
          COUNT(*) = 2 as columns_exist
        FROM 
          information_schema.columns
        WHERE 
          table_name = 'contest_task_progress'
          AND column_name IN ('contest_task_id', 'user_id');
      `);

      if (contestTaskProgressColumnsExist.rows[0].columns_exist) {
        // Check if the constraint already exists
        const contestTaskProgressConstraintExists = await client.query(`
          SELECT COUNT(*) > 0 as constraint_exists
          FROM information_schema.table_constraints
          WHERE table_name = 'contest_task_progress' AND constraint_name = 'unique_contest_task_user';
        `);

        if (!contestTaskProgressConstraintExists.rows[0].constraint_exists) {
          // Add unique constraint to contest_task_progress table
          await client.query(`
            ALTER TABLE contest_task_progress
            ADD CONSTRAINT unique_contest_task_user UNIQUE (contest_task_id, user_id);
          `);
          console.log('Added unique constraint to contest_task_progress table');
        } else {
          console.log('Unique constraint already exists on contest_task_progress table');
        }
      } else {
        console.log('Skipping unique constraint for contest_task_progress table: required columns do not exist');
      }
    } else {
      console.log('Skipping unique constraint for contest_task_progress table: table does not exist');
    }

    await client.query('COMMIT');
    console.log('Unique constraints added successfully');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error in addUniqueConstraints migration:', e);
    throw e;
  } finally {
    client.release();
  }
}

