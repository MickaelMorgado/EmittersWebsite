"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Unlock, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { VersionBadge } from '@/components/VersionBadge';

interface Project {
  title: string;
  description: string;
  href: string;
  accentColor: string;
  isPublic?: boolean;
  isExternal?: boolean;
}

const PROJECTS: { [section: string]: Project[] } = {
  "Main Section": [
    { title: "About Me", description: "Mickael Morgado", href: "/mika", accentColor: "0, 162, 255", isPublic: true },
  ],
  "My main projects": [
    { title: "PNL Calendar", description: "PNL Calendar project", href: "/PNLCalendar", accentColor: "0, 255, 127" },
    { title: "MemoGPT", description: "AI-powered memo and prompt manager", href: "/memogpt", accentColor: "147, 51, 234" },
    { title: "Blender Vertex Measurements", description: "Blender add-on for real-time distance measurements", href: "https://github.com/MickaelMorgado/BlenderVertexMeasurements", accentColor: "255, 153, 0", isExternal: true, isPublic: true },
  ],
  "Node Projects": [
    { title: "Blockchains visualizer", description: "Interactive 3D blockchains and token visualizer", href: "/blockchain-visualizer", accentColor: "31, 239, 239", isPublic: false },
    { title: "Data Visualizer Project", description: "Interactive 3D data visualizer", href: "/dataVisualizer", accentColor: "45, 212, 191", isPublic: true },
    { title: "Sounder Project", description: "A sound design tool for creating randomized music", href: "/sounder", accentColor: "244, 63, 94", isPublic: true },
    { title: "Daily Todo Tracker", description: "Track your daily habits and see progress over time.", href: "/todo", accentColor: "234, 179, 8" },
    { title: "Hips Project", description: "Main and finished landing page", href: "/HipsExample", accentColor: "59, 130, 246" },
    { title: "3D Printer Camera Monitor", description: "Monitor multiple 3D-printer camera feeds", href: "/printer-monitor", accentColor: "255, 50, 50", isPublic: true },
    { title: "EMF Detector Simulator", description: "Portable radiation scanner with real-time sonar feedback, inspired by Stalker: Heart of Chornobyl specialized artifacts detection gear.", href: "/emf-detector", accentColor: "34, 197, 94", isPublic: true },
    { title: "G-code Timelapse", description: "Minimalist 3D print timelapse visualization", href: "/gcode-timelapse", accentColor: "168, 85, 247", isPublic: true },
    { title: "PC AI Assistant", description: "Voice-activated AI assistant with real-time galaxy visualization", href: "/pc-ai-assistant", accentColor: "236, 72, 153" },
    { title: "3D CAD App", description: "Simple 3D CAD software for creating 3D objects", href: "/cad3d", accentColor: "14, 165, 233", isPublic: true },
    { title: "Camera Effects", description: "Real-time camera filters and visual effects", href: "/camera-effects", accentColor: "20, 184, 166", isPublic: true },
    { title: "TikTok + AI Assistant", description: "Integrated TikTok live events with AI voice response", href: "/tiktok-tts", accentColor: "255, 0, 80" },
    { title: "STALKER 2 Ammo Tracker", description: "Interactive ammo and weight management dashboard", href: "/stalker2-ammo", accentColor: "255, 126, 0", isPublic: true },
  ],
  "Standalone Projects": [
    { title: "Trading Tools", description: "Trading tools for analyzing and visualizing market data", href: "https://emittersgame.com/tools/index6.html", accentColor: "245, 158, 11", isExternal: true },
  ]
};

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
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    const isCookieUnlocked = document.cookie.split('; ').find(row => row.startsWith('site_unlocked=true'));
    if (isCookieUnlocked) setIsUnlocked(true);
  }, []);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const masterKey = process.env.NEXT_PUBLIC_MASTER_KEY; 
    if (password === masterKey) {
      setIsUnlocked(true);
      // Set cookie that expires in 7 days
      const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
      document.cookie = `site_unlocked=true; path=/; expires=${expires}; SameSite=Lax`;
      setShowUnlockModal(false);
      setError(false);
      setPassword('');
      window.location.reload(); // Refresh to ensure middleware/state is in sync
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  const toggleLock = () => {
    if (isUnlocked) {
      setIsUnlocked(false);
      document.cookie = "site_unlocked=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
      window.location.reload();
    } else {
      setShowUnlockModal(true);
    }
  };

  const ProjectCard = ({ project }: { project: Project }) => {
    const isLocked = !project.isPublic && !isUnlocked;
    
    const content = (
      <TiltCard isGlobalHovered={isGlobalHovered} setIsGlobalHovered={setIsGlobalHovered} accentColor={project.accentColor}>
        <Card className="h-full flex flex-col hover:shadow-md transition-shadow relative overflow-hidden">
          {isLocked && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center border border-white/10 rounded-xl transition-all duration-300 group-hover:bg-black/40">
              <Lock className="w-8 h-8 text-white/40 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Private Access</span>
            </div>
          )}
          <CardHeader>
            <CardTitle className="uppercase flex items-center justify-between">
              {project.title}
              {project.isPublic && <span className="text-[8px] bg-green-500/20 text-green-500 px-1.5 py-0.5 rounded border border-green-500/30">Public</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">{project.description}</p>
          </CardContent>
        </Card>
      </TiltCard>
    );

    if (isLocked) {
      return (
        <div onClick={() => setShowUnlockModal(true)} className="h-full cursor-pointer">
          {content}
        </div>
      );
    }

    if (project.isExternal) {
      return (
        <a href={project.href} target="_blank" rel="noopener noreferrer" className="h-full">
          {content}
        </a>
      );
    }

    return (
      <Link href={project.href} target="_blank" className="h-full">
        {content}
      </Link>
    );
  };

  return (
    <div className="bg-black min-h-screen text-white selection:bg-white/20">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-500/20 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-red-500/20 blur-[120px] rounded-full" />
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="flex items-center justify-between border-b border-white/10 pb-8 mb-8">
          <div>
            <TypographyH1>Welcome to my Projects Page</TypographyH1>
            <p className="text-muted-foreground">Explore my collection of interactive projects and experiments.</p>
          </div>
          <div className="flex items-center gap-3">
             <Button 
                onClick={toggleLock} 
                variant="outline" 
                size="icon" 
                className={`transition-all duration-500 ${isUnlocked ? 'border-green-500/50 text-green-400 bg-green-500/5' : 'border-white/10'}`}
                title={isUnlocked ? "Logout (Admin Mode On)" : "Login to Admin Mode"}
              >
                {isUnlocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4 opacity-50" />}
              </Button>
            <Link href="/" className="size-8">
              <Button size="icon" aria-label="Back to homepage" variant="default" className="bg-white text-black hover:bg-white/90">
                <X className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {Object.entries(PROJECTS).map(([section, projects]) => (
          <section key={section} className="mt-12 first:mt-0">
            {section === "Main Section" || section === "My main projects" ? (
               <TypographyH1>{section}</TypographyH1>
            ) : (
               <TypographyH3>{section}</TypographyH3>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
              {projects.map((p, i) => (
                <ProjectCard key={i} project={p} />
              ))}
            </div>
          </section>
        ))}

        {/* Unlock Modal */}
        {showUnlockModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/80 backdrop-blur-md" 
              onClick={() => setShowUnlockModal(false)}
            />
            <div 
              className={`relative bg-[#0a0a0a] border ${error ? 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'border-white/10'} p-8 rounded-2xl w-full max-w-md transition-all duration-300 transform scale-100 animate-in fade-in zoom-in`}
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                  <Lock className={`w-8 h-8 ${error ? 'text-red-500' : 'text-white'}`} />
                </div>
                <h2 className="text-2xl font-bold uppercase tracking-wider">Private Access</h2>
                <p className="text-muted-foreground text-sm mt-2">Enter the master key to unlock all projects</p>
              </div>

              <form onSubmit={handleUnlock} className="space-y-4">
                <input
                  type="password"
                  autoFocus
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center text-2xl tracking-[0.5em] focus:outline-none focus:border-white/30 transition-colors"
                />
                {error && <p className="text-red-500 text-xs text-center animate-bounce">Access Denied. Incorrect Master Key.</p>}
                <div className="flex gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1 border-white/10" 
                    onClick={() => setShowUnlockModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-white text-black hover:bg-white/90 font-bold"
                  >
                    Unlock
                  </Button>
                </div>
              </form>
              <p className="text-[10px] text-white/20 text-center mt-8 uppercase tracking-widest">
                Developer Terminal Mode v1.0
              </p>
            </div>
          </div>
        )}
      </div>
      <VersionBadge projectName="my-app" />
    </div>
  );
}

