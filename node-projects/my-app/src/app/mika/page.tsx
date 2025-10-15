"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import "./portfolio.css";

import Aquarium3D from "./Aquarium3D";
import BMW3D from "./BMW3D";
import Code3D from "./Code3D";
import Crypto3D from "./Crypto3D";
import Drones3D from "./Drones3D";
import { useGsapEffects } from "./gsapEffects";
import Main3DModel from "./Main3D";
import Printing3D from "./Printing3D";
import RadarChart from "./RadarChart";
import SimRacing3D from "./SimRacing3D";

const modelBasePath = "@assets/models/";


export default function MikaPage() {
  useGsapEffects();

  const [activeFilter, setActiveFilter] = useState("All");

  const handleFilterClick = (filter: string) => {
    setActiveFilter(filter);
  };

  // Example usage of modelBasePath in components that load models:
  // <ModelComponent modelPath={`${modelBasePath}A1Mini.gltf`} />

  const skills = [
    { name: "React & Next.js", level: 70 },
    { name: "SciChart.js", level: 40 },
    { name: "JavaScript", level: 75 },
    { name: "React Three.js", level: 40 },
    { name: "TypeScript", level: 60 },
    { name: "Tailwind CSS", level: 40 },
    { name: "Git", level: 75 },
    { name: "Node.js", level: 60 },
    { name: "Express.js", level: 20 },
    { name: "MongoDB", level: 20 },
    { name: "PostgreSQL", level: 20 },
    { name: "Docker", level: 50 },
    { name: "Agentic AI / LLMs", level: 30 },
    { name: "Automation", level: 70 },
    { name: "Web 3", level: 20 },
    { name: "Supabase / Firebase", level: 20 }
  ];

  const lowSkills = skills.filter(skill => skill.level <= 20);
  const radarSkills = skills.filter(skill => skill.level > 20);

  const otherSkills = [
    { name: "Blender", level: 70 },
    { name: "Unreal Engine", level: 90 },
    { name: "3D Printing", level: 30 },
    { name: "Live Streaming", level: 70 },
    { name: "Trading", level: 50 },
    { name: "Investing", level: 35 },
    { name: "Google Sheets", level: 25 },
    { name: "FL Studio Music Composer", level: 50 },
    { name: "Video Editing", level: 30 },
    { name: "SIM Racing", level: 80 },
    { name: "Aquascaping", level: 20 },
  ];

  const lowOtherSkills = otherSkills.filter(skill => skill.level <= 20);
  const radarOtherSkills = otherSkills.filter(skill => skill.level > 20);

  // Enum for corner types
  enum CornerType {
    DownRight,
    DownLeft,
    LeftDown,
    RightDown,
  }

  // Static radius for all corners
  const RADIUS = 150;

  // Function to create a quadratic Bézier corner
  const createCornerQ = (
    type: CornerType,
    startX: number,
    startY: number
  ): string => {
    switch (type) {
      case CornerType.DownRight:
        return `Q ${startX},${startY + RADIUS} ${startX + RADIUS},${startY + RADIUS}`;
      case CornerType.DownLeft:
        return `Q ${startX},${startY + RADIUS} ${startX - RADIUS},${startY + RADIUS}`;
      case CornerType.LeftDown:
        return `Q ${startX - RADIUS},${startY} ${startX - RADIUS},${startY + RADIUS}`;
      case CornerType.RightDown:
        return `Q ${startX + RADIUS},${startY} ${startX + RADIUS},${startY + RADIUS}`;
    }
  };

  const svgHigh = 13272; // document.body.clientHeight
  const svgPath = `
    M 600 0
    V 1500
    ${createCornerQ(CornerType.DownRight, 600, 1500)}
    H 1000
    ${createCornerQ(CornerType.RightDown, 1000, 1500 + RADIUS)}
    V 2400
    ${createCornerQ(CornerType.DownLeft, 1000 + RADIUS, 2400)}
    H 200
    ${createCornerQ(CornerType.LeftDown, 0 + RADIUS, 2400 + RADIUS)}
    V ${3500 - RADIUS}
    ${createCornerQ(CornerType.DownRight, 0, 3500 - RADIUS)}
    H 1000
    ${createCornerQ(CornerType.RightDown, 1000, 3500)}
    V 4700
    ${createCornerQ(CornerType.DownLeft, 1000 + RADIUS, 4700)}
    H 400
    ${createCornerQ(CornerType.LeftDown, 500 - RADIUS, 5000 - RADIUS)}
    V 5400
    ${createCornerQ(CornerType.DownRight, 200, 5400)}
    H 800
    ${createCornerQ(CornerType.RightDown, 700 + RADIUS, 5400 + RADIUS)}
    V 6000
    ${createCornerQ(CornerType.DownLeft, 800 + RADIUS, 6000)}
    H 300
    ${createCornerQ(CornerType.LeftDown, 300, 6000 + RADIUS)}
    V 7000
    ${createCornerQ(CornerType.DownRight, 150, 7000)}
    H 1100
    ${createCornerQ(CornerType.RightDown, 1100 , 7000 + RADIUS)}
    V ${svgHigh}
  `;


  useEffect(() => {
    // Inject the CSS styles for motion path container and body
    const style = document.createElement("style");
    style.innerHTML = `
      .motion-path-container {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        min-height: 100vh;
        z-index: -1;
        pointer-events: none;
      }
      #motionSVG {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        min-height: 100vh;
      }
      body {
        position: relative;
        min-height: 100vh;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <main className="font-saira text-white bg-dark h-full">
      {/* MIGRATED FROM tools/index11.html */}
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-gradient-to-r from-black via-transparent to-black z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold uppercase">Mickael</h1>
            <div className="hidden md:flex space-x-8">
              <a href="#about" className="hover:text-primary transition-colors">About</a>
              <a href="#work" className="hover:text-primary transition-colors">Work</a>
              <a href="#contact" className="hover:text-primary transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </nav>

      <div id="smooth-wrapper">
        <div id="smooth-content">
          {/* Motion Path Background */}
          <div className="motion-path-container">
            <svg
              id="motionSVG"
              viewBox={`0 0 1200 ${svgHigh}`}
              preserveAspectRatio="xMidYMin meet"
              style={{ width: "100%", height: "100%" }}
            >
              {/* Glow filter */}
              <defs>
                <filter id="laserGlow">
                  <feGaussianBlur className="blur" result="coloredBlur" stdDeviation="25" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Background path (static) */}
              <path
                id="motionPathBg"
                d={svgPath}
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />

              {/* Progress path (fills as you scroll) */}
              <path
                id="motionPathHighlight"
                d={svgPath}
                fill="none"
                stroke="rgb(255, 0, 0)"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#laserGlow)"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>

          {/* Three js model as Background */}
          <Main3DModel />

          {/* Hero Section */}
          <section id="hero" className="min-h-screen flex items-center justify-center">
            <div className="container mx-auto px-6 z-10 text-center">
              <h1 className="text-5xl font-bold mb-6 uppercase">Tech Developer</h1>
              <p className="text-xl mb-8">The ultimate 'Jack of all trades'</p>
<a
  href="#"
  onClick={(e) => {
    e.preventDefault();
    window.scrollBy({ top: window.innerHeight - 200, behavior: "smooth" });
  }}
  className="text-red-500 opacity-20! hover:opacity-100! scale-100 transition-all hover:scale-200"
>
  ⩒
</a>


            </div>
          </section>

          {/* About Section */}
          <section id="about" className="py-20">
            <div className="container mx-auto px-6">
              <div className="flex flex-col md:flex-row gap-12">
                <div className="md:w-2/4">
                  <h2 className="text-3xl font-bold mb-6 uppercase">About Me</h2>
                  <p className="mb-4 mr-12">
                    I'm Mickael, a detail-driven creator and performance enthusiast who values precision in everything I do.
                    <br />
                    <br />
                    Whether I’m trading with calculated strategies, optimizing my sim racing setup for maximum realism, or customizing hardware with 3D-printed mods, I bring a hands-on, problem-solving mindset to the table.
                    <br />
                    <br />
                    I prefer machines that feel right—like the raw power and refined build of a BMW M4 over the plastic minimalism of a Tesla.
                    <br />
                    <br />
                    I love control, immersion, and tuning systems—be it force feedback in racing, market entries with tight stop-losses, or the acoustic fidelity of my Unreal Engine projects.
                    <br />
                    <br />
                    I don’t just use tools—I master them, modify them, and make them mine.
                  </p>
                </div>
                <div className="md:w-2/4 relative">
                    <Image
                      width={300}
                      height={300}
                      src="./assets/mika.png"
                      className="rounded-full w-90 h-90 mx-auto saturate-50"
                      alt="Mickael"
                    />
                </div>
              </div>
            </div>
          </section>

          {/* Passions Section */}
          <section id="passions" className="py-20">
            <div className="container mx-auto px-6">
              <h2 className="text-5xl font-bold text-center mb-12">MY PASSIONS</h2>
              {/* 3D Printing */}
              <div className="passion-item">
                <div className="flex flex-col md:flex-row gap-12">
                  <div className="md:w-1/2">
                    <div className="passion-content">
                      <h3 className="text-2xl font-bold mb-4">3D PRINTING</h3>
                      <p className="mb-4">Creating and designing custom 3D models for various projects and prototypes.</p>
                      <p className="text-gray-400">Expertise in FDM and SLA printing technologies, material selection, and post-processing techniques.</p>
                    </div>
                  </div>
                  <div className="md:w-1/2">
                    <div className="passion-image">
                      {/* 3D Printing 3D Scene */}
                      <div className="w-full h-full min-h-[400px]">
                        {typeof window !== "undefined" && <Printing3D />}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Drones */}
              <div className="passion-item">
                <div className="flex flex-col md:flex-row-reverse gap-12">
                  <div className="md:w-1/2">
                    <div className="passion-content">
                      <h3 className="text-2xl font-bold mb-4">DRONES</h3>
                      <p className="mb-4">Building and flying drones for aerial photography and videography.</p>
                      <p className="text-gray-400">DIY drone builds, custom modifications, and professional aerial photography services.</p>
                    </div>
                  </div>
                  <div className="md:w-1/2">
                    <div className="passion-image">
                      {/* Drone 3D Scene Placeholder */}
                      <div className="w-full h-full min-h-[400px]">
                        {typeof window !== "undefined" && <Drones3D />}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* BMW */}
              <div className="passion-item">
                <div className="flex flex-col md:flex-row-reverse gap-12">
                  <div className="md:w-1/2">
                    <div className="passion-image">
                      {/* BMW 3D Scene Placeholder */}
                      <div className="w-full h-full min-h-[400px]">
                        {typeof window !== "undefined" && <BMW3D />}
                      </div>
                    </div>
                  </div>
                  <div className="md:w-1/2">
                    <div className="passion-content">
                      <h3 className="text-2xl font-bold mb-4">BMW</h3>
                      <p className="mb-4">Fan of BMW brand and proud owner of a F20 twin turbo model. Next car on my wishlist is an M3 or M5.</p>
                      <p className="text-gray-400">Always open to discuss about cars, specially motorsport LMDh and GTs.</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Crypto */}
              <div className="passion-item">
                <div className="flex flex-col md:flex-row gap-12">
                  <div className="md:w-1/2">
                    <div className="passion-image">
                      {/* Crypto 3D Scene Placeholder */}
                      <div className="w-full h-full min-h-[400px]">
                        {typeof window !== "undefined" && <Crypto3D />}
                      </div>
                    </div>
                  </div>
                  <div className="md:w-1/2">
                    <div className="passion-content">
                      <h3 className="text-2xl font-bold mb-4">CRYPTO</h3>
                      <p className="mb-4">Investing and developing blockchain solutions since early 2017.</p>
                      <p className="text-gray-400">Experience with Bitcoin, Ethereum, and other major cryptocurrencies. Active in DeFi and NFT spaces.</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* SimRacing */}
              <div className="passion-item">
                <div className="flex flex-col md:flex-row gap-12">
                  <div className="md:w-1/2">
                    <div className="passion-content">
                      <h3 className="text-2xl font-bold mb-4">SIM RACING</h3>
                      <p className="mb-4">I'm someone who craves precision, performance, and authenticity—whether it's driving a BMW M series or racing in VR.</p>
                      <p className="text-gray-400">I’m always refining my sim rig for better feedback and immersion, down to customizing pedals and exploring 3D-printed upgrades. I care about the feel of everything I use, and I don’t settle for “good enough.” If there’s a way to make something more real, more responsive, more right, I’ll find it.</p>
                    </div>
                  </div>
                  <div className="md:w-1/2">
                    <div className="passion-image">
                      {/* Steering Wheel 3D Scene Placeholder */}
                      <div className="w-full h-full min-h-[400px]">
                        {typeof window !== "undefined" && <SimRacing3D />}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Aquarium */}
              <div className="passion-item">
                <div className="flex flex-col md:flex-row gap-12">
                  <div className="md:w-2/3">
                    <div className="passion-image">
                      {/* Aquarium 3D Scene Placeholder */}
                      <div className="w-full h-full min-h-[400px]">
                        {typeof window !== "undefined" && <Aquarium3D />}
                      </div>
                    </div>
                  </div>
                  <div className="md:w-1/3">
                    <div className="passion-content">
                      <h3 className="text-2xl font-bold mb-4">AQUARIUM</h3>
                      <p className="mb-4">Maintaining and designing freshwater and marine aquariums.</p>
                      <p className="text-gray-400">Expert in reef tanks, planted tanks, and aquatic plant propagation.</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Code */}
              <div className="passion-item">
                <div className="flex flex-col md:flex-row gap-12">
                  <div className="md:w-1/2">
                    <div className="passion-content">
                      <h3 className="text-2xl font-bold mb-4">CODE</h3>
                      <p className="mb-4">I'm someone who craves precision, performance, and authenticity—whether it's driving a BMW M series or racing in VR.</p>
                      <p className="text-gray-400">I’m always refining my sim rig for better feedback and immersion, down to customizing pedals and exploring 3D-printed upgrades. I care about the feel of everything I use, and I don’t settle for “good enough.” If there’s a way to make something more real, more responsive, more right, I’ll find it.</p>
                    </div>
                  </div>
                  <div className="md:w-1/2">
                    <div className="passion-image">
                      {/* Code 3D Scene Placeholder */}
                      <div className="w-full h-full min-h-[400px]">
                        {typeof window !== "undefined" && <Code3D />}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Skills Section */}
          <section id="skills" className="py-20">
            <div className="container mx-auto px-6">
              <h2 className="text-5xl font-bold text-center mb-12 uppercase">PROGRAMMING SKILLS</h2>
              <div className="flex flex-col items-center md:flex-row gap-40">
                <div className="md:w-1/2">
                  <p>
                    I am a web developer and tech enthusiast with a strong foundation in React & Next.js, JavaScript, TypeScript, Node.js, and Git. I build dynamic web applications, integrate automation workflows, and explore agentic AI / LLMs to create intelligent, self-improving systems.
                    <br />
                    <br />
                    My experience spans full-stack development with Docker, basic backend work using Express.js, MongoDB, PostgreSQL, and modern web services like Supabase / Firebase. I also experiment with SciChart.js for interactive data visualization, Tailwind CSS for clean UI design, and explore emerging technologies like Web3.
                    <br />
                    <br />
                    Driven by curiosity and problem-solving, I combine hands-on coding, automation, and experimentation to deliver practical and innovative tech solutions.
                  </p>
                  {lowSkills.length > 0 && (
                    <ul title="Other skills I tried but can't confidently say that I'm mastered yet" className="mt-4 list-disc list-inside text-sm text-gray-400">
                      {lowSkills.map(skill => (
                        <li key={skill.name}>{skill.name}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="md:w-1/2">
                  <RadarChart data={radarSkills} />
                </div>
              </div>
            </div>
          </section>

          {/* Other Skills */}
          <section id="otherSkills" className="py-20">
            <div className="container mx-auto px-6">
              <h2 className="text-5xl font-bold text-center mb-12 uppercase">OTHER SKILLS</h2>
              <div className="flex flex-col items-center md:flex-row gap-40">
                <div className="md:w-1/2">
                  <p>
                    I am a versatile creator and technologist blending game development, 3D modeling, and digital fabrication. I designed 3D assets for my game Emitters using Blender and Unreal Engine, and now apply CAD techniques for 3D printing to turn digital concepts into physical objects.
                    <br /><br />
                    I also live stream, compose music with FL Studio, and manage a sophisticated multi-asset portfolio using Google Sheets—creating interactive graphs and data visualizers that combine savings, investments, and trading strategies.
                    <br /><br />
                    Hands-on, analytical, and creative, I thrive at the intersection of interactive experiences, digital creation, and financial insight.
                  </p>

                  {lowOtherSkills.length > 0 && (
                    <ul title="Other skills I tried but can't confidently say that I'm mastered yet" className="mt-4 list-disc list-inside text-sm text-gray-400">
                      {lowOtherSkills.map(skill => (
                        <li key={skill.name}>{skill.name}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="md:w-1/2">
                  <RadarChart data={radarOtherSkills} />
                </div>
              </div>
            </div>
          </section>

          {/* Tools Section */}
          <section id="tools" className="py-20">
            <div className="container mx-auto px-6">
              <h2 className="text-5xl font-bold text-center mb-12">APPS / TOOLS / PROJECTS</h2>
              <div className="mb-12 text-center">
                <div className="flex flex-wrap justify-center">
                  {["All", "Racing", "Game Development", "Apps", "Scripting"].map((filter) => (
                    <span
                      key={filter}
                      className={`badge mr-2 mb-2 ${activeFilter === filter ? "active" : ""}`}
                      data-filter={filter}
                      onClick={() => handleFilterClick(filter)}
                      style={{ cursor: "pointer" }}
                    >
                      {filter}
                    </span>
                  ))}
                </div>
              </div>
              <div id="tools-grid" className="grid md:grid-cols-3 gap-12">
                {[{
                    category: "Racing",
                    imgSrc: "./assets/images/simhubdashboard.png",
                    alt: "SimHub Dashboard",
                    title: "SimHub Dashboard",
                    description: "Created my first SimHub dashboard for my sim racing rig, using a tablet as a secondary screen. It displays RPM, pedals inputs, position and laps, as well as lap times, time delta & lap differencials, fuel consuption and lap estimates, ABS/TC levels, and race flags info while racing.",
                    link: "https://github.com/Mikaele01/simhub-dashboard",
                    linkText: "Download Now",
                    readMore: "https://www.tiktok.com/@mickaelmorgado7/video/7469122187866180896"
                  },
                  {
                    category: "Game Development",
                    imgSrc: "https://emittersgame.com/assets/images/gallery/Capture2.png",
                    alt: "Emitters Game",
                    title: "EMITTERS Game",
                    description: "This is one of my biggest project, a game created from scratch and an awesome website for it. Emitters is a fast-paced, first-person experience set in a future taken over by deadly hi-tech drones.",
                    link: "https://emittersgame.com",
                    linkText: "Visit Website",
                  },
                  {
                    category: "Apps",
                    imgSrc: "https://raw.githubusercontent.com/MickaelMorgado/MikasCodesApp/main/src/assets/images/github/Screenshot%202024-01-20%20at%2000.03.18.png",
                    alt: "Mikas Codes App",
                    title: "Mikas Codes App",
                    description: "An Electron app for storing and generating codes. Logging tasks hour for daily job, super efficient.",
                    link: "https://github.com/MickaelMorgado/MikasCodesApp",
                    linkText: "View on GitHub",
                  },
                  {
                    category: "Scripting",
                    imgSrc: "https://via.placeholder.com/600x400",
                    alt: "Scripting",
                    title: "Scripting",
                    description: "I love to make my life easier with scripts, always bringing solutions to my daily tasks.",
                    link: "#",
                    linkText: "View Details",
                  },
                  {
                    category: "Apps",
                    imgSrc: "https://emittersgame.com/assets/images/tools/ipfs.png",
                    alt: "IFPSTutorial",
                    title: "IFPS Limitless Cloud Storage",
                    description: "A cloud file storage using Web3 technology (IFPS). This is a personal project to improve my flow when it comes to transfer files in the easiest way possible, no google account required and easily transferable to mobile devices, no cloud storage limit as its basically p2p scattered files.",
                  },
                  {
                    category: "Game Development",
                    imgSrc: "https://emittersgame.com/assets/images/tools/shoot.png",
                    alt: "Shooter",
                    title: "Shooter",
                    description: "This is my first project I ever made, it was a lot of fun to make in my beginner days with html, css and js (and php at the time). I managed to recover the game for you to play, but it had way more features back in the days (old PHP xD), like main menu with players leaderboard, user settings and aesthetic and system customizations",
                    link: "https://emittersgame.com/shoot/games/game.html",
                    linkText: "Play Now",
                    readMore: "https://www.youtube.com/watch?v=b1skv1fOoQY"
                  },
                  {
                    category: "Apps",
                    imgSrc: "https://blog.excelpricefeed.com/wp-content/uploads/2022/08/ticker.png",
                    alt: "Price Ticker",
                    title: "Price Ticker",
                    description: "A simple crypto price ticker that could runs in your tablet, it only support static Gold, BTC and EURUSD pair but planning to make it customizable in the future. It fetches real-time prices from a public API and displays them in a user-friendly format.",
                    link: "https://emittersgame.com/tools/index10.html",
                    linkText: "Try Now",
                  },
                ].map((tool, index) => {
                  const isVisible = activeFilter === "All" || tool.category === activeFilter;
                  return (
                    <div
                      key={index}
                      className={`card rounded-lg p-8 ${isVisible ? "flex" : "hidden"}`}
                      data-category={tool.category}
                    >
                      <div className="card-content">
                        <Image
                          width={300}
                          height={300}
                          src={tool.imgSrc}
                          alt={tool.alt}
                          className="w-full rounded-lg mb-6"
                        />
                        <h3 className="text-2xl font-bold mb-4">{tool.title}</h3>
                        <p className="mb-4">{tool.description}</p>
                        <div className="flex gap-5">
                        {tool.link && (
                          <a target="_blank" href={tool.link} className="btn-minimal">
                            {tool.linkText}
                          </a>
                        )}
                        {tool.readMore && (
                          <>
                            <a target="_blank" href={tool.readMore} className="btn-minimal">
                              Read More
                            </a>
                          </>
                        )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section id="contact" className="py-60">
            <div className="container mx-auto px-6">
              <div className="flex flex-col md:flex-row gap-12">
                <div className="md:w-1/2 flex items-center justify-center">
                  <i className="fas fa-mobile-alt phone text-grey opacity-50"></i>
                </div>
                <div className="md:w-1/2">
                  <h2 className="text-5xl font-bold mb-6">LET'S WIRE</h2>
                  <form className="space-y-6">
                    <div>
                      <input type="text" placeholder="Name" className="w-full card rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div>
                      <input type="email" placeholder="Email" className="w-full card rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div>
                      <textarea placeholder="Message" className="w-full card rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary h-32"></textarea>
                    </div>
                    <button type="submit" className="btn-minimal w-full">Send Message</button>
                  </form>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="bg-black py-8">
            <div className="container mx-auto px-6">
              <div className="flex justify-center space-x-6">
                <a href="#" className="text-white hover:text-primary transition-colors"><i className="fab fa-github"></i></a>
                <a href="#" className="text-white hover:text-primary transition-colors"><i className="fab fa-linkedin"></i></a>
                <a href="#" className="text-white hover:text-primary transition-colors"><i className="fab fa-twitter"></i></a>
              </div>
              <p className="text-center text-gray-400 mt-4">
                {new Date().getFullYear()}. All rights reserved.
              </p>
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}
