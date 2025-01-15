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
    // Fetch user's earned badges
    const userBadgesResult = await client.query(`
      SELECT badge_id, earned_at
      FROM user_badges
      WHERE user_id = $1
    `, [user.id]);

    const userBadges = userBadgesResult.rows.reduce((acc, row) => {
      acc[row.badge_id] = row.earned_at;
      return acc;
    }, {});

    // Fetch user's task counts
    const taskCountsResult = await client.query(`
      SELECT task_type, COUNT(*) as count
      FROM completed_tasks
      WHERE user_id = $1
      GROUP BY task_type
    `, [user.id]);

    const taskCounts = taskCountsResult.rows.reduce((acc, row) => {
      acc[row.task_type.toLowerCase()] = parseInt(row.count);
      return acc;
    }, {});

    const totalTasks = Object.values(taskCounts).reduce((sum: number, count: number) => sum + count, 0);

    // Combine badge information with user's earned status and progress
    const allBadges = badges.map(badge => {
      const earned = userBadges[badge.id] !== undefined;
      let progress = 0;
      if (badge.requirement.type.toLowerCase() === 'total') {
        progress = (totalTasks / badge.requirement.count) * 100;
      } else {
        const count = taskCounts[badge.requirement.type.toLowerCase()] || 0;
        progress = (count / badge.requirement.count) * 100;
      }
      return {
        id: badge.id,
        name: badge.name,
        description: badge.description,
        earned_at: userBadges[badge.id] || null,
        progress: Math.min(progress, 100),
        requirement: badge.requirement
      };
    });

    // Sort badges: earned first (most recent first), then unearned by progress (highest to lowest)
    allBadges.sort((a, b) => {
      if (a.earned_at && b.earned_at) {
        return new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime();
      }
      if (a.earned_at) return -1;
      if (b.earned_at) return 1;
      return b.progress - a.progress;
    });

    return NextResponse.json(allBadges);
  } catch (error) {
    console.error('Error fetching badges:', error);
    return NextResponse.json({ error: 'Failed to fetch badges' }, { status: 500 });
  } finally {
    client.release();
  }
}

