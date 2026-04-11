// =============================================================================
// Noties — Core Type Definitions
// =============================================================================

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/** 2D coordinate used for note placement and drag offsets. */
export interface Position {
  x: number
  y: number
}

/** Tracks the pan/scroll offset of the infinite canvas. */
export interface CanvasViewport {
  scrollX: number
  scrollY: number
}

// ---------------------------------------------------------------------------
// Domain Models
// ---------------------------------------------------------------------------

/** A single sticky note on the canvas. */
export interface Note {
  id: string
  title?: string
  content: string
  position: Position
  hasUnsavedChanges: boolean
  savedContent: string
  /** Transient: true while an AI search request is in-flight */
  isSearching?: boolean
  /** Transient: true while an AI fix request is in-flight */
  isFixing?: boolean
  /** Section this note belongs to (stacked mode) */
  sectionId?: string | null
  /** Order within its section (stacked mode) */
  order?: number
  /** Note card width in px (default 320) */
  width?: number
  /** Note card height in px (default 240) */
  height?: number
}

/** A labeled divider/grouping header on the canvas. */
export interface SectionHeader {
  id: string
  label: string
  position: Position
  order: number
  color?: string
}

/** A workflow is a named collection of notes and sections. */
export interface Workflow {
  id: string
  name: string
  notes: Note[]
  sections: SectionHeader[]
  layoutMode: 'free' | 'grid'
}

// ---------------------------------------------------------------------------
// UI State
// ---------------------------------------------------------------------------

/** Fullscreen editor overlay state. null when no note is expanded. */
export interface FullscreenEditorState {
  noteId: string
}

/** Right-click context menu state. null when closed. */
export interface ContextMenuState {
  x: number
  y: number
  noteId: string
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

export type PersistedNote = Omit<Note, 'isSearching' | 'isFixing'>

export interface PersistedWorkflow {
  id: string
  name: string
  notes: PersistedNote[]
  sections: SectionHeader[]
  layoutMode: 'free' | 'grid'
}

export type StoragePayload = PersistedWorkflow[]

// ---------------------------------------------------------------------------
// Component Props (Phase 3 — decomposition-ready)
// ---------------------------------------------------------------------------

export interface HeaderProps {
  workflows: Workflow[]
  activeWorkflowId: string
  onSelectWorkflow: (workflowId: string) => void
  onAddWorkflow: () => void
  onAddNote: () => void
  onAddSection: () => void
  layoutMode: 'free' | 'grid'
  onToggleLayoutMode: (mode: 'free' | 'grid') => void
}

export interface NavBarProps {
  workflows: Workflow[]
  activeWorkflowId: string
  onSelectWorkflow: (workflowId: string) => void
  onAddWorkflow: () => void
  onOpenSettings: () => void
}

export interface SubNavProps {
  layoutMode: 'free' | 'grid'
  onToggleLayoutMode: (mode: 'free' | 'grid') => void
  onAddNote: () => void
  onAddSection: () => void
  onOpenSettings: () => void
}

export interface WorkflowDropdownProps {
  workflows: Workflow[]
  activeWorkflowId: string
  onSelectWorkflow: (workflowId: string) => void
  onAddWorkflow: () => void
  onClose: () => void
}

export interface CanvasProps {
  notes: Note[]
  sections: SectionHeader[]
  isDraggingId: string | null
  draggingSectionId: string | null
  contextMenu: ContextMenuState | null
  onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void
  onMouseUp: () => void
  onNoteMouseDown: (noteId: string, e: React.MouseEvent<HTMLDivElement>) => void
  onSectionMouseDown: (sectionId: string, e: React.MouseEvent<HTMLDivElement>) => void
  onNoteContentChange: (noteId: string, content: string) => void
  onNoteFocus: (noteId: string) => void
  onNoteContextMenu: (e: React.MouseEvent, noteId: string) => void
  onSaveNote: (noteId: string) => void
  onDeleteNote: (noteId: string) => void
  onFixWithAI: (noteId: string) => void
  onFormatText: (command: string, value?: string) => void
  onNoteDoubleClick: (noteId: string) => void
  onDeleteSection: (sectionId: string) => void
  onUpdateSectionLabel: (sectionId: string, label: string) => void
  onNoteResize: (noteId: string, size: { width: number; height: number }) => void
}

export interface NoteCardProps {
  note: Note
  isDragging: boolean
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void
  onContentChange: (content: string) => void
  onTitleChange: (title: string) => void
  onFocus: () => void
  onContextMenu: (e: React.MouseEvent) => void
  onSave: () => void
  onDelete: () => void
  onFixWithAI: () => void
  onFormatText: (command: string, value?: string) => void
  onDoubleClick: () => void
  onResize: (size: { width: number; height: number }) => void
}

export interface NoteToolbarProps {
  onFormatText: (command: string, value?: string) => void
  onInsertLink: () => void
  onInsertImage: () => void
}

export interface NoteActionsProps {
  hasUnsavedChanges: boolean
  isFixing: boolean
  hasContent: boolean
  onFixWithAI: () => void
  onSave: () => void
}

export interface ContextMenuProps {
  state: ContextMenuState
  onSearchWithAI: () => void
  onDuplicate: () => void
  onDelete: () => void
  onClose: () => void
}

export interface EmptyCanvasProps {
  onAddNote: () => void
}

export interface FullscreenEditorProps {
  note: Note
  onContentChange: (content: string) => void
  onTitleChange: (title: string) => void
  onSave: () => void
  onFixWithAI: () => void
  onFormatText: (command: string, value?: string) => void
  onClose: () => void
}

export interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
}
