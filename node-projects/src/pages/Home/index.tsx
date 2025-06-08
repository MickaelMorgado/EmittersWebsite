import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { TypographyH1 } from '../../components/utils/Typos';
import { Separator } from '../../components/ui/separator';
import { X } from 'lucide-react';
import { Button } from "../../components/ui/button";


const Home = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <TypographyH1>Welcome to my Projects Page</TypographyH1>
          <p className="text-muted-foreground mb-8">Explore my collection of interactive projects and experiments.</p>
        </div>
        <Link to="/" className="size-8">
          <Button size="icon" aria-label="Back to homepage">
            <X />
          </Button>
        </Link>
      </div>
      <Separator />
      <section>
        <TypographyH1>My main projects</TypographyH1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <Link to="/pnl-calendar" className="h-full">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle>PNL Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">PNL Calendar project</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>
      <section>
        <TypographyH1>Hips tests</TypographyH1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <Link to="/threejs" className="h-full">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle>Three.js Project</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Interactive 3D graphics and animations</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/hips" className="h-full">
            <Card className="h-full flex flex-col">
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
};

export default Home;
