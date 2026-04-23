# Active Context: Zone-Net Munitions

## Current State
- Feature-complete for core ammunition tracking
- Tutorial showcase system implemented
- AI logistics sidebar with hierarchical alerts
- Graph view for visual comparison
- Screenshot scanner with OpenAI GPT-4o Vision

## Recent Work
- Added screenshot scanner (drag-drop, paste, upload)
- Implemented AI vision detection with editable quantities
- Added expanded image preview with zoom
- Implemented two-column ammo slot tooltip
- Created compact spinner controls (vertical +/- buttons)

## Active Decisions
1. **Single File Component**: Keeping all logic in `page.tsx` for simplicity (~2400 lines)
2. **No External State Library**: useState sufficient for current scale
3. **CSS Over Tailwind**: Custom CSS provides better theme control
4. **LocalStorage Only**: No backend integration planned
5. **User-provided API Key**: Users bring their own OpenAI key for screenshot scanning

## Known Issues / Limitations
1. No import/export functionality for sharing loadouts
2. No history/undo for accidental changes
3. Tutorial speech synthesis may have voice availability issues
4. Mobile responsiveness not prioritized

## Next Potential Features
- Notes/memos per ammo type
- Loadout presets (save/load configurations)
- Activity history log
- Export/import data as JSON
- Quick-add favorite ammo types

## Development Notes
- When adding new ammo variants, update `data.ts` with complete info
- New UI controls should include hover sounds via `playHoverSound()`
- Threshold editing uses compact spinner controls
- All data keys use `v4` suffix for future migration compatibility
- Screenshot scanner uses `stalker_openai_key_v1` for API key storage
