import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AboutPage() {
  return (
    <div className="container mx-auto py-12">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">About Our Project</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-lg dark:prose-invert mx-auto">
          <p className="text-center mb-6">
            We made this project for BPA 2025 as part of the Farrell Chapter of Heritage High School (Chapter Number: 02-1528).
          </p>
          <p className="text-center mb-6">
            Our team worked together to create an innovative solution that showcases our skills and teamwork.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <TeamMember name="Asmit Padhy" />
            <TeamMember name="Dinesh Nalliah" />
            <TeamMember name="Aryan Joshi" />
            <TeamMember name="Advith Suggala" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function TeamMember({ name }: { name: string }) {
  return (
    <div className="text-center">
      <div className="w-24 h-24 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-2">
        {name.split(' ').map(n => n[0]).join('')}
      </div>
      <p className="font-medium">{name}</p>
    </div>
  )
}

