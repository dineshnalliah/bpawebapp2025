'use client'

import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

interface TeamLeaderboard {
  id: number;
  name: string;
  company: string;
  badge_count: number;
  goals_completed: number;
}

interface IndividualLeaderboard {
  id: number;
  name: string;
  team_name: string;
  badge_count: number;
  tasks_completed: number;
}

export default function LeaderboardPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [teams, setTeams] = useState<TeamLeaderboard[]>([])
  const [individuals, setIndividuals] = useState<IndividualLeaderboard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLeaderboards = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch('/api/leaderboards')
        if (!response.ok) {
          throw new Error('Failed to fetch leaderboards')
        }
        const data = await response.json()
        setTeams(data.teams)
        setIndividuals(data.individuals)
      } catch (error) {
        console.error('Error fetching leaderboards:', error)
        setError('Failed to load leaderboards. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchLeaderboards()
  }, [])

  const filteredTeams = teams.filter(team => 
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.company.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredIndividuals = individuals.filter(individual => 
    individual.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    individual.team_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return <div>Loading leaderboards...</div>
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
                    <p className="font-medium">{team.badge_count} badges</p>
                    <p className="text-sm text-muted-foreground">{team.goals_completed} goals completed</p>
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
                    <p className="text-sm text-muted-foreground">{individual.team_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{individual.tasks_completed} tasks completed</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  )
}

