---
description: Agent workflow for frontend UI, components, styling, and user experience
trigger: New features requiring UI, component development, styling, user interactions
---

# Frontend Agent Workflow

## Purpose

Handle all frontend-related development:
1. **UI Components**: React components, layouts, pages
2. **Styling**: Tailwind CSS, animations, responsive design
3. **User Interactions**: Events, forms, feedback
4. **Client-Side Logic**: Browser APIs, client components
5. **Accessibility**: ARIA, keyboard navigation, screen readers

## Responsibilities

| Area | Tasks |
|------|-------|
| **Components** | Create/update React components, compose UI |
| **Pages** | Route pages, layouts, routing |
| **Styling** | Tailwind classes, CSS modules, animations |
| **Forms** | Form UI, validation feedback, submissions |
| **Interactions** | Click handlers, hover states, transitions |
| **Responsive** | Mobile, tablet, desktop layouts |
| **Accessibility** | ARIA labels, focus management, semantics |

## Code Patterns

### Component Structure

```tsx
// components/ui/Button.tsx
import { cn } from '@/lib/utils';

type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = ({ 
  variant = 'primary', 
  size = 'md', 
  className,
  children,
  ...props 
}: ButtonProps) => {
  return (
    <button
      className={cn(
        'rounded-lg font-medium transition-colors',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};
```

### Page Component

```tsx
// app/feature/page.tsx
import { FeatureContainer } from './FeatureContainer';

export default function FeaturePage() {
  return (
    <main className="min-h-screen p-6">
      <h1 className="text-3xl font-bold mb-6">Feature</h1>
      <FeatureContainer />
    </main>
  );
}
```

### Client Component

```tsx
// components/InteractiveWidget.tsx
'use client';

import { useState } from 'react';

export const InteractiveWidget = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        Toggle
      </button>
      {isOpen && <div>Content</div>}
    </div>
  );
};
```

## Styling Guidelines

### Tailwind Patterns

```tsx
// Layout
<div className="flex flex-col gap-4 p-6 max-w-4xl mx-auto">

// Card
<div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-6">

// Typography
<h1 className="text-2xl font-bold text-zinc-900 dark:text-white">

// Interactive
<button className="hover:bg-zinc-100 active:scale-95 transition-all">

// Responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

### Animation (Framer Motion)

```tsx
import { motion } from 'framer-motion';

export const FadeIn = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
);
```

## Project-Specific Context

### my-app Structure
```
src/
├── app/              # Pages (route segments)
├── components/
│   ├── ui/           # Base UI components (Button, Card, etc.)
│   └── features/     # Feature-specific components
├── lib/              # Utilities (cn, helpers)
└── hooks/            # Custom hooks
```

### Existing UI Components
- `TiltCard` - 3D tilt effect card
- `VersionBadge` - Version display component
- Check `src/components/ui/` for more

### Design Tokens
- Colors: `accentColor` format: `"R, G, B"`
- Dark mode: Use `dark:` variants
- Spacing: Tailwind scale

## Workflow Steps

### 1. Understand UI Requirements
- Review feature requirements
- Identify UI components needed
- Plan component hierarchy

### 2. Consume Backend Types
```typescript
// Use types from Backend Agent
import type { User, CreateUserRequest } from '@/types/user';
```

### 3. Build Components
- Create base components first
- Compose into feature components
- Add styling and animations

### 4. Connect to State
```tsx
// Connect to Zustand store from Backend Agent
import { useUserStore } from '@/stores/useUserStore';

export const UserList = () => {
  const { users, loading, fetchUsers } = useUserStore();
  
  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) return <Spinner />;
  
  return <div>{users.map(user => ...)}</div>;
};
```

### 5. Add Interactions
- Event handlers
- Loading states
- Error feedback
- Success notifications

### 6. Ensure Accessibility
- Semantic HTML
- ARIA attributes
- Keyboard navigation
- Focus management

## Coordination with Backend Agent

### Type Consumption
Frontend uses types defined by Backend:

```typescript
// Frontend receives these types from Backend
import type { 
  User,           // Data shape
  UserResponse,   // API response
  CreateUserRequest  // Form data
} from '@/types/user';
```

### Parallel Work Pattern
```
[Backend Agent]                    [Frontend Agent]
      │                                  │
      ├─ Define types/interfaces ───────►│
      │                                  ├─ Use types in components
      ├─ Create API endpoints           ├─ Build UI skeleton
      │                                  ├─ Add styling
      ├─ Implement logic                ├─ Handle loading states
      │                                  │
      └─ Set up stores ─────────────────►│
                                         ├─ Connect to store
      ◄──────── Integration test ────────┘
```

### Handoff Points
1. **Types ready** → Frontend can start building with mock data
2. **Store ready** → Frontend connects to real state
3. **API ready** → Full integration testing

## Accessibility Checklist

- [ ] Semantic HTML elements
- [ ] ARIA labels on interactive elements
- [ ] Keyboard navigation works
- [ ] Focus visible on all interactive
- [ ] Color contrast meets WCAG
- [ ] Screen reader tested
- [ ] Reduced motion respected

## Responsive Breakpoints

| Breakpoint | Tailwind | Use Case |
|------------|----------|----------|
| Mobile | (default) | < 640px |
| Tablet | `sm:` | >= 640px |
| Desktop | `md:` | >= 768px |
| Large | `lg:` | >= 1024px |
| XL | `xl:` | >= 1280px |

## Commands

| Task | Command |
|------|---------|
| Type check | `cd node-projects/my-app && npx tsc --noEmit` |
| Lint | `cd node-projects/my-app && npm run lint` |
| Dev server | `cd node-projects/my-app && npm run dev` |

## Output Format

When Frontend Agent completes work:

```
## Frontend Agent Report

### Components Created:
| Component | File | Description |
|-----------|------|-------------|
| UserCard | src/components/features/UserCard.tsx | Display user info |
| UserList | src/components/features/UserList.tsx | List of users |
| UserForm | src/components/features/UserForm.tsx | Create user form |

### Pages Updated:
| Page | Changes |
|------|---------|
| /users | Added UserList and UserForm |

### Styling:
- Responsive layout (mobile-first)
- Dark mode supported
- Animations on mount

### Accessibility:
- ✅ ARIA labels
- ✅ Keyboard navigation
- ✅ Focus management

### Connected Stores:
- useUserStore (from Backend Agent)

### Types Used:
- User, CreateUserRequest (from @/types/user)
```
