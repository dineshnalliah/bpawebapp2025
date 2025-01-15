import { notFound } from 'next/navigation'
import { getUser } from '@/lib/auth'
import UserProfileContent from './user-profile-content'

export default async function UserProfilePage({ params }: { params: { id: string } }) {
  const currentUser = await getUser()
  if (!currentUser) {
    notFound()
  }

  return <UserProfileContent userId={params.id} currentUser={currentUser} />
}

