---
description: Agent workflow for backend logic, APIs, data management, and business logic
trigger: New features requiring logic, API development, data processing, state management
---

# Backend Agent Workflow

## Purpose

Handle all backend-related development:
1. **Business Logic**: Core application logic, algorithms
2. **API Routes**: REST/GraphQL endpoints, server actions
3. **Data Management**: State stores, data fetching, caching
4. **Server-Side Code**: Server components, middleware
5. **Integrations**: External APIs, databases, services

## Responsibilities

| Area | Tasks |
|------|-------|
| **API Routes** | Create/update endpoints, handle requests/responses |
| **Server Actions** | Form handlers, mutations, server-side operations |
| **Data Fetching** | API calls, data transformation, error handling |
| **State Management** | Zustand stores, context providers, data flow |
| **Business Logic** | Algorithms, calculations, validation |
| **Database** | Queries, migrations, schema (if applicable) |
| **Security** | Auth checks, input validation, sanitization |

## Code Patterns

### API Routes (Next.js App Router)

```typescript
// app/api/resource/route.ts
import { NextResponse } from 'next/server';

export const GET = async (request: Request) => {
  const data = await fetchData();
  return NextResponse.json(data);
};

export const POST = async (request: Request) => {
  const body = await request.json();
  const result = await processData(body);
  return NextResponse.json(result);
};
```

### Server Actions

```typescript
// app/actions/resource.ts
'use server';

export const saveData = async (data: FormData) => {
  // Validate
  // Process
  // Return result
};
```

### Zustand Store

```typescript
// stores/useResourceStore.ts
import { create } from 'zustand';

type State = {
  items: Item[];
  loading: boolean;
};

type Actions = {
  fetchItems: () => Promise<void>;
  addItem: (item: Item) => void;
};

export const useResourceStore = create<State & Actions>((set) => ({
  items: [],
  loading: false,
  fetchItems: async () => {
    set({ loading: true });
    const data = await fetch('/api/items').then(r => r.json());
    set({ items: data, loading: false });
  },
  addItem: (item) => set((s) => ({ items: [...s.items, item] })),
}));
```

## Project-Specific Context

### my-app Structure
```
src/
├── app/
│   ├── api/           # API routes
│   └── (routes)/      # Server components
├── actions/           # Server actions
├── lib/               # Utilities, helpers
└── stores/            # Zustand stores
```

### Common Integrations
- TikTok API (tiktok-backend)
- Blockchain/wallet connections
- External REST APIs
- Local storage / IndexedDB

## Workflow Steps

### 1. Analyze Requirements
- Understand the feature requirements
- Identify data flow and API needs
- Plan state management approach

### 2. Design Data Layer
- Define types/interfaces
- Plan API endpoints
- Design store structure

### 3. Implement Backend
- Create API routes / server actions
- Implement business logic
- Add validation and error handling

### 4. Create State Management
- Set up Zustand stores
- Connect to API endpoints
- Handle loading/error states

### 5. Test & Document
- Test API endpoints
- Document interfaces
- Update memory-bank if needed

## Coordination with Frontend Agent

### Data Contract
Backend provides typed interfaces that Frontend consumes:

```typescript
// types/api.ts
export interface UserResponse {
  id: string;
  name: string;
  email: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
}
```

### Parallel Work Pattern
```
[Backend Agent]                    [Frontend Agent]
      │                                  │
      ├─ Define types/interfaces ───────►│
      │                                  ├─ Use types in components
      ├─ Create API endpoints           │
      │                                  ├─ Build UI
      ├─ Implement logic                │
      │                                  ├─ Connect to store
      └─ Set up stores ─────────────────►│
                                         │
      ◄──────── Integration test ────────┘
```

## Error Handling

### API Error Response
```typescript
export const errorResponse = (message: string, status = 400) => 
  NextResponse.json({ error: message }, { status });
```

### Store Error State
```typescript
type State = {
  error: string | null;
  // ...
};

// In fetch
catch (e) {
  set({ error: e instanceof Error ? e.message : 'Unknown error' });
}
```

## Security Checklist

- [ ] Input validation on all endpoints
- [ ] Auth checks where needed
- [ ] Sanitize user input
- [ ] Rate limiting (if applicable)
- [ ] No sensitive data in responses
- [ ] Environment variables for secrets

## Commands

| Task | Command |
|------|---------|
| Type check | `cd node-projects/my-app && npx tsc --noEmit` |
| Test API | `curl http://localhost:3000/api/endpoint` |
| Check stores | Verify Zustand devtools |

## Output Format

When Backend Agent completes work:

```
## Backend Agent Report

### Implemented:
| Component | File | Description |
|-----------|------|-------------|
| API Route | src/app/api/users/route.ts | GET/POST users |
| Store | src/stores/useUserStore.ts | User state management |
| Types | src/types/user.ts | User interfaces |

### Types Exported:
```typescript
export interface User { ... }
export interface CreateUserRequest { ... }
```

### API Endpoints:
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/users | List users |
| POST | /api/users | Create user |

### Ready for Frontend:
- Types available at `src/types/user.ts`
- Store hook: `useUserStore()`
- API ready for consumption
```
