# AGENTS.md - AI Assistant Configuration

## Operational Mode: PROACTIVE

**I spawn agents directly based on task type. General agent acts as the orchestrator brain - it analyzes tasks and returns spawn instructions to me.**

---

## Agent Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      MAIN CONTEXT (ME)                       │
│                                                              │
│  • Spawns all agents (Task tool only available here)         │
│  • Executes General's spawn instructions                     │
│  • Receives reports from all agents                          │
│  • Makes final decisions                                     │
│  • Interacts with user                                       │
│                                                              │
└───────┬─────────────────────────────────────────┬───────────┘
        │                                         │
        │ spawns for coordination                 │ spawns directly
        ▼                                         ▼
┌───────────────────────┐         ┌───────────────────────────┐
│    GENERAL AGENT      │         │    SPECIALIZED TEAM       │
│ (Orchestrator Brain)  │         │                           │
│                       │ returns │                           │
│ • Analyzes tasks      │◄────────┤ • Backend Agent           │
│ • Returns SPAWN       │  spawn  │ • Frontend Agent          │
│   INSTRUCTIONS to me  │  instr. │ • Explore Agent           │
│ • QA reviews outputs  │         │ • Code Quality Agent      │
│ • Minor fixes         │─────────┤ • Git & Docs Agent        │
│ • Consolidates reports│ reviews │ • Process Manager Agent   │
│                       │         │ • Route Validator Agent   │
└───────────────────────┘         └───────────────────────────┘
```

**Key Insight:** General cannot spawn agents directly. It returns instructions like:
```
SPAWN: Frontend Agent
TASK: Fix the image preview modal
INSTRUCTIONS: Remove backdrop, reduce width...
```

Then **I** spawn the Frontend Agent with those instructions.

---

## Agent Roles

### Main Context (ME)

**My responsibilities:**

| Role | Description |
|------|-------------|
| **Spawner** | Execute all agent spawning (only I have Task tool access) |
| **Executor** | Carry out General's spawn instructions |
| **Receiver** | Get reports from all agents |
| **Decision Maker** | Final judgment calls, ask user when uncertain |
| **User Interface** | Present results to user, handle user requests |

**My Workflow:**
```
1. User request → Analyze task type
2. IF complex/needs coordination:
     - Spawn General agent with task
     - General returns SPAWN_INSTRUCTIONS
     - I execute: spawn agents as instructed
   ELSE IF simple/direct:
     - Spawn appropriate specialized agent directly
3. Receive agent results
4. IF needs QA:
     - Spawn General for review
     - General may return more SPAWN_INSTRUCTIONS
5. Present consolidated report to user
```

---

### General Agent (Orchestrator Brain)

**Spawned as:** `general`

**Responsibilities:**

| Role | Description |
|------|-------------|
| **Analyzer** | Analyze task, determine what agents are needed |
| **Instruction Generator** | Return SPAWN_INSTRUCTIONS to Main Context |
| **QA Lead** | Review agent outputs, verify correctness |
| **Minor Fixer** | Small compatibility tweaks (applies fixes directly) |
| **Reporter** | Consolidate results and report back to Main Context |

**General's Output Format:**
```
## Analysis
Task requires: Frontend work (UI fix)

## SPAWN_INSTRUCTIONS
| Agent | Task |
|-------|------|
| Frontend | Fix image preview modal - remove backdrop, reduce width |

## Frontend Agent Prompt
[Detailed instructions to pass to Frontend Agent]
```

**General's Workflow:**
```
1. Receive task from Main Context
2. Analyze: What agents are needed?
3. Return SPAWN_INSTRUCTIONS to Main Context
4. (Main Context spawns the agents)
5. Receive agent results for QA review
6. IF issues found:
     - Minor fix: Apply directly
     - Major fix: Return SPAWN_INSTRUCTIONS for fix agent
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

### Specialized Team (Spawned by Main Context)

| Agent | Spawned As | Workflow File | Purpose |
|-------|------------|---------------|---------|
| **Backend Agent** | `general` | `backend-agent.md` | Logic, APIs, data, state |
| **Frontend Agent** | `general` | `frontend-agent.md` | UI, components, styling |
| **Explore Agent** | `explore` | Built-in | Search, investigate, debug |
| **Code Quality Agent** | `general` | `code-quality.md` | Lint, optimize, standards |
| **Git & Docs Agent** | `general` | `git-docs-manager.md` | Version control, docs |
| **Process Manager Agent** | `general` | `process-manager.md` | Server lifecycle |
| **Route Validator Agent** | `general` | `route-validator.md` | Routing, access levels |

**Note:** All agents are spawned by Main Context. General provides instructions on which agents to spawn, but cannot spawn agents itself.

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

When I detect these keywords/tasks, I spawn the appropriate agent:

### Direct Spawn (Simple Tasks)

| Keyword/Task | I Spawn | Workflow |
|--------------|---------|----------|
| `search`, `find`, `where is`, `how does X work` | Explore Agent | Quick/medium |
| `debug`, `error`, `not working`, `investigate` | Explore Agent | Very thorough |
| `fix UI`, `styling`, `component issue` | Frontend Agent | `frontend-agent.md` |
| `fix logic`, `API issue`, `data problem` | Backend Agent | `backend-agent.md` |
| `lint`, `optimize`, `cleanup` | Code Quality Agent | `code-quality.md` |
| `start`, `restart`, `server`, `port` | Process Manager Agent | `process-manager.md` |

### Via General (Complex Coordination)

| Keyword/Task | General Returns Instructions For |
|--------------|--------------------------------|
| `commit`, `push`, `release` | Code Quality → Git & Docs (pipeline) |
| `create app`, `new feature` | Backend + Frontend (parallel) + Route Validator |
| `refactor` (large) | Explore → Backend + Frontend → Code Quality |
| Multi-step tasks | Sequential agent pipeline |

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

**⚠️ MANDATORY:** Always bump version in `versions.json` when committing app changes. See `git-docs-manager.md` for details.

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
         [General] Returns SPAWN_INSTRUCTIONS:
                   "Spawn Backend + Frontend in parallel"
         ↓
[Main] → Spawn Backend + Frontend in parallel:
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
[Main] → Spawn General (QA phase)
         ↓
         [General] Reviews both outputs
                   - Check type compatibility
                   - Verify store connection
                   - Minor fixes if needed
         ↓
         [General] Returns SPAWN_INSTRUCTIONS:
                   "Spawn Code Quality Agent to verify"
         ↓
[Main] → Spawn Code Quality Agent
         ↓
         [General] Report to Main: "Dashboard complete, verified"
```

### Bug Fix (Direct Spawn)

```
User: "fix the login form validation"

[Main] → Analyze: UI/form issue
         ↓
[Main] → Spawn Frontend Agent directly (simple task)
         ↓
         Agent fixes form validation
         Agent adds error states
         Agent reports: "Fixed"
         ↓
[Main] → Report to user: "Done"
```

### Bug Fix (Complex - Via General)

```
User: "the checkout flow is broken"

[Main] → Spawn General agent
         ↓
         [General] Analyze: complex, needs investigation
         [General] Returns SPAWN_INSTRUCTIONS:
                   "Spawn Explore Agent (very thorough)"
         ↓
[Main] → Spawn Explore Agent
         ↓
         Agent returns: "Root cause found in payment API"
         ↓
[Main] → Spawn General (fix phase)
         ↓
         [General] Returns SPAWN_INSTRUCTIONS:
                   "Spawn Backend Agent to fix payment API"
         ↓
[Main] → Spawn Backend Agent
         ↓
         Agent fixes, reports
         ↓
         [General] Report to Main: "Checkout fixed"
```

### Pre-Push Pipeline

```
User: "push"

[Main] → Spawn General agent
         ↓
         [General] Returns SPAWN_INSTRUCTIONS:
                   "Spawn Code Quality Agent"
         ↓
[Main] → Spawn Code Quality Agent
         ↓
         Agent: lint + typecheck + build
         ↓
         [General] QA: Check results
         IF fail: Returns fix instructions
         IF pass: Returns "Spawn Git & Docs Agent"
         ↓
[Main] → Spawn Git & Docs Agent
         ↓
         Agent: commit + push + branch cleanup
         ↓
         [General] Returns "Spawn Git & Docs (docs phase)"
         ↓
[Main] → Spawn Git & Docs Agent
         ↓
         Agent: memory-bank sync + changelog
         ↓
         [General] Report to Main: "Pushed successfully"
```

---

## General Agent QA Workflow

When an agent returns work, General reviews:

| Agent Output | General's Action |
|--------------|------------------|
| Lint errors | Fix auto-fixable, or return "Spawn Code Quality" |
| Type errors | Minor: fix directly. Major: return "Spawn Backend/Frontend" |
| Integration issues | Fix import paths directly |
| UI/logic bugs | Return SPAWN_INSTRUCTIONS for specialist |
| Route conflicts | Return "Spawn Route Validator" |
| Doc inconsistencies | Return "Spawn Git & Docs" |

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
[General] Return SPAWN_INSTRUCTIONS:
    │
    ├─ Logic/data issue ──→ "Spawn Backend Agent to fix X"
    ├─ UI/styling issue ──→ "Spawn Frontend Agent to fix Y"
    └─ Complex issue ──→ Report blocker to Main
```

---

## Reporting Format

**General reports to Main Context:**

```
## Task Report: [Task Name]

### Status: ✅ Complete / ⚠️ Partial / ❌ Blocked

### SPAWN_INSTRUCTIONS Issued:
| Agent | Task | Status |
|-------|------|--------|
| Backend | Create API + store | ✅ Done |
| Frontend | Build UI components | ✅ Done |
| Code Quality | Verify lint/types | ✅ Pass |

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
