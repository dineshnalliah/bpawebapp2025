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
    let result;
    if (user.role === 'contest_administrator') {
      // For contest administrators, fetch all tasks
      result = await client.query('SELECT * FROM tasks')
    } else {
      // For other users, only fetch their own tasks
      result = await client.query('SELECT * FROM tasks WHERE user_id = $1', [user.id])
    }
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  } finally {
    client.release()
  }
}

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const client = await pool.connect();
  try {
    const { name, type, goalNumber } = await request.json();
    
    if (!name || !type || !goalNumber) {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
    }

    const result = await client.query(
      'INSERT INTO tasks (user_id, name, type, goal_number, current_progress, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [user.id, name, type, goalNumber, 0, 'in_progress']
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function PUT(request: Request) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const client = await pool.connect();
  try {
    const { taskId, progress } = await request.json();
    
    if (!taskId || progress === undefined) {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
    }

    const result = await client.query(
      'UPDATE tasks SET current_progress = $1, status = CASE WHEN $1 >= goal_number THEN \'completed\' ELSE \'in_progress\' END WHERE id = $2 AND user_id = $3 RETURNING *',
      [progress, taskId, user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Task not found or not authorized' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating task progress:', error);
    return NextResponse.json({ error: 'Failed to update task progress' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(request: Request) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const taskId = searchParams.get('id')

  if (!taskId) {
    return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
  }

  const client = await pool.connect();
  try {
    
    let deleteQuery;
    let queryParams;

    if (user.role === 'contest_administrator') {
      // Admins can delete any task
      deleteQuery = 'DELETE FROM tasks WHERE id = $1 RETURNING id';
      queryParams = [taskId];
    } else if (user.role === 'team_captain') {
      // Team captains can delete their own tasks and tasks of their team members
      deleteQuery = `
        DELETE FROM tasks 
        WHERE id = $1 AND (
          user_id = $2 
          OR user_id IN (
            SELECT tm.user_id 
            FROM team_members tm 
            WHERE tm.team_id IN (
              SELECT team_id 
              FROM team_members 
              WHERE user_id = $2 AND role = 'captain'
            )
          )
        )
        RETURNING id
      `;
      queryParams = [taskId, user.id];
    } else {
      // Regular users can only delete their own tasks
      deleteQuery = 'DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id';
      queryParams = [taskId, user.id];
    }

    const deleteResult = await client.query(deleteQuery, queryParams);

    if (deleteResult.rowCount === 0) {
      return NextResponse.json({ error: 'Task not found or not authorized to delete' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Task deleted successfully', id: deleteResult.rows[0].id });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Failed to delete task', details: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}

