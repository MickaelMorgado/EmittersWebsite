# Product Context: Zone-Net Munitions

## Target Users
STALKER 2 players who want to optimize their ammunition management and avoid supply shortages during gameplay.

## User Experience Goals
1. **Immersion**: STALKER-themed UI with PDA aesthetic, zone terminology, and atmospheric audio
2. **Efficiency**: Quick data entry with minimal clicks
3. **Awareness**: Clear visual indicators for low supplies
4. **Intelligence**: AI assistant that proactively identifies problems

## Design Language
- **Theme**: Post-apocalyptic military PDA interface
- **Colors**: Dark backgrounds, amber/red accents, muted tactical palette
- **Typography**: Monospace fonts, technical labels
- **Audio**: Diegetic UI sounds (reload clicks, box opens, page turns)

## Interaction Patterns
1. **Click to Expand**: Ammo slots expand inline for editing
2. **Hover Reveals**: Threshold values shown on hover
3. **Quick Add Modal**: Bulk entry via searchable modal
4. **Weapon Filtering**: Click weapon card to filter compatible ammo
5. **Caliber Summaries**: Click caliber threshold to edit

## Terminology
- **Backpack**: Active inventory carried by player
- **Loot / Safe House**: Stash storage at base
- **Hardware**: Equipped weapons
- **Kuznetsov AI**: The logistics analysis system
- **Calibration**: Manual ammo compatibility override
- **Tactical Baseline**: Minimum ammo threshold

## Error Handling
- Non-intrusive warnings (visual badges only)
- No blocking modals for routine operations
- Confirmation required for destructive actions (purge data, unequip weapon)
