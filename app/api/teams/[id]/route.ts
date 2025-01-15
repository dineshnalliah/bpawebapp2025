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
    // Fetch team details
    const teamResult = await client.query(`
      SELECT t.*, u.name as creator_name
      FROM teams t
      LEFT JOIN users u ON t.created_at = u.created_at
      WHERE t.id = $1
    `, [teamId]);

    if (teamResult.rows.length === 0) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const team = teamResult.rows[0];

    // Fetch team members
    const membersResult = await client.query(`
      SELECT u.id, u.name, tm.role, 
         COUNT(DISTINCT ta.id) as total_tasks,
         COUNT(DISTINCT CASE WHEN ta.status = 'completed' THEN ta.id END) as completed_tasks
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      LEFT JOIN tasks ta ON u.id = ta.user_id
      WHERE tm.team_id = $1
      GROUP BY u.id, u.name, tm.role
    `, [teamId]);

    // Fetch team progress
    const progressResult = await client.query(`
      SELECT g.name, g.target_value, g.current_value, g.unit
      FROM goals g
      WHERE g.team_id = $1
    `, [teamId]);

    // Fetch contests participation
    const contestsResult = await client.query(`
      SELECT c.id, c.name, c.start_date, c.end_date
      FROM contests c
      JOIN contest_teams ct ON c.id = ct.contest_id
      WHERE ct.team_id = $1
      ORDER BY c.end_date DESC
    `, [teamId]);

    return NextResponse.json({
      ...team,
      members: membersResult.rows,
      progress: progressResult.rows,
      contests: contestsResult.rows.map(contest => ({
        ...contest,
        start_date: contest.start_date.toISOString(),
        end_date: contest.end_date.toISOString()
      }))
    });
  } catch (error) {
    console.error('Error fetching team details:', error);
    return NextResponse.json({ error: 'Failed to fetch team details' }, { status: 500 });
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
  const { name, description, company, avatar_url } = await request.json();

  const client = await pool.connect();
  try {
    // Check if the user is a team captain or admin
    const roleCheck = await client.query(`
      SELECT tm.role as team_role, u.role as user_role
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = $1 AND tm.user_id = $2
    `, [teamId, user.id]);

    if (roleCheck.rows.length === 0 || 
        (roleCheck.rows[0].team_role !== 'captain' && 
         roleCheck.rows[0].user_role !== 'team_manager' && 
         roleCheck.rows[0].user_role !== 'contest_administrator')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update team details
    const result = await client.query(`
      UPDATE teams
      SET name = $1, description = $2, company = $3, avatar_url = $4
      WHERE id = $5
      RETURNING *
    `, [name, description, company, avatar_url, teamId]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating team details:', error);
    return NextResponse.json({ error: 'Failed to update team details' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const teamId = params.id;

  const client = await pool.connect();
  try {
    // Check if the user is a team captain or admin
    const roleCheck = await client.query(`
      SELECT tm.role as team_role, u.role as user_role
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = $1 AND tm.user_id = $2
    `, [teamId, user.id]);

    if (roleCheck.rows.length === 0 || 
        (roleCheck.rows[0].team_role !== 'captain' && 
         roleCheck.rows[0].user_role !== 'contest_administrator')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete the team
    await client.query('DELETE FROM teams WHERE id = $1', [teamId]);

    return NextResponse.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Error deleting team:', error);
    return NextResponse.json({ error: 'Failed to delete team' }, { status: 500 });
  } finally {
    client.release();
  }
}

