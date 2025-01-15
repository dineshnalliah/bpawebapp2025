import { notFound } from 'next/navigation'
import { getUser } from '@/lib/auth'
import ContestDashboard from './contest-dashboard'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default async function ContestPage({ params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user) {
    notFound()
  }

  try {
    return <ContestDashboard contestId={params.id} currentUser={user} />
  } catch (error) {
    console.error('Error rendering ContestDashboard:', error)
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>An unexpected error occurred. Please try again later.</AlertDescription>
      </Alert>
    )
  }
}

