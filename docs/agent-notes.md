# Agent Notes — Noties

## SESSION — 2026-04-09 — Phase 2: Port Prototype Into Electron

### Last Session Summary
- Phase 1 (Project Scaffolding) completed on 2026-04-09
- Electron shell is working: `npm run dev` opens window with placeholder App.tsx
- BUG-001 resolved (ELECTRON_RUN_AS_NODE env var issue)
- Three prototype bugs cataloged (BUG-002, BUG-003, BUG-004) — all PENDING

### Phase 2 Execution Plan

**Goal:** Port `workflow-notes.jsx` (895 lines) into the Electron app as a working TypeScript component.

**Assigned tasks:**

- [x] TASK-001 | @architect | Define TypeScript interfaces for Note, Workflow, ContextMenuState, and component props | DONE when: `src/renderer/src/types/index.ts` exists with all types exported, compiles with zero errors
- [x] TASK-002 | @ui-builder | Convert `workflow-notes.jsx` to `WorkflowNotes.tsx` — apply TS types from TASK-001, fix BUG-002 (contextMenuItemStyle after return), fix BUG-004 (drag offset coordinates) | DONE when: file compiles with zero TS errors and all three bugs are resolved
- [x] TASK-003 | @ui-builder | Extract `<style>` tag content from WorkflowNotes into `styles/global.css` (merge with existing CSS variables) | DONE when: zero `<style>` tags in JSX, all styles in CSS files, visual appearance unchanged
- [x] TASK-004 | @ui-builder | Wire `<WorkflowNotes />` into `App.tsx`, remove placeholder content | DONE when: `npm run dev` renders the full notes app with tabs, drag, edit, context menu, localStorage persistence
- [x] TASK-005 | @code-reviewer | Review the completed port for: TS correctness, missing type assertions, React anti-patterns, any remaining bugs | DONE when: review notes posted, all critical issues resolved

**Dependency order:** TASK-001 -> TASK-002 -> TASK-003 -> TASK-004 -> TASK-005

**Scoping decision: BUG-003 (missing x-api-key) is DEFERRED to Phase 5.**
The AGENTS.md plan already notes this — AI calls will be completely rewritten to use IPC in Phase 5. Fixing the header now on code that will be deleted is wasted effort. For Phase 2, AI buttons will be present but non-functional (they'll fail gracefully with the existing try/catch).

**Blocked on Adrian:** None — this is a straight port with known scope.

**Confidence:** High — this is mechanical conversion work, no design decisions needed.
**Risk:** Low — the prototype already works, we're just porting format.
**Estimated time:** 30-45 minutes for all tasks.

### Phase 2 Result
- **Status:** COMPLETE (2026-04-10)
- All 5 tasks done. Additional hotfixes applied: BUG-005 (backwards text), BUG-006 (prompt crash), BUG-007 (white screen).

---

## SESSION — 2026-04-10 — Feature Planning & AGENTS.md Overhaul

### Last Session Summary
- Phase 2 completed on 2026-04-10
- 7 bugs total resolved (BUG-001 through BUG-007)
- App runs in Electron with all prototype features working
- Phase 3 (component decomposition) was next on the roadmap

### What Happened This Session
Adrian provided 7 new feature requests:
1. Settings Dashboard
2. Note fullscreen on double-click
3. Workflow nav redesign (dropdown/carousel, max 5 visible)
4. Note titles (editable)
5. Scrollable canvas (pan all directions)
6. Section headers/dividers
7. Free mode vs Stacked mode

### Decisions Made
- **Phase 3 (decomposition) remains the top priority.** The monolith is ~1035 lines. All 7 features touch the same file. Decompose first, then add features cleanly.
- **New features organized into Phase 3B (canvas/note) and Phase 3C (layout/organization)** — inserted between Phase 3 and Phase 4.
- **Settings Dashboard merged into Phase 5** alongside API key security — they are the same concern.
- **Items moved from Suggestions to active phases:** Auto-save and Dark mode moved to Phase 7. Canvas pan moved from suggestions to Phase 3B.
- **Prompt modal (BUG-006 fix) noted for extraction** in Phase 3 decomposition as its own component.

### Updated Phase Dependency Graph
```
Phase 1 (DONE) -> Phase 2 (DONE) -> Phase 3 (decomposition)
     -> Phase 3B (note titles, scrollable canvas, fullscreen)
     -> Phase 3C (workflow nav, dividers, free/stacked mode)
     -> Phase 4 (Zustand store + storage)
     -> Phase 5 (API security + settings dashboard)
     -> Phase 6 (styling extraction)
     -> Phase 7 (desktop polish)
     -> Phase 8 (build & distribution)
```

### Files Updated
- `AGENTS.md` — complete overhaul with new phases 3B, 3C, updated store shape, updated Phase 5/6/7

### Next Session Should Start With
- Phase 3 execution: Architect designs decomposition plan, then UI Builder extracts components
- First task: @architect reviews WorkflowNotes.tsx and produces component tree + file structure

### Open Questions for Adrian
- None — plan is ready to execute. Adrian should review the updated AGENTS.md and confirm the phase ordering before we start Phase 3.

---

## Session — 2026-04-11

### Phase 3: Component Decomposition (In Progress)
Splitting WorkflowNotes.tsx (1035 lines) into focused components:
- EmptyState.tsx — "No notes yet" placeholder
- ContextMenu.tsx — Right-click menu overlay
- NoteToolbar.tsx — Rich text formatting toolbar
- LoadingOverlay.tsx — AI operation spinner
- StickyNote.tsx — Individual note card (biggest piece)
- Canvas.tsx — Grid canvas container with mouse handlers
- Header.tsx — App header with logo, tabs, buttons
- PromptDialog.tsx — Custom modal replacing window.prompt()

### Pending Features (Phase 3B/3C)
- Note titles on each sticky note
- Scrollable canvas (pan all directions)
- Double-click note → fullscreen editor
- Workflow nav carousel (max 5 visible, arrows)
- Section headers/dividers
- Free mode vs Stacked mode toggle
- Settings dashboard (Phase 5)

### Bugs Resolved (all 7)
BUG-001: ELECTRON_RUN_AS_NODE — RESOLVED
BUG-002: contextMenuItemStyle after return — RESOLVED
BUG-003: Missing x-api-key header — RESOLVED
BUG-004: Drag offset viewport/canvas mismatch — RESOLVED
BUG-005: Text writes backwards — RESOLVED
BUG-006: prompt() crashes Electron — RESOLVED
BUG-007: White screen useEffect ordering — RESOLVED
