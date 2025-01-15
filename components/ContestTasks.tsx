'use client'

import { useState, useEffect } from 'react'
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface ContestTask {
  id: number
  name: string
  description: string
  type: string
  goal_number: number
  current_progress: number
}

export function ContestTasks() {
  const [tasks, setTasks] = useState<ContestTask[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchContestTasks = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/tasks/contest')
      if (!response.ok) {
        throw new Error('Failed to fetch contest tasks')
      }
      const data = await response.json()
      setTasks(data)
    } catch (error) {
      console.error('Error fetching contest tasks:', error)
      setError('Failed to load contest tasks. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchContestTasks()
  }, [])

  const handleProgressUpdate = async (taskId: number, progress: number) => {
    try {
      const response = await fetch('/api/tasks/contest', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskId, progress }),
      })

      if (!response.ok) {
        throw new Error('Failed to update task progress')
      }

      const updatedTask = await response.json()

      if (updatedTask.taskCompleted) {
        // Remove the completed task from the list
        setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId))
      } else {
        // Update the task's progress
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === taskId
              ? { ...task, current_progress: updatedTask.current_progress }
              : task
          )
        )
      }
    } catch (error) {
      console.error('Error updating task progress:', error)
      setError('Failed to update task progress. Please try again.')
    }
  }

  if (isLoading) {
    return <div>Loading contest tasks...</div>
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      {tasks.map(task => (
        <div key={task.id} className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <p className="font-medium">{task.name}</p>
            <span className="text-sm text-muted-foreground">
              {task.current_progress} / {task.goal_number} {task.type}
            </span>
          </div>
          <Progress value={(task.current_progress / task.goal_number) * 100} />
          <Button
            onClick={() => handleProgressUpdate(task.id, 1)}
            className="mt-2"
            size="sm"
          >
            Increment Progress
          </Button>
        </div>
      ))}
      {tasks.length === 0 && (
        <p className="text-muted-foreground">No active contest tasks.</p>
      )}
    </div>
  )
}

