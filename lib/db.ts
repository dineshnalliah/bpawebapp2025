import { Pool } from 'pg';
import { addMissingColumnsAndTables } from '../migrations/add_missing_columns_and_tables';
import { addCompletedTasksTable } from '../migrations/add_completed_tasks_table';
import { updateBadgesTable } from '../migrations/update_badges_table';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

export default pool;

export async function initDatabase() {
  const { createSchema } = await import('./schema');
  const { seedDatabase } = await import('./seed');

  try {
    await createSchema();
    await addMissingColumnsAndTables();
    await addCompletedTasksTable();
    await updateBadgesTable();
    await seedDatabase();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Test the connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to the database:', err);
  } else {
    console.log('Successfully connected to the database');
    release();
  }
});

