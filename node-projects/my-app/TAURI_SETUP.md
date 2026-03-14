# PS3 Visualizer - Tauri Desktop App Setup

This guide helps you set up the PS3 Visualizer as a standalone Tauri desktop application so you can run it alongside games while keeping focus on the game window.

## Prerequisites

- **Node.js 20.x** (already set in package.json)
- **Rust** — Required for Tauri to build the desktop app
  - Install from https://rustup.rs/
- **Windows 10+** (or macOS/Linux with appropriate SDKs)

## Installation

### 1. Install Tauri CLI

The CLI is already listed in `devDependencies`. Install all npm packages:

```bash
npm install
```

### 2. Set Up Rust (One-Time)

If you don't have Rust installed:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

Then reload your terminal/shell.

## Development

### Run in Development Mode

Start the Tauri dev server. This runs Next.js in the background and opens the Tauri window:

```bash
npm run tauri-dev
```

What happens:
- Next.js dev server starts on `http://localhost:3000` (runs in background)
- Tauri window opens and loads the Next.js app
- Changes to React code hot-reload in the window
- Controller input is ready to test immediately

**Note:** On first run, Tauri will download and compile Rust dependencies (takes 2-5 minutes).

### Test Controller Input

1. Connect a PS3 DualShock 3 controller via USB
2. Press any face button or the PS button
3. See particles burst in realtime
4. Hold L2/R2 to test the turbo jet animation

## Building

### Create Standalone Executable

```bash
npm run tauri-build
```

Output:
- **Windows:** `.msi` installer in `src-tauri/target/release/bundle/msi/`
- **macOS:** `.dmg` in `src-tauri/target/release/bundle/dmg/`
- **Linux:** `.AppImage` in `src-tauri/target/release/bundle/appimage/`

You can then distribute the installer to others.

## Project Structure

```
my-app/
├── src/app/ps3-visualizer/       # React components
│   ├── ControllerExperience.tsx  # Main visualizer
│   ├── useDualShock.ts           # Gamepad API hook
│   └── page.tsx                  # Page wrapper
├── src-tauri/                    # Tauri backend (Rust)
│   ├── tauri.conf.json          # Window config, build settings
│   ├── Cargo.toml               # Rust dependencies
│   ├── build.rs                 # Tauri build script
│   └── src/
│       ├── main.rs              # App entry point
│       └── lib.rs               # Library code
└── TAURI_SETUP.md              # This file
```

## Configuration

### Window Settings (tauri.conf.json)

Customize the app window:

```json
"windows": [
  {
    "title": "PS3 Visualizer",
    "width": 1200,
    "height": 800,
    "minWidth": 800,
    "minHeight": 600,
    "alwaysOnTop": false  // Set to true to keep above other windows
  }
]
```

**Useful settings:**
- `"alwaysOnTop": true` — Keep visualizer visible while gaming
- `"resizable": true` — Allow window resizing
- `"decorations": true` — Show window title bar

### Icon (Optional)

Add app icons in `src-tauri/icons/` to customize the app icon. Tauri accepts:
- `32x32.png`
- `128x128.png`
- `128x128@2x.png` (Retina)
- `icon.ico` (Windows)
- `icon.icns` (macOS)

## Troubleshooting

### "command not found: tauri"
Make sure `npm install` ran successfully and Tauri CLI is installed.

### Rust build fails
Run `rustup update` to ensure Rust is current:
```bash
rustup update
```

### Port 3000 already in use
Change the dev port in `tauri.conf.json`:
```json
"devPath": "http://localhost:3001"  // Change 3000 to 3001
```

### Controller not detected
1. Connect controller via **USB** (not Bluetooth)
2. Press a button to wake the device
3. Check browser console (F12) for gamepad API errors
4. Some controllers need the driver installed (vendor software)

## Tips

- **Alt+Tab smoothly** between game and visualizer while gaming
- **Resize the window** to fit your monitor layout (e.g., side-by-side with game)
- **Use "LOCK" button** in-app to prevent accidental repositioning
- **Enable "Always on Top"** if you want the visualizer to stay visible over the game

## Next Steps

- Customize particle effects in `ControllerExperience.tsx`
- Add custom button mappings in `useDualShock.ts`
- Extend functionality with Rust commands (see Tauri docs for IPC)

Enjoy! 🎮✨
