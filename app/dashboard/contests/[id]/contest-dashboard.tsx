'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { TeamSearch } from "@/components/TeamSearch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ErrorBoundary } from 'react-error-boundary'

interface ContestDashboardProps {
  contestId: string
  currentUser: {
    id: number
    role: string
  }
}

interface Contest {
  id: number
  name: string
  description: string
  start_date: string
  end_date: string
  status: string
  created_by: number
  created_by_name: string
  teams: Array<{
    id: number
    name: string
    company: string
    total_tasks: number
    completed_tasks: number
    team_size: number
  }>
}

interface ContestTask {
  id: number
  name: string
  description: string
  type: string
  goal_number: number
  current_progress: number
}

function ErrorFallback({error, resetErrorBoundary}) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Something went wrong:</AlertTitle>
      <AlertDescription>{error.message}</AlertDescription>
      <Button onClick={resetErrorBoundary}>Try again</Button>
    </Alert>
  )
}

export default function ContestDashboard({ contestId, currentUser }: ContestDashboardProps) {
  const router = useRouter()
  const [contest, setContest] = useState<Contest | null>(null)
  const [contestTasks, setContestTasks] = useState<ContestTask[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [selectedTeams, setSelectedTeams] = useState<number[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchContestData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const [contestResponse, tasksResponse] = await Promise.all([
          fetch(`/api/contests/${contestId}`),
          fetch(`/api/contests/${contestId}/tasks`)
        ])
        if (!contestResponse.ok || !tasksResponse.ok) {
          throw new Error('Failed to fetch contest data')
        }
        const contestData = await contestResponse.json()
        const tasksData = await tasksResponse.json()

        if (contestData.created_by !== currentUser.id) {
          router.push('/dashboard')
          return
        }

        setContest(contestData)
        setContestTasks(tasksData)
        setSelectedTeams(contestData.teams.map((team: { id: number }) => team.id))
      } catch (error) {
        console.error('Error fetching contest data:', error)
        setError('Failed to load contest data. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchContestData()
  }, [contestId, currentUser.id, router])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    try {
      const formData = new FormData(e.currentTarget)
      const response = await fetch(`/api/contests/${contestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.get('name'),
          description: formData.get('description'),
          startDate: formData.get('startDate'),
          endDate: formData.get('endDate'),
          teamIds: selectedTeams,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update contest')
      }

      const updatedContest = await response.json()
      setContest(updatedContest)
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating contest:', error)
      setError('Failed to update contest. Please try again.')
    }
  }

  const handleAddTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    try {
      const formData = new FormData(e.currentTarget)
      const response = await fetch(`/api/contests/${contestId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.get('name'),
          description: formData.get('description'),
          type: formData.get('type'),
          goalNumber: Number(formData.get('goalNumber')),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to add contest task')
      }

      const newTask = await response.json()
      setContestTasks([...contestTasks, newTask])
      setIsAddingTask(false)
    } catch (error) {
      console.error('Error adding contest task:', error)
      setError('Failed to add contest task. Please try again.')
    }
  }

  const handleDeleteContest = async () => {
    if (!confirm('Are you sure you want to delete this contest? This action cannot be undone.')) {
      return;
    }
    setError(null);
    try {
      const response = await fetch(`/api/contests/${contestId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete contest');
      }

      router.push('/dashboard');
    } catch (error) {
      console.error('Error deleting contest:', error);
      setError('Failed to delete contest. Please try again.');
    }
  };

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!contest) {
    return <div>Contest not found</div>
  }

  const isContestAdministrator = currentUser.role === 'contest_administrator'

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // Reset the state of your app so the error doesn't happen again
        setError(null)
        setIsLoading(true)
      }}
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{contest.name}</CardTitle>
            <CardDescription>
              {new Date(contest.start_date).toLocaleDateString()} - {new Date(contest.end_date).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{contest.description}</p>
            <p className="text-sm">Status: {contest.status}</p>
            <p className="text-sm">Created by: {contest.created_by_name}</p>
          </CardContent>
          <CardFooter>
            {isContestAdministrator && (
              <>
                <Button onClick={() => setIsEditing(true)}>Edit Contest</Button>
                <Button variant="destructive" onClick={handleDeleteContest} className="ml-2">Delete Contest</Button>
              </>
            )}
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contest Tasks</CardTitle>
            {isContestAdministrator && (
              <Button onClick={() => setIsAddingTask(true)}>Add Task</Button>
            )}
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Use the centralized task reporting system on the dashboard to update your progress for these tasks.
            </p>
            {contestTasks.map(task => (
              <div key={task.id} className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium">{task.name}</p>
                  <span className="text-sm text-muted-foreground">
                    {task.current_progress} / {task.goal_number} {task.type}
                  </span>
                </div>
                <Progress value={(task.current_progress / task.goal_number) * 100} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            {contest.teams.map((team, index) => (
              <div key={team.id} className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <p className="font-medium">{index + 1}. {team.name}</p>
                    <p className="text-sm text-muted-foreground">{team.company}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{team.completed_tasks} tasks completed</p>
                    <p className="text-xs text-muted-foreground">{team.team_size} members</p>
                  </div>
                </div>
                <Progress value={(team.completed_tasks / Math.max(team.completed_tasks, 1)) * 100} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Contest</DialogTitle>
              <DialogDescription>
                Make changes to the contest details here. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="name" className="text-right">Name</label>
                  <Input id="name" name="name" defaultValue={contest.name} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="description" className="text-right">Description</label>
                  <Textarea id="description" name="description" defaultValue={contest.description} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="startDate" className="text-right">Start Date</label>
                  <Input id="startDate" name="startDate" type="date" defaultValue={contest.start_date.split('T')[0]} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="endDate" className="text-right">End Date</label>
                  <Input id="endDate" name="endDate" type="date" defaultValue={contest.end_date.split('T')[0]} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right">Teams</label>
                  <div className="col-span-3">
                    <TeamSearch onTeamsSelected={setSelectedTeams} initialSelectedTeams={selectedTeams} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save changes</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Contest Task</DialogTitle>
              <DialogDescription>
                Create a new task for this contest. All teams will be assigned this task.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddTask}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="name" className="text-right">Name</label>
                  <Input id="name" name="name" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="description" className="text-right">Description</label>
                  <Textarea id="description" name="description" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="type" className="text-right">Type</label>
                  <Select name="type" required>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select task type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Exercise">Exercise</SelectItem>
                      <SelectItem value="Water">Water</SelectItem>
                      <SelectItem value="Sleep">Sleep</SelectItem>
                      <SelectItem value="Steps">Steps</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="goalNumber" className="text-right">Goal Number</label>
                  <Input type="number" id="goalNumber" name="goalNumber" className="col-span-3" required />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Add Task</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </ErrorBoundary>
  )
}

