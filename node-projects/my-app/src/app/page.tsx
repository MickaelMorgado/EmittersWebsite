// app/page.tsx
import Link from 'next/link';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

function TypographyH1({ children }: { children: React.ReactNode }) {
  return <h1 className="text-4xl font-bold tracking-tight mb-4">{children}</h1>;
}

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <TypographyH1>Welcome to my Projects Page 1</TypographyH1>
          <p className="text-muted-foreground mb-8">Explore my collection of interactive projects and experiments.</p>
        </div>
        <Link href="/" className="size-8">
          <Button size="icon" aria-label="Back to homepage" variant="default">
            <X className="h-4 w-4" />
          </Button>
        </Link>
      </div>
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
        <TypographyH1>Hips tests</TypographyH1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
          <Link href="/threejs" className="h-full">
            <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>Three.js Project</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Interactive 3D graphics and animations</p>
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