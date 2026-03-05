# Project Brief: STALKER 2 Ammo Tracker (Zone-Net Munitions)

## Overview
A tactical ammunition management application for STALKER 2 players. Tracks ammo inventory, stash reserves, and weapon loadouts with AI-powered logistics analysis.

## Core Purpose
Help STALKER 2 players manage their ammunition supplies by:
- Tracking rounds in backpack (inventory) vs safe house (stash)
- Setting warning thresholds per ammo type and caliber
- Monitoring weapon-specific ammunition needs
- Providing AI-driven supply chain analysis and recommendations

## Key Features
1. **Dual-Panel Inventory System**
   - Backpack (active inventory) tracking
   - Safe House Loot (stash) reserves
   - Quick transfer between locations

2. **Threshold-Based Alerts**
   - Per-variant warning thresholds
   - Caliber-wide threshold monitoring
   - Visual warning indicators (red badges)

3. **Weapon Hardware Tracking**
   - Equip carried weapons
   - Auto-detect compatible ammunition
   - Manual ammo calibration for modded gear
   - Minimum reserve requirements per weapon

4. **Kuznetsov AI Sidebar**
   - Real-time logistics scanning
   - Hierarchical alerts by caliber
   - Hardware/ammunition mismatch detection
   - Tactical recommendations

5. **View Modes**
   - Grid view (visual ammo slots)
   - Graph view (bar chart comparison)

6. **Tutorial Showcase**
   - Interactive guided walkthrough
   - Speech synthesis narration
   - Demo data injection

## Data Model
- `AmmoVariant`: Individual ammo type with stats (damage, penetration, weight)
- `AmmoCaliber`: Parent category grouping variants
- `AmmoState`: User's inventory/stash counts and thresholds
- `CarryingWeapon`: Equipped weapon with optional ammo filter overrides

## Storage
- LocalStorage persistence (`stalker_ammo_data_v4`, `stalker_caliber_thresh_v4`, `stalker_carried_weapons_v2`)
- SessionStorage for audio unlock state
