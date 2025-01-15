'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Activity, BarChart2, Users, Award } from 'lucide-react'

export default function Home() {
  const router = useRouter()

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-primary text-primary-foreground py-4">
        <div className="container mx-auto flex justify-between items-center px-4">
          <div className="flex items-center space-x-2">
            <Activity className="h-6 w-6" />
            <span className="text-xl font-bold">Healthy Habit Tracker</span>
          </div>
          <nav>
            <ul className="flex space-x-4">
              <li><Link href="/about" className="hover:underline">About</Link></li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="flex-grow">
        <section className="bg-gradient-to-b from-primary to-primary-foreground text-white py-20">
          <div className="container mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">Build Healthy Habits Together</h1>
            <p className="text-xl mb-8">Track, compete, and achieve your health goals as a team</p>
            <div className="flex justify-center space-x-4">
              <Button asChild variant="default" size="lg">
                <Link href="/auth/signin">Sign In</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/auth/signup">Register</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-16 bg-background">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose Healthy Habit Tracker?</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <FeatureCard 
                icon={<Activity className="h-12 w-12 mb-4 text-primary" />}
                title="Habit Tracking"
                description="Set and track daily, weekly, or monthly goals for various health habits."
              />
              <FeatureCard 
                icon={<BarChart2 className="h-12 w-12 mb-4 text-primary" />}
                title="Progress Visualization"
                description="View your progress over time with intuitive charts and graphs."
              />
              <FeatureCard 
                icon={<Users className="h-12 w-12 mb-4 text-primary" />}
                title="Team Building"
                description="Compete with other teams and foster workplace camaraderie."
              />
              <FeatureCard 
                icon={<Award className="h-12 w-12 mb-4 text-primary" />}
                title="Rewards & Badges"
                description="Earn digital badges for your team's achievements and milestones."
              />
            </div>
          </div>
        </section>

        <section className="py-16 bg-muted">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8">Join as a Team Member, Team Manager, or Contest Administrator</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <RoleCard
                title="Team Member"
                description="Join a team, track your habits, and contribute to your team's success. Participate in challenges and earn badges for your achievements."
              />
              <RoleCard
                title="Team Manager"
                description="Create and manage teams, set team goals, and motivate your members. Monitor team progress and compete against other teams in your organization."
              />
              <RoleCard
                title="Contest Administrator"
                description="Organize company-wide contests, set up challenges, and oversee the entire program. Manage teams and track overall company health improvements."
              />
            </div>
            <div className="mt-8">
              <Button asChild variant="default" size="lg">
                <Link href="/auth/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-primary text-primary-foreground py-8">
        <div className="container mx-auto text-center">
          <p>&copy; {new Date().getFullYear()} Healthy Habit Tracker. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-card text-card-foreground p-6 rounded-lg shadow-md text-center">
      {icon}
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p>{description}</p>
    </div>
  )
}

function RoleCard({ title, description }) {
  return (
    <div className="bg-card text-card-foreground p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p>{description}</p>
    </div>
  )
}

