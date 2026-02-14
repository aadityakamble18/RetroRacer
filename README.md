# 🏎️ retroRacer


**retroRacer** is a high-speed, retro-futuristic arcade racer that blends modern web technologies with the gritty aesthetic of 80s cyberpunk terminals. Built for both enthusiasts and developers, it offers a seamless blend of high-performance canvas rendering and a robust React-based UI.

---

## 🚀 Overview

In a digital void where speed is survival, Player 1 and Player 2 pilot neon-infused racers through an endless stream of procedural obstacles. The "retroRacer" signifies the terminal-inspired design, featuring a custom-built "boot sequence" and a UI that feels like it was ripped straight out of a 1980s mainframe.

### Core Philosophy
- **Minimalism Meets Complexity**: Simple controls, but deep physics-based movement.
- **Visual Immersion**: Every frame is processed with CRT-inspired scanlines and chromatic aberration effects.
- **Fair Multiplay**: Unique "Dual-Crash" logic ensures that the race isn't over until the last pilot falls.

---

## 🏗️ Technical Architecture & Stack

The game utilizes a "Hybrid-Engine" approach, separating the simulation from the interface to ensure 60FPS performance even during intense action.

### The Tech Stack
- **Framework**: [React 19](https://react.dev/) - Handles the high-level game state, menus, and dashboard overlays.
- **Engine**: **Custom HTML5 Canvas API** - Dedicated rendering loop for the racing track, player sprites, and obstacle logic.
- **Application Wrapper**: [Electron](https://www.electronjs.org/) - Transforms the web-based project into a native Windows executable with system-level access.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & Vanilla CSS - Powers the futuristic "Glassmorphism" UI and CRT scanline animations.
- **Build System**: [Vite](https://vitejs.dev/) - Provides Hot Module Replacement (HMR) for rapid development and optimized tree-shaking for production.

---

## 📂 Project Structure

The codebase is organized into modular directories to separate game logic, UI components, and system configurations:

```text
retroRacer/
├── build/                 # Production assets (Icons, Installer resources)
│   └── icon.png           # Your custom Cyberpunk Helmet logo
├── components/            # React UI Components
│   ├── Dashboard.tsx      # In-game HUD (Speed, Distance, RPM)
│   ├── GameEngine.tsx     # The HEART of the game: Canvas loop and collision logic
│   └── TerminalMenu.tsx   # The "OS" style menu system & boot sequence
├── utils/                 # Helper functions
│   └── audio.ts           # Global AudioManager (SFX and UI clicks)
├── release/               # Compiled binaries (stored via Git LFS)
│   ├── RetroRacer-win32-x64/ # Portable executable folder
│   ├── installer/         # SetupExe for Windows installations
│   └── RetroRacer-Portable.zip # Compressed portable version
├── constants.ts           # Game balance (Speed, gravity, obstacle density)
├── types.ts               # Shared TypeScript interfaces & GameStates
├── main.cjs               # Electron main process (Window management)
├── index.html             # Entry point with CRT effect overlay
└── Install-retroRacer.ps1 # Custom PowerShell Installer script
```

---

## 🧠 In-Depth Design Patterns

### 1. The Rendering Loop
Unlike standard React apps, the core gameplay doesn't rely on the DOM. `GameEngine.tsx` utilizes `requestAnimationFrame` to run a continuous loop that updates positions and re-renders the canvas at the monitor's native refresh rate.

### 2. Collision Detection
The game uses an optimized "AABB" (Axis-Aligned Bounding Box) algorithm tailored for the 2.5D perspective, ensuring pixel-perfect contact detection without draining CPU resources.

### 3. State Management
Game state (MENU -> PLAYING -> GAME_OVER) is managed through React's Context/State, allowing the UI to react instantly to in-game events like crashes or score milestones.

---

## 🕹️ Controls & Gameplay

| Pilot | Action | Controls |
| :--- | :--- | :--- |
| **P1** | Steer | `A` / `D` or `Left` / `Right` |
| **P1** | Thrust | `W` (Accelerate) / `S` (Brake) |
| **P2** | Steer | `Left Arrow` / `Right Arrow` |
| **P2** | Thrust | `Up Arrow` (Accelerate) / `Down Arrow` |
| **All** | Pause | `ESC` or `P` |

---

## 📥 Downloads & Installation

You can download the game directly from this repository or the **[Releases](https://github.com/aadityakamble18/RetroRacer/releases)** page.

### 1. Standard Guided Installation
*Recommended for most users.*
1.  Navigate to the `release/installer/` folder in this repo.
2.  Download and run **`RetroRacerSetup.exe`**.
3.  Follow the on-screen instructions to install the game.

### 2. Custom PowerShell Installer
*Use this for custom installation paths and automatic desktop shortcuts.*
1.  Navigate to the `release/` folder and download **`RetroRacer-Portable.zip`**.
2.  Extract the zip file to your preferred location.
3.  Right-click the **`Install-retroRacer.ps1`** script (in the project root) and select **"Run with PowerShell"**.
4.  The script will ask you where to install the files and if you want to create Desktop and Start Menu shortcuts.

### 3. Portable Execution
1.  Download and extract **`RetroRacer-Portable.zip`**.
2.  Open the `RetroRacer-win32-x64` folder.
3.  Launch **`retroRacer.exe`** directly—no installation required!

---

## 👨‍💻 Developer Guide

```bash
# Clone the repository
git clone https://github.com/aadityakamble18/RetroRacer.git
cd retroRacer

# Install dependencies
npm install

# Start development mode
npm run dev

# Build the production executable
npm run electron:build
```

---

## 🎨 Creative Credits
- **Art Direction**: Inspired by 80s terminal aesthetic and cyberpunk visuals.
- **Icons**: Custom Helmet Logo.
- **Sound**: Procedural sound effects and synthesized engine loops.

---
*Developed for the Void. Bound by no law but Physics.*
