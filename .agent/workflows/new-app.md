---
description: Steps to follow when creating a new application within the my-app project structure.
---

When creating a new application in `node-projects/my-app`, follow these mandatory steps:

1. **Create the App Directory**: Initialize the new route folder in `src/app/`.
2. **Register on Main Page**: 
   - Open `src/app/page.tsx`.
   - Add a new `<Link>` and `<TiltCard>` entry in the appropriate section (e.g., "Node Projects").
   - Assign a unique `accentColor`.
3. **Update Memory Bank**:
   - Create a specific markdown file in `memory-bank/project-specific/apps/`.
   - Update `memory-bank/apps-overview.md` with the new entry.
4. **Documentation**:
   - Ensure the app's features and technical details are documented in the Memory Bank.
