'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Bell, HelpCircle, Settings, LogOut } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
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
  { id: 1, name: "Team Alpha", company: "TechCorp", members: 5, progress: 75 },
  { id: 2, name: "Fitness Fanatics", company: "HealthInc", members: 4, progress: 60 },
  { id: 3, name: "Wellness Warriors", company: "FitnessCo", members: 6, progress: 80 },
  { id: 4, name: "Health Heroes", company: "WellnessCorp", members: 3, progress: 45 },
]

export default function TeamsPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredTeams = teams.filter(team => 
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.company.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Search teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Team
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create a New Team</DialogTitle>
                  <DialogDescription>
                    Fill in the details to create a new team. You'll be automatically assigned as the team captain.
                  </DialogDescription>
                </DialogHeader>
                <form className="space-y-4">
                  <Input placeholder="Team Name" />
                  <Input placeholder="Company" />
                  <Input placeholder="Initial Goal" />
                </form>
                <DialogFooter>
                  <Button type="submit">Create Team</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTeams.map(team => (
            <Card key={team.id}>
              <CardHeader>
                <CardTitle>{team.name}</CardTitle>
                <CardDescription>{team.company}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 mb-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={`https://avatar.vercel.sh/${team.name}`} alt={team.name} />
                    <AvatarFallback>{team.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{team.members} members</p>
                    <p className="text-sm text-muted-foreground">Team Progress</p>
                  </div>
                </div>
                <Progress value={team.progress} className="h-2" />
                <p className="mt-2 text-sm text-right">{team.progress}% complete</p>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href={`/dashboard/teams/${team.id}`}>View Team</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}

