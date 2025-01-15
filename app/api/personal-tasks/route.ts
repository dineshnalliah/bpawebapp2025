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
    const result = await client.query('SELECT * FROM personal_tasks WHERE user_id = $1 ORDER BY due_date', [user.id])
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error fetching personal tasks:', error)
    return NextResponse.json({ error: 'Failed to fetch personal tasks' }, { status: 500 })
  } finally {
    client.release()
  }
}

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name, description, type, goalNumber, dueDate, isRecurring, recurrencePattern } = await request.json()

  const client = await pool.connect()
  try {
    const result = await client.query(
      'INSERT INTO personal_tasks (user_id, name, description, type, goal_number, due_date, status, is_recurring, recurrence_pattern) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [user.id, name, description, type, goalNumber, dueDate, 'pending', isRecurring, recurrencePattern]
    )
    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Error creating personal task:', error)
    return NextResponse.json({ error: 'Failed to create personal task' }, { status: 500 })
  } finally {
    client.release()
  }
}

export async function PUT(request: Request) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, name, description, type, goalNumber, dueDate, status, isRecurring, recurrencePattern, currentProgress } = await request.json()

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const result = await client.query(
      'UPDATE personal_tasks SET name = $1, description = $2, type = $3, goal_number = $4, due_date = $5, status = $6, is_recurring = $7, recurrence_pattern = $8, current_progress = $9 WHERE id = $10 AND user_id = $11 RETURNING *',
      [name, description, type, goalNumber, dueDate, status, isRecurring, recurrencePattern, currentProgress, id, user.id]
    )

    if (result.rows.length === 0) {
      await client.query('ROLLBACK')
      return NextResponse.json({ error: 'Task not found or not authorized' }, { status: 404 })
    }

    const updatedTask = result.rows[0]

    // Check if the task is completed
    if (updatedTask.current_progress >= updatedTask.goal_number && updatedTask.status !== 'completed') {
      // Mark the task as completed
      await client.query('UPDATE personal_tasks SET status = $1 WHERE id = $2', ['completed', updatedTask.id])

      // Add to completed_tasks table
      await client.query(`
        INSERT INTO completed_tasks (user_id, task_type)
        VALUES ($1, $2)
      `, [user.id, updatedTask.type])

      // Create a notification
      await client.query(`
        INSERT INTO notifications (user_id, type, message)
        VALUES ($1, $2, $3)
      `, [user.id, 'task_completed', `You have completed the task: ${updatedTask.name}`])

      updatedTask.status = 'completed'

      // Check for badge unlocks
      const taskCounts = await client.query(`
        SELECT task_type, COUNT(*) as count
        FROM completed_tasks
        WHERE user_id = $1
        GROUP BY task_type
      `, [user.id]);

      const totalTasks = taskCounts.rows.reduce((sum, row) => sum + parseInt(row.count), 0);

      const { checkBadgeUnlock } = await import('@/lib/badges');
      const unlockedBadges = [];

      for (const row of taskCounts.rows) {
        unlockedBadges.push(...checkBadgeUnlock(row.task_type, parseInt(row.count), totalTasks));
      }

      // Add newly unlocked badges
      for (const badge of unlockedBadges) {
        await client.query(`
          INSERT INTO user_badges (user_id, badge_id)
          VALUES ($1, $2)
          ON CONFLICT (user_id, badge_id) DO NOTHING
        `, [user.id, badge.id]);

        // Create notification for unlocked badge
        await client.query(`
          INSERT INTO notifications (user_id, type, message)
          VALUES ($1, $2, $3)
        `, [user.id, 'badge_unlocked', `You've unlocked the "${badge.name}" badge!`]);
      }
    }

    await client.query('COMMIT')
    return NextResponse.json(updatedTask)
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error updating personal task:', error)
    return NextResponse.json({ error: 'Failed to update personal task' }, { status: 500 })
  } finally {
    client.release()
  }
}

export async function DELETE(request: Request) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
  }

  const client = await pool.connect()
  try {
    const result = await client.query('DELETE FROM personal_tasks WHERE id = $1 AND user_id = $2 RETURNING id', [id, user.id])
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Task not found or not authorized' }, { status: 404 })
    }
    return NextResponse.json({ message: 'Task deleted successfully', id: result.rows[0].id })
  } catch (error) {
    console.error('Error deleting personal task:', error)
    return NextResponse.json({ error: 'Failed to delete personal task' }, { status: 500 })
  } finally {
    client.release()
  }
}

