'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface TaskReporterProps {
  onTaskReport: (taskType: string, goalNumber: number) => Promise<void>
}

const taskTypes = [
  { value: 'exercise', label: 'Exercise', unit: 'hours' },
  { value: 'sleep', label: 'Sleep', unit: 'hours' },
  { value: 'water', label: 'Water', unit: 'cups' },
  { value: 'steps', label: 'Steps', unit: 'steps' },
]

export function TaskReporter({ onTaskReport }: TaskReporterProps) {
  const [taskType, setTaskType] = useState<string>('')
  const [goalNumber, setGoalNumber] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setError(null)
  setSuccess(null)

  if (!taskType || !goalNumber) {
    setError('Please select a task type and enter a goal number.')
    return
  }

  try {
    console.log('Reporting task:', taskType, goalNumber)
    
    // First, report the task to the general task reporting endpoint
    await onTaskReport(taskType, parseInt(goalNumber))
    
    // Then, update the contest task progress if it exists
    const contestTaskResponse = await fetch(`/api/tasks/contest`)
    const contestTasks = await contestTaskResponse.json()
    
    const matchingTask = contestTasks.find(task => task.type.toLowerCase() === taskType)
    if (matchingTask) {
      await fetch(`/api/tasks/contest`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId: matchingTask.id,
          progress: parseInt(goalNumber),
        }),
      })
    }

    console.log('Task reported successfully')
    setSuccess('Task reported successfully!')
    setTaskType('')
    setGoalNumber('')
  } catch (error) {
    console.error('Error reporting task:', error)
    setError('Failed to report task. Please try again.')
  }
}

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex space-x-4">
        <Select value={taskType} onValueChange={setTaskType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select task type" />
          </SelectTrigger>
          <SelectContent>
            {taskTypes.map(type => (
              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="number"
          placeholder={`Enter ${taskTypes.find(t => t.value === taskType)?.unit || 'goal number'}`}
          value={goalNumber}
          onChange={(e) => setGoalNumber(e.target.value)}
          className="w-[200px]"
        />
        <Button type="submit">Submit</Button>
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
    </form>
  )
}

