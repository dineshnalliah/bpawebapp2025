'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface TeamPageContentProps {
  teamId: string
  role?: string
  currentUser: {
    id: number
    role: string
  }
}

interface TeamData {
  id: number
  name: string
  description: string
  company: string
  avatar_url: string
  created_at: string
  creator_name: string
  code: string
  members: Array<{
    id: number
    name: string
    role: string
    total_tasks: number
    completed_tasks: number
  }>
  progress: Array<{
    name: string
    target_value: number
    current_value: number
    unit: string
  }>
  contests: Array<{
    id: number
    name: string
    ranking: number
    score: number
    start_date: string
    end_date: string
  }>
}

export default function TeamPageContent({ teamId: teamIdProp, role = 'member', currentUser }: TeamPageContentProps) {
  const router = useRouter()
  const [teamData, setTeamData] = useState<TeamData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isInviting, setIsInviting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { id: teamId } = useParams()
  const [contestTasks, setContestTasks] = useState<Array<{
    id: number
    name: string
    description: string
    type: string
    goal_number: number
    current_progress: number
  }>>([])

  useEffect(() => {
    const fetchTeamData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/teams/${teamId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch team data')
        }
        const data = await response.json()
        setTeamData(data)
      } catch (error) {
        console.error('Error fetching team data:', error)
        setError('Failed to load team data. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTeamData()
  }, [teamId])

  useEffect(() => {
    const fetchContestTasks = async () => {
      try {
        const response = await fetch(`/api/teams/${teamId}/contest-tasks`)
        if (!response.ok) {
          throw new Error('Failed to fetch contest tasks')
        }
        const data = await response.json()
        setContestTasks(data)
      } catch (error) {
        console.error('Error fetching contest tasks:', error)
        setError('Failed to load contest tasks. Please try again later.')
      }
    }

    fetchContestTasks()
  }, [teamId])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!canEdit) {
      setError("You don't have permission to edit team details.");
      return;
    }
    try {
      const formData = new FormData(e.currentTarget);
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.get('name'),
          description: formData.get('description'),
          company: formData.get('company'),
          avatar_url: formData.get('avatar_url'),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update team data');
      }

      const updatedData = await response.json();
      setTeamData(prevData => ({ ...prevData, ...updatedData }));
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating team data:', error);
      setError('Failed to update team data. Please try again.');
    }
  };

  const handleInviteMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    try {
      const formData = new FormData(e.currentTarget)
      const response = await fetch(`/api/teams/${teamId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.get('email'),
          role: formData.get('role'),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to invite member')
      }

      setIsInviting(false)
      setError('Invitation sent successfully!')
    } catch (error) {
      console.error('Error inviting member:', error)
      setError(error.message || 'Failed to invite member. Please try again.')
    }
  }

  const handleRemoveMember = async (memberId: number) => {
    setError(null)
    try {
      const response = await fetch(`/api/teams/${teamId}/members`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memberId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to remove member')
      }

      // Refresh team data to reflect member removal
      const updatedTeamResponse = await fetch(`/api/teams/${teamId}`)
      const updatedTeamData = await updatedTeamResponse.json()
      setTeamData(updatedTeamData)
    } catch (error) {
      console.error('Error removing member:', error)
      setError('Failed to remove member. Please try again.')
    }
  }

  const handleDeleteTeam = async () => {
    if (!confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
      return;
    }
    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete team');
      }

      router.push('/dashboard');
    } catch (error) {
      console.error('Error deleting team:', error);
      setError('Failed to delete team. Please try again.');
    }
  };

  const handleLeaveTeam = async () => {
    if (!confirm('Are you sure you want to leave this team?')) {
      return;
    }
    try {
      const response = await fetch(`/api/teams/${teamId}/leave`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to leave team');
      }

      router.push('/dashboard');
    } catch (error) {
      console.error('Error leaving team:', error);
      setError('Failed to leave team. Please try again.');
    }
  };

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (error) {
    return (
      <Alert variant={error.includes('successfully') ? "default" : "destructive"}>
        <AlertTitle>{error.includes('successfully') ? "Success" : "Error"}</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!teamData) {
    return <div>Team not found</div>
  }

  const isTeamCaptain = role === 'captain';
  const isTeamManager = currentUser.role === 'team_manager';
  const isContestAdministrator = currentUser.role === 'contest_administrator';
  const canEdit = isTeamCaptain || isTeamManager || isContestAdministrator;
  const isMember = role === 'member';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={teamData.avatar_url || `https://avatar.vercel.sh/${teamData.name}`} />
              <AvatarFallback>{teamData.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{teamData.name}</CardTitle>
              <CardDescription>{teamData.company}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{teamData.description}</p>
          <p className="text-sm mt-2">Team Code: <span className="font-mono bg-muted p-1 rounded">{teamData.code}</span></p>
          <p className="text-sm">Created on: {new Date(teamData.created_at).toLocaleDateString()}</p>
          <p className="text-sm">Created by: {teamData.creator_name || 'Unknown'}</p>
        </CardContent>
        <CardFooter className="flex justify-between">
          {canEdit && (
            <Button onClick={() => setIsEditing(true)}>Edit Team Details</Button>
          )}
          {isTeamCaptain && (
            <Button variant="destructive" onClick={handleDeleteTeam}>Delete Team</Button>
          )}
          {(isMember || isTeamCaptain) && (
            <Button variant="secondary" onClick={handleLeaveTeam}>Leave Team</Button>
          )}
        </CardFooter>
      </Card>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team Details</DialogTitle>
            <DialogDescription>
              Make changes to your team information here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="name" className="text-right">Name</label>
                <Input id="name" name="name" defaultValue={teamData.name} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="company" className="text-right">Company</label>
                <Input id="company" name="company" defaultValue={teamData.company} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="description" className="text-right">Description</label>
                <Textarea id="description" name="description" defaultValue={teamData.description} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="avatar_url" className="text-right">Avatar URL</label>
                <Input id="avatar_url" name="avatar_url" defaultValue={teamData.avatar_url} className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="progress">Team Progress</TabsTrigger>
          <TabsTrigger value="contests">Contests</TabsTrigger>
          <TabsTrigger value="contest-tasks">Contest Tasks</TabsTrigger>
        </TabsList>
        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              {canEdit && (
                <Button onClick={() => setIsInviting(true)}>Invite Member</Button>
              )}
            </CardHeader>
            <CardContent>
              {teamData.members.map(member => (
                <div key={member.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={`https://avatar.vercel.sh/${member.name}`} />
                      <AvatarFallback>{member.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground capitalize">{member.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{member.completed_tasks} / {member.total_tasks} tasks</p>
                    <Progress value={(member.completed_tasks / member.total_tasks) * 100} className="w-[100px]" />
                  </div>
                  {canEdit && member.id !== currentUser.id && (
                    <Button variant="outline" size="sm" onClick={() => handleRemoveMember(member.id)}>
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="progress">
          <Card>
            <CardHeader>
              <CardTitle>Team Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={teamData.progress}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="current_value" fill="#8884d8" name="Current" />
                  <Bar dataKey="target_value" fill="#82ca9d" name="Target" />
                </BarChart>
              </ResponsiveContainer>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={teamData.progress}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="current_value" stroke="#8884d8" name="Current" />
                  <Line type="monotone" dataKey="target_value" stroke="#82ca9d" name="Target" />
                </LineChart>
              </ResponsiveContainer>
              {teamData.progress.map(goal => (
                <div key={goal.name} className="mt-4">
                  <div className="flex justify-between mb-1">
                    <span>{goal.name}</span>
                    <span>{goal.current_value} / {goal.target_value} {goal.unit}</span>
                  </div>
                  <Progress value={(goal.current_value / goal.target_value) * 100} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="contests">
          <Card>
            <CardHeader>
              <CardTitle>Contest Participation</CardTitle>
            </CardHeader>
            <CardContent>
              {teamData.contests.map(contest => (
                <div key={contest.id} className="flex items-center justify-between py-2">
                  <Link href={`/dashboard/contests/${contest.id}`} className="font-medium hover:underline">
                    {contest.name}
                  </Link>
                  <div className="text-right">
                    <p className="text-sm font-medium">Rank: {contest.ranking}</p>
                    <p className="text-sm text-muted-foreground">Score: {contest.score}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(contest.start_date).toLocaleDateString()} - {new Date(contest.end_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="contest-tasks">
          <Card>
            <CardHeader>
              <CardTitle>Team Tasks</CardTitle>
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
        </TabsContent>
      </Tabs>

      <Dialog open={isInviting} onOpenChange={setIsInviting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Enter the email address of the person you want to invite to the team.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInviteMember}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="email" className="text-right">Email</label>
                <Input id="email" name="email" type="email" className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="role" className="text-right">Role</label>
                <Select name="role" required>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="captain">Captain</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Invite Member</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

