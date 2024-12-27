'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import Link from 'next/link'
import { Bell, HelpCircle, Settings, LogOut } from 'lucide-react'
import { Button } from "@/components/ui/button"

// Dummy data for demonstration
const personalBadges = [
  { id: 1, name: "Early Bird", description: "Completed morning workout for 7 days", earned: true },
  { id: 2, name: "Hydration Hero", description: "Drank 8 glasses of water daily for a month", earned: true },
  { id: 3, name: "Step Master", description: "Reached 10,000 steps for 30 consecutive days", earned: false },
  { id: 4, name: "Nutrition Ninja", description: "Logged all meals for 2 weeks straight", earned: true },
]

const teamBadges = [
  { id: 1, name: "Team Spirit", description: "All team members completed their goals for a week", earned: true },
  { id: 2, name: "Synergy Surge", description: "Team completed a group challenge", earned: true },
  { id: 3, name: "Leaderboard Legends", description: "Team held the top spot for 2 weeks", earned: false },
]

const companyBadges = [
  { id: 1, name: "Wellness Champion", description: "Company-wide participation rate above 90%", earned: true },
  { id: 2, name: "Health Innovator", description: "Implemented 5 new wellness initiatives", earned: false },
]

export default function BadgesPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const filterBadges = (badges: typeof personalBadges) => 
    badges.filter(badge => 
      badge.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      badge.description.toLowerCase().includes(searchTerm.toLowerCase())
    )

  const filteredPersonalBadges = filterBadges(personalBadges)
  const filteredTeamBadges = filterBadges(teamBadges)
  const filteredCompanyBadges = filterBadges(companyBadges)

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
        <h1 className="text-3xl font-bold tracking-tight mb-6">Badges</h1>

        <div className="mb-6">
          <div className="relative max-w-sm">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Search badges..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Tabs defaultValue="personal">
          <TabsList>
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="company">Company</TabsTrigger>
          </TabsList>
          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle>Personal Badges</CardTitle>
                <CardDescription>Badges earned through individual achievements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredPersonalBadges.map(badge => (
                    <div key={badge.id} className="flex items-start space-x-4">
                      <Avatar className="mt-1">
                        <AvatarImage src={`https://avatar.vercel.sh/${badge.name}`} />
                        <AvatarFallback>{badge.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">{badge.name}</h3>
                          {badge.earned ? (
                            <Badge variant="secondary">Earned</Badge>
                          ) : (
                            <Badge variant="outline">Not Earned</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{badge.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="team">
            <Card>
              <CardHeader>
                <CardTitle>Team Badges</CardTitle>
                <CardDescription>Badges earned through team achievements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredTeamBadges.map(badge => (
                    <div key={badge.id} className="flex items-start space-x-4">
                      <Avatar className="mt-1">
                        <AvatarImage src={`https://avatar.vercel.sh/${badge.name}`} />
                        <AvatarFallback>{badge.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">{badge.name}</h3>
                          {badge.earned ? (
                            <Badge variant="secondary">Earned</Badge>
                          ) : (
                            <Badge variant="outline">Not Earned</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{badge.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="company">
            <Card>
              <CardHeader>
                <CardTitle>Company Badges</CardTitle>
                <CardDescription>Badges earned through company-wide achievements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredCompanyBadges.map(badge => (
                    <div key={badge.id} className="flex items-start space-x-4">
                      <Avatar className="mt-1">
                        <AvatarImage src={`https://avatar.vercel.sh/${badge.name}`} />
                        <AvatarFallback>{badge.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">{badge.name}</h3>
                          {badge.earned ? (
                            <Badge variant="secondary">Earned</Badge>
                          ) : (
                            <Badge variant="outline">Not Earned</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{badge.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

