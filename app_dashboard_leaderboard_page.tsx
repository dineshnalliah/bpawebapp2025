'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from 'next/link'
import { Bell, HelpCircle, Settings, LogOut } from 'lucide-react'
import { Button } from "@/components/ui/button"

// Dummy data for demonstration
const teams = [
  { id: 1, name: "Team Alpha", company: "TechCorp", score: 1250, progress: 75 },
  { id: 2, name: "Fitness Fanatics", company: "HealthInc", score: 1100, progress: 60 },
  { id: 3, name: "Wellness Warriors", company: "FitnessCo", score: 1300, progress: 80 },
  { id: 4, name: "Health Heroes", company: "WellnessCorp", score: 950, progress: 45 },
]

const individuals = [
  { id: 1, name: "John Doe", team: "Team Alpha", score: 450, progress: 85 },
  { id: 2, name: "Jane Smith", team: "Fitness Fanatics", score: 425, progress: 70 },
  { id: 3, name: "Mike Johnson", team: "Wellness Warriors", score: 475, progress: 90 },
  { id: 4, name: "Emily Brown", team: "Health Heroes", score: 400, progress: 65 },
]

export default function LeaderboardPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredTeams = teams.filter(team => 
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.company.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredIndividuals = individuals.filter(individual => 
    individual.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    individual.team.toLowerCase().includes(searchTerm.toLowerCase())
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
        <h1 className="text-3xl font-bold tracking-tight mb-6">Leaderboard</h1>

        <div className="mb-6">
          <div className="relative max-w-sm">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Search teams or individuals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Tabs defaultValue="teams">
          <TabsList>
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="individuals">Individuals</TabsTrigger>
          </TabsList>
          <TabsContent value="teams">
            <Card>
              <CardHeader>
                <CardTitle>Team Rankings</CardTitle>
                <CardDescription>See how teams are performing in the challenge</CardDescription>
              </CardHeader>
              <CardContent>
                {filteredTeams.map((team, index) => (
                  <div key={team.id} className="flex items-center space-x-4 mb-4">
                    <span className="font-bold text-2xl w-8">{index + 1}</span>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={`https://avatar.vercel.sh/${team.name}`} alt={team.name} />
                      <AvatarFallback>{team.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{team.name}</p>
                      <p className="text-sm text-muted-foreground">{team.company}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{team.score} pts</p>
                      <Progress value={team.progress} className="h-2 w-20" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="individuals">
            <Card>
              <CardHeader>
                <CardTitle>Individual Rankings</CardTitle>
                <CardDescription>See how individuals are performing in the challenge</CardDescription>
              </CardHeader>
              <CardContent>
                {filteredIndividuals.map((individual, index) => (
                  <div key={individual.id} className="flex items-center space-x-4 mb-4">
                    <span className="font-bold text-2xl w-8">{index + 1}</span>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={`https://avatar.vercel.sh/${individual.name}`} alt={individual.name} />
                      <AvatarFallback>{individual.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{individual.name}</p>
                      <p className="text-sm text-muted-foreground">{individual.team}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{individual.score} pts</p>
                      <Progress value={individual.progress} className="h-2 w-20" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

