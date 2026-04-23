# Emitters - Developer Tools Web Application

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-black)

A collection of free developer tools and web applications built with Next.js 15, React, Three.js, and modern web technologies.

## Available Tools & Apps

### Trading & Finance
| App | Description |
|-----|-------------|
| [PNL Calendar](https://emitters.app/PNLCalendar) | Trading journal with profit/loss calendar visualization |
| [Daily Todo Tracker](https://emitters.app/todo) | Habit and productivity tracking with charts |

### AI & Voice Assistants
| App | Description |
|-----|-------------|
| [MemoGPT](https://emitters.app/memogpt) | AI prompt manager for ChatGPT and LLM workflows |
| [PC AI Assistant](https://emitters.app/pc-ai-assistant) | Voice-activated AI chat with 3D galaxy visualization |
| [TikTok TTS](https://emitters.app/tiktok-tts) | Text-to-speech for TikTok live streaming |

### 3D & Graphics
| App | Description |
|-----|-------------|
| [3D CAD](https://emitters.app/cad3d) | Browser-based 3D modeling with STL/OBJ export |
| [G-Code Timelapse](https://emitters.app/gcode-timelapse) | Visualize 3D prints from G-code files |
| [Camera Effects](https://emitters.app/camera-effects) | Real-time webcam filters and AR effects |

### Development Utilities
| App | Description |
|-----|-------------|
| [Image Compressor](https://emitters.app/image-compressor) | Bulk compress images to target file size |
| [3D Printer Monitor](https://emitters.app/printer-monitor) | Multi-camera monitoring for 3D printers |
| [Sounder](https://emitters.app/sounder) | Audio sampler and music production tool |
| [EMF Detector](https://emitters.app/emf-detector) | Electromagnetic field simulator |

### Gaming Tools
| App | Description |
|-----|-------------|
| [S.T.A.L.K.E.R. 2 Ammo Tracker](https://emitters.app/stalker2-ammo) | Ammo and inventory management for S.T.A.L.K.E.R. 2 |

## Tech Stack

- **Framework:** Next.js 15 (App Router) with Turbopack
- **Language:** TypeScript
- **UI Components:** React 18, Tailwind CSS, Shadcn UI
- **3D Graphics:** Three.js, React Three Fiber, Drei, React Three Postprocessing
- **State Management:** Zustand
- **Database:** Supabase (for todo tracker)
- **Deployment:** Vercel

## Node.js Version Requirements

This project requires **Node.js 20.x** for compatibility with Vercel's deployment environment and React Three Fiber library.

### Local Development Setup

1. **Using nvm (recommended):**
   ```bash
   nvm install 20
   nvm use 20
   ```

2. **Verify Node.js version:**
   ```bash
   node --version
   # Should output v20.x.x
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

## Project Structure

```
my-app/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── PNLCalendar/       # Trading calendar
│   │   ├── memogpt/           # AI prompt manager
│   │   ├── sounder/           # Audio sampler
│   │   ├── printer-monitor/   # 3D print monitoring
│   │   ├── emf-detector/      # EMF simulator
│   │   ├── gcode-timelapse/   # 3D print visualization
│   │   ├── pc-ai-assistant/   # AI assistant
│   │   ├── cad3d/             # 3D CAD tool
│   │   ├── camera-effects/    # Webcam effects
│   │   ├── tiktok-tts/        # TikTok TTS
│   │   ├── stalker2-ammo/     # Game tracker
│   │   └── image-compressor/  # Image optimizer
│   ├── components/            # Shared React components
│   ├── stores/                # Zustand state stores
│   ├── lib/                   # Utilities
│   └── types/                 # TypeScript definitions
├── public/                    # Static assets
│   ├── robots.txt            # SEO robots file
│   └── sitemap.xml           # XML sitemap
└── package.json
```

## SEO Optimization

This application includes comprehensive SEO features:

- **robots.txt** - Search engine crawling directives
- **sitemap.xml** - XML sitemap with all pages
- **Metadata** - Per-page title, description, and keywords
- **Open Graph** - Social media preview images
- **JSON-LD** - Structured data for search engines

### Keywords

Free developer tools, online utilities, web apps, trading journal, AI prompts, ChatGPT tools, 3D modeling, browser CAD, image compressor, text to speech, TikTok live, 3D printing, webcam effects, music production, game utilities

## Vercel Deployment

### Setup

1. Ensure you have the environment variables set up in Vercel dashboard or locally in a `.env` file. Example variables are listed in `.env.example`.

2. The project includes a `vercel.json` file to configure the build and routing for Vercel.

### Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Build locally to verify
npm run vercel-build

# Deploy to production
vercel --prod
```

Alternatively, connect your GitHub repository to Vercel for automatic deployments on push.

## License

MIT License - feel free to use these tools for any purpose.

## Keywords

developer tools, free online tools, web applications, trading tools, AI assistant, ChatGPT prompts, 3D CAD, image compressor, text to speech, TikTok live tools, 3D printing utilities, music production, habit tracker, productivity apps, browser-based tools
