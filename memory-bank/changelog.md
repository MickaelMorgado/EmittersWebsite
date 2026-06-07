# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-06-07

### Added
- Live trend card candle-age ticker (timezone-safe, ticks every 1s, no polling lag)
- News agent plain_summary field rendered as "In Plain Words" section
- News agent rejection_reason + Trend agent reasoning fields propagated through dashboard
- /api/trading-bot/risk-settings endpoint (GET/POST) persisting daily/weekly/monthly drawdown %
- New maxTokens chat option (800 default, 250 for short recaps)

### Changed
- OpenRouter model chain reordered fastest→slowest with 45s per-model AbortController timeout
- Trend dashboard polling refactored to recursive setTimeout (no race on new-candle compare)
- Agent cards compacted (removed debug blocks, smaller fonts)

### Fixed
- Polling race between concurrent trend-signal fetches
- 4 pre-existing baseline build errors (agents-status enum, stats:{}, chatAI boolean, STATUS_STYLES color)

## [Unreleased]

### Added
- Agent workflow system with AGENTS.md configuration
- Route validator workflow for project routing management
- Process manager workflow for server monitoring
- Git & documentation workflow for versioning and SEO
- Code quality workflow for linting and optimization
- VersionBadge component for version tracking across all apps
- versions.json data file with semantic versioning for 17 projects
- SEO files: robots.txt, sitemap.xml, ai-context.md
- Memory-bank history tracking system
- Cursor Follower interactive web app
- AI-context.md enhanced for LLM discoverability

### Changed
- Enhanced project organization with dedicated workflows
- Updated documentation structure for AI discoverability
- Expanded robots.txt with comprehensive AI crawler directives

## [1.0.0] - 2026-02-22

### Added
- Interactive 3D blockchains and token visualizer
- Data Visualizer - Interactive 3D data visualization
- Sounder - Sound design tool for randomized music
- Daily Todo Tracker
- Hips Project landing page
- 3D Printer Camera Monitor
- EMF Detector Simulator
- G-code Timelapse visualization
- PC AI Assistant with galaxy visualization
- 3D CAD App
- Camera Effects with real-time filters
- TikTok + AI Assistant integration
- STALKER 2 Ammo Tracker
- MemoGPT - AI-powered memo and prompt manager
- PNL Calendar project
- Blender Vertex Measurements add-on

### Technologies
- Next.js 15 with Turbopack
- React 19
- Three.js for 3D graphics
- TypeScript strict mode
- Tailwind CSS

---

## Version History Summary

| Version | Date | Highlights |
|---------|------|------------|
| 1.0.0 | 2026-02-22 | Initial release with 15+ interactive projects |
