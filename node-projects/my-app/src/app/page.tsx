// app/page.tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';
import Link from 'next/link';

function TypographyH1({ children }: { children: React.ReactNode }) {
  return <h1 className="text-4xl font-bold tracking-tight mb-4">{children}</h1>;
}

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <TypographyH1>Welcome to my Projects Page</TypographyH1>
          <p className="text-muted-foreground mb-8">Explore my collection of interactive projects and experiments.</p>
        </div>
        <Link href="/" className="size-8">
          <Button size="icon" aria-label="Back to homepage" variant="default">
            <X className="h-4 w-4" />
          </Button>
        </Link>
      </div>
      <section className="mt-12">
        <TypographyH1>Main Section</TypographyH1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
          <Link href="/mika" className="h-full">
            <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>About Me</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Mickael Morgado</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>
      <section className="mt-12">
        <TypographyH1>My main projects</TypographyH1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
          <Link href="/PNLCalendar" className="h-full">
            <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>PNL Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">PNL Calendar project</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/memogpt" className="h-full">
            <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>MemoGPT</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">AI-powered memo and prompt manager</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>
      <section className="mt-12">
        <TypographyH1>Tests</TypographyH1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
          <Link href="" className="h-full opacity-10">
            <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>Blockchains visualizer</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Interactive 3D blockchains and token visualizer</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dataVisualizer" className="h-full">
            <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>Data Visualizer Project</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Interactive 3D data visualizer</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/sounder" className="h-full">
            <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>Sounder Project</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">A sound design tool for creating randomized music</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="" className="h-full opacity-10">
            <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>Crypto Bot</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Getting my hand on crypto development</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/todo" className="h-full">
            <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>Daily Todo Tracker</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Track your daily habits and see progress over time.</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/HipsExample" className="h-full">
            <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>Hips Project</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Main and finished landing page</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>
    </div>
  );
}