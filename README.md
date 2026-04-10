# Noties

AI-enhanced workflow sticky notes — available as a desktop app (Electron) and web app.

## Overview

Noties is a productivity tool for organizing thoughts, tasks, and research across multiple workflows. Each workflow has its own canvas of draggable sticky notes with rich text editing and AI-powered features.

### Key Features

- **Multiple Workflows** — Organize notes into separate workflow tabs (e.g., Frontend Development, API Integration, Database Design)
- **Draggable Canvas** — Free-position sticky notes on an infinite canvas with grid snapping
- **Rich Text Editing** — Bold, italic, underline, lists, code blocks, links, and images
- **AI-Powered Notes** — Fix note structure/clarity with AI, search for information and get results as new notes
- **Dual Platform** — Runs as a native desktop app (Electron) or in the browser as a web app
- **Persistent Storage** — Desktop: file-based persistence via electron-store. Web: localStorage fallback
- **Secure API Handling** — API keys never touch the renderer; all AI calls proxy through the Electron main process

## Current Status

**Phase 1: Scaffolding** — Complete. Project structure created, all dependencies installed, Electron + React + TypeScript app launches successfully. An environment bug (`ELECTRON_RUN_AS_NODE`) was diagnosed and fixed. Ready for Phase 2.

**Next:** Phase 2 — Port the prototype (`workflow-notes.jsx`) into the Electron shell.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Desktop Runtime | Electron |
| Build Tool | Vite (via electron-vite) |
| State Management | Zustand |
| Storage | electron-store (desktop) / localStorage (web) |
| AI Integration | Anthropic Claude API |
| Styling | Global CSS with custom properties |

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
git clone https://github.com/a-dev-gh/Noties.git
cd Noties
npm install
```

### Configuration

Create a `.env` file in the project root:

```env
ANTHROPIC_API_KEY=your-api-key-here
```

> The API key is only read by the Electron main process and never bundled into the renderer.

### Development

```bash
npm run dev
```

Opens the Electron app with hot-reload enabled for the React renderer.

### Build

```bash
# Build for Windows
npm run build:win
```

## Project Structure

```
src/
  main/                     # Electron main process
    index.ts                #   Window creation, app lifecycle
    ipc.ts                  #   IPC handlers (AI proxy, storage)
    store.ts                #   electron-store configuration

  preload/                  # Security bridge
    index.ts                #   contextBridge API exposure

  renderer/                 # React application
    src/
      App.tsx               #   Root component
      main.tsx              #   React entry point

      components/
        layout/             #   TitleBar, Header
        canvas/             #   Canvas, StickyNote, NoteToolbar, EmptyState
        context-menu/       #   ContextMenu
        shared/             #   LoadingOverlay, ErrorBoundary

      hooks/                #   useDragNote, useContextMenu, useAI
      store/                #   Zustand store (useStore)
      utils/                #   noteHelpers, storage bridge
      styles/               #   CSS files with custom properties
```

## Architecture

### Desktop (Electron)

```
┌─────────────────────────────────────────────┐
│  Main Process (Node.js)                     │
│  - Reads .env (API key)                     │
│  - Handles IPC: ai:fix, ai:search           │
│  - Manages electron-store (file persistence)│
│  - Window lifecycle                         │
├─────────────────────────────────────────────┤
│  Preload (contextBridge)                    │
│  - Exposes safe API to renderer             │
│  - No direct Node.js access in renderer     │
├─────────────────────────────────────────────┤
│  Renderer (React + Vite)                    │
│  - UI components + Zustand state            │
│  - Calls window.electronAPI for AI/storage  │
│  - Zero access to API keys or file system   │
└─────────────────────────────────────────────┘
```

### Web App

When running as a web app (without Electron), the app detects `window.electronAPI` is undefined and falls back to:
- **Storage**: localStorage
- **AI**: Direct API calls (user provides key in settings)

## Design

- **Theme**: Purple gradient (`#667eea` to `#764ba2`) with aurora animations
- **Font**: Plus Jakarta Sans
- **Pattern**: BEM-like CSS class naming with CSS custom properties

## License

MIT
