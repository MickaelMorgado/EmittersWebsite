# System Patterns: Zone-Net Munitions

## Component Architecture
Single-page component with internal helper functions:
- `FocusedInput`: Input with auto-focus/select behavior
- `WarningIcon`: Reusable alert indicator
- `GlobalAudio`: Singleton audio manager
- Sound effect functions: `playAmmoSound`, `playHoverSound`, etc.
- `fuzzyMatch`: Search utility with regex support

## Data Flow
```
STALKER_AMMO_DATA (static)
       ↓
   useState (data, caliberThresholds, carriedWeapons)
       ↓
   localStorage (persistence)
       ↓
   UI rendering (filtered by search/weapon/section)
```

## Rendering Patterns

### Dual Section Rendering
Both inventory and stash panels use identical structure:
1. Filter variants by section + search
2. Group by caliber
3. Render caliber header with aggregate stats
4. Render variant slots via `renderAmmoSlot()`

### Slot Expansion Pattern
```
[ammo slot] → click → [expanded controls overlay]
                          ├── quantity +/- buttons
                          ├── transfer button
                          └── threshold settings
```

### AI Sidebar Generation
Hierarchical alert structure:
```
Hardware Warnings → [weapon-level alerts]
Caliber Groups → [variant-level alerts]
                  └── sub-messages (transfer suggestions)
```

## State Update Patterns

### Field Updates
```typescript
updateField(id, field, value) → setData(prev => ({...prev, [id]: {...prev[id], [field]: value}}))
```

### Ammo Transfer
```typescript
moveAmmo(id, from, to, amount) → Calculates actual transfer, updates both fields
```

### Weapon Management
```typescript
addWeapon(name) → Creates instance with unique ID
removeWeapon(id) → Filters from array
updateWeaponAmmoFilter(id, ammoId) → Toggles ammo in filter array
```

## CSS Architecture
- BEM-like class naming (`.ammo-slot`, `.ammo-slot-tooltip`)
- CSS custom properties for theming (`--accent-red`, `--accent-amber`)
- Scoped styles via `.stalker-container` wrapper
- Responsive considerations minimal (desktop-focused)

## Modal Pattern
Two modal types use same overlay structure:
1. Quick Add Modal: Bulk ammo entry
2. Calibration Modal: Weapon ammo configuration

Both use:
- Click-outside to close
- `e.stopPropagation()` on modal content
- Search filtering within modal
