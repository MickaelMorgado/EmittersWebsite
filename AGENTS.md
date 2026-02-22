# AGENTS.md - AI Assistant Configuration

## Subagent Dedications

### Explore Agent Tasks
| Task | Thoroughness | Description |
|------|--------------|-------------|
| Find API routes/endpoints | medium | Locate route definitions in Next.js app |
| Search React components | quick | Find component usage and patterns |
| Debug complex issues | very thorough | Deep codebase analysis for root cause |
| Architecture analysis | very thorough | Understand system before new features |
| Search memory-bank context | medium | Find relevant project documentation |
| Route discovery | medium | Scan src/app/ for all existing routes |
| Code quality audit | medium | Find lint issues, unused code, optimization opportunities |

### General Agent Tasks
| Task | Description |
|------|-------------|
| Multi-file refactoring | Complex code reorganization |
| Feature implementation | Multi-step feature development |
| Update memory-bank docs | Keep documentation in sync |
| Code review | Analyze code quality post-implementation |
| **Route validation** | Validate and update page.tsx routing (see route-validator.md) |
| Access level audit | Review public/private status of all projects |
| **Process management** | Run, monitor, and reboot project servers (see process-manager.md) |
| **Git & documentation** | Version control, changelogs, SEO/AI discoverability, version tracking (see git-docs-manager.md) |
| **Code quality** | Linting, optimization, best practices, documentation (see code-quality.md) |

## Parallel Workflow Examples

### Bug Investigation Workflow
```
1. Launch explore agent (very thorough) to find root cause
2. Main context remains available for implementing fixes
3. Explore agent returns findings, then apply solution
```

### Feature Addition Workflow
```
1. Launch explore agent (medium) to search existing patterns
2. Parallel: review memory-bank for architectural context
3. Implement using found patterns
4. Optionally: launch general agent to update documentation
```

### Multi-Project Search Workflow
```
1. Launch multiple explore agents in parallel:
   - Agent 1: Search my-app for component X
   - Agent 2: Search tiktok-backend for endpoint Y
2. Consolidate results and proceed with implementation
```

## Project Structure

```
EmittersWebsite/
├── index.html              # Main website entry
├── memory-bank/            # Project documentation hub
├── .agent/workflows/       # Workflow definitions
├── node-projects/
│   ├── my-app/             # Next.js React app (primary)
│   └── tiktok-backend/     # TikTok live connector backend
├── discord-bot/            # Discord bot
├── rtmp/                   # Streaming server
├── tools/                  # Trading and utility tools
└── assets/                 # Static assets (JS, CSS)
```

## Development Commands

### my-app (Next.js)
```bash
cd node-projects/my-app
npm run dev      # Start dev server with Turbopack
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

### tiktok-backend
```bash
cd node-projects/tiktok-backend
npm start        # Run TikTok backend server
```

### Root (Lint All)
```bash
node run-eslint-all.js   # Lint all projects
```

## Code Standards

### ESLint Rules (root)
- `prefer-arrow-callback`: error
- `func-style`: expression (arrow functions)
- `arrow-body-style`: as-needed
- Prettier integration enabled

### TypeScript
- Strict mode enabled in my-app
- Follow existing type patterns

### Code Style
- Use arrow functions for all callbacks
- Avoid `function` keyword declarations
- Keep functions concise, use expression bodies where possible
- Follow patterns in `memory-bank/systemPatterns.md`

## Workflows

Refer to `.agent/workflows/` for specific workflows:
- **new-app.md**: Steps for creating new apps in my-app
- **route-validator.md**: Validate and update page.tsx routing, access levels
- **process-manager.md**: Run, monitor, and reboot project servers
- **git-docs-manager.md**: Version control, changelogs, SEO/AI discoverability
- **code-quality.md**: Linting, optimization, best practices, documentation

## Memory Bank Integration

When making changes, update relevant memory-bank files:

| Change Type | File to Update |
|-------------|----------------|
| New app/feature | `memory-bank/apps-overview.md` |
| Architecture change | `memory-bank/systemPatterns.md` |
| New technology | `memory-bank/techContext.md` |
| Progress update | `memory-bank/progress.md` |
| Active work | `memory-bank/activeContext.md` |
| App-specific docs | `memory-bank/project-specific/apps/` |

**Reference:** `memory-bank/README.md` for full navigation.

## Subagent Thoroughness Guide

| Level | When to Use |
|-------|-------------|
| quick | Simple lookups, single file searches, pattern matching |
| medium | Multi-file searches, API endpoint discovery, component usage |
| very thorough | Bug investigations, architecture analysis, comprehensive reviews |
