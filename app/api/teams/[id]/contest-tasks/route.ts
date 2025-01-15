import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUser } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const teamId = params.id;

  const client = await pool.connect();
  try {
    // First, check if the team is part of any contest
    const teamContestCheck = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM contest_teams WHERE team_id = $1
      ) as is_in_contest
    `, [teamId]);

    if (!teamContestCheck.rows[0].is_in_contest) {
      // If the team is not part of any contest, return an empty array
      return NextResponse.json([]);
    }

    // If the team is part of a contest, fetch the contest tasks
    const result = await client.query(`
      SELECT ct.*, COALESCE(ctp.current_progress, 0) as current_progress
      FROM contest_tasks ct
      JOIN contest_teams cte ON ct.contest_id = cte.contest_id
      LEFT JOIN contest_task_progress ctp ON ct.id = ctp.contest_task_id AND ctp.user_id = $1
      WHERE cte.team_id = $2
      ORDER BY ct.created_at
    `, [user.id, teamId]);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching contest tasks for team:', error);
    return NextResponse.json({ error: 'Failed to fetch contest tasks' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const teamId = params.id;
  const { taskId, progress } = await request.json();

  const client = await pool.connect();
  try {
    const result = await client.query(`
      INSERT INTO contest_task_progress (contest_task_id, user_id, current_progress)
      VALUES ($1, $2, $3)
      ON CONFLICT (contest_task_id, user_id)
      DO UPDATE SET current_progress = $3, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [taskId, user.id, progress]);

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating contest task progress:', error);
    return NextResponse.json({ error: 'Failed to update contest task progress' }, { status: 500 });
  } finally {
    client.release();
  }
}

