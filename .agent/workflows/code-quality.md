---
description: Agent workflow for code quality, linting, optimization, and documentation
trigger: After feature completion, before commits, periodic code review, user request
---

# Code Quality Agent Workflow

## Purpose

1. **Linting**: Enforce code standards, fix violations
2. **Tidyness**: Organize imports, remove unused code
3. **Optimization**: Performance improvements, bundle size
4. **Best Practices**: Modern patterns, TypeScript best practices
5. **Documentation**: Concise JSDoc comments

## Quality Standards

### ESLint Rules (Enforced)

```javascript
// Already configured in eslint.config.js
'prefer-arrow-callback': 'error',
'func-style': ['error', 'expression'],
'arrow-body-style': ['error', 'as-needed'],
'prefer-arrow/prefer-arrow-functions': 'error'
```

### TypeScript Standards

| Rule | Practice |
|------|----------|
| Strict mode | Enabled - no `any` without justification |
| Type imports | Use `import type { X }` for types only |
| Interface vs Type | Prefer `interface` for objects, `type` for unions |
| Nullish | Use `??` over `\|\|` for null/undefined checks |
| Optional chaining | Use `?.` for safe property access |

### Code Style Preferences

| Preference | Correct | Incorrect |
|------------|---------|-----------|
| Functions | `const fn = () => {}` | `function fn() {}` |
| Exports | `export const X = {}` | `export default X` (named preferred) |
| Async | `async () => {}` | `.then().catch()` chains |
| Immutability | `const`, spread, Object.freeze | `let`, mutations |
| Destructuring | `const { a, b } = obj` | `const a = obj.a` |

## Workflow Steps

### Step 1: Lint Check

```bash
# Root level - all projects
node run-eslint-all.js

# my-app specific
cd node-projects/my-app && npm run lint

# With auto-fix
eslint --fix src/
```

### Step 2: TypeScript Check

```bash
cd node-projects/my-app
npx tsc --noEmit
```

### Step 3: Code Cleanup

**Actions:**
- [ ] Remove unused imports
- [ ] Remove unused variables/functions
- [ ] Remove commented-out code (unless intentional)
- [ ] Remove console.log (replace with proper logging if needed)
- [ ] Sort imports alphabetically
- [ ] Group imports: external → internal → relative
- [ ] Remove duplicate code (DRY)

**Import Order:**
```typescript
// 1. React/Next
import { useState, useEffect } from 'react';
import Link from 'next/link';

// 2. External libraries
import { motion } from 'framer-motion';
import * as THREE from 'three';

// 3. Internal components/utilities
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// 4. Types
import type { Project } from '@/types';

// 5. Relative imports
import { LocalComponent } from './LocalComponent';
```

### Step 4: Optimization Checks

| Category | Check | Action |
|----------|-------|--------|
| Bundle size | Large imports | Use tree-shaking, dynamic imports |
| React | Re-renders | useMemo, useCallback, React.memo |
| Images | Unoptimized | Use next/image, lazy loading |
| Fonts | Loading all | Subset fonts, use variable fonts |
| CSS | Unused styles | Tailwind purge, remove dead CSS |
| Dependencies | Outdated/vulnerable | `npm audit`, `npm outdated` |

**Bundle Analysis:**
```bash
cd node-projects/my-app
npm run build
npx analyze  # If configured
```

### Step 5: Modern Patterns Check

| Pattern | Implementation |
|---------|---------------|
| State | Prefer `useReducer` for complex state |
| Effects | Use `useSyncExternalStore` for external data |
| Context | Split contexts for unrelated values |
| Refs | Use callback refs for DOM elements |
| Events | Use `useEffectEvent` for non-reactive logic |
| Server | Use Server Components by default in Next.js 15 |

### Step 6: Documentation

**JSDoc Format (Short):**

```typescript
/** Calculates total price with tax */
const calculateTotal = (price: number, tax: number) => price * (1 + tax);

/** Fetches user data by ID */
const fetchUser = async (id: string): Promise<User> => {
  // ...
};

interface Project {
  /** Display name */
  title: string;
  /** RGB color string (e.g., "255, 100, 50") */
  accentColor: string;
}
```

**When to Document:**
- ✅ Public APIs and utilities
- ✅ Complex algorithms
- ✅ Non-obvious business logic
- ✅ Type definitions with special formats
- ❌ Self-explanatory code
- ❌ Getters/setters
- ❌ Simple one-liners

**File Header (Optional for complex files):**
```typescript
/**
 * EMF Detector Simulator
 * Simulates radiation scanner with sonar feedback
 */
```

## Quality Report Format

```
## Code Quality Report

### Files Checked: 45
### Issues Found: 12
### Auto-fixed: 8
### Needs Manual Review: 4

### Lint Issues
| File | Line | Issue | Status |
|------|------|-------|--------|
| src/app/page.tsx | 42 | Unused import 'useState' | Auto-fixed |
| src/lib/utils.ts | 15 | Missing return type | Manual |

### Optimization Suggestions
| File | Issue | Suggestion |
|------|-------|------------|
| src/components/Heavy.tsx | Large component | Split into smaller components |
| src/app/layout.tsx | Synchronous font load | Use next/font |

### Documentation Added
| File | Added |
|------|-------|
| src/lib/calc.ts | 3 JSDoc comments |

### Score: 85/100
- Lint: 90/100
- TypeScript: 95/100
- Optimization: 75/100
- Documentation: 80/100
```

## Quick Commands

| Task | Command |
|------|---------|
| Lint all | `node run-eslint-all.js` |
| Lint my-app | `cd node-projects/my-app && npm run lint` |
| Lint fix | `eslint --fix src/` |
| Type check | `npx tsc --noEmit` |
| Check unused | `npx ts-prune` |
| Bundle analyze | `npm run build && npx analyze` |
| Audit deps | `npm audit` |
| Update deps | `npm outdated` |

## Integration Points

### With Route Validator
- After route changes → lint affected files

### With New App Workflow
- After app creation → run lint, fix issues

### With Git/Docs Agent
- Before commit → quality check
- Block commit if critical issues found

### With Process Manager
- After code fix → signal for restart if needed

## Auto-Fix Rules

**Always auto-fix:**
- Import sorting
- Unused imports
- Missing semicolons (if configured)
- Trailing whitespace
- Arrow function style

**Ask before fixing:**
- Unused variables (might be WIP)
- any types (might be intentional)
- console.log (might be debugging)

**Never auto-fix:**
- Logic errors
- Type mismatches
- Security issues

## Pre-Commit Quality Gate

```bash
# Run before every commit
node run-eslint-all.js && cd node-projects/my-app && npx tsc --noEmit
```

If this fails → notify user, do not commit

## Quality Thresholds

| Metric | Threshold | Action |
|--------|-----------|--------|
| Lint errors | 0 | Block commit |
| Lint warnings | < 10 | Warn user |
| TypeScript errors | 0 | Block commit |
| TypeScript any | < 5 | Warn user |
| Bundle size increase | > 10% | Warn user |
