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
import Printing3D from "./Printing3D";
import SimRacing3D from "./SimRacing3D";

const modelBasePath = "/assets/models/";


export default function MikaPage() {
  useGsapEffects();

  const [activeFilter, setActiveFilter] = useState("all");

  const handleFilterClick = (filter: string) => {
    setActiveFilter(filter);
  };

  // Example usage of modelBasePath in components that load models:
  // <ModelComponent modelPath={`${modelBasePath}A1Mini.gltf`} />


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
    <main className="font-saira text-white bg-dark min-h-screen">
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
              viewBox="0 0 1200 11075"
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
                d="M 600,0
                  V 1500
                  C 600,1600 650,1650 800,1650
                  H 1000
                  C 1150,1650 1200,1700 1200,1800
                  V 2000
                  C 1200,2100 1150,2150 1000,2150
                  H 400
                  C 250,2150 200,2200 200,2300
                  V 3800
                  C 200,3900 150,3950 100,3950
                  H 50
                  C 0,3950 0,4000 0,4050
                  V 4250
                  C 0,4300 50,4350 100,4350
                  H 1000
                  C 1150,4350 1200,4400 1200,4500
                  V 4700
                  C 1200,4800 1150,4850 1000,4850
                  H 400
                  C 250,4850 200,4900 200,5000
                  V 6500
                  C 200,6600 250,6650 400,6650
                  H 800
                  C 950,6650 1000,6700 1000,6800
                  V 7000
                  C 1000,7100 950,7150 800,7150
                  H 200
                  C 100,7150 50,7200 50,7300
                  V 8800
                  C 50,8900 100,8950 200,8950
                  H 1000
                  C 1150,8950 1200,9000 1200,9100
                  V 9300
                  C 1200,9400 1150,9450 1000,9450
                  H 400
                  C 250,9450 200,9500 200,9600
                  V 11075"
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
                d="M 600,0
                  V 1500
                  C 600,1600 650,1650 800,1650
                  H 1000
                  C 1150,1650 1200,1700 1200,1800
                  V 2000
                  C 1200,2100 1150,2150 1000,2150
                  H 400
                  C 250,2150 200,2200 200,2300
                  V 3800
                  C 200,3900 150,3950 100,3950
                  H 50
                  C 0,3950 0,4000 0,4050
                  V 4250
                  C 0,4300 50,4350 100,4350
                  H 1000
                  C 1150,4350 1200,4400 1200,4500
                  V 4700
                  C 1200,4800 1150,4850 1000,4850
                  H 400
                  C 250,4850 200,4900 200,5000
                  V 6500
                  C 200,6600 250,6650 400,6650
                  H 800
                  C 950,6650 1000,6700 1000,6800
                  V 7000
                  C 1000,7100 950,7150 800,7150
                  H 200
                  C 100,7150 50,7200 50,7300
                  V 8800
                  C 50,8900 100,8950 200,8950
                  H 1000
                  C 1150,8950 1200,9000 1200,9100
                  V 9300
                  C 1200,9400 1150,9450 1000,9450
                  H 400
                  C 250,9450 200,9500 200,9600
                  V 11075"
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
          {/* Hero Section */}
          <section id="hero" className="min-h-screen flex items-center justify-center">
            <div className="container mx-auto px-6 z-10 text-center">
              <h1 className="text-5xl font-bold mb-6 uppercase">Tech Developer</h1>
              <p className="text-xl mb-8">The ultimate 'Jack of all trades'</p>
              <a href="#work" className="text-primary hover:text-white transition-colors">View My Work</a>
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
                    src="/assets/images/tools/mika.png"
                    className="rounded-full w-80 h-80 mx-auto saturate-50"
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
              <div className="flex flex-col md:flex-row gap-12">
                <div className="md:w-1/2">
                  <div className="grid grid-cols-2 gap-4">
                    <ul className="space-y-2 list-disc list-inside">
                      <li>React & Next.js</li>
                      <li>SciChart.js</li>
                      <li>JavaScript</li>
                      <li>TypeScript</li>
                      <li>Tailwind CSS</li>
                    </ul>
                    <ul className="space-y-2 list-disc list-inside">
                      <li>Git</li>
                      <li>Node.js</li>
                      <li>Express.js</li>
                      <li>MongoDB</li>
                      <li>PostgreSQL</li>
                    </ul>
                    <ul className="space-y-2 list-disc list-inside">
                      <li>Redis</li>
                      <li>Docker</li>
                      <li>Kubernetes</li>
                    </ul>
                  </div>
                </div>
                <div className="md:w-1/2">
                  <div className="grid grid-cols-6 gap-4">
                    {/* Skill icons */}
                    <div className="skill-icon relative" data-tooltip="React.js - Building reusable components and managing state efficiently &#x1F534;&#x1F534;&#x1F534;&#x1F534;">
                      <i className="fab fa-react text-3xl"></i>
                    </div>
                    <div className="skill-icon relative" data-tooltip="Next.js - Server-side rendering and static site generation &#x1F534;&#x1F534;&#x1F534;">
                      <i className="fas fa-server text-3xl"></i>
                    </div>
                    <div className="skill-icon relative" data-tooltip="JavaScript - ES6+ features and modern development &#x1F534;&#x1F534;&#x1F534;">
                      <i className="fab fa-js text-3xl"></i>
                    </div>
                    <div className="skill-icon relative" data-tooltip="TypeScript - Type safety and better code organization &#x1F534;&#x1F534;">
                      <i className="fab fa-typescript text-3xl"></i>
                    </div>
                    <div className="skill-icon relative" data-tooltip="Tailwind CSS - Utility-first styling &#x1F534;">
                      <i className="fas fa-paint-brush text-3xl"></i>
                    </div>
                    <div className="skill-icon relative" data-tooltip="Git - Version control and collaboration &#x1F534;&#x1F534;&#x1F534;&#x1F534;">
                      <i className="fab fa-git text-3xl"></i>
                    </div>
                    <div className="skill-icon relative" data-tooltip="Node.js - Backend development with JavaScript &#x1F534;&#x1F534;">
                      <i className="fab fa-node text-3xl"></i>
                    </div>
                    <div className="skill-icon relative" data-tooltip="MongoDB - NoSQL database &#x1F534;">
                      <i className="fas fa-database text-3xl"></i>
                    </div>
                    <div className="skill-icon relative" data-tooltip="SciChart.js - Real-time data visualization &#x1F534;&#x1F534;&#x1F534;">
                      <i className="fas fa-chart-line text-3xl"></i>
                    </div>
                    <div className="skill-icon relative" data-tooltip="Electron - Cross-platform desktop application &#x1F534;&#x1F534;">
                      <i className="fas fa-desktop text-3xl"></i>
                    </div>
                    <div className="skill-icon relative" data-tooltip="IFPS - Decentralized storage &#x1F534;">
                      <i className="fas fa-cloud text-3xl"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Other Skills */}
          <section id="otherSkills" className="py-20">
            <div className="container mx-auto px-6">
              <h2 className="text-5xl font-bold text-center mb-12 uppercase">OTHER SKILLS</h2>
              <div className="flex flex-col md:flex-row gap-12">
                <div className="md:w-1/2">
                  <div className="grid grid-cols-2 gap-4">
                    <ul className="space-y-2 list-disc list-inside">
                      <li>Blender</li>
                      <li>Unreal Engine</li>
                      <li>3D Printing</li>
                      <li>Live Streaming</li>
                      <li>Trading</li>
                      <li>Google Sheets</li>
                      <li>FL Studio Music Composer</li>
                    </ul>
                    <ul className="space-y-2 list-disc list-inside"></ul>
                    <ul className="space-y-2 list-disc list-inside"></ul>
                  </div>
                </div>
                <div className="md:w-1/2">
                  <div className="grid grid-cols-6 gap-4">
                    <div className="skill-icon relative" data-tooltip="Blender - 3D Modeling">
                      <i className="fab fa-blender text-3xl"></i>
                    </div>
                    <div className="skill-icon relative" data-tooltip="Unreal Engine - Game Development">
                      <i className="fab fa-unreal-engine text-3xl"></i>
                    </div>
                    <div className="skill-icon relative" data-tooltip="3D Printing - FDM/SLA Printing">
                      <i className="fas fa-print text-3xl"></i>
                    </div>
                    <div className="skill-icon relative" data-tooltip="Live Streaming - YouTube/Twitch">
                      <i className="fab fa-youtube text-3xl"></i>
                    </div>
                    <div className="skill-icon relative" data-tooltip="Trading - Stock/Crypto Trading">
                      <i className="fas fa-chart-pie text-3xl"></i>
                    </div>
                    <div className="skill-icon relative" data-tooltip="Google Sheets - Spreadsheets">
                      <i className="fas fa-table text-3xl"></i>
                    </div>
                    <div className="skill-icon relative" data-tooltip="FL Studio - Music Composition">
                      <i className="fas fa-music text-3xl"></i>
                    </div>
                  </div>
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
              {["all", "Racing", "Game Development", "Apps", "Scripting"].map((filter) => (
                <span
                  key={filter}
                  className={`badge mr-2 mb-2 ${activeFilter === filter ? "active" : ""}`}
                  data-filter={filter}
                  onClick={() => handleFilterClick(filter)}
                  style={{ cursor: "pointer" }}
                >
                  {filter === "all" ? "All" : filter}
                </span>
              ))}
            </div>
          </div>
          <div id="tools-grid" className="grid md:grid-cols-3 gap-12">
            {[{
                category: "Racing",
                imgSrc: "https://raw.githubusercontent.com/Mikaele01/simhub-dashboard/main/simhub-dashboard.png",
                alt: "SimHub Dashboard",
                title: "SimHub Dashboard",
                description: "A customizable dashboard for SimHub, a racing simulator.",
                link: "https://github.com/Mikaele01/simhub-dashboard",
                linkText: "Download Now",
              },
              {
                category: "Game Development",
                imgSrc: "https://emittersgame.com/assets/images/1.jpg",
                alt: "Emitters Game",
                title: "Emitters Game",
                description: "This is one of my biggest project, a game created from scratch and an awesome website for it. Emitters is a fast-paced, first-person experience set in a future taken over by deadly hi-tech drones.",
                link: "https://emittersgame.com",
                linkText: "Visit Website",
              },
              {
                category: "Apps",
                imgSrc: "https://github.com/Mikaele01/MikasCodesApp/blob/main/assets/images/screenshot.png?raw=true",
                alt: "Mikas Codes App",
                title: "Mikas Codes App",
                description: "An Electron app for storing and generating codes. Logging tasks hour for daily job, super efficient.",
                link: "https://github.com/Mikaele01/MikasCodesApp",
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
                imgSrc: "/assets/images/tools/ipfs.png",
                alt: "IFPSTutorial",
                title: "IFPS Limitless Cloud Storage",
                description: "A cloud file storage using web3 technology (IFPS). This is a personal project to improve my flow when it comes to transfer files in the easiest way possible, no google account required and easily transferable to mobile devices, no cloud storage limit as its basically p2p scattered files.",
                link: "https://github.com/Mikaele01/IFPSTutorial",
                linkText: "View on GitHub",
              },
              {
                category: "Game Development",
                imgSrc: "/assets/images/tools/shoot.png",
                alt: "Shooter",
                title: "Shooter",
                description: "This is my first project I ever made, it was a lot of fun to make in my beginner days with html, css and js (and php at the time).",
                link: "https://mikaele01.github.io/Shooter/",
                linkText: "Play Now",
              }
            ].map((tool, index) => {
              const isVisible = activeFilter === "all" || tool.category === activeFilter;
              return (
                <div
                  key={index}
                  className={`card rounded-lg p-8 ${isVisible ? "block" : "hidden"}`}
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
                    <a href={tool.link} className="btn-minimal">
                      {tool.linkText}
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
            </div>
          </section>

          {/* Contact Section */}
          <section id="contact" className="py-20">
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
