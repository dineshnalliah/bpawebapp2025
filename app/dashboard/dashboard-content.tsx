'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Users, Trophy, Award } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { TeamSearch } from "@/components/TeamSearch"
import { TaskReporter } from "@/components/TaskReporter"
import { JoinTeamDialog } from '@/components/JoinTeamDialog'
import { PersonalTasks } from '@/components/PersonalTasks'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ContestTasks } from '@/components/ContestTasks'

export default function DashboardContent() {
  const router = useRouter()
  const [teams, setTeams] = useState([])
  const [tasks, setTasks] = useState([])
  const [contests, setContests] = useState([])
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isCreatingContest, setIsCreatingContest] = useState(false)
  const [selectedTeams, setSelectedTeams] = useState([])

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [userRes, teamsRes, tasksRes, contestsRes] = await Promise.all([
        fetch('/api/user'),
        fetch('/api/teams'),
        fetch('/api/tasks'),
        fetch('/api/contests')
      ])

      if (!userRes.ok || !teamsRes.ok || !tasksRes.ok || !contestsRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const [userData, teamsData, tasksData, contestsData] = await Promise.all([
        userRes.json(),
        teamsRes.json(),
        tasksRes.json(),
        contestsRes.json()
      ])

      setUser(userData)
      setTeams(teamsData)
      setTasks(tasksData)
      setContests(contestsData)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setError('Failed to load data. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const createContest = async (contestData) => {
    try {
      const response = await fetch('/api/contests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contestData),
      })

      if (!response.ok) {
        throw new Error('Failed to create contest')
      }

      const newContest = await response.json()
      setContests([...contests, newContest])
      setIsCreatingContest(false)
      setSelectedTeams([])
    } catch (error) {
      console.error('Error creating contest:', error)
      setError('Failed to create contest. Please try again.')
    }
  }

  const initializeDatabase = async () => {
    try {
      const response = await fetch('/api/init-db', { method: 'POST' });
      if (!response.ok) {
        throw new Error('Failed to initialize database');
      }
      alert('Database initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
      alert('Failed to initialize database. Check the console for details.');
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

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Dashboard</h1>

      {process.env.NODE_ENV === 'development' && (
        <Button onClick={initializeDatabase} className="mb-4">
          Initialize Database
        </Button>
      )}

      {user?.role === 'contest_administrator' ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Your Contests</CardTitle>
            </CardHeader>
            <CardContent>
              {contests.length > 0 ? (
                contests.map(contest => (
                  <div key={contest.id} className="mb-4">
                    <Link href={`/dashboard/contests/${contest.id}`} className="font-medium hover:underline">
                      {contest.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {new Date(contest.start_date).toLocaleDateString()} - {new Date(contest.end_date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Status: {contest.status}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">You haven't created any contests yet.</p>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={() => setIsCreatingContest(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Contest
              </Button>
            </CardFooter>
          </Card>
        </>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Your Teams</CardTitle>
            </CardHeader>
            <CardContent>
              {teams.map(team => (
                <div key={team.id} className="mb-2">
                  <Link href={`/dashboard/teams/${team.id}/${user.role}`} className="font-medium hover:underline">
                    {team.name}
                  </Link>
                </div>
              ))}
            </CardContent>
            {user.role === 'team_manager' && (
              <CardFooter>
                <Button onClick={() => router.push('/dashboard/create-team')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Team
                </Button>
              </CardFooter>
            )}
          </Card>

          {user.role === 'team_member' && (
            <Card>
              <CardHeader>
                <CardTitle>Join a Team</CardTitle>
              </CardHeader>
              <CardContent>
                <JoinTeamDialog />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Current Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="contest">
                <TabsList>
                  <TabsTrigger value="contest">Contest Tasks</TabsTrigger>
                  <TabsTrigger value="personal">Personal Tasks</TabsTrigger>
                </TabsList>
                <TabsContent value="contest">
                  <ContestTasks />
                </TabsContent>
                <TabsContent value="personal">
                  <PersonalTasks />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Report Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <TaskReporter onTaskReport={async (taskType, goalNumber) => {
                try {
                  const response = await fetch('/api/tasks/report', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ taskType, goalNumber }),
                  });

                  if (!response.ok) {
                    throw new Error('Failed to report task');
                  }

                  const data = await response.json();
                  if (data.unlockedBadges && data.unlockedBadges.length > 0) {
                    // Show notification for unlocked badges
                    data.unlockedBadges.forEach(badge => {
                      // You can use a toast notification library here, or create a custom notification component
                      alert(`Congratulations! You've unlocked the "${badge.name}" badge!`);
                    });
                  }

                  // Refresh the dashboard data
                  fetchData();
                } catch (error) {
                  console.error('Error reporting task:', error);
                  setError('Failed to report task. Please try again.');
                }
              }} />
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={isCreatingContest} onOpenChange={(open) => setIsCreatingContest(open)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create a New Contest</DialogTitle>
            <DialogDescription>
              Enter the details to create a new contest.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.target as HTMLFormElement)
            createContest({
              name: formData.get('name'),
              description: formData.get('description'),
              startDate: formData.get('startDate'),
              endDate: formData.get('endDate'),
              teamIds: selectedTeams,
            })
          }}>
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
                <label htmlFor="startDate" className="text-right">Start Date</label>
                <Input id="startDate" name="startDate" type="date" className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="endDate" className="text-right">End Date</label>
                <Input id="endDate" name="endDate" type="date" className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right">Teams</label>
                <div className="col-span-3">
                  <TeamSearch onTeamsSelected={setSelectedTeams} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Create Contest</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

