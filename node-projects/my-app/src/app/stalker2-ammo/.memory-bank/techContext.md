# Technical Context: Zone-Net Munitions

## Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: CSS with custom properties (no Tailwind)
- **Icons**: Lucide React
- **State Management**: React useState/useRef (no external store)

## File Structure
```
stalker2-ammo/
├── page.tsx          # Main component (1849 lines)
├── data.ts           # Static ammo database
├── styles.css        # All styling
└── .memory-bank/     # Development documentation
```

## Key Dependencies
- `lucide-react`: Icon library
- No other external dependencies for core functionality

## State Architecture
```typescript
// Core Data State
data: { [ammoId: string]: AmmoState }
caliberThresholds: { [caliberId: string]: { inventory: number; stash: number } }
carriedWeapons: CarryingWeapon[]

// UI State
viewMode: 'grid' | 'graph'
activeAmmoId: string | null
quickAddTarget: 'inventory' | 'stash' | null
editingThreshold: string | null
isShowcase: boolean
```

## Audio System
- Global singleton `GlobalAudio` for lazy initialization
- Browser autoplay bypass via manual unlock
- Sound effects: hover, ammo pickup, box open, page turn, gun slide, zipper, shell

## Persistence Strategy
- localStorage for user data (v4 schema)
- SessionStorage for transient UI state (audio unlock)
- Migration support from v1/v2 schemas

## Performance Considerations
- `useMemo` for filtered lists and computed values
- Lazy audio initialization to avoid autoplay blocks
- CSS-based animations (no JS animation library)

## Browser APIs Used
- `localStorage` / `sessionStorage`
- `window.speechSynthesis` (tutorial narration)
- `Audio` elements (UI sounds)
