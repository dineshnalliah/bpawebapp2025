import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUser } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const contestId = params.id;

  const client = await pool.connect();
  try {
    // Check if contest_task_progress table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'contest_task_progress'
      );
    `);

    if (!tableExists.rows[0].exists) {
      console.error('contest_task_progress table does not exist');
      return NextResponse.json({ error: 'Database schema is not up to date' }, { status: 500 });
    }

    // Check if required columns exist in contest_task_progress table
    const columnsExist = await client.query(`
      SELECT 
        EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'contest_task_progress' AND column_name = 'contest_task_id') AS contest_task_id_exists,
        EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'contest_task_progress' AND column_name = 'user_id') AS user_id_exists,
        EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'contest_task_progress' AND column_name = 'current_progress') AS current_progress_exists
    `);

    if (!columnsExist.rows[0].contest_task_id_exists || !columnsExist.rows[0].user_id_exists || !columnsExist.rows[0].current_progress_exists) {
      console.error('Required columns do not exist in contest_task_progress table');
      return NextResponse.json({ error: 'Database schema is not up to date' }, { status: 500 });
    }

    const result = await client.query(`
      SELECT ct.*, ctp.current_progress
      FROM contest_tasks ct
      LEFT JOIN contest_task_progress ctp ON ct.id = ctp.contest_task_id AND ctp.user_id = $1
      WHERE ct.contest_id = $2
      ORDER BY ct.created_at
    `, [user.id, contestId]);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching contest tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch contest tasks' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user || user.role !== 'contest_administrator') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const contestId = params.id;
  const { name, description, type, goalNumber } = await request.json();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create the contest task
    const taskResult = await client.query(`
      INSERT INTO contest_tasks (contest_id, name, description, type, goal_number)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [contestId, name, description, type, goalNumber]);

    const taskId = taskResult.rows[0].id;

    // Assign the task to all team members in the contest
    await client.query(`
      INSERT INTO contest_task_progress (contest_task_id, user_id, current_progress)
      SELECT $1, tm.user_id, 0
      FROM contest_teams ct
      JOIN team_members tm ON ct.team_id = tm.team_id
      WHERE ct.contest_id = $2
    `, [taskId, contestId]);

    // Update the total_tasks count for the contest
    await client.query(`
      UPDATE contests
      SET total_tasks = total_tasks + 1
      WHERE id = $1
    `, [contestId]);

    await client.query('COMMIT');

    return NextResponse.json(taskResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating contest task:', error);
    return NextResponse.json({ error: 'Failed to create contest task' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const contestId = params.id;
  const { taskId, progress } = await request.json();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Update the user's progress for the task
    const result = await client.query(`
      INSERT INTO contest_task_progress (contest_task_id, user_id, current_progress)
      VALUES ($1, $2, $3)
      ON CONFLICT (contest_task_id, user_id)
      DO UPDATE SET 
        current_progress = $3, 
        completed = CASE WHEN $3 >= (SELECT goal_number FROM contest_tasks WHERE id = $1) THEN true ELSE false END,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [taskId, user.id, progress]);

    // If the task is completed, update the team's completion count
    if (result.rows[0].completed) {
      await client.query(`
        UPDATE contest_teams
        SET completed_tasks = completed_tasks + 1
        WHERE contest_id = $1 AND team_id = (
          SELECT team_id FROM team_members WHERE user_id = $2 LIMIT 1
        )
      `, [contestId, user.id]);
    }

    await client.query('COMMIT');

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating contest task progress:', error);
    return NextResponse.json({ error: 'Failed to update contest task progress' }, { status: 500 });
  } finally {
    client.release();
  }
}

