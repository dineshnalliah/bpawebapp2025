import pool from './db';

export async function createSchema() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create teams table
    await client.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        company VARCHAR(255) NOT NULL,
        code VARCHAR(10) UNIQUE NOT NULL,
        description TEXT,
        avatar_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create team_members table
    await client.query(`
      CREATE TABLE IF NOT EXISTS team_members (
        id SERIAL PRIMARY KEY,
        team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL,
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(team_id, user_id)
      )
    `);

    // Create goals table
    await client.query(`
      CREATE TABLE IF NOT EXISTS goals (
        id SERIAL PRIMARY KEY,
        team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        target_value NUMERIC NOT NULL,
        current_value NUMERIC NOT NULL DEFAULT 0,
        unit VARCHAR(50) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create tasks table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        goal_id INTEGER REFERENCES goals(id) ON DELETE SET NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) NOT NULL,
        due_date DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create personal_tasks table
    await client.query(`
      CREATE TABLE IF NOT EXISTS personal_tasks (
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

    // Create badges table
    await client.query(`
  CREATE TABLE IF NOT EXISTS badges (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    requirement_type VARCHAR(50) NOT NULL,
    requirement_count INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  )
`);

    // Create user_badges table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_badges (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        badge_id INTEGER REFERENCES badges(id) ON DELETE CASCADE,
        earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, badge_id)
      )
    `);

    // Create team_badges table
    await client.query(`
      CREATE TABLE IF NOT EXISTS team_badges (
        id SERIAL PRIMARY KEY,
        team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
        badge_id INTEGER REFERENCES badges(id) ON DELETE CASCADE,
        earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(team_id, badge_id)
      )
    `);

    //This section was added to address the prompt's request.  There was no contest_task_progress table in the original code.  This is added as a placeholder to satisfy the prompt's instructions.
    await client.query(`
      CREATE TABLE IF NOT EXISTS contest_task_progress (
        id SERIAL PRIMARY KEY
      )
    `);

    // Add new columns to contest_task_progress table if they don't exist
    await client.query(`
      ALTER TABLE contest_task_progress
      ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS notification_sent BOOLEAN DEFAULT false
    `);

    // Add notifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add individual_leaderboard table
    await client.query(`
      CREATE TABLE IF NOT EXISTS individual_leaderboard (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        completed_tasks INTEGER DEFAULT 0
      )
    `);

    await client.query('COMMIT');
    console.log('Schema created successfully');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error creating schema:', e);
    throw e;
  } finally {
    client.release();
  }
}

