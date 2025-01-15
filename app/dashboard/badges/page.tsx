'use client'

import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"

interface BadgeType {
  id: number
  name: string
  description: string
  image_url: string
  earned_at: string | null
  progress: number
  requirement: {
    type: string
    count: number
  }
}

export default function BadgesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [badges, setBadges] = useState<BadgeType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBadges = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch('/api/badges')
        if (!response.ok) {
          throw new Error('Failed to fetch badges')
        }
        const data = await response.json()
        setBadges(data)
      } catch (error) {
        console.error('Error fetching badges:', error)
        setError('Failed to load badges. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBadges()
  }, [])

  const filterBadges = (badges: BadgeType[]) => 
    badges.filter(badge => 
      badge.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      badge.description.toLowerCase().includes(searchTerm.toLowerCase())
    )

  const earnedBadges = badges.filter(badge => badge.earned_at || badge.progress >= 100)
  const unearnedBadges = badges.filter(badge => !badge.earned_at && badge.progress < 100)

  if (isLoading) {
    return <div>Loading badges...</div>
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

      <Tabs defaultValue="earned">
        <TabsList>
          <TabsTrigger value="earned">Earned</TabsTrigger>
          <TabsTrigger value="unearned">Unearned</TabsTrigger>
        </TabsList>
        <TabsContent value="earned">
          <Card>
            <CardHeader>
              <CardTitle>Earned Badges</CardTitle>
              <CardDescription>Badges you have earned through your achievements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {filterBadges(earnedBadges).map(badge => (
                  <div key={badge.id} className="flex items-start space-x-4">
                    <Avatar className="mt-1">
                      <AvatarImage src={badge.image_url || `https://avatar.vercel.sh/${badge.name}`} />
                      <AvatarFallback>{badge.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{badge.name}</h3>
                        <Badge variant="secondary">Earned</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{badge.description}</p>
                      {badge.earned_at ? (
                        <p className="text-xs text-muted-foreground mt-1">
                          Earned on: {new Date(badge.earned_at).toLocaleDateString()}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-1">
                          Newly earned! Congratulations!
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="unearned">
          <Card>
            <CardHeader>
              <CardTitle>Unearned Badges</CardTitle>
              <CardDescription>Badges you can still earn</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {filterBadges(unearnedBadges).map(badge => (
                  <div key={badge.id} className="flex items-start space-x-4">
                    <Avatar className="mt-1">
                      <AvatarImage src={badge.image_url || `https://avatar.vercel.sh/${badge.name}`} />
                      <AvatarFallback>{badge.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{badge.name}</h3>
                        <Badge variant="outline">Not Earned</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{badge.description}</p>
                      <div className="mt-2">
                        <Progress value={badge.progress} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          Progress: {Math.round(badge.progress)}% ({badge.requirement.count - Math.floor(badge.progress / 100 * badge.requirement.count)} {badge.requirement.type} tasks remaining)
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  )
}

