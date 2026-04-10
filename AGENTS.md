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

## Known Blockers — RESOLVED

### Electron `require("electron")` Resolution Bug on Windows 10

**Status: Resolved (2026-04-09)**

**Original symptoms:**
- `require("electron")` in the main process returned the binary path string (`electron.exe`) instead of the Electron API object
- `process.type` was `undefined` even inside the Electron process
- Tested on Electron 28, 33, and 36 — same issue on all versions
- `process.versions.electron` IS set correctly, confirming we're inside Electron
- The issue occurred regardless of whether running via `electron .`, `electron file.js`, or `electron-vite dev`
- The `externalizeDepsPlugin` in electron-vite correctly bundled to `const electron = require("electron")` but the runtime resolution failed

**Root cause:** VS Code's terminal inherits `ELECTRON_RUN_AS_NODE=1` from VS Code's own environment — VS Code is itself an Electron app. This environment variable tells `electron.exe` to behave as plain Node.js, which disables `require("electron")` API resolution and causes `process.type` to be undefined.

**Fix:** Created `scripts/electron-dev.js` — a launcher script that explicitly strips `ELECTRON_RUN_AS_NODE` from the environment before spawning `electron-vite`. All npm scripts (`dev`, `build`, etc.) were updated to route through this launcher.

---

## Bug Log

Tracks all bugs found and fixed across the project lifetime.

---

**BUG-001: `ELECTRON_RUN_AS_NODE` breaks Electron API on Windows**
- **Found:** Phase 1 (2026-04-09)
- **Severity:** Critical (app won't launch)
- **Symptoms:** `require("electron")` returns binary path string instead of API object. `process.type` undefined. `app`, `BrowserWindow` all undefined.
- **Root Cause:** VS Code terminal inherits `ELECTRON_RUN_AS_NODE=1` which forces electron.exe into Node.js mode
- **Fix:** `scripts/electron-dev.js` strips env var before launch. All npm scripts routed through it.
- **Status:** RESOLVED (2026-04-09)
- **Files changed:** `scripts/electron-dev.js` (new), `package.json` (scripts updated)

---

**BUG-002: `contextMenuItemStyle` defined after return statement** (from prototype)
- **Found:** Phase 1 analysis (2026-04-09)
- **Severity:** Medium (style object undefined at render time)
- **Location:** `workflow-notes.jsx` line 877
- **Root Cause:** `const contextMenuItemStyle = {...}` is declared after the component's `return` statement
- **Fix:** Moved `contextMenuItemStyle` before return in `WorkflowNotes.tsx`
- **Status:** RESOLVED (2026-04-10)

---

**BUG-003: Missing `x-api-key` header in Claude API calls** (from prototype)
- **Found:** Phase 1 analysis (2026-04-09)
- **Severity:** Critical (all AI calls fail with 401)
- **Location:** `workflow-notes.jsx` lines 172, 253
- **Root Cause:** `fetch()` headers only include `Content-Type`, no `x-api-key`
- **Fix:** AI calls now route through main process IPC with proper `x-api-key` header in `ipc.ts`
- **Status:** RESOLVED (2026-04-10)

---

**BUG-004: Drag offset mixes viewport and canvas coordinates** (from prototype)
- **Found:** Phase 1 analysis (2026-04-09)
- **Severity:** Low (notes jump on drag start)
- **Location:** `workflow-notes.jsx` lines 306-309
- **Root Cause:** `dragOffset` calculated as `e.clientX - note.position.x` but clientX is viewport-relative while position is canvas-relative
- **Fix:** `handleMouseDown` now subtracts `canvasRect.left`/`top` before storing offset
- **Status:** RESOLVED (2026-04-10)

---

**BUG-005: Text writes backwards in contentEditable editor**
- **Found:** Phase 2 testing (2026-04-10)
- **Severity:** Critical (app unusable for text input)
- **Root Cause:** `dangerouslySetInnerHTML={{ __html: note.content }}` on the contentEditable div caused React to reset innerHTML on every state change, moving cursor to position 0. Each keystroke inserted at start — backwards text.
- **Fix:** Removed `dangerouslySetInnerHTML` entirely. Added `initializedNotes` ref (Set) to track which notes have had initial content set. useEffect only writes innerHTML on first mount or for external updates (AI fix) when user is not editing.
- **Status:** RESOLVED (2026-04-10)
- **Files changed:** `src/renderer/src/components/WorkflowNotes.tsx`

---

**BUG-006: `prompt()` crashes Electron app**
- **Found:** Phase 2 testing (2026-04-10)
- **Severity:** Critical (app crashes on New Workflow, Insert Link, Insert Image)
- **Root Cause:** `window.prompt()` is blocked when `contextIsolation: true` in Electron. Three places used it: `addWorkflow`, `insertLink`, `insertImage`.
- **Fix:** Replaced all `prompt()` calls with async `showPrompt()` function that renders a custom modal dialog with input field, Cancel/OK buttons, and Enter/Escape keyboard support.
- **Status:** RESOLVED (2026-04-10)
- **Files changed:** `src/renderer/src/components/WorkflowNotes.tsx`

---

**BUG-007: White screen — useEffect references variable before declaration**
- **Found:** Phase 2 testing (2026-04-10)
- **Severity:** Critical (app shows blank white screen)
- **Root Cause:** The editor DOM sync useEffect referenced `activeWorkflowData` before its `const` declaration, hitting JavaScript's temporal dead zone.
- **Fix:** Moved the useEffect after `activeWorkflowData` is declared.
- **Status:** RESOLVED (2026-04-10)
- **Files changed:** `src/renderer/src/components/WorkflowNotes.tsx`

---

## Development Phases

### Phase 1: Project Scaffolding
**Agent: Orchestrator**
**Status: COMPLETE**

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
**Status: COMPLETE**

- [x] Copy `workflow-notes.jsx` into `src/renderer/src/components/WorkflowNotes.tsx`
- [x] Convert to TypeScript (add types for Note, Workflow, state)
- [x] Fix bug: `contextMenuItemStyle` defined after return statement
- [x] Fix bug: missing `x-api-key` header in API calls
- [x] Fix bug: drag offset mixes viewport and canvas coordinates
- [x] Fix bug: text writes backwards in contentEditable (BUG-005)
- [x] Fix bug: `prompt()` crashes Electron (BUG-006)
- [x] Fix bug: useEffect references variable before declaration (BUG-007)
- [x] Move `<style>` tag content into `styles/global.css`
- [x] Render `<WorkflowNotes />` from `App.tsx`
- [x] Verify all features: tabs, drag, edit, context menu, localStorage

**Acceptance criteria:** Prototype runs identically inside Electron — no visual changes.

---

### Phase 3: Component Decomposition
**Agent: Architect (design) + UI Builder (implementation)**
**Status: PENDING**
**Priority: CRITICAL — blocks all feature work**

The monolithic `WorkflowNotes.tsx` (~1035 lines) must be decomposed before any features are added. Every new feature touches this file; building on the monolith means rewriting later.

**Step 3.1 — Architect designs decomposition plan (read-only)**
- [ ] Review `WorkflowNotes.tsx` and produce a component tree diagram
- [ ] Define file structure under `src/renderer/src/components/`
- [ ] Define which state stays local vs. gets lifted
- [ ] Define hook extractions (`useDragNote.ts`, `useContextMenu.ts`, `useStorage.ts`)
- [ ] Update types in `src/renderer/src/types/index.ts` if needed

**Step 3.2 — UI Builder extracts components (in order)**

| # | Component | Source Lines (approx) | Complexity | New File |
|---|---|---|---|---|
| 1 | `EmptyState.tsx` | 808-821 | Low | `components/EmptyState.tsx` |
| 2 | `ContextMenu.tsx` + `useContextMenu.ts` | 823-872 | Medium | `components/ContextMenu.tsx`, `hooks/useContextMenu.ts` |
| 3 | `NoteToolbar.tsx` | 706-731 | Low | `components/NoteToolbar.tsx` |
| 4 | `LoadingOverlay.tsx` | 631-660 | Low | `components/LoadingOverlay.tsx` |
| 5 | `StickyNote.tsx` | 609-806 | High | `components/StickyNote.tsx` |
| 6 | `Canvas.tsx` | 590-606 | Medium | `components/Canvas.tsx` |
| 7 | `Header.tsx` | 518-587 | Medium | `components/Header.tsx` |
| 8 | `PromptModal.tsx` | (prompt modal code) | Medium | `components/PromptModal.tsx` |
| 9 | `useDragNote.ts` | 302-343 | Medium | `hooks/useDragNote.ts` |
| 10 | `useStorage.ts` | 13-36 | Low | `hooks/useStorage.ts` |

**Step 3.3 — Compose and verify**
- [ ] Create `App.tsx` composition using extracted components
- [ ] Delete `WorkflowNotes.tsx`
- [ ] Verify: all features work, no visual changes, zero TS errors

**Acceptance criteria:** All features work identically, no visual changes, monolith deleted, each component < 200 lines, zero TS errors.

---

### Phase 3B: Canvas & Note Features
**Agent: Architect (design) + UI Builder (implementation)**
**Status: PENDING**
**Depends on: Phase 3 complete**

New features that enhance the core note and canvas experience.

**3B.1 — Note Titles**
- [ ] Add `title: string` field to `Note` type in `types/index.ts`
- [ ] Add editable title input to `StickyNote.tsx` (above content area)
- [ ] Default title: "Untitled" for new notes
- [ ] Title persisted in storage alongside content
- [ ] Update `PersistedNote` type to include `title`

**3B.2 — Scrollable Canvas (pan in all directions)**
- [ ] Add `canvasOffset: Position` state to `Canvas.tsx`
- [ ] Implement middle-click drag or Shift+drag to pan the canvas
- [ ] Render notes at `position + canvasOffset`
- [ ] Add visual scroll indicators or minimap later (Phase 7)
- [ ] Canvas should feel infinite — no hard boundaries

**3B.3 — Note Fullscreen on Double-Click**
- [ ] Create `FullscreenNote.tsx` — modal overlay with full-width editor
- [ ] Double-click on `StickyNote.tsx` triggers fullscreen mode
- [ ] Fullscreen shows: title (editable), content (editable), toolbar, close button
- [ ] Escape key or close button returns to canvas
- [ ] Changes in fullscreen sync back to the note on the canvas
- [ ] Note toolbar available in fullscreen mode

**Acceptance criteria:** Notes have editable titles. Canvas pans in all directions. Double-click opens fullscreen editor. All changes persist.

---

### Phase 3C: Layout & Organization Features
**Agent: Architect (design) + UI Builder (implementation)**
**Status: PENDING**
**Depends on: Phase 3B complete (canvas + titles needed first)**

**3C.1 — Workflow Nav Redesign**
- [ ] Replace flat tab bar in `Header.tsx` with "Workflows" dropdown/carousel
- [ ] Show max 5 workflows with left/right arrow navigation
- [ ] Move "+ New Workflow" inside the dropdown
- [ ] Add "See All Workflows" option when more than 5 workflows exist
- [ ] Add workflow rename (inline edit on double-click)
- [ ] Add workflow delete (with confirmation)

**3C.2 — Section Headers / Dividers**
- [ ] Create `SectionDivider.tsx` — draggable labeled divider on the canvas
- [ ] Add `Divider` type to `types/index.ts` with `id`, `label`, `position`, `orientation` (horizontal/vertical)
- [ ] Store dividers in workflow data (alongside notes)
- [ ] Dividers are draggable (reuse `useDragNote` pattern)
- [ ] Double-click divider label to rename

**3C.3 — Free Mode vs Stacked Mode**
- [ ] Add `layoutMode: 'free' | 'stacked'` to workflow state
- [ ] Create toggle button in `Header.tsx`
- [ ] **Free mode** (current): notes positioned freely on canvas
- [ ] **Stacked mode**: notes arranged in columns (Kanban-style), snapped to grid
- [ ] Switching modes preserves note data but recalculates positions
- [ ] Section dividers become column headers in stacked mode

**Acceptance criteria:** Workflow nav shows max 5 tabs with carousel. Dividers work on canvas. Toggle between free and stacked layouts.

---

### Phase 4: Zustand Store + Storage Migration
**Agent: DB Builder + Architect**
**Status: PENDING**
**Depends on: Phase 3C complete**

- [ ] Create `store/useStore.ts` — Zustand store with typed state and actions
- [ ] Create `src/main/store.ts` — electron-store config with defaults
- [ ] Create IPC channels: `storage:load`, `storage:save` in `src/main/ipc.ts`
- [ ] Create `utils/storage.ts` — bridge (IPC for desktop, localStorage for web)
- [ ] Migrate all components from prop-drilling to `useStore()` selectors
- [ ] Implement data migration: localStorage -> electron-store on first desktop launch
- [ ] Handle new fields in migration: `note.title`, `workflow.dividers`, `workflow.layoutMode`

**Store shape:**
```typescript
interface NotiesState {
  workflows: Workflow[]
  activeWorkflow: string
  activeEditor: string | null
  contextMenu: ContextMenuState | null
  canvasOffset: Position
  fullscreenNoteId: string | null

  // Actions
  setActiveWorkflow: (id: string) => void
  addWorkflow: (name: string) => void
  renameWorkflow: (id: string, name: string) => void
  deleteWorkflow: (id: string) => void
  setLayoutMode: (mode: 'free' | 'stacked') => void
  addNote: () => void
  updateNoteTitle: (noteId: string, title: string) => void
  updateNoteContent: (noteId: string, content: string) => void
  saveNote: (noteId: string) => void
  deleteNote: (noteId: string) => void
  duplicateNote: (noteId: string) => void
  updateNotePosition: (noteId: string, position: Position) => void
  setNoteAIState: (noteId: string, state: Partial<AIState>) => void
  setFullscreenNote: (noteId: string | null) => void
  setCanvasOffset: (offset: Position) => void
  addDivider: (label: string) => void
  updateDivider: (dividerId: string, updates: Partial<Divider>) => void
  deleteDivider: (dividerId: string) => void
  save: () => Promise<void>
  initialize: () => Promise<void>
}
```

**Acceptance criteria:** Data persists via file system (desktop) or localStorage (web). Zustand drives all state. New features (titles, dividers, layout mode) included in store.

---

### Phase 5: API Key Security + Settings Dashboard
**Agent: Security Audit + UI Builder**
**Status: PENDING**
**Depends on: Phase 4 complete**

**5.1 — API Key Security (main process)**
- [ ] Implement `ai:fix` IPC handler — reads `ANTHROPIC_API_KEY` from `process.env`, calls Claude API
- [ ] Implement `ai:search` IPC handler — same pattern
- [ ] Expose `fixWithAI()` and `searchWithAI()` through contextBridge (already stubbed)
- [ ] Create `hooks/useAI.ts` — manages loading states, calls IPC, handles errors with user feedback
- [ ] Verify `.env` uses `ANTHROPIC_API_KEY` (no `VITE_` prefix — never bundled)
- [ ] Web fallback: direct API calls with user-provided key stored in localStorage

**5.2 — Settings Dashboard**
- [ ] Create `components/Settings.tsx` — slide-out panel or modal
- [ ] Sections: API Configuration, Preferences, About
- [ ] API key input field with show/hide toggle (masked by default)
- [ ] API key validation — test call on save, show success/error
- [ ] Store API key: main process env (desktop) or localStorage (web, with warning)
- [ ] Preferences: default workflow name, note size, theme (placeholder for Phase 7)
- [ ] Settings accessible from Header via gear icon
- [ ] Settings state persisted via Zustand store + electron-store

**Acceptance criteria:** Renderer source contains zero API keys. AI calls work through main process proxy. Settings panel allows API key entry and validation. DevTools shows no key in network/source.

---

### Phase 6: Styling Extraction
**Agent: UI Builder**
**Status: PENDING**
**Depends on: Phase 5 complete**

- [ ] Define CSS custom properties in `:root` (already started in `global.css`)
- [ ] Create CSS files: `canvas.css`, `note.css`, `toolbar.css`, `context-menu.css`, `animations.css`, `titlebar.css`, `settings.css`, `fullscreen.css`
- [ ] Extract all inline `style={}` props into CSS classes (BEM-like naming)
- [ ] Replace all `onMouseEnter`/`onMouseLeave` style hacks with CSS `:hover`
- [ ] Keep only dynamic values inline (`left`, `top`, `zIndex` for note positioning)
- [ ] Style new components: Settings panel, FullscreenNote, SectionDivider, WorkflowCarousel

**CSS naming convention:**
```
.note-card
.note-card--dragging
.note-card--fullscreen
.note-card__handle
.note-card__title
.note-card__editor
.note-card__actions
.canvas
.canvas--stacked
.header__workflow-carousel
.settings-panel
.section-divider
```

**Acceptance criteria:** Zero inline style props except truly dynamic positioning values.

---

### Phase 7: Professional Desktop Features
**Agent: UI Builder + Architect**
**Status: PENDING**
**Depends on: Phase 6 complete**

- [ ] Custom frameless titlebar (`TitleBar.tsx` — minimize, maximize, close, `-webkit-app-region: drag`)
- [ ] React error boundary with friendly fallback UI
- [ ] Keyboard shortcuts: `Ctrl+N` (new note), `Ctrl+S` (save), `Ctrl+D` (duplicate), `Delete`
- [ ] Toast notification system for errors and confirmations
- [ ] Electron app menu (File, Edit, View, Help)
- [ ] Note z-index management (click to bring to front)
- [ ] Canvas minimap for orientation when zoomed/panned
- [ ] Dark mode toggle (CSS variables swap)
- [ ] Auto-save with debounce (replace manual save button)

**Acceptance criteria:** App feels like a polished native desktop application.

---

### Phase 8: Build & Distribution
**Agent: Orchestrator**
**Status: PENDING**
**Depends on: Phase 7 complete**

- [ ] Add `electron-builder` to devDependencies
- [ ] Configure: Windows NSIS installer, app icon, app ID `com.adev.noties`
- [ ] Create app icons (256x256 ICO for Windows)
- [ ] Build script: `npm run build:win`
- [ ] Test built installer on Windows 10
- [ ] Push to GitHub (`a-dev-gh/Noties`)
- [ ] Create GitHub Release with installer asset

**Acceptance criteria:** Installable `.exe` works end-to-end on Windows.

---

## Phase Dependency Graph

```
Phase 1 (DONE) -> Phase 2 (DONE) -> Phase 3 (decomposition)
                                          |
                                     Phase 3B (canvas & note features)
                                          |
                                     Phase 3C (layout & organization)
                                          |
                                     Phase 4 (Zustand + storage)
                                          |
                                     Phase 5 (API security + settings)
                                          |
                                     Phase 6 (styling extraction)
                                          |
                                     Phase 7 (desktop polish)
                                          |
                                     Phase 8 (build & distribution)
```

---

## Bugs Found in Prototype

These were tracked here and fixed during Phase 2.

| # | Bug | Location | Impact | Status |
|---|---|---|---|---|
| 1 | `contextMenuItemStyle` defined after `return` statement | Line 877 | Style object is undefined when referenced in JSX | RESOLVED |
| 2 | No `x-api-key` header in Claude API calls | Lines 172, 253 | All API calls fail with 401 Unauthorized | RESOLVED |
| 3 | Drag offset uses `clientX - note.position.x` (viewport vs canvas coords) | Line 306-309 | Notes jump on drag start when canvas isn't at (0,0) | RESOLVED |
| 4 | Text writes backwards in contentEditable | WorkflowNotes.tsx | App unusable for text input | RESOLVED |
| 5 | `prompt()` crashes Electron | WorkflowNotes.tsx | App crashes on New Workflow, Insert Link, Insert Image | RESOLVED |
| 6 | useEffect references variable before declaration | WorkflowNotes.tsx | White screen on launch | RESOLVED |

---

## Suggestions & Future Features

These are not in the current scope but are recommended for future development:

### High Priority
- **Search/filter notes** — Find notes by content as the collection grows
- **Export** — Export notes as markdown or plain text for sharing

### Medium Priority
- **Auto-updater** — `electron-updater` for seamless updates via GitHub Releases
- **Undo/redo** — Workflow-level undo (delete note, then undo)
- **Note resize** — Drag handle on bottom-right corner
- **Canvas zoom** — Scroll wheel zoom for large note collections
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
