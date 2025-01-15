import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUser } from '@/lib/auth';
import { checkBadgeUnlock, Badge } from '@/lib/badges';

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) {
    console.error('Unauthorized: User not found')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { taskType, goalNumber } = await request.json()

  if (!taskType || !goalNumber) {
    console.error('Invalid input:', { taskType, goalNumber })
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const client = await pool.connect()
  try {
    console.log('Processing task report:', { taskType, goalNumber, userId: user.id })
    await client.query('BEGIN')

    // Update personal tasks
    const personalTaskResult = await client.query(`
      UPDATE personal_tasks
      SET current_progress = current_progress + $1,
          status = CASE WHEN current_progress + $1 >= goal_number THEN 'completed' ELSE 'in_progress' END
      WHERE user_id = $2 AND type = $3 AND status != 'completed'
      RETURNING *
    `, [goalNumber, user.id, taskType])

    for (const updatedPersonalTask of personalTaskResult.rows) {
      if (updatedPersonalTask.status === 'completed') {
        // Add to completed_tasks table
        await client.query(`
          INSERT INTO completed_tasks (user_id, task_type)
          VALUES ($1, $2)
        `, [user.id, taskType])

        // Create notification for completed personal task
        await client.query(`
          INSERT INTO notifications (user_id, type, message)
          VALUES ($1, 'task_completed', $2)
        `, [user.id, `You've completed your ${taskType} task: ${updatedPersonalTask.name}!`])
      }
    }

    // Update team tasks
    await client.query(`
      UPDATE goals g
      SET current_value = g.current_value + $1
      FROM team_members tm
      WHERE tm.user_id = $2 AND tm.team_id = g.team_id AND g.name = $3
    `, [goalNumber, user.id, taskType])

    // Fetch relevant contest tasks
    const contestTasksResult = await client.query(`
      SELECT ct.id, ct.goal_number
      FROM contest_tasks ct
      JOIN contest_teams cte ON ct.contest_id = cte.contest_id
      JOIN team_members tm ON cte.team_id = tm.team_id
      WHERE tm.user_id = $1 AND ct.type = $2
    `, [user.id, taskType])

    // Update contest tasks individually
    for (const row of contestTasksResult.rows) {
      const result = await client.query(`
        INSERT INTO contest_task_progress (contest_task_id, user_id, current_progress, completed)
        VALUES ($1, $2, $3, CASE WHEN $3 >= $4 THEN true ELSE false END)
        ON CONFLICT (contest_task_id, user_id)
        DO UPDATE SET 
          current_progress = contest_task_progress.current_progress + $3,
          completed = CASE WHEN contest_task_progress.current_progress + $3 >= $4 THEN true ELSE contest_task_progress.completed END
        RETURNING *
      `, [row.id, user.id, goalNumber, row.goal_number])

      const updatedProgress = result.rows[0]
      if (updatedProgress.completed && !updatedProgress.notification_sent) {
        // Create notification for completed contest task
        await client.query(`
          INSERT INTO notifications (user_id, type, message)
          VALUES ($1, 'contest_task_completed', $2)
        `, [user.id, `You've completed a contest task: ${taskType}!`])

        // Mark notification as sent
        await client.query(`
          UPDATE contest_task_progress
          SET notification_sent = true
          WHERE contest_task_id = $1 AND user_id = $2
        `, [row.id, user.id])

        // Update the team's completed tasks count
        await client.query(`
          UPDATE contest_teams
          SET completed_tasks = completed_tasks + 1
          WHERE contest_id = (SELECT contest_id FROM contest_tasks WHERE id = $1)
            AND team_id = (SELECT team_id FROM team_members WHERE user_id = $2)
        `, [row.id, user.id])
      }
    }

    // Check for badge unlocks
    const taskCounts = await client.query(`
      SELECT task_type, COUNT(*) as count
      FROM completed_tasks
      WHERE user_id = $1
      GROUP BY task_type
    `, [user.id]);

    const totalTasks = taskCounts.rows.reduce((sum, row) => sum + parseInt(row.count), 0);

    const { checkBadgeUnlock } = await import('@/lib/badges');
    const unlockedBadges: Badge[] = [];

    for (const row of taskCounts.rows) {
      const badgesToUnlock = checkBadgeUnlock(row.task_type, parseInt(row.count), totalTasks);
      unlockedBadges.push(...badgesToUnlock);
    }

    // Add newly unlocked badges
    for (const badge of unlockedBadges) {
      const result = await client.query(`
        INSERT INTO user_badges (user_id, badge_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, badge_id) DO NOTHING
        RETURNING *
      `, [user.id, badge.id]);

      if (result.rowCount > 0) {
        // Create notification for unlocked badge
        await client.query(`
          INSERT INTO notifications (user_id, type, message)
          VALUES ($1, $2, $3)
        `, [user.id, 'badge_unlocked', `You've unlocked the "${badge.name}" badge!`]);
      }
    }

    await client.query('COMMIT')
    console.log('Task report processed successfully')
    if (unlockedBadges.length > 0) {
      return NextResponse.json({ 
        message: 'Task reported successfully', 
        unlockedBadges: unlockedBadges,
        refresh: true 
      });
    }
    return NextResponse.json({ message: 'Task reported successfully', refresh: true })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error processing task report:', error)
    return NextResponse.json({ error: 'Failed to report task', details: error.message }, { status: 500 })
  } finally {
    client.release()
  }
}

