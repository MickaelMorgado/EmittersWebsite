---
description: Agent workflow for validating and updating routing in my-app page.tsx
trigger: When creating new apps, refactoring routes, or auditing project access
---

# Route Validator Agent Workflow

## Purpose

This workflow ensures all projects in `node-projects/my-app/src/app/` are properly:
1. Registered in `src/app/page.tsx` with correct routing
2. Assigned appropriate access level (public/private)
3. Organized in logical sections
4. Documented in memory-bank

## Trigger Conditions

- New app created in `src/app/`
- Route refactoring or renaming
- Periodic audit of project access levels
- User request to review routing

## Workflow Steps

### Step 1: Discover All Routes

```
Scan src/app/ directory for all route folders
Exclude: api, _next, node_modules, .git
List: All folders that represent Next.js routes
```

### Step 2: Compare Against page.tsx

```
Parse PROJECTS object in src/app/page.tsx
Identify:
  - Routes missing from page.tsx
  - Routes in page.tsx that don't exist (orphans)
  - Routes with missing/incorrect href
```

### Step 3: Access Level Assessment

For each new/unassigned project, analyze:

| Criteria | Suggest Public | Suggest Private |
|----------|----------------|-----------------|
| Contains personal data | ❌ | ✅ |
| Financial/blockchain related | ❌ | ✅ |
| API keys or secrets exposed | ❌ | ✅ |
| Work in progress | ❌ | ✅ |
| Demo/showcase ready | ✅ | ❌ |
| External portfolio piece | ✅ | ❌ |
| Contains user credentials | ❌ | ✅ |

**When uncertain → ASK USER**

### Step 4: Section Assignment

Default sections:
- **Main Section**: Personal info, about pages
- **My main projects**: Flagship/completed projects
- **Node Projects**: Interactive web apps
- **Standalone Projects**: External links, separate repos

### Step 5: Apply Updates

1. Add missing entries to `PROJECTS` object
2. Assign appropriate:
   - `title`: Human-readable name
   - `description`: Brief (1 line) description
   - `href`: Route path (e.g., `/app-name`)
   - `accentColor`: RGB string (e.g., `"255, 100, 50"`)
   - `isPublic`: true/false
   - `isExternal`: true (if external link)

3. Remove orphaned entries
4. Update memory-bank/apps-overview.md
5. Create/update app-specific doc in memory-bank/project-specific/apps/

## Output Format

When complete, report:

```
## Route Validation Report

### New Routes Added
| Route | Section | isPublic | accentColor |
|-------|---------|----------|-------------|
| /new-app | Node Projects | false | 100, 200, 50 |

### Orphaned Routes Removed
| Route | Reason |
|-------|--------|
| /old-app | Directory deleted |

### Access Level Changes
| Route | Old | New | Reason |
|-------|-----|-----|--------|
| /blockchain | private | private | Contains wallet data |

### Pending Decisions
| Route | Question |
|-------|----------|
| /new-feature | Should this be public? Contains demo data. |
```

## Example Execution

### Discover Routes
```bash
# Find all route directories
ls -d node-projects/my-app/src/app/*/
```

### Current page.tsx Structure Reference

```typescript
interface Project {
  title: string;
  description: string;
  href: string;
  accentColor: string;
  isPublic?: boolean;    // false = requires unlock
  isExternal?: boolean;  // true = external link
}
```

### Default Access Rules

- **Explicitly Private (isPublic: false)**:
  - Blockchain/wallet projects
  - AI assistants with personal data
  - Admin/internal tools
  - Unfinished experiments

- **Explicitly Public (isPublic: true)**:
  - Portfolio showcases
  - Demo apps
  - External links (GitHub, etc.)

- **Default (no isPublic)**: Treated as private

### Current Access Levels (Reference)

| Project | isPublic | Notes |
|---------|----------|-------|
| About Me (/mika) | true | Personal portfolio |
| Blender Vertex Measurements | true | External GitHub |
| Data Visualizer | true | Demo showcase |
| Sounder | true | Demo showcase |
| 3D Printer Camera Monitor | true | Demo showcase |
| EMF Detector Simulator | true | Demo showcase |
| G-code Timelapse | true | Demo showcase |
| 3D CAD App | true | Demo showcase |
| Camera Effects | true | Demo showcase |
| STALKER 2 Ammo Tracker | true | Demo showcase |
| Blockchains visualizer | false | Contains wallet data |
| PNL Calendar | (default) | Financial data |
| MemoGPT | (default) | Personal AI tool |
| Daily Todo Tracker | (default) | Personal tool |
| Hips Project | (default) | Client work |
| PC AI Assistant | (default) | Personal AI tool |
| TikTok + AI Assistant | (default) | Personal tool |
| Trading Tools | true | External link |

## Memory Bank Updates

After routing changes, update:

1. `memory-bank/apps-overview.md` - Add/remove entries
2. `memory-bank/project-specific/apps/[app-name].md` - Create if new
3. `memory-bank/progress.md` - Note the addition

## Integration with new-app.md

When using `new-app.md` workflow, this route validator should be called as the final step to ensure proper registration.
