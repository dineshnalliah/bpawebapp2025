import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUser } from '@/lib/auth';

export async function GET(request: Request) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const client = await pool.connect()
  try {
    const result = await client.query(`
      SELECT ct.*, c.name as contest_name, COALESCE(ctp.current_progress, 0) as current_progress
      FROM contest_tasks ct
      JOIN contests c ON ct.contest_id = c.id
      JOIN contest_teams cte ON c.id = cte.contest_id
      JOIN team_members tm ON cte.team_id = tm.team_id
      LEFT JOIN contest_task_progress ctp ON ct.id = ctp.contest_task_id AND ctp.user_id = $1
      WHERE tm.user_id = $1 AND c.status = 'active'
        AND (ctp.completed IS NULL OR ctp.completed = false)
      ORDER BY c.start_date DESC, ct.created_at ASC
    `, [user.id])
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error fetching contest tasks:', error)
    return NextResponse.json({ error: 'Failed to fetch contest tasks' }, { status: 500 })
  } finally {
    client.release()
  }
}

export async function PUT(request: Request) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { taskId, progress: reportedProgress } = await request.json()
  const progress = parseInt(reportedProgress, 10)
  if (isNaN(progress)) {
    return NextResponse.json({ error: 'Invalid progress value' }, { status: 400 })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Check if the user is part of the team participating in the contest
    const userTeamCheck = await client.query(`
      SELECT ct.contest_id, ct.team_id
      FROM contest_teams ct
      JOIN team_members tm ON ct.team_id = tm.team_id
      JOIN contest_tasks cts ON ct.contest_id = cts.contest_id
      WHERE tm.user_id = $1 AND cts.id = $2
    `, [user.id, taskId])

    if (userTeamCheck.rows.length === 0) {
      throw new Error('User is not authorized to update this task')
    }

    const contestId = userTeamCheck.rows[0].contest_id
    const teamId = userTeamCheck.rows[0].team_id

    // Get the current progress and goal number
    const currentProgressResult = await client.query(`
      SELECT COALESCE(ctp.current_progress, 0) as current_progress, ct.goal_number
      FROM contest_tasks ct
      LEFT JOIN contest_task_progress ctp ON ct.id = ctp.contest_task_id AND ctp.user_id = $2
      WHERE ct.id = $1
    `, [taskId, user.id])

    const { current_progress: currentProgress, goal_number: goalNumber } = currentProgressResult.rows[0]
    const newProgress = parseInt(currentProgress, 10) + progress
    const completed = newProgress >= goalNumber

    // Update the user's progress for the task
    const result = await client.query(`
      INSERT INTO contest_task_progress (contest_task_id, user_id, current_progress, completed)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (contest_task_id, user_id)
      DO UPDATE SET 
        current_progress = $3, 
        completed = $4,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [taskId, user.id, newProgress, completed])

    // If the task is newly completed, update the team's completion count
    if (completed && parseInt(currentProgress, 10) < goalNumber) {
      await client.query(`
        UPDATE contest_teams
        SET completed_tasks = completed_tasks + 1
        WHERE contest_id = $1 AND team_id = $2
      `, [contestId, teamId])
    }

    await client.query('COMMIT')

    return NextResponse.json({
      ...result.rows[0],
      taskCompleted: completed
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error updating contest task progress:', error)
    return NextResponse.json({ error: 'Failed to update contest task progress' }, { status: 500 })
  } finally {
    client.release()
  }
}

