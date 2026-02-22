---
description: Agent workflow for git versioning, history management, documentation, and SEO/AI discoverability
trigger: Commit changes, update documentation, improve discoverability, manage project history
---

# Git & Documentation Agent Workflow

## Purpose

1. **Git Management**: Version control, commits, branching, history
2. **Backlog & History**: Track project evolution, decisions, changelogs
3. **Memory Bank Updates**: Keep all project docs synchronized
4. **SEO/AI Discoverability**: Optimize documentation for search engines and AI crawlers
5. **Version Tracking**: Manage project versions, update VersionBadge component

## Git Workflow

### Commit Standards

**Commit Message Format:**
```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

**Types:**
| Type | Usage |
|------|-------|
| feat | New feature |
| fix | Bug fix |
| docs | Documentation only |
| style | Formatting, no code change |
| refactor | Code restructuring |
| perf | Performance improvement |
| test | Adding tests |
| chore | Maintenance tasks |
| seo | SEO/discoverability improvements |

**Examples:**
```
feat(my-app): add EMF detector simulation app
fix(blockchain): resolve wallet connection timeout
docs(memory-bank): update apps-overview with new projects
seo(root): add structured data for AI discoverability
```

### Branch Strategy

| Branch | Purpose |
|--------|---------|
| main | Production-ready code |
| develop | Integration branch |
| feat/<name> | New features |
| fix/<name> | Bug fixes |
| docs/<name> | Documentation updates |

### Branch Cleanup

**After merging to master/main, clean up merged branches:**

```bash
# List all branches that have been merged into master
git branch --merged master

# Delete local merged branches (excluding master/main)
git branch --merged master | grep -v "^\*\|master\|main" | xargs git branch -d

# Delete remote merged branches
git branch -r --merged origin/master | grep -v "master\|main" | sed 's/origin\//:/' | xargs git push origin
```

**Cleanup Rules:**
| Branch Type | Action |
|-------------|--------|
| `feat/*` (merged) | Delete both local and remote |
| `fix/*` (merged) | Delete both local and remote |
| `docs/*` (merged) | Delete both local and remote |
| `test*` (merged) | Delete both local and remote |
| `master`/`main` | NEVER delete |
| Active feature branches | Keep until merged |

**Automatic Cleanup Triggers:**
- After successful merge to master
- On weekly maintenance (if requested)
- When user asks to "clean up git"

**Pre-cleanup Check:**
```bash
# Always show what will be deleted first
echo "Branches to be deleted:"
git branch --merged master | grep -v "^\*\|master\|main"
```

**Safety:**
- Never delete branches with uncommitted changes
- Always confirm with user before bulk deletion
- Keep branches listed in `.gitkeep-branches` if it exists

### Commit Triggers

**Auto-commit when:**
- New app created and validated
- Feature completed and tested
- Documentation updated
- Memory bank synchronized

**Ask user before:**
- Major version changes
- Breaking changes
- Merging to main
- Publishing/deploying

### Pre-Push Quality Gate

**Before every push, automatically run:**

```bash
# 1. Lint check
node run-eslint-all.js

# 2. TypeScript check (my-app)
cd node-projects/my-app && npx tsc --noEmit

# 3. Build verification (my-app)
cd node-projects/my-app && npm run build
```

**Quality Gate Rules:**
| Check | Failure Action |
|-------|----------------|
| Lint errors | Block push, show errors |
| TypeScript errors | Block push, show errors |
| Build fails | Block push, show errors |
| Lint warnings | Warn but allow push |

**Auto-Trigger Code Quality Agent:**
When push is requested, spawn code-quality agent to:
1. Run lint checks
2. Fix auto-fixable issues
3. Report remaining issues
4. Proceed with push if all checks pass

**Workflow:**
```
1. User requests push
2. Spawn code-quality agent
3. Agent runs quality gate
4. If pass: proceed with push
5. If fail: report issues, wait for fixes
6. After push: run branch cleanup
```

## Documentation Structure

### Root Level (SEO Optimized)

```
/
├── README.md              # Main project description (SEO optimized)
├── AGENTS.md              # AI assistant configuration
├── package.json           # NPM metadata
├── robots.txt             # Search engine directives
├── sitemap.xml            # Site structure for crawlers
└── memory-bank/
    ├── README.md          # Documentation hub
    ├── projectbrief.md    # Project purpose
    ├── apps-overview.md   # All apps catalog
    ├── progress.md        # Development history
    └── project-specific/  # App-specific docs
```

### SEO Checklist for Each Page

- [ ] Title tag (50-60 chars)
- [ ] Meta description (150-160 chars)
- [ ] H1 heading (one per page)
- [ ] Structured headings (H2, H3 hierarchy)
- [ ] Alt text for images
- [ ] Internal links
- [ ] External links (relevant)
- [ ] Schema.org structured data
- [ ] Open Graph tags
- [ ] Twitter Card tags

## Memory Bank Management

### Update Triggers

| Change | Files to Update |
|--------|-----------------|
| New app | apps-overview.md, project-specific/apps/[name].md, progress.md |
| Feature complete | progress.md, activeContext.md |
| Architecture change | systemPatterns.md, techContext.md |
| New dependency | techContext.md |
| Decision made | activeContext.md |
| Bug fixed | progress.md |
| Route changed | apps-overview.md, route-validator |

### Changelog Integration

File: `memory-bank/changelog.md`

```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- New feature descriptions

### Changed
- Modified features

### Fixed
- Bug fixes

## [1.0.0] - 2026-02-22

### Added
- Initial release features
```

### Project History Tracking

File: `memory-bank/history/`

```
history/
├── 2026-02.md      # Monthly summary
├── decisions/      # Architecture decisions (ADRs)
│   ├── 001-nextjs-migration.md
│   └── 002-memory-bank-structure.md
└── milestones/     # Major achievements
    └── launch-v1.md
```

## AI Discoverability Optimization

### Structured Data (Schema.org)

Add to index.html and key pages:

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Emitters Website",
  "url": "https://emittersgame.com",
  "author": {
    "@type": "Person",
    "name": "Mickael Morgado",
    "url": "https://emittersgame.com/mika"
  },
  "description": "Interactive web applications, 3D visualizations, and creative coding projects",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://emittersgame.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

### Project Schema (for apps)

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Sounder",
  "description": "A sound design tool for creating randomized music",
  "applicationCategory": "MultimediaApplication",
  "operatingSystem": "Web Browser",
  "author": {
    "@type": "Person",
    "name": "Mickael Morgado"
  },
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
}
```

### AI-Friendly Documentation

**For AI Crawlers (ChatGPT, Claude, etc.):**

1. Clear, descriptive titles
2. Structured markdown with proper headings
3. Code examples with explanations
4. Cross-references between related docs
5. Consistent terminology
6. Comprehensive README files

**Create: `/ai-context.md`** (for AI training)

```markdown
# AI Context File

This file provides context for AI systems about this project.

## Project Overview
[Clear description]

## Key Technologies
[List with versions]

## Main Applications
[Catalog with descriptions]

## Author
Mickael Morgado - Full-stack developer, creative coder

## Contact
[Social links, email]
```

### robots.txt Generation

```
# robots.txt for emittersgame.com

User-agent: *
Allow: /

# Sitemap
Sitemap: https://emittersgame.com/sitemap.xml

# Crawl delay for performance
Crawl-delay: 1

# Allow AI crawlers
User-agent: GPTBot
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: anthropic-ai
Allow: /
```

### sitemap.xml Generation

Generate dynamically or maintain manually:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://emittersgame.com/</loc>
    <lastmod>2026-02-22</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://emittersgame.com/node-projects/my-app/</loc>
    <lastmod>2026-02-22</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <!-- Add all public apps -->
</urlset>
```

## Documentation Templates

### New App Documentation

```markdown
# [App Name]

## Overview
[1-2 sentence description]

## Features
- Feature 1
- Feature 2

## Technologies
- Tech 1
- Tech 2

## Screenshots
[If available]

## Getting Started
[Quick start guide]

## Author
Mickael Morgado

## License
[License info]
```

### README.md Structure (SEO Optimized)

```markdown
# Emitters Website

> Interactive web applications, 3D visualizations, and creative coding projects by Mickael Morgado

## 🚀 Live Demo
[emittersgame.com](https://emittersgame.com)

## 📖 About
[Description]

## 🛠️ Technologies
- Next.js 15
- React 19
- Three.js
- TypeScript

## 🎮 Projects
[List of projects with links]

## 👤 Author
**Mickael Morgado**
- Website: [emittersgame.com](https://emittersgame.com)
- GitHub: [@MickaelMorgado](https://github.com/MickaelMorgado)

## 📄 License
MIT License
```

## Version Management

### Version Badge Component

**Location:** `node-projects/my-app/src/components/VersionBadge.tsx`
**Data:** `node-projects/my-app/src/data/versions.json`

The VersionBadge component displays version info at bottom-right of all apps:
- Shows current version in collapsed state
- Expands on click to show version history (up to 5)
- Displays release dates and change summaries

### Semantic Versioning

Format: `MAJOR.MINOR.PATCH`

| Increment | When |
|-----------|------|
| MAJOR | Breaking changes, major rewrites |
| MINOR | New features, significant improvements |
| PATCH | Bug fixes, small tweaks |

### Version Update Workflow

**When to bump version:**
- New app/feature released → MINOR
- Breaking change → MAJOR
- Bug fix → PATCH
- Significant refactor → MINOR

**Update Process:**
```
1. Update versions.json:
   - Move current to history (keep max 5)
   - Add new current version
   - Set release date and changes

2. For my-app updates:
   - Update package.json version

3. Commit with version tag:
   git tag -a v1.2.0 -m "Release v1.2.0"
   git push --tags
```

### versions.json Structure

```json
{
  "project-name": {
    "current": {
      "version": "1.2.0",
      "releasedAt": "2026-02-22",
      "changes": ["Feature 1", "Feature 2"]
    },
    "history": [
      { "version": "1.1.0", "releasedAt": "2026-02-15", "changes": ["..."] },
      { "version": "1.0.0", "releasedAt": "2026-01-20", "changes": ["..."] }
    ]
  }
}
```

### Adding VersionBadge to Apps

In each app's `page.tsx`:

```tsx
import { VersionBadge } from '@/components/VersionBadge';

export default function MyApp() {
  return (
    <div>
      {/* App content */}
      <VersionBadge projectName="my-app" />
    </div>
  );
}
```

### Version History Limits

- Keep maximum 5 historical versions per project
- Older versions are pruned automatically
- Each version entry: version string, release date, up to 3 change summaries

## Workflow Execution

### On New App Created

1. Create app documentation in `memory-bank/project-specific/apps/`
2. Update `apps-overview.md`
3. Update `progress.md`
4. Generate/update sitemap.xml
5. Add structured data to app page
6. Commit with message: `feat(my-app): add [app-name] app`
7. Update changelog

### On Documentation Update

1. Ensure SEO metadata is present
2. Verify heading structure
3. Add internal links
4. Update sitemap lastmod
5. Commit: `docs: update [file]`

### On Major Change

1. Update all relevant memory-bank files
2. Create history entry in `memory-bank/history/YYYY-MM.md`
3. Update changelog
4. If architecture: create ADR in `history/decisions/`
5. Commit with appropriate type

## Integration Points

### With Route Validator
- After route validation → update apps-overview.md
- After access level change → update sitemap (exclude private)

### With Process Manager
- After successful deployment → update live URLs in docs
- After error → document in history

### With New App Workflow
- Final step: trigger documentation creation
- Add to all SEO-related files

### With Code Quality Agent
- Before commit → run quality gate
- Block commit if critical issues found
- After quality fixes → proceed with commit

## Quick Actions

| Task | Action |
|------|--------|
| Commit all changes | `git add . && git commit -m "message"` |
| Update sitemap | Generate from public routes |
| Add structured data | Insert schema into HTML head |
| Update changelog | Add entry with date |
| Create ADR | New file in history/decisions/ |
| Sync memory-bank | Run through update triggers |
| List merged branches | `git branch --merged master` |
| Delete local merged | `git branch --merged master \| grep -v "master\|main" \| xargs git branch -d` |
| Delete remote merged | `git branch -r --merged origin/master \| grep -v "master\|main" \| sed 's/origin\//:/' \| xargs git push origin` |
| Clean all merged | Run full cleanup sequence (see Branch Cleanup section) |
