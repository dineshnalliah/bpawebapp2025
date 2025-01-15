'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"

interface Contest {
  id: number
  name: string
  description: string
  start_date: string
  end_date: string
  status: string
  team_ids: number[]
  team_names: string[]
}

export default function ContestsPage() {
  const [contests, setContests] = useState<Contest[]>([])
  const [teams, setTeams] = useState([])
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingContestId, setEditingContestId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchContests()
    fetchTeams()
  }, [])

  const fetchContests = async () => {
    try {
      const response = await fetch('/api/contests')
      if (!response.ok) {
        throw new Error('Failed to fetch contests')
      }
      const data = await response.json()
      setContests(data)
    } catch (error) {
      console.error('Error fetching contests:', error)
      setError('Failed to load contests. Please try again later.')
    }
  }

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams')
      if (!response.ok) {
        throw new Error('Failed to fetch teams')
      }
      const data = await response.json()
      setTeams(data)
    } catch (error) {
      console.error('Error fetching teams:', error)
      setError('Failed to load teams. Please try again later.')
    }
  }

  const handleCreateContest = async (formData: FormData) => {
    try {
      const response = await fetch('/api/contests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.get('name'),
          description: formData.get('description'),
          startDate: formData.get('startDate'),
          endDate: formData.get('endDate'),
          teamIds: Array.from(formData.getAll('teamIds')).map(Number),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create contest')
      }

      await fetchContests()
      setIsCreating(false)
    } catch (error) {
      console.error('Error creating contest:', error)
      setError('Failed to create contest. Please try again.')
    }
  }

  const handleUpdateContest = async (formData: FormData) => {
    try {
      const response = await fetch('/api/contests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingContestId,
          name: formData.get('name'),
          description: formData.get('description'),
          startDate: formData.get('startDate'),
          endDate: formData.get('endDate'),
          teamIds: Array.from(formData.getAll('teamIds')).map(Number),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update contest')
      }

      await fetchContests()
      setIsEditing(false)
      setEditingContestId(null)
    } catch (error) {
      console.error('Error updating contest:', error)
      setError('Failed to update contest. Please try again.')
    }
  }

  const handleDeleteContest = async (contestId: number) => {
    try {
      const response = await fetch(`/api/contests?id=${contestId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete contest')
      }

      await fetchContests()
    } catch (error) {
      console.error('Error deleting contest:', error)
      setError('Failed to delete contest. Please try again.')
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Contests</h1>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button onClick={() => setIsCreating(true)} className="mb-4">
        <Plus className="mr-2 h-4 w-4" /> Create New Contest
      </Button>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {contests.map((contest) => (
          <Card key={contest.id}>
            <CardHeader>
              <CardTitle>{contest.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">{contest.description}</p>
              <p className="text-sm">Start Date: {new Date(contest.start_date).toLocaleDateString()}</p>
              <p className="text-sm">End Date: {new Date(contest.end_date).toLocaleDateString()}</p>
              <p className="text-sm">Status: {contest.status}</p>
              <p className="text-sm">Teams: {contest.team_names.join(', ')}</p>
              <div className="flex space-x-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => {
                  setEditingContestId(contest.id)
                  setIsEditing(true)
                }}>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDeleteContest(contest.id)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isCreating || isEditing} onOpenChange={(open) => {
        if (!open) {
          setIsCreating(false)
          setIsEditing(false)
          setEditingContestId(null)
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Contest' : 'Create New Contest'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update the contest details below.' : 'Enter the details for the new contest.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.target as HTMLFormElement)
            if (isEditing) {
              handleUpdateContest(formData)
            } else {
              handleCreateContest(formData)
            }
          }}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="name" className="text-right">Name</label>
                <Input id="name" name="name" defaultValue={isEditing ? contests.find(c => c.id === editingContestId)?.name : ''} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="description" className="text-right">Description</label>
                <Textarea id="description" name="description" defaultValue={isEditing ? contests.find(c => c.id === editingContestId)?.description : ''} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="startDate" className="text-right">Start Date</label>
                <Input id="startDate" name="startDate" type="date" defaultValue={isEditing ? contests.find(c => c.id === editingContestId)?.start_date.split('T')[0] : ''} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="endDate" className="text-right">End Date</label>
                <Input id="endDate" name="endDate" type="date" defaultValue={isEditing ? contests.find(c => c.id === editingContestId)?.end_date.split('T')[0] : ''} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right">Teams</label>
                <div className="col-span-3">
                  {teams.map(team => (
                    <div key={team.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`team-${team.id}`}
                        name="teamIds"
                        value={team.id}
                        defaultChecked={isEditing ? contests.find(c => c.id === editingContestId)?.team_ids.includes(team.id) : false}
                      />
                      <label htmlFor={`team-${team.id}`}>{team.name}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">{isEditing ? 'Update Contest' : 'Create Contest'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

