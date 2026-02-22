# AGENTS.md - AI Assistant Configuration

## Operational Mode: PROACTIVE

**I will automatically spawn the General agent to coordinate the specialized team. General acts as QA, Fixer, and Reporter.**

---

## Agent Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      MAIN CONTEXT (ME)                       │
│                                                              │
│  • Receives reports from General agent                       │
│  • Makes final decisions                                     │
│  • Interacts with user                                       │
│                                                              │
└─────────────────────┬───────────────────────────────────────┘
                      │ spawns & receives reports
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                     GENERAL AGENT                            │
│              (QA + Coordinator + Reporter)                   │
│                                                              │
│  • Spawns and coordinates specialized team                   │
│  • Reviews all agent outputs (QA)                            │
│  • Minor compatibility fixes & tweaks                        │
│  • Ensures compatibility between agent outputs               │
│  • Reports consolidated results to Main Context              │
│                                                              │
└─────────────────────┬───────────────────────────────────────┘
                      │ spawns & coordinates
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    SPECIALIZED TEAM                          │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              DEVELOPMENT PAIR (Parallel)                 ││
│  │  ┌─────────────────┐    ┌─────────────────┐             ││
│  │  │  Backend Agent  │◄──►│ Frontend Agent  │             ││
│  │  │ (Logic & Data)  │    │  (UI & Styling) │             ││
│  │  └─────────────────┘    └─────────────────┘             ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌──────────┬──────────┬──────────┬──────────┬────────────┐ │
│  │ Explore  │ Code     │ Git &    │ Process  │ Route      │ │
│  │ Agent    │ Quality  │ Docs     │ Manager  │ Validator  │ │
│  │          │ Agent    │ Agent    │ Agent    │ Agent      │ │
│  └──────────┴──────────┴──────────┴──────────┴────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Agent Roles

### Main Context (ME)

**My responsibilities:**

| Role | Description |
|------|-------------|
| **Receiver** | Get consolidated reports from General agent |
| **Decision Maker** | Final judgment calls, ask user when uncertain |
| **User Interface** | Present results to user, handle user requests |

**My Workflow:**
```
1. User request → Spawn General agent with task
2. General coordinates team and does QA
3. General reports back with results
4. Present consolidated report to user
```

---

### General Agent (QA + Coordinator + Reporter)

**Spawned as:** `general`

**Responsibilities:**

| Role | Description |
|------|-------------|
| **Coordinator** | Detect tasks, spawn appropriate agents, manage workflows |
| **QA Lead** | Review all agent outputs, verify correctness, ensure quality |
| **Minor Fixer** | Small compatibility tweaks, adjust agent work for integration |
| **Reporter** | Consolidate results and report back to Main Context |

**General's Workflow:**
```
1. Receive task from Main Context
2. Analyze and spawn appropriate agent(s)
3. Monitor agent execution
4. Review agent output (QA)
5. IF issues found:
     - Minor fix: Apply directly (compatibility tweaks)
     - Major fix: Spawn Backend/Frontend agent to fix
     - Blocker: Report to Main Context
6. Verify final result
7. Report consolidated results to Main Context
```

**What General Fixes vs Passes to Specialists:**

| Issue Type | Action |
|------------|--------|
| Import path corrections | Fix directly |
| Type mismatches (minor) | Fix directly |
| Lint auto-fixes | Fix directly |
| Logic bugs | → Backend Agent |
| UI bugs | → Frontend Agent |
| Complex refactors | → Backend + Frontend (parallel) |

---

### Specialized Team (Spawned by General)

| Agent | Spawned As | Workflow File | Purpose |
|-------|------------|---------------|---------|
| **Backend Agent** | `general` | `backend-agent.md` | Logic, APIs, data, state |
| **Frontend Agent** | `general` | `frontend-agent.md` | UI, components, styling |
| **Explore Agent** | `explore` | Built-in | Search, investigate, debug |
| **Code Quality Agent** | `general` | `code-quality.md` | Lint, optimize, standards |
| **Git & Docs Agent** | `general` | `git-docs-manager.md` | Version control, docs |
| **Process Manager Agent** | `general` | `process-manager.md` | Server lifecycle |
| **Route Validator Agent** | `general` | `route-validator.md` | Routing, access levels |

---

## Development Pair (Backend + Frontend)

The Backend and Frontend agents work in parallel like a pair programming team.

### Backend Agent (`general` → `backend-agent.md`)

**Purpose:** Logic, APIs, data management

| Responsibility | Examples |
|----------------|----------|
| API Routes | REST endpoints, server actions |
| Business Logic | Algorithms, calculations, validation |
| State Management | Zustand stores, data flow |
| Data Fetching | API calls, caching, transformations |
| Server-Side | Server components, middleware |
| Integrations | External APIs, databases |
| Types/Interfaces | Data contracts for Frontend |

**Outputs:** API routes, stores, types, server actions

---

### Frontend Agent (`general` → `frontend-agent.md`)

**Purpose:** UI, components, styling

| Responsibility | Examples |
|----------------|----------|
| UI Components | React components, layouts |
| Pages | Route pages, page structure |
| Styling | Tailwind, animations, responsive |
| Forms | Form UI, validation feedback |
| Interactions | Events, hover states, transitions |
| Accessibility | ARIA, keyboard, semantics |
| Client-Side | Browser APIs, client components |

**Outputs:** Components, pages, styles, hooks

---

### Pair Programming Pattern

```
Task: "Add user management feature"

[General] → Spawn Backend + Frontend in parallel

[Backend Agent]                    [Frontend Agent]
      │                                  │
      ├─ Define User types ─────────────►│
      │    interface User { ... }        │  Use User type
      │                                  │  Build UserCard component
      ├─ Create /api/users              │
      │    GET, POST handlers            │  Build UserList component
      │                                  │
      ├─ Set up useUserStore            │  Add loading states
      │    Zustand store                 │
      │                                  │  Connect to useUserStore
      └─ Export types & store ──────────►│
                                         │
      ◄─────── Integration ready ────────┘
                     │
                     ▼
              [General] QA Review
                     │
                     ▼
              Report to Main
```

---

## Auto-Spawn Triggers

When I detect these keywords/tasks, I spawn General agent with the appropriate instructions:

| Keyword/Task | General Spawns | Workflow |
|--------------|----------------|----------|
| `lint`, `optimize`, `cleanup`, `refactor` | Code Quality Agent | `code-quality.md` |
| `start`, `restart`, `crash`, `server`, `port` | Process Manager Agent | `process-manager.md` |
| `commit`, `push`, `version`, `changelog`, `release` | Git & Docs Agent | `git-docs-manager.md` |
| `route`, `page.tsx`, `new app`, `access level` | Route Validator Agent | `route-validator.md` |
| `search`, `find`, `where is`, `how does X work` | Explore Agent (quick/medium) | Built-in |
| `debug`, `error`, `not working`, `investigate` | Explore Agent (very thorough) | Built-in |
| `update docs`, `sync memory-bank`, `document this` | Git & Docs Agent | `git-docs-manager.md` |
| `create app`, `new feature`, `add feature` | Backend + Frontend (parallel) | Sequential then parallel |
| `fix logic`, `API issue`, `data problem` | Backend Agent | `backend-agent.md` |
| `fix UI`, `styling`, `component issue` | Frontend Agent | `frontend-agent.md` |

---

## Remaining Specialized Agents

### Explore Agent (`explore`)

**Purpose:** Search, investigate, debug codebase

**Thoroughness Levels:**
| Level | Use Case |
|-------|----------|
| `quick` | Single file lookups, simple patterns |
| `medium` | Multi-file searches, API discovery |
| `very thorough` | Deep debugging, architecture analysis |

---

### Code Quality Agent (`general` → `code-quality.md`)

**Purpose:** Lint, optimize, enforce standards

**Commands:**
```bash
node run-eslint-all.js                          # Lint all
cd node-projects/my-app && npm run lint         # Lint my-app
cd node-projects/my-app && npx tsc --noEmit     # Type check
```

---

### Git & Docs Agent (`general` → `git-docs-manager.md`)

**Purpose:** Version control, documentation, SEO

**Commit Format:** `<type>(<scope>): <subject>`

---

### Process Manager Agent (`general` → `process-manager.md`)

**Purpose:** Server lifecycle management

**Managed Processes:**
| Project | Command | Port |
|---------|---------|------|
| my-app | `npm run dev` | 3000 |
| tiktok-backend | `npm start` | 3001 |

---

### Route Validator Agent (`general` → `route-validator.md`)

**Purpose:** Routing, access levels, registration

---

## Orchestration Patterns

### Feature Development (Parallel Pair)

```
User: "add user dashboard with stats"

[Main] → Spawn General agent
         ↓
         [General] Analyze: needs backend (data) + frontend (UI)
         ↓
         [General] → Spawn in parallel:
                     │
                     ├─ [Backend Agent]
                     │    ├─ Define Stats types
                     │    ├─ Create /api/stats endpoint
                     │    ├─ Set up useStatsStore
                     │    └─ Report: "Backend ready"
                     │
                     └─ [Frontend Agent]
                          ├─ Build Dashboard component
                          ├─ Create StatsCard components
                          ├─ Connect to useStatsStore
                          └─ Report: "Frontend ready"
         ↓
         [General] QA: Review both outputs
                   - Check type compatibility
                   - Verify store connection
                   - Test integration
         ↓
         [General] Minor fixes if needed (import paths, type tweaks)
         ↓
         [General] → Spawn Code Quality Agent (verify)
         ↓
         [General] Report to Main: "Dashboard complete, verified"
```

### Bug Fix (Targeted Agent)

```
User: "fix the login form validation"

[Main] → Spawn General agent
         ↓
         [General] Analyze: UI/form issue → Frontend Agent
         ↓
         [General] → Spawn Frontend Agent
                     ↓
                     Agent fixes form validation
                     Agent adds error states
                     Agent reports: "Fixed"
         ↓
         [General] QA: Review fix
         ↓
         [General] Report to Main: "Login validation fixed"
```

### Pre-Push Pipeline

```
User: "push"

[Main] → Spawn General agent
         ↓
         [General] → Spawn Code Quality Agent
                     ↓
                     Agent: lint + typecheck + build
                     ↓
                     [General] QA: Check results
                     IF fail: Minor fixes or spawn Backend/Frontend
         ↓
         [General] → Spawn Git & Docs Agent
                     ↓
                     Agent: commit + push + branch cleanup
         ↓
         [General] → Spawn Git & Docs Agent (docs phase)
                     ↓
                     Agent: memory-bank sync + changelog
         ↓
         [General] Report to Main: "Pushed successfully"
```

---

## General Agent QA Workflow

When an agent returns work, General reviews:

| Agent Output | General's QA Action |
|--------------|---------------------|
| Lint errors | Fix auto-fixable, or spawn Code Quality |
| Type errors | Minor: fix directly. Major: spawn Backend/Frontend |
| Integration issues | Fix import paths, adjust for compatibility |
| UI/logic bugs | Spawn appropriate specialist |
| Route conflicts | Spawn Route Validator |
| Doc inconsistencies | Spawn Git & Docs |

**Fix Decision Tree:**
```
Agent returns work
    ↓
[General] QA: Is it correct?
    │
    ├─YES──→ Accept, proceed
    │
    NO
    ↓
[General] Is it a minor fix? (imports, small tweaks)
    │
    ├─YES──→ Fix directly, verify
    │
    NO
    ↓
[General] Spawn specialist to fix:
    │
    ├─ Logic/data issue ──→ Backend Agent
    ├─ UI/styling issue ──→ Frontend Agent
    └─ Complex issue ──→ Report blocker to Main
```

---

## Reporting Format

**General reports to Main Context:**

```
## Task Report: [Task Name]

### Status: ✅ Complete / ⚠️ Partial / ❌ Blocked

### Agents Spawned:
| Agent | Status | Notes |
|-------|--------|-------|
| Backend | ✅ Done | API + store created |
| Frontend | ✅ Done | UI connected |
| Code Quality | ✅ Pass | No issues |

### Integration Fixes (by General):
- Fixed import path in UserCard.tsx
- Adjusted type in useUserStore.ts

### Files Changed:
- src/app/api/users/route.ts (Backend)
- src/stores/useUserStore.ts (Backend)
- src/components/features/UserCard.tsx (Frontend)
- src/app/users/page.tsx (Frontend)

### Blockers (if any):
- None
```

---

## Project Structure

```
EmittersWebsite/
├── index.html              # Main website entry
├── memory-bank/            # Project documentation hub
├── .agent/workflows/       # Agent workflow definitions
│   ├── backend-agent.md    # Backend Agent workflow
│   ├── frontend-agent.md   # Frontend Agent workflow
│   ├── code-quality.md     # Code Quality Agent workflow
│   ├── git-docs-manager.md # Git & Docs Agent workflow
│   ├── process-manager.md  # Process Manager Agent workflow
│   ├── route-validator.md  # Route Validator Agent workflow
│   └── new-app.md          # New app creation guide
├── node-projects/
│   ├── my-app/             # Next.js React app (primary)
│   │   └── src/
│   │       ├── app/        # Pages & API routes
│   │       ├── components/ # React components
│   │       ├── stores/     # Zustand stores
│   │       ├── lib/        # Utilities
│   │       └── types/      # TypeScript types
│   └── tiktok-backend/     # TikTok live connector backend
├── discord-bot/            # Discord bot
├── rtmp/                   # Streaming server
├── tools/                  # Trading and utility tools
└── assets/                 # Static assets (JS, CSS)
```

---

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

---

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

---

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
