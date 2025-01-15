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
    const contestResult = await client.query(`
      SELECT c.*, u.name as created_by_name
      FROM contests c
      LEFT JOIN users u ON c.created_by = u.id
      WHERE c.id = $1
    `, [contestId]);

    if (contestResult.rows.length === 0) {
      return NextResponse.json({ error: 'Contest not found' }, { status: 404 });
    }

    const contest = contestResult.rows[0];

    const teamsResult = await client.query(`
      SELECT t.id, t.name, t.company,
             COUNT(DISTINCT tm.user_id) as team_size,
             COALESCE(SUM(CASE WHEN ctp.completed THEN 1 ELSE 0 END), 0) as completed_tasks
      FROM teams t
      JOIN contest_teams ct ON t.id = ct.team_id
      LEFT JOIN team_members tm ON t.id = tm.team_id
      LEFT JOIN contest_tasks cts ON ct.contest_id = cts.contest_id
      LEFT JOIN contest_task_progress ctp ON cts.id = ctp.contest_task_id AND tm.user_id = ctp.user_id
      WHERE ct.contest_id = $1
      GROUP BY t.id, t.name, t.company
      ORDER BY completed_tasks DESC, team_size DESC
    `, [contestId]);

    contest.teams = teamsResult.rows;

    return NextResponse.json(contest);
  } catch (error) {
    console.error('Error fetching contest details:', error);
    return NextResponse.json({ error: 'Failed to fetch contest details' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user || user.role !== 'contest_administrator') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const contestId = params.id;
  const { name, description, startDate, endDate, teamIds } = await request.json();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const contestResult = await client.query(`
      UPDATE contests
      SET name = $1, description = $2, start_date = $3, end_date = $4
      WHERE id = $5
      RETURNING *
    `, [name, description, startDate, endDate, contestId]);

    if (contestResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Contest not found' }, { status: 404 });
    }

    await client.query('DELETE FROM contest_teams WHERE contest_id = $1', [contestId]);

    for (const teamId of teamIds) {
      await client.query('INSERT INTO contest_teams (contest_id, team_id) VALUES ($1, $2)', [contestId, teamId]);
    }

    await client.query('COMMIT');

    return NextResponse.json(contestResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating contest:', error);
    return NextResponse.json({ error: 'Failed to update contest' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user || user.role !== 'contest_administrator') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const contestId = params.id;

  const client = await pool.connect();
  try {
    // Delete the contest
    await client.query('DELETE FROM contests WHERE id = $1', [contestId]);

    return NextResponse.json({ message: 'Contest deleted successfully' });
  } catch (error) {
    console.error('Error deleting contest:', error);
    return NextResponse.json({ error: 'Failed to delete contest' }, { status: 500 });
  } finally {
    client.release();
  }
}

