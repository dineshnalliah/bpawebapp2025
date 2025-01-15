import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUser } from '@/lib/auth';
import { badges } from '@/lib/badges';

export async function GET(request: Request) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const client = await pool.connect();
  try {
    // Fetch tasks by type
    const tasksByTypeResult = await client.query(`
      SELECT 
        COALESCE(ct.task_type, 'Other') as name,
        COUNT(*) as value
      FROM completed_tasks ct
      WHERE ct.user_id = $1
      GROUP BY ct.task_type
      ORDER BY value DESC
    `, [user.id]);

    // Fetch user's task counts
    const userTaskCountsResult = await client.query(`
      SELECT task_type, COUNT(*) as count
      FROM completed_tasks
      WHERE user_id = $1
      GROUP BY task_type
    `, [user.id]);

    const userTaskCounts = userTaskCountsResult.rows.reduce((acc, row) => {
      acc[row.task_type.toLowerCase()] = parseInt(row.count);
      return acc;
    }, {});

    // Calculate badge progress
    const badgeProgress = badges.map(badge => {
      const completedCount = userTaskCounts[badge.requirement.type.toLowerCase()] || 0;
      const progress = Math.min((completedCount / badge.requirement.count) * 100, 100);
      return {
        name: badge.name,
        progress: Math.round(progress)
      };
    });

    // Sort badges by progress and get top 3
    const topBadges = badgeProgress.sort((a, b) => b.progress - a.progress).slice(0, 3);

    // Fetch weekly activity
    const weeklyActivityResult = await client.query(`
      SELECT 
        DATE_TRUNC('day', completed_at) as date,
        COUNT(*) as tasks
      FROM completed_tasks
      WHERE user_id = $1 AND completed_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE_TRUNC('day', completed_at)
      ORDER BY date
    `, [user.id]);

    const analyticsData = {
      tasksByType: tasksByTypeResult.rows,
      badgeProgress: topBadges,
      weeklyActivity: weeklyActivityResult.rows.map(row => ({
        ...row,
        date: row.date.toISOString().split('T')[0] // Format date as YYYY-MM-DD
      }))
    };

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics data' }, { status: 500 });
  } finally {
    client.release();
  }
}

