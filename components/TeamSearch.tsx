'use client'

import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

interface Team {
  id: number
  name: string
  company: string
}

interface TeamSearchProps {
  onTeamsSelected: (selectedTeams: number[]) => void
  initialSelectedTeams?: number[]
}

export function TeamSearch({ onTeamsSelected, initialSelectedTeams = [] }: TeamSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeams, setSelectedTeams] = useState<number[]>(initialSelectedTeams)

  useEffect(() => {
    const searchTeams = async () => {
      try {
        const response = await fetch(`/api/contests?search=${encodeURIComponent(searchTerm)}`)
        if (!response.ok) {
          throw new Error('Failed to search teams')
        }
        const data = await response.json()
        setTeams(data)
      } catch (error) {
        console.error('Error searching teams:', error)
      }
    }

    if (searchTerm) {
      searchTeams()
    } else {
      setTeams([])
    }
  }, [searchTerm])

  const handleTeamToggle = (teamId: number) => {
    setSelectedTeams(prev => 
      prev.includes(teamId) 
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    )
  }

  useEffect(() => {
    onTeamsSelected(selectedTeams)
  }, [selectedTeams, onTeamsSelected])

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-8"
          placeholder="Search teams..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        {teams.map(team => (
          <div key={team.id} className="flex items-center space-x-2">
            <Checkbox
              id={`team-${team.id}`}
              checked={selectedTeams.includes(team.id)}
              onCheckedChange={() => handleTeamToggle(team.id)}
            />
            <label htmlFor={`team-${team.id}`} className="text-sm">
              {team.name} - {team.company}
            </label>
          </div>
        ))}
      </div>
    </div>
  )
}

