'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bell, HelpCircle, Settings, LogOut, Plus, ChevronDown } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Dummy data for demonstration
const teams = [
  { id: 1, name: "Team Alpha", company: "TechCorp", progress: 75 },
  { id: 2, name: "Fitness Fanatics", company: "HealthInc", progress: 60 },
]

const tasks = [
  { id: 1, name: "30 minutes of exercise", progress: 80, type: "personal" },
  { id: 2, name: "Drink 8 glasses of water", progress: 50, type: "personal" },
  { id: 3, name: "Team step challenge", progress: 70, type: "team" },
]

const badges = [
  { id: 1, name: "Early Bird", description: "Completed morning workout for 7 days", type: "personal" },
  { id: 2, name: "Hydration Hero", description: "Drank 8 glasses of water daily for a month", type: "personal" },
  { id: 3, name: "Team Spirit", description: "Contributed to all team goals for a week", type: "team" },
]

export default function Dashboard() {
  const [userTasks, setUserTasks] = useState(tasks)

  const addTask = (taskName: string) => {
    const newTask = {
      id: userTasks.length + 1,
      name: taskName,
      progress: 0,
      type: "personal"
    }
    setUserTasks([...userTasks, newTask])
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 hidden md:flex">
            <Link className="mr-6 flex items-center space-x-2" href="/">
              <span className="hidden font-bold sm:inline-block">Healthy Habit Tracker</span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/dashboard/teams">Teams</Link>
              <Link href="/dashboard/leaderboard">Leaderboard</Link>
              <Link href="/dashboard/badges">Badges</Link>
            </nav>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <nav className="flex items-center">
              <Button variant="ghost" size="icon">
                <Bell className="h-4 w-4" />
                <span className="sr-only">Notifications</span>
              </Button>
              <Button variant="ghost" size="icon">
                <HelpCircle className="h-4 w-4" />
                <span className="sr-only">Help</span>
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
                <span className="sr-only">Settings</span>
              </Button>
              <Button variant="ghost" size="icon">
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Log out</span>
              </Button>
            </nav>
          </div>
        </div>
      </header>
      <main className="container py-6">
        <h1 className="text-3xl font-bold tracking-tight mb-4">Dashboard</h1>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Your Teams</CardTitle>
            </CardHeader>
            <CardContent>
              {teams.map(team => (
                <div key={team.id} className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-medium">{team.name}</p>
                    <p className="text-sm text-muted-foreground">{team.company}</p>
                  </div>
                  <Progress value={team.progress} className="w-[60px]" />
                </div>
              ))}
            </CardContent>
            <CardFooter>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Join Team</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Join a Team</DialogTitle>
                    <DialogDescription>
                      Enter the team code to join. This request will need to be verified by the team manager.
                    </DialogDescription>
                  </DialogHeader>
                  <Input placeholder="Enter team code" />
                  <DialogFooter>
                    <Button type="submit">Join Team</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Create Team</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <Input placeholder="Team Name" />
                <Input placeholder="Company" />
                <Input placeholder="Preliminary Goals" />
              </form>
            </CardContent>
            <CardFooter>
              <Button>Create Team</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="personal">
                <TabsList>
                  <TabsTrigger value="personal">Personal</TabsTrigger>
                  <TabsTrigger value="team">Team</TabsTrigger>
                </TabsList>
                <TabsContent value="personal">
                  {userTasks.filter(task => task.type === 'personal').map(task => (
                    <div key={task.id} className="mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium">{task.name}</p>
                        <span className="text-sm text-muted-foreground">{task.progress}%</span>
                      </div>
                      <Progress value={task.progress} />
                    </div>
                  ))}
                </TabsContent>
                <TabsContent value="team">
                  {userTasks.filter(task => task.type === 'team').map(task => (
                    <div key={task.id} className="mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium">{task.name}</p>
                        <span className="text-sm text-muted-foreground">{task.progress}%</span>
                      </div>
                      <Progress value={task.progress} />
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Task
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Task</DialogTitle>
                    <DialogDescription>
                      Create a new personal task to track your progress.
                    </DialogDescription>
                  </DialogHeader>
                  <Input placeholder="Task Name" id="taskName" />
                  <DialogFooter>
                    <Button type="submit" onClick={() => {
                      const taskName = (document.getElementById('taskName') as HTMLInputElement).value
                      if (taskName) {
                        addTask(taskName)
                      }
                    }}>Add Task</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teams.map((team, index) => (
                  <div key={team.id} className="flex items-center">
                    <span className="font-bold mr-2">{index + 1}.</span>
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={`https://avatar.vercel.sh/${team.name}`} alt={team.name} />
                      <AvatarFallback>{team.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="ml-3">
                      <p className="text-sm font-medium leading-none">{team.name}</p>
                      <p className="text-sm text-muted-foreground">{team.company}</p>
                    </div>
                    <div className="ml-auto font-medium">{team.progress}%</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Badges</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {badges.map(badge => (
                  <div key={badge.id} className="flex items-start space-x-4">
                    <Avatar>
                      <AvatarImage src={`https://avatar.vercel.sh/${badge.name}`} />
                      <AvatarFallback>{badge.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{badge.name}</p>
                      <p className="text-sm text-muted-foreground">{badge.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

