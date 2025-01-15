import Link from 'next/link'
import { Settings, User, BarChart2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { getUser } from '@/lib/auth'
import LogoutButton from '@/components/LogoutButton'
import { Notifications } from '@/components/Notifications'

export default async function DashboardLayout({
children,
}: {
children: React.ReactNode
}) {
const user = await getUser()

return (
  <div className="min-h-screen bg-background">
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link className="mr-6 flex items-center space-x-2" href="/dashboard">
            <span className="hidden font-bold sm:inline-block">Healthy Habit Tracker</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/dashboard/leaderboard">Leaderboard</Link>
            <Link href="/dashboard/badges">Badges</Link>
            <Link href="/dashboard/analytics">Analytics</Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center">
            <Notifications />
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard/analytics">
                <BarChart2 className="h-4 w-4" />
                <span className="sr-only">Analytics</span>
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard/settings">
                <Settings className="h-4 w-4" />
                <span className="sr-only">Settings</span>
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/profile/${user?.id}`}>
                <User className="h-4 w-4" />
                <span className="sr-only">Profile</span>
              </Link>
            </Button>
            <LogoutButton />
          </nav>
        </div>
      </div>
    </header>
    <main className="container py-6">
      {children}
    </main>
  </div>
)
}

