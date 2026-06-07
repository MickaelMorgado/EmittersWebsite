# Progress

- [x] Created memory-bank directory  
- [x] Wrote projectbrief.md  
- [x] Wrote productContext.md  
- [x] Wrote systemPatterns.md  
- [x] Wrote techContext.md  
- [x] Wrote activeContext.md  
- [x] Wrote functions.md  
- [x] Wrote progress.md

## 2026-06-07 — Trading Bot v1.3.0

- Live trend ticker (timezone-safe candle age)
- Plain-language news recap (non-trader audience)
- New /api/trading-bot/risk-settings endpoint (persistent daily/weekly/monthly drawdown %)
- OpenRouter chain reorder fastest→slowest + 45s per-model timeout + maxTokens option
- Compact agent cards (debug blocks removed, smaller fonts)
- Build green: fixed 4 pre-existing type errors (agents-status enum, stats:{}, chatAI boolean, STATUS_STYLES)

## 2026-06-04: OpenRouter Migration for Trade Analysis

### OpenRouter Model Chain Swap (architecture / fix)
- **File**: `node-projects/my-app/src/lib/ai.ts`
- **Scope**: `chatAI()` and the OpenRouter code path in `node-projects/my-app/src/app/api/trading-bot/report-history/route.ts` (all three note generators — 50-trade, 500-trade, global recommendation — now pass `{ provider: 'openrouter' }`).
- **New chain**: `OPENROUTER_MODEL` env override → `google/gemma-4-31b-it:free` → `openai/gpt-oss-20b:free` → `nvidia/nemotron-3-nano-30b-a3b:free`. Sequential, first non-empty `choices[0].message.content` wins, `max_tokens: 800`.
- **Reason**: prior chain (`deepseek-v4-flash:free`, `qwen3-next-80b-a3b-instruct:free`, `llama-3.3-70b-instruct:free`) was returning empty/errored responses in production, breaking all three note generators.
- **API route**: `maxDuration` raised to 300s to tolerate OpenRouter free-tier latency.

### mergeNoteUpdates Hardening (logic)
- **File**: `node-projects/my-app/src/app/api/trading-bot/report-history/route.ts`
- **Change**: filters out malformed legacy items whose `content` itself looks like raw JSON (matches `{"id":` / `[{` / `"action":"add"`), preventing the merger from carrying forward corrupted history.
- **Change**: unknown action verbs (anything other than `add` / `update` / `deprecate`) now default to `add` instead of being silently dropped.

### parseJSON Hardening (parser)
- **File**: `node-projects/my-app/src/lib/ai.ts`
- **Change**: extended parse strategy from `direct → markdown-fence → objectMatch` to `direct → markdown-fence → stripPrefix → objectMatch → arrayMatch`. The old single `{[\s\S]*}` regex was over-matching into prose when LLMs emitted commentary alongside JSON.

### ReportCard → Learning Board (UI)
- **Files**: `node-projects/my-app/src/app/trading-bot/components/ReportCard.tsx`, `AIReportsSection.tsx`, `TradeHistorySection.tsx`, `page.tsx`
- **Change**: report card visual treatment refactored into a "Learning Board" layout, unifying the 50-trade, 500-trade, and global-recommendation views under a single label.

### versions.json (1.2.0 → 1.2.1)
- **File**: `node-projects/my-app/src/data/versions.json`
- **Change**: my-app bumped 1.2.0 → 1.2.1 (releasedAt 2026-06-04); 1.2.0 moved to history; history remains capped at 3 entries.

## 2026-03-18: Cursor Follower & Streaming Tools

### ✅ Cursor Follower Application
- **Location**: `node-projects/cursor-follower/`
- **Purpose**: Real-time cursor tracking and streaming overlay
- **Features**:
  - Python mouse tracking using `pyautogui` for system-level cursor access
  - WebSocket server for broadcasting cursor coordinates in real-time
  - Multi-monitor support for cursor tracking across extended displays
  - Velocity-based smooth cursor following with configurable smoothing
  - Portrait/Landscape video mode switching (9:16 and 16:9 aspect ratios)

### ✅ Portrait Video Production Tools
- **Canvas-based streaming**: `getDisplayMedia` + `canvas.captureStream()` pipeline
- **Aspect ratio adaptation**: Automatic letterboxing for portrait video export
- **Social media ready**: Optimized for TikTok, Instagram Reels, YouTube Shorts
- **Real-time overlays**: Cursor visualization with configurable effects

### ✅ Agent Orchestration System
- **Workflow definitions**: Created 6 agent workflows in `.agent/workflows/`
- **Specialized agents**: Backend, Frontend, Explore, Code Quality, Git & Docs, Process Manager, Route Validator
- **Task delegation**: General agent coordinates complex tasks across specialized agents
- **Parallel execution**: Backend + Frontend agents work simultaneously on features

## 2026-03-07: TikTok Analytics App

### ✅ New TikTok Analytics Application
- **Location**: `node-projects/my-app/src/app/tiktok-analytics/`
- **Store**: `node-projects/my-app/src/stores/useTikTokAnalyticsStore.ts`
- **Features**:
  - CSV file import with drag-and-drop support
  - Parses tab-separated values (Post Date, Caption, URL, Metrics Date, Views, Likes, Comments, Shares)
  - Stats cards: Total videos, views, likes, comments, shares
  - Recharts area charts showing engagement over time
  - Data table with sortable columns
  - Click row to open TikTok URL in new tab
  - VersionBadge integration

### ✅ Route & Navigation
- Added link to main page (`/tiktok-analytics`)
- Added to memory-bank/apps-overview.md
- Created app documentation in memory-bank/project-specific/apps/tiktok-analytics.md

## 2026-02-22: Agent Workflow System & Version Tracking

### ✅ Agent Configuration System
- **AGENTS.md**: Main AI assistant configuration file
- **Subagent Dedications**: Explore (quick/medium/very thorough) and General agents
- **5 Workflow Definitions**: new-app, route-validator, process-manager, git-docs-manager, code-quality
- **Integration Points**: Workflows reference each other for coordinated execution

### ✅ Version Tracking Implementation
- **VersionBadge Component**: Reusable React component for all apps
- **versions.json**: Semantic versioning data for 17 projects
- **Features**: Collapsed badge, expandable history (5 versions), release dates, change notes
- **Deployment**: Added to emf-detector as initial implementation

### ✅ SEO & AI Discoverability
- **robots.txt**: Search engine directives with AI crawler permissions
- **sitemap.xml**: Public URL structure for crawlers
- **ai-context.md**: Structured context for AI training systems
- **changelog.md**: Version history tracking

### ✅ Documentation Updates
- Updated memory-bank/activeContext.md
- Updated memory-bank/progress.md
- Created memory-bank/history/2026-02.md
- Created .agent/logs/ directory for process management

## 2026-02-22: Stalker 2 Ammo - Collapsible Sidebar Accordions

### ✅ Accordion Implementation
- **Logistics Scan Accordion:** Converted to collapsible section with severity-based header coloring.
  - Critical alerts: Red header with pulsing "!" badge
  - Warnings: Amber header
  - Info: Blue header
- **AI Assistant Accordion:** Separate collapsible section with amber header styling.
- **Independent State:** Both accordions can be expanded/collapsed independently (both default to expanded).
- **Added ChevronDown icon:** From lucide-react for expand/collapse visual indicator.

### 🔧 Technical Changes
- Added `accordionLogistics` and `accordionAssistant` state variables.
- Added `getLogisticsSeverity()` function to determine highest severity across all alerts.
- New CSS classes: `.ai-accordion`, `.ai-accordion-header`, `.ai-accordion-chevron`, `.severity-badge`.
- Removed old `.ai-message.system` and `.ai-message.assistant` block structure.

### 📋 Next Steps
- **Chat Messages in Accordion:** Move chat messages (screenshot uploads, AI detections, processing state) inside the AI Assistant accordion for better organization.

## 2026-02-21: Stalker 2 Ammo Tracker - Tactical Overhaul & Logistics Engine

### ✅ Advanced Logistics Implementation
- **Magazine-Based Transfers**: Integrated `boxSize` logic for all ammo variants, ensuring transfers and stock adjustments respect in-game magazine capacities.
- **Surplus Detection System**: Implemented KUZNETSOV AI logic to identify inventory surpluses (3x threshold).
- **Caliber-Safety Protocol**: Added logic to suppress surplus alerts if removing the excess would breach the tactical baseline for the overall caliber group.
- **Deficit Reporting**: Updated all alerts to explicitly display the exact count of rounds needed to reach tactical baselines ("Shortage" and "Deficit" metrics).

### ✅ UI/UX Overhaul & Premium Aesthetics
- **Ammo Calibration Modal**: 
    - Implemented real-time search filtering.
    - Added premium tactical styling with left-accent bars and custom checkmark indicators.
    - Integrated hardware identification in the modal header.
- **Site Header Refinement**: 
    - Expanded header geometry for improved spacing (`85px` height).
    - Multi-tone branding ("Zone-Net Munitions") with tactical accent line and top-edge scanner motif.
    - Improved typography and letter spacing for industrial OS feel.
- **Tactical Tiering**:
    - **Purple Grade**: Precision rounds (.308 Match, 7.62x54mm 7N1, 5.56x45mm Mk 262) now feature high-tier purple gradients and glows.
    - **Green Grade**: 9x19mm +P and AP rounds unified under green-tier visuals.
- **Interactive Telemetry**: Clicking surplus alerts now automatically toggles the manifest to Graph View for visual verification.

### ✅ Data Integrity & Nomenclature
- **Accuracy Update**: Renamed "9x19mm Para" to "9x19mm +P" to match in-game data.
- **Supply Logic**: Updated 9x19mm box sizes to 30 rounds and ensured Match rounds are correctly tiered.
- **Audio Feedback**: Unified mechanical audio feedback for all logistics interactions.

### 🎯 Key Technical Achievement
- **Smart Logistics**: Created a non-destructive surplus detection engine that understands cross-variant dependencies within a single caliber group.
- **Tactical UI Design**: Developed a high-density, low-clutter interface that maintains military-grade aesthetics while adding complex filtering and data visualization features.

## 2026-01-22: PC AI Assistant App Implementation

### ✅ Created Complete PC AI Assistant Application
- **Location**: `node-projects/my-app/pc-ai-assistant/`
- **Type**: Standalone Node.js application with galaxy visualization
- **Features**: Voice-activated AI assistant with real-time 3D galaxy particle effects
- **Architecture**: Express.js server with Socket.io for real-time communication

### ✅ Full Implementation Delivered
- **Server Component**: `voice_ollama.js` - Main server with Ollama AI integration and TTS
- **Frontend Components**:
  - `public/index.html` - Web interface with Three.js setup
  - `public/visual.js` - Advanced galaxy visualization engine with 3000 particles
- **Configuration**: `package.json` with all required dependencies (ollama, express, socket.io)
- **Documentation**: Comprehensive `README.md` with setup, usage, and customization instructions

### ✅ Key Technical Features Implemented
- **AI Integration**: Ollama API with Phi-3 Mini model for conversational AI
- **Cross-Platform TTS**: Support for macOS (`say`), Windows (PowerShell), and Linux (`espeak`)
- **Real-time Visualization**: Socket.io synchronized 3D galaxy with speech-reactive animations
- **Custom Glow Effects**: Additive-blending particle halos without complex post-processing
- **State-Based Coloring**: Dynamic color changes (Red→Blue→Green→White) reflecting conversation phases
- **Performance Optimized**: InstancedMesh for 3000+ particles with efficient rendering

### ✅ Complete Setup and Testing
- **Dependencies Installed**: All npm packages successfully installed
- **Project Structure**: Properly organized with public/ directory for static assets
- **Memory Bank Updated**: Documented in activeContext.md and progress.md
- **Navigation Added**: Link added to main my-app page for easy access
- **Ready for Use**: Application can be started with `npm start` and accessed at localhost:3000

### 🎯 Technical Achievements
- **3D Graphics**: Advanced Three.js implementation with custom glow effects and particle systems
- **Real-time Communication**: Socket.io integration for seamless voice-visual synchronization
- **AI Integration**: Local LLM integration with Ollama for privacy-focused AI conversations
- **Cross-Platform Compatibility**: TTS support across all major operating systems
- **Performance**: Optimized rendering pipeline handling thousands of particles in real-time
- **User Experience**: Intuitive terminal-based interaction with stunning visual feedback

## 2025-12-08: DataVisualizer Enhancements & Shared Components

### ✅ Enhanced DataVisualizer with Multiple Numeric Comparisons
- **Added multiple comparison inputs**: Users can now add unlimited numeric datasets with individual colors
- **Visibility toggles**: Each comparison has an eye/eye-slash button to show/hide datasets
- **Dynamic UI**: Add/remove comparison buttons with smooth interactions
- **Centralized blending**: All galaxies render in the same space for proportional visualization
- **ChatGPT integration**: AI can populate the first comparison input with processed numeric values

### ✅ Created Shared Sidebar Component
- **Location**: `node-projects/my-app/src/components/sidebar.tsx`
- **Features**: Collapsible overlay sidebar with backdrop blur and smooth transitions
- **Consistent transparency**: Uses `bg-[rgba(0,0,0,0.75)]` for reliable cross-browser opacity
- **Reusable design**: Toggle button, optional title, scrollable content area
- **Floating overlay**: Always appears on top of main content without shifting layout

### ✅ Updated Both Apps to Use Shared Sidebar
- **DataVisualizer**: Replaced floating control panel with sidebar overlay
- **Printer-Monitor**: Migrated from inline sidebar to shared component
- **Consistent UX**: Identical sidebar behavior across all applications
- **Maintainability**: Single source of truth for sidebar styling and functionality

### 🎯 Key Technical Achievements
- **Component Architecture**: Created reusable React component with TypeScript interfaces
- **State Management**: Proper handling of multiple comparison states with visibility toggles
- **3D Visualization**: Enhanced galaxy rendering system for comparative data display
- **UI/UX Consistency**: Unified sidebar experience across the application ecosystem
- **Performance**: Efficient rendering with conditional visibility checks

### 📋 Implementation Details
- **Galaxy Component**: Added xOffset prop (though not used for central blending)
- **Comparison State**: Array of `{number, color, visible}` objects with full CRUD operations
- **Sidebar Props**: `isOpen`, `onToggle`, `children`, `title` for flexible usage
- **CSS Classes**: Proper z-indexing and backdrop-blur for overlay effect
- **Responsive Design**: Sidebar adapts between collapsed (w-12) and expanded (w-[500px]) states

### 🔧 2025-12-19: Fixed Max Updraw Calculation Bug
- **Issue Identified**: The max updraw calculation in `profitabilityCalculation()` was using incorrect logic (`trough - peak` instead of `peak - trough`)
- **Root Cause**: Updraw represents maximum recovery from drawdowns, not the inverse of drawdown
- **Fix Applied**: Corrected calculation to track maximum recovery when new peaks are reached after drawdowns
- **Variable Renamed**: Changed `maxUpdrawn` to `maxUpdraw` for grammatical consistency
- **Impact**: Now properly calculates the maximum amount recovered from any drawdown period
- **Testing**: Verified logic handles peak/trough tracking correctly across equity curve

### 🔧 2025-12-19: Added Total Wins/Losses Count
- **Issue Identified**: Backtesting results only showed consecutive wins/losses but not total wins/losses count
- **User Feedback**: "I noticed that I have only Consecutive Wins and Consecutive Losses, but forgot simply wins and losses count"
- **Fix Applied**: Added `totalWins` and `totalLosses` counters in `profitabilityCalculation()` function
- **Display Updated**: Added total wins and losses lines in the results output
- **Impact**: Now displays both total wins/losses and consecutive wins/losses for comprehensive trade statistics
