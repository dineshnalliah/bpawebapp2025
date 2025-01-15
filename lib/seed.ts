import pool from './db';
import bcrypt from 'bcrypt';

export async function seedDatabase() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Seed users
    const password = await bcrypt.hash('password123', 10);
    const userIds = await Promise.all([
      client.query('INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id', ['john@example.com', password, 'John Doe', 'member']),
      client.query('INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id', ['jane@example.com', password, 'Jane Smith', 'captain']),
      client.query('INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id', ['admin@example.com', password, 'Admin User', 'admin'])
    ]);

    // Seed teams
    const teamIds = await Promise.all([
      client.query('INSERT INTO teams (name, company, code) VALUES ($1, $2, $3) RETURNING id', ['Team Alpha', 'TechCorp', 'ALPHA1']),
      client.query('INSERT INTO teams (name, company, code) VALUES ($1, $2, $3) RETURNING id', ['Fitness Fanatics', 'HealthInc', 'FIT123'])
    ]);

    // Seed team members
    await client.query('INSERT INTO team_members (user_id, team_id, role) VALUES ($1, $2, $3)', [userIds[0].rows[0].id, teamIds[0].rows[0].id, 'member']);
    await client.query('INSERT INTO team_members (user_id, team_id, role) VALUES ($1, $2, $3)', [userIds[1].rows[0].id, teamIds[0].rows[0].id, 'captain']);
    await client.query('INSERT INTO team_members (user_id, team_id, role) VALUES ($1, $2, $3)', [userIds[1].rows[0].id, teamIds[1].rows[0].id, 'member']);

    // Seed goals
    await client.query('INSERT INTO goals (team_id, name, description, target_value, unit, start_date, end_date) VALUES ($1, $2, $3, $4, $5, $6, $7)', 
      [teamIds[0].rows[0].id, 'Daily Steps', 'Reach 10,000 steps daily', 10000, 'steps', '2023-01-01', '2023-12-31']);
    await client.query('INSERT INTO goals (team_id, name, description, target_value, unit, start_date, end_date) VALUES ($1, $2, $3, $4, $5, $6, $7)', 
      [teamIds[1].rows[0].id, 'Water Intake', 'Drink 8 glasses of water daily', 8, 'glasses', '2023-01-01', '2023-12-31']);

    // Seed tasks
    await client.query('INSERT INTO tasks (user_id, goal_id, name, description, status, due_date) VALUES ($1, $2, $3, $4, $5, $6)', 
      [userIds[0].rows[0].id, 1, 'Morning Walk', 'Take a 30-minute walk in the morning', 'in_progress', '2023-06-30']);
    await client.query('INSERT INTO tasks (user_id, goal_id, name, description, status, due_date) VALUES ($1, $2, $3, $4, $5, $6)', 
      [userIds[1].rows[0].id, 2, 'Hydration Reminder', 'Set up reminders to drink water throughout the day', 'completed', '2023-06-15']);

    // Seed badges
    await client.query(`
      INSERT INTO badges (name, description, image_url, requirement_type, requirement_count)
      VALUES 
        ('Early Bird', 'Completed morning workout for 7 days', 'https://example.com/badges/early-bird.png', 'Exercise', 7),
        ('Hydration Hero', 'Drank 8 glasses of water daily for a month', 'https://example.com/badges/hydration-hero.png', 'Water', 30)
      ON CONFLICT (name) DO NOTHING
    `);

    // Seed user badges
    await client.query('INSERT INTO user_badges (user_id, badge_id) VALUES ($1, $2)', [userIds[0].rows[0].id, 1]);
    await client.query('INSERT INTO user_badges (user_id, badge_id) VALUES ($1, $2)', [userIds[1].rows[0].id, 2]);

    // Seed team badges
    await client.query('INSERT INTO team_badges (team_id, badge_id) VALUES ($1, $2)', [teamIds[0].rows[0].id, 1]);

    await client.query('COMMIT');
    console.log('Database seeded successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error seeding database:', error);
  } finally {
    client.release();
  }
}

