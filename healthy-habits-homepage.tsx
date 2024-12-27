import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Heart, Trophy, Users, Target } from 'lucide-react';

const HomePage = () => {
  const [rememberMe, setRememberMe] = useState(false);

  const handleSignIn = (e) => {
    e.preventDefault();
    // Handle sign in logic here
    console.log('Signing in...');
  };

  const handleRegister = (e) => {
    e.preventDefault();
    // Handle registration logic here
    console.log('Registering...');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-400 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-4xl font-bold mb-4">Healthy Habit Team Tracker</h1>
            <p className="text-xl mb-8">Build healthy habits together, achieve more as a team</p>
            <div className="space-x-4">
              {/* Sign In Dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-white text-blue-600 hover:bg-gray-100">
                    Sign In
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Sign In</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="Enter your email" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input id="password" type="password" placeholder="Enter your password" required />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="remember" 
                        checked={rememberMe}
                        onCheckedChange={setRememberMe}
                      />
                      <Label htmlFor="remember">Remember me</Label>
                    </div>
                    <Button type="submit" className="w-full">Sign In</Button>
                  </form>
                </DialogContent>
              </Dialog>

              {/* Register Dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-white text-white hover:bg-blue-500">
                    Register
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Register</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reg-email">Email</Label>
                      <Input id="reg-email" type="email" placeholder="Enter your email" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-password">Password</Label>
                      <Input id="reg-password" type="password" placeholder="Enter your password" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <Input id="confirm-password" type="password" placeholder="Confirm your password" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Account Type</Label>
                      <RadioGroup defaultValue="team-member">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="team-member" id="team-member" />
                          <Label htmlFor="team-member">Team Member</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="team-captain" id="team-captain" />
                          <Label htmlFor="team-captain">Team Captain</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="admin" id="admin" />
                          <Label htmlFor="admin">Contest Administrator</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <Button type="submit" className="w-full">Register</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <Heart className="w-8 h-8 text-blue-500 mb-2" />
              <CardTitle>Habit Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              Set and track daily, weekly, or monthly goals for various healthy habits
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Trophy className="w-8 h-8 text-blue-500 mb-2" />
              <CardTitle>Team Competitions</CardTitle>
            </CardHeader>
            <CardContent>
              Compete with other teams and earn badges for reaching milestones
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="w-8 h-8 text-blue-500 mb-2" />
              <CardTitle>Team Building</CardTitle>
            </CardHeader>
            <CardContent>
              Foster workplace comradery through shared health goals
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Target className="w-8 h-8 text-blue-500 mb-2" />
              <CardTitle>Progress Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              Visualize your progress with interactive charts and graphs
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Account Types Section */}
      <div className="bg-gray-100 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Account Types</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-4 space-y-2">
                  <li>Add and modify personal goals</li>
                  <li>Track individual progress</li>
                  <li>Contribute to team achievements</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Team Captains</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-4 space-y-2">
                  <li>Set and modify team goals</li>
                  <li>Manage team settings</li>
                  <li>Verify team progress</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contest Administrator</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-4 space-y-2">
                  <li>Add and modify teams</li>
                  <li>Set company-wide goals</li>
                  <li>Manage competitions</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p>© 2024 Healthy Habit Team Tracker. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
