import { notFound } from 'next/navigation'
import { getUser } from '@/lib/auth'
import TeamPageContent from './team-page-content'

export default async function TeamRolePage({ params }: { params: { id: string, role?: string } }) {
  const user = await getUser()
  if (!user) {
    notFound()
  }

  // If role is undefined, set it to 'member' as a default
  const role = params.role || 'member'

  return <TeamPageContent teamId={params.id} role={role} currentUser={user} />
}

