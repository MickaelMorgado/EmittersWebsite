"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState } from 'react';

function TypographyH1({ children }: { children: React.ReactNode }) {
  return <h1 className="text-4xl font-bold tracking-tight mb-4 heading-shine uppercase">{children}</h1>;
}

function TypographyH3({ children }: { children: React.ReactNode }) {
  return <h2 className="text-3xl font-bold tracking-tight mb-4 heading-shine uppercase">{children}</h2>;
}

function TiltCard({ 
  children, 
  isGlobalHovered, 
  setIsGlobalHovered,
  accentColor = '255, 255, 255' // RGB string
}: { 
  children: React.ReactNode, 
  isGlobalHovered: boolean, 
  setIsGlobalHovered: (v: boolean) => void,
  accentColor?: string
}) {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [isLocalHovered, setIsLocalHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0, opacity: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -15;
    const rotateY = ((x - centerX) / centerX) * 15;

    setRotate({ x: rotateX, y: rotateY });
    setMousePos({ x, y, opacity: 0.4 });
    if (!isLocalHovered) {
      setIsLocalHovered(true);
      setIsGlobalHovered(true);
    }
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
    setMousePos(prev => ({ ...prev, opacity: 0 }));
    setIsLocalHovered(false);
    setIsGlobalHovered(false);
  };

  const isDimmed = isGlobalHovered && !isLocalHovered;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="h-full w-full transition-all duration-300 ease-out cursor-pointer relative overflow-hidden rounded-xl group"
      style={{
        perspective: '1000px',
        transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) scale(${isLocalHovered ? 1.3 : 1})`,
        transformStyle: 'preserve-3d',
        boxShadow: isLocalHovered 
          ? `0 30px 150px -20px rgba(${accentColor}, 0.3), 0 0 90px rgba(${accentColor}, 0.1)` 
          : 'none',
        border: '1px solid',
        borderColor: isLocalHovered ? `rgba(${accentColor}, 0.6)` : 'rgba(255, 255, 255, 0.1)',
        opacity: isDimmed ? 0.6 : 1,
        zIndex: isLocalHovered ? 50 : 1,
        backgroundColor: isLocalHovered ? '#000' : 'transparent',
      }}
    >
      {/* Sharp Reflection effect with accent hint */}
      <div
        className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at ${mousePos.x}px ${mousePos.y}px, rgba(${accentColor}, 0.6) 0%, rgba(${accentColor}, 0.2) 25%, transparent 50%)`,
          opacity: mousePos.opacity,
        }}
      />
      {children}
    </div>
  );
}

export default function Home() {
  const [isGlobalHovered, setIsGlobalHovered] = useState(false);
  return (
    <div className="bg-black min-h-screen text-white">
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
            <Link href="/mika" target="_blank" className="h-full">
              <TiltCard isGlobalHovered={isGlobalHovered} setIsGlobalHovered={setIsGlobalHovered} accentColor="0, 162, 255">
                <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="uppercase">About Me</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Mickael Morgado</p>
                  </CardContent>
                </Card>
              </TiltCard>
            </Link>
          </div>
        </section>

        <section className="mt-12">
          <TypographyH1>My main projects</TypographyH1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
            <Link href="/PNLCalendar" target="_blank" className="h-full">
              <TiltCard isGlobalHovered={isGlobalHovered} setIsGlobalHovered={setIsGlobalHovered} accentColor="0, 255, 127">
                <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="uppercase">PNL Calendar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">PNL Calendar project</p>
                  </CardContent>
                </Card>
              </TiltCard>
            </Link>
            <Link href="/memogpt" target="_blank" className="h-full">
              <TiltCard isGlobalHovered={isGlobalHovered} setIsGlobalHovered={setIsGlobalHovered} accentColor="147, 51, 234">
                <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="uppercase">MemoGPT</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">AI-powered memo and prompt manager</p>
                  </CardContent>
                </Card>
              </TiltCard>
            </Link>
            <a href="https://github.com/MickaelMorgado/BlenderVertexMeasurements" target="_blank" rel="noopener noreferrer" className="h-full">
              <TiltCard isGlobalHovered={isGlobalHovered} setIsGlobalHovered={setIsGlobalHovered} accentColor="255, 153, 0">
                <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="uppercase">Blender Vertex Measurements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Blender add-on for real-time distance measurements between selected vertices with GPU-accelerated screen-space text overlays</p>
                  </CardContent>
                </Card>
              </TiltCard>
            </a>
          </div>
        </section>

        <section className="mt-12">
          <TypographyH1>Tests</TypographyH1>
          <TypographyH3>Node Projects</TypographyH3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
            <Link href="" target="_blank" className="h-full opacity-10">
              <TiltCard isGlobalHovered={isGlobalHovered} setIsGlobalHovered={setIsGlobalHovered} accentColor="31, 239, 239">
                <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="uppercase">Blockchains visualizer</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Interactive 3D blockchains and token visualizer</p>
                  </CardContent>
                </Card>
              </TiltCard>
            </Link>

            <Link href="/dataVisualizer" target="_blank" className="h-full">
              <TiltCard isGlobalHovered={isGlobalHovered} setIsGlobalHovered={setIsGlobalHovered} accentColor="45, 212, 191">
                <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="uppercase">Data Visualizer Project</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Interactive 3D data visualizer</p>
                  </CardContent>
                </Card>
              </TiltCard>
            </Link>
            <Link href="/sounder" target="_blank" className="h-full">
              <TiltCard isGlobalHovered={isGlobalHovered} setIsGlobalHovered={setIsGlobalHovered} accentColor="244, 63, 94">
                <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="uppercase">Sounder Project</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">A sound design tool for creating randomized music</p>
                  </CardContent>
                </Card>
              </TiltCard>
            </Link>
            <Link href="" target="_blank" className="h-full opacity-10">
              <TiltCard isGlobalHovered={isGlobalHovered} setIsGlobalHovered={setIsGlobalHovered} accentColor="16, 185, 129">
                <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="uppercase">Crypto Bot</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Getting my hand on crypto development</p>
                  </CardContent>
                </Card>
              </TiltCard>
            </Link>
            <Link href="/todo" target="_blank" className="h-full">
              <TiltCard isGlobalHovered={isGlobalHovered} setIsGlobalHovered={setIsGlobalHovered} accentColor="234, 179, 8">
                <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="uppercase">Daily Todo Tracker</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Track your daily habits and see progress over time.</p>
                  </CardContent>
                </Card>
              </TiltCard>
            </Link>
            <Link href="/HipsExample" target="_blank" className="h-full">
              <TiltCard isGlobalHovered={isGlobalHovered} setIsGlobalHovered={setIsGlobalHovered} accentColor="59, 130, 246">
                <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="uppercase">Hips Project</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Main and finished landing page</p>
                  </CardContent>
                </Card>
              </TiltCard>
            </Link>
            <Link href="/printer-monitor" target="_blank" className="h-full">
              <TiltCard isGlobalHovered={isGlobalHovered} setIsGlobalHovered={setIsGlobalHovered} accentColor="255, 50, 50">
                <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="uppercase">3D Printer Camera Monitor</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Monitor multiple 3D-printer camera feeds from smartphones via Iriun</p>
                  </CardContent>
                </Card>
              </TiltCard>
            </Link>
            <Link href="/emf-detector" target="_blank" className="h-full">
              <TiltCard isGlobalHovered={isGlobalHovered} setIsGlobalHovered={setIsGlobalHovered} accentColor="34, 197, 94">
                <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="uppercase">EMF Detector Simulator</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Simulate EMF radiation detection based on network connection speed, inspired by Stalker2 ingame scanner device</p>
                  </CardContent>
                </Card>
              </TiltCard>
            </Link>
            <Link href="/gcode-timelapse" target="_blank" className="h-full">
              <TiltCard isGlobalHovered={isGlobalHovered} setIsGlobalHovered={setIsGlobalHovered} accentColor="168, 85, 247">
                <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="uppercase">G-code Timelapse</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Minimalist 3D print timelapse visualization from G-code files</p>
                  </CardContent>
                </Card>
              </TiltCard>
            </Link>
            <Link href="/pc-ai-assistant" target="_blank" className="h-full">
              <TiltCard isGlobalHovered={isGlobalHovered} setIsGlobalHovered={setIsGlobalHovered} accentColor="236, 72, 153">
                <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="uppercase">PC AI Assistant</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">
                      Voice-activated AI assistant with real-time galaxy visualization and speech-reactive animations
                    </p>
                  </CardContent>
                </Card>
              </TiltCard>
            </Link>

            <Link href="/cad3d" target="_blank" className="h-full">
              <TiltCard isGlobalHovered={isGlobalHovered} setIsGlobalHovered={setIsGlobalHovered} accentColor="14, 165, 233">
                <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="uppercase">3D CAD App</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">
                      Simple 3D CAD software for creating and manipulating 3D objects
                    </p>
                  </CardContent>
                </Card>
              </TiltCard>
            </Link>

            <Link href="/camera-effects" target="_blank" className="h-full">
              <TiltCard isGlobalHovered={isGlobalHovered} setIsGlobalHovered={setIsGlobalHovered} accentColor="20, 184, 166">
                <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="uppercase">Camera Effects</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">
                      Real-time camera filters and visual effects
                    </p>
                  </CardContent>
                </Card>
              </TiltCard>
            </Link>
            <Link href="/tiktok-tts" target="_blank" className="h-full">
              <TiltCard isGlobalHovered={isGlobalHovered} setIsGlobalHovered={setIsGlobalHovered} accentColor="255, 0, 80">
                <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="uppercase">TikTok + AI Assistant</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">
                      Integrated TikTok live events with AI voice response and reactive galaxy visualization
                    </p>
                  </CardContent>
                </Card>
              </TiltCard>
            </Link>
          </div>
        </section>

        <section className="mt-12">
          <TypographyH3>Standalone Projects</TypographyH3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
            <Link href="https://emittersgame.com/tools/index6.html" target="_blank" className="h-full">
              <TiltCard isGlobalHovered={isGlobalHovered} setIsGlobalHovered={setIsGlobalHovered} accentColor="245, 158, 11">
                <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="uppercase">Trading Tools</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">
                      Trading tools for analyzing and visualizing market data
                    </p>
                  </CardContent>
                </Card>
              </TiltCard>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

