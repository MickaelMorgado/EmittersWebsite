# Stalker 2 Ammo Terminal

A tactical logistics terminal for managing munitions in the Zone, featuring advanced supply aggregation and AI-driven insights.

## Features

### 📦 Caliber Aggregation
- **Localized Totals:** Dynamically sums all variants (PST, AP, etc.) within a specific caliber for each container (Backpack vs. Stash).
- **Tactical Thresholds:** Set mission-critical reserve levels per caliber or per variant.
- **HUD Warnings:** Visual `AlertTriangle` indicators blink when supplies fall below critical levels.

### 🤖 Kuznetsov AI Intelligence
- **Munition Interchangeability:** The AI understands variant compatibility.
- **Reassurance Logic:** Provides `REASSURANCE` messages if specific boxes are low but overall caliber reserves are safe.
- **Strategic Advice:** Flags critical shortages across the entire supply chain.

### 🔊 Tactical Audio Environment
- **Action Feedback:** Mechanical reload sounds for transfers and quantity adjustments.
- **UI Navigation:** Mechanical click feedback on hover for all interactive elements.
- **Advanced Interaction:** Specialized sounds for mechanical cases (Quick Add) and electronic interfaces (Settings).

### 🔄 Logistics Optimization
- **Magazine-Based Transfers:** Inventory adjustments respect in-game box/magazine sizes (`boxSize`).
- **Surplus Detection:** AI identifies excess stock (3x threshold) while ensuring caliber-wide safety.
- **Deficit Reporting:** Quantitative reporting of exact shortages needed to reach tactical baselines.

## Technical Details
- **Path**: `/stalker2-ammo`
- **Component**: `StalkerAmmoPage`
- **Persistence**: `localStorage` (v4 schema)

## 🚀 Future Roadmap (Next Steps)
- **Trade-Offsetting Logic:** Calculate optimal trade routes based on surplus ammunition to maximize faction currency.
- **Zone-Net Regional Intelligence**: Implement regional ammo availability checks. Kuznetsov AI will cross-reference your current location with known regional loot tables (Requires LLM Model Integration).
