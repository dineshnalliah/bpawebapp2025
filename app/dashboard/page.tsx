import { redirect } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import DashboardContent from './dashboard-content'

export default async function DashboardPage() {
  const authenticated = await isAuthenticated()

  if (!authenticated) {
    redirect('/auth/signin')
  }

  return <DashboardContent />
}

