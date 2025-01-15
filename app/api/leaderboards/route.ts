import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUser } from '@/lib/auth';

export async function GET(request: Request) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const client = await pool.connect();
  try {
    // Fetch team leaderboard
    const teamLeaderboard = await client.query(`
      SELECT t.id, t.name, t.company, 
             COUNT(DISTINCT ub.badge_id) as badge_count,
             COUNT(DISTINCT CASE WHEN g.current_value >= g.target_value THEN g.id END) as goals_completed
      FROM teams t
      LEFT JOIN team_members tm ON t.id = tm.team_id
      LEFT JOIN user_badges ub ON tm.user_id = ub.user_id
      LEFT JOIN goals g ON t.id = g.team_id
      GROUP BY t.id, t.name, t.company
      ORDER BY goals_completed DESC, badge_count DESC
    `);

    // Fetch individual leaderboard
    const individualLeaderboard = await client.query(`
      SELECT u.id, u.name, t.name as team_name,
             COUNT(DISTINCT ct.id) as tasks_completed
      FROM users u
      LEFT JOIN team_members tm ON u.id = tm.user_id
      LEFT JOIN teams t ON tm.team_id = t.id
      LEFT JOIN completed_tasks ct ON u.id = ct.user_id
      GROUP BY u.id, u.name, t.name
      ORDER BY tasks_completed DESC
    `);

    return NextResponse.json({
      teams: teamLeaderboard.rows,
      individuals: individualLeaderboard.rows
    });
  } catch (error) {
    console.error('Error fetching leaderboards:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboards' }, { status: 500 });
  } finally {
    client.release();
  }
}

