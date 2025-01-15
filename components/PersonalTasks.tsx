'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"

interface PersonalTask {
  id: number
  name: string
  description: string
  type: string
  goal_number: number
  current_progress: number
  due_date: string
  status: string
  is_recurring: boolean
  recurrence_pattern: string
}

const taskTypes = [
  { value: 'exercise', label: 'Exercise', unit: 'hours' },
  { value: 'sleep', label: 'Sleep', unit: 'hours' },
  { value: 'water', label: 'Water', unit: 'cups' },
  { value: 'steps', label: 'Steps', unit: 'steps' },
]

export function PersonalTasks() {
  const [tasks, setTasks] = useState<PersonalTask[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<PersonalTask | null>(null)

  const fetchTasks = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/personal-tasks')
      if (!response.ok) {
        throw new Error('Failed to fetch tasks')
      }
      const data = await response.json()
      setTasks(data.filter(task => task.status !== 'completed'))
    } catch (error) {
      console.error('Error fetching tasks:', error)
      setError('Failed to load tasks. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    const taskData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      type: formData.get('type') as string,
      goalNumber: Number(formData.get('goalNumber')),
      dueDate: formData.get('dueDate') as string,
      isRecurring: formData.get('isRecurring') === 'on',
      recurrencePattern: formData.get('recurrencePattern') as string,
    }

    try {
      const response = await fetch('/api/personal-tasks', {
        method: editingTask ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingTask ? { ...taskData, id: editingTask.id } : taskData),
      })

      if (!response.ok) {
        throw new Error('Failed to save task')
      }

      const updatedTask = await response.json()
    
      setIsDialogOpen(false)
      setEditingTask(null)
    
      if (updatedTask.status === 'completed') {
        // Remove the completed task from the UI
        setTasks(prevTasks => prevTasks.filter(task => task.id !== updatedTask.id))
      } else {
        // Update or add the task in the UI
        setTasks(prevTasks => {
          const index = prevTasks.findIndex(task => task.id === updatedTask.id)
          if (index !== -1) {
            return [...prevTasks.slice(0, index), updatedTask, ...prevTasks.slice(index + 1)]
          } else {
            return [...prevTasks, updatedTask]
          }
        })
      }
    } catch (error) {
      console.error('Error saving task:', error)
      setError('Failed to save task. Please try again.')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return
    }

    try {
      const response = await fetch(`/api/personal-tasks?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete task')
      }

      fetchTasks()
    } catch (error) {
      console.error('Error deleting task:', error)
      setError('Failed to delete task. Please try again.')
    }
  }

  if (isLoading) {
    return <div>Loading personal tasks...</div>
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
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button onClick={() => setEditingTask(null)}>Add New Task</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Task' : 'Add New Task'}</DialogTitle>
            <DialogDescription>
              {editingTask ? 'Edit your personal task here.' : 'Create a new personal task.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="name" className="text-right">Name</label>
                <Input id="name" name="name" defaultValue={editingTask?.name} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="description" className="text-right">Description</label>
                <Textarea id="description" name="description" defaultValue={editingTask?.description} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="type" className="text-right">Type</label>
                <Select name="type" defaultValue={editingTask?.type || taskTypes[0].value}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select task type" />
                  </SelectTrigger>
                  <SelectContent>
                    {taskTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="goalNumber" className="text-right">Goal Number</label>
                <Input id="goalNumber" name="goalNumber" type="number" defaultValue={editingTask?.goal_number} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="dueDate" className="text-right">Due Date</label>
                <Input id="dueDate" name="dueDate" type="date" defaultValue={editingTask?.due_date} className="col-span-3" required />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="isRecurring" name="isRecurring" defaultChecked={editingTask?.is_recurring} />
                <label htmlFor="isRecurring">Recurring Task</label>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="recurrencePattern" className="text-right">Recurrence Pattern</label>
                <Select name="recurrencePattern" defaultValue={editingTask?.recurrence_pattern || 'none'}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select recurrence pattern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">{editingTask ? 'Update Task' : 'Create Task'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="mt-4 space-y-4">
        {tasks.map((task) => (
          <div key={task.id} className="flex items-center justify-between p-4 border rounded">
            <div className="flex-grow mr-4">
              <h3 className="font-semibold">{task.name}</h3>
              <p className="text-sm text-gray-500">{task.description}</p>
              <p className="text-sm">Type: {task.type}</p>
              <p className="text-sm">Due: {new Date(task.due_date).toLocaleDateString()}</p>
              {task.is_recurring && (
                <p className="text-sm">Recurrence: {task.recurrence_pattern}</p>
              )}
              <Progress value={(task.current_progress / task.goal_number) * 100} className="mt-2" />
              <p className="text-sm mt-1">
                Progress: {task.current_progress} / {task.goal_number} {taskTypes.find(t => t.value === task.type)?.unit}
              </p>
            </div>
            <div>
              <Button variant="outline" className="mr-2" onClick={() => {
                setEditingTask(task)
                setIsDialogOpen(true)
              }}>
                Edit
              </Button>
              <Button variant="destructive" onClick={() => handleDelete(task.id)}>Delete</Button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

