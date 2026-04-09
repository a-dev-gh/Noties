# Noties — Agent Workflow & Development Plan

This document outlines the agent-driven development workflow, task assignments, and implementation plan for building Noties from prototype to production.

---

## Agent Roster

The following specialized agents are used throughout development. Each agent has a defined role, tools, and scope of responsibility.

| Agent | Role | Scope |
|---|---|---|
| **Orchestrator** | Task coordinator | Reads tasks, assigns agents, enforces execution order, prevents conflicts |
| **Architect** | System designer | Data models, component structure, auth design, IPC patterns (read-only analysis) |
| **UI Builder** | Frontend specialist | React components, responsive layouts, animations, CSS — writes to `src/renderer/` |
| **DB Builder** | Data/storage specialist | Zustand store, electron-store, data migrations, IPC for persistence |
| **Security Audit** | Security scanner | API key isolation, IPC channel safety, input validation (read-only audit) |
| **Code Reviewer** | Quality reviewer | Code quality, patterns, performance, best practices (read-only) |
| **Performance Audit** | Performance specialist | Bundle size, load times, lazy loading, caching (read-only) |
| **Debugger** | Bug tracer | Error analysis, root cause tracing, fix generation |
| **Documenter** | Documentation writer | README, guides, API docs, SOPs |

---

## Development Phases

### Phase 1: Project Scaffolding ✅
**Agent: Orchestrator**
**Status: Complete**

- [x] Initialize npm project with `package.json`
- [x] Install dependencies: react, react-dom, zustand, electron, electron-store, electron-vite, typescript
- [x] Create `electron.vite.config.ts` — main/preload/renderer build targets
- [x] Create TypeScript configs (`tsconfig.json`, `tsconfig.node.json`, `tsconfig.web.json`)
- [x] Create `src/main/index.ts` — Electron BrowserWindow, app lifecycle
- [x] Create `src/preload/index.ts` — contextBridge with typed API
- [x] Create `src/renderer/` — index.html, main.tsx, App.tsx, global.css
- [x] Create `.gitignore`, `.env` placeholder
- [x] Create README.md, AGENTS.md
- [x] Initialize git repo, connect to GitHub remote

**Acceptance criteria:** `npm run dev` opens an Electron window rendering the React app.

---

### Phase 2: Port Prototype Into Electron
**Agent: UI Builder**
**Status: Pending**

- [ ] Copy `workflow-notes.jsx` into `src/renderer/src/components/WorkflowNotes.tsx`
- [ ] Convert to TypeScript (add types for Note, Workflow, state)
- [ ] Fix bug: `contextMenuItemStyle` defined after return statement
- [ ] Fix bug: missing `x-api-key` header in API calls
- [ ] Fix bug: drag offset mixes viewport and canvas coordinates
- [ ] Move `<style>` tag content into `styles/global.css`
- [ ] Render `<WorkflowNotes />` from `App.tsx`
- [ ] Verify all features: tabs, drag, edit, context menu, localStorage

**Acceptance criteria:** Prototype runs identically inside Electron — no visual changes.

---

### Phase 3: Component Decomposition
**Agent: UI Builder + Architect**
**Status: Pending**

Extract the monolithic component into focused, testable pieces:

| # | Component | Source Lines | Complexity |
|---|---|---|---|
| 1 | `EmptyState.tsx` | 808-821 | Low — zero logic |
| 2 | `ContextMenu.tsx` + `useContextMenu.ts` | 823-872 | Medium — state + positioning |
| 3 | `NoteToolbar.tsx` | 706-731 | Low — callback props |
| 4 | `LoadingOverlay.tsx` | 631-660 | Low — display only |
| 5 | `StickyNote.tsx` | 609-806 | High — drag, edit, actions |
| 6 | `Canvas.tsx` | 590-606 | Medium — mouse handlers |
| 7 | `Header.tsx` | 518-587 | Medium — tabs + buttons |
| 8 | `useDragNote.ts` | 302-343 | Medium — mouse event logic |

- [ ] Extract each component in order (each step independently testable)
- [ ] Delete `WorkflowNotes.tsx` when all pieces are extracted
- [ ] Compose components from `App.tsx`

**Acceptance criteria:** All features work, no visual changes, monolith file deleted.

---

### Phase 4: Zustand Store + Storage Migration
**Agent: DB Builder + Architect**
**Status: Pending**

- [ ] Create `store/useStore.ts` — Zustand store with typed state and actions
- [ ] Create `src/main/store.ts` — electron-store config with defaults
- [ ] Create IPC channels: `storage:load`, `storage:save` in `src/main/ipc.ts`
- [ ] Create `utils/storage.ts` — bridge (IPC for desktop, localStorage for web)
- [ ] Migrate all components from prop-drilling to `useStore()` selectors
- [ ] Implement data migration: localStorage → electron-store on first desktop launch

**Store shape:**
```typescript
interface NotiesState {
  workflows: Workflow[]
  activeWorkflow: string
  activeEditor: string | null
  contextMenu: ContextMenuState | null

  // Actions
  setActiveWorkflow: (id: string) => void
  addWorkflow: (name: string) => void
  addNote: () => void
  updateNoteContent: (noteId: string, content: string) => void
  saveNote: (noteId: string) => void
  deleteNote: (noteId: string) => void
  duplicateNote: (noteId: string) => void
  updateNotePosition: (noteId: string, position: Position) => void
  setNoteAIState: (noteId: string, state: Partial<AIState>) => void
  save: () => Promise<void>
  initialize: () => Promise<void>
}
```

**Acceptance criteria:** Data persists via file system (desktop) or localStorage (web). Zustand drives all state.

---

### Phase 5: API Key Security
**Agent: Security Audit**
**Status: Pending**

- [ ] Implement `ai:fix` IPC handler — reads `ANTHROPIC_API_KEY` from `process.env`, calls Claude API
- [ ] Implement `ai:search` IPC handler — same pattern
- [ ] Expose `fixWithAI()` and `searchWithAI()` through contextBridge (already stubbed)
- [ ] Create `hooks/useAI.ts` — manages loading states, calls IPC, handles errors with user feedback
- [ ] Verify `.env` uses `ANTHROPIC_API_KEY` (no `VITE_` prefix — never bundled)
- [ ] Add settings UI for API key entry when not configured
- [ ] Web fallback: direct API calls with user-provided key stored in localStorage

**Acceptance criteria:** Renderer source contains zero API keys. AI calls work through main process proxy. DevTools shows no key in network/source.

---

### Phase 6: Styling Extraction
**Agent: UI Builder**
**Status: Pending**

- [ ] Define CSS custom properties in `:root` (already started in `global.css`)
- [ ] Create CSS files: `canvas.css`, `note.css`, `toolbar.css`, `context-menu.css`, `animations.css`, `titlebar.css`
- [ ] Extract all inline `style={}` props into CSS classes (BEM-like naming)
- [ ] Replace all `onMouseEnter`/`onMouseLeave` style hacks with CSS `:hover`
- [ ] Keep only dynamic values inline (`left`, `top`, `zIndex` for note positioning)

**CSS naming convention:**
```
.note-card
.note-card--dragging
.note-card__handle
.note-card__editor
.note-card__actions
```

**Acceptance criteria:** Zero inline style props except truly dynamic positioning values.

---

### Phase 7: Professional Desktop Features
**Agent: UI Builder + Architect**
**Status: Pending**

- [ ] Custom frameless titlebar (`TitleBar.tsx` — minimize, maximize, close, `-webkit-app-region: drag`)
- [ ] React error boundary with friendly fallback UI
- [ ] Keyboard shortcuts: `Ctrl+N` (new note), `Ctrl+S` (save), `Ctrl+D` (duplicate), `Delete`
- [ ] Replace `prompt()` with proper modal component (add/rename workflow)
- [ ] Toast notification system for errors and confirmations
- [ ] Electron app menu (File, Edit, View, Help)
- [ ] Note z-index management (click to bring to front)
- [ ] Better workflow management (rename, delete, reorder tabs)

**Acceptance criteria:** App feels like a polished native desktop application.

---

### Phase 8: Build & Distribution
**Agent: Orchestrator**
**Status: Pending**

- [ ] Add `electron-builder` to devDependencies
- [ ] Configure: Windows NSIS installer, app icon, app ID `com.adev.noties`
- [ ] Create app icons (256x256 ICO for Windows)
- [ ] Build script: `npm run build:win`
- [ ] Test built installer on Windows 10
- [ ] Push to GitHub (`a-dev-gh/Noties`)
- [ ] Create GitHub Release with installer asset

**Acceptance criteria:** Installable `.exe` works end-to-end on Windows.

---

## Bugs Found in Prototype

These are tracked here and will be fixed during Phase 2.

| # | Bug | Location | Impact |
|---|---|---|---|
| 1 | `contextMenuItemStyle` defined after `return` statement | Line 877 | Style object is undefined when referenced in JSX |
| 2 | No `x-api-key` header in Claude API calls | Lines 172, 253 | All API calls fail with 401 Unauthorized |
| 3 | Drag offset uses `clientX - note.position.x` (viewport vs canvas coords) | Line 306-309 | Notes jump on drag start when canvas isn't at (0,0) |

---

## Suggestions & Future Features

These are not in the current scope but are recommended for future development:

### High Priority
- **Auto-save** — Debounced save on every content change (replace manual save button)
- **Dark mode** — Theme toggle (Adrian has experience from Rolekeeper's theme system)
- **Search/filter notes** — Find notes by content as the collection grows
- **Export** — Export notes as markdown or plain text for sharing

### Medium Priority
- **Auto-updater** — `electron-updater` for seamless updates via GitHub Releases
- **Undo/redo** — Workflow-level undo (delete note, then undo)
- **Note resize** — Drag handle on bottom-right corner
- **Canvas zoom/pan** — For large note collections
- **Note colors/labels** — Visual categorization

### Lower Priority
- **Multi-window** — Open notes in separate windows for side-by-side editing
- **Note linking** — Reference one note from another
- **Session templates** — Pre-built workflow templates
- **Accessibility** — ARIA labels, focus management, screen reader support
- **PWA support** — For the web version, offline-first with service worker

---

## Web App vs Desktop App

Noties is designed to run in both environments:

| Feature | Desktop (Electron) | Web App |
|---|---|---|
| Storage | electron-store (JSON file) | localStorage |
| AI API Key | Secure in main process `.env` | User enters in settings UI |
| Window Controls | Custom frameless titlebar | Browser chrome |
| File System | Full access via main process | No access |
| Offline | Full offline support | Partial (no AI without network) |
| Distribution | Windows installer (.exe) | Static hosting (Vercel, Netlify) |

The `utils/storage.ts` bridge and `hooks/useAI.ts` detect the environment and fall back gracefully.
