import React, { useState, useRef, useEffect } from 'react'
import type {
  Note,
  Workflow,
  SectionHeader,
  Position,
  ContextMenuState,
  FullscreenEditorState,
  StoragePayload
} from '../types'
import Header from './Header'
import Canvas from './Canvas'
import StackedCanvas from './StackedCanvas'
import FullscreenEditor from './FullscreenEditor'
import PromptDialog from './PromptDialog'
import type { PromptDialogState } from './PromptDialog'

// ---------------------------------------------------------------------------
// Storage helpers — prefer electronAPI, fall back to localStorage (web mode)
// ---------------------------------------------------------------------------
const loadFromStorage = (): Promise<StoragePayload | null> => {
  if (window.electronAPI) {
    return window.electronAPI.loadData().then((data) => {
      if (data) return data as StoragePayload
      return null
    })
  }
  return Promise.resolve(
    (() => {
      const saved = localStorage.getItem('workflow-notes-data')
      return saved ? (JSON.parse(saved) as StoragePayload) : null
    })()
  )
}

const persistToStorage = (data: StoragePayload): void => {
  if (window.electronAPI) {
    window.electronAPI.saveData(data)
  } else {
    localStorage.setItem('workflow-notes-data', JSON.stringify(data))
  }
}

/** Migrate older persisted workflows that lack sections/layoutMode fields. */
const migrateWorkflows = (raw: StoragePayload): Workflow[] =>
  raw.map((w) => ({
    ...w,
    sections: (w as Workflow).sections ?? [],
    layoutMode: (w as Workflow).layoutMode ?? 'free'
  }))

// ---------------------------------------------------------------------------
// Default workflows
// ---------------------------------------------------------------------------
const DEFAULT_WORKFLOWS: Workflow[] = [
  { id: 'w1', name: 'Frontend Development', notes: [], sections: [], layoutMode: 'free' },
  { id: 'w2', name: 'API Integration', notes: [], sections: [], layoutMode: 'free' },
  { id: 'w3', name: 'Database Design', notes: [], sections: [], layoutMode: 'free' }
]

// Palette of accent colors cycled for new sections
const SECTION_COLORS = [
  '#667eea',
  '#f093fb',
  '#4ade80',
  '#fb923c',
  '#38bdf8',
  '#f43f5e',
  '#a78bfa'
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const WorkflowNotes = (): JSX.Element => {
  const [workflows, setWorkflows] = useState<Workflow[]>(DEFAULT_WORKFLOWS)
  const [activeWorkflow, setActiveWorkflow] = useState<string>('w1')

  // Note dragging
  const [isDragging, setIsDragging] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 })

  // Section dragging
  const [isDraggingSection, setIsDraggingSection] = useState<string | null>(null)
  const [sectionDragOffset, setSectionDragOffset] = useState<Position>({ x: 0, y: 0 })

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [activeEditor, setActiveEditor] = useState<string | null>(null)
  const [promptDialog, setPromptDialog] = useState<PromptDialogState | null>(null)
  const [fullscreenNote, setFullscreenNote] = useState<FullscreenEditorState | null>(null)

  const canvasRef = useRef<HTMLDivElement>(null)
  const editorRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const initializedNotes = useRef<Set<string>>(new Set())

  // Load persisted data on mount
  useEffect(() => {
    loadFromStorage()
      .then((saved) => {
        if (saved) setWorkflows(migrateWorkflows(saved))
      })
      .catch((err) => console.error('[storage] load failed:', err))
  }, [])

  // Close context menu on any document click
  useEffect(() => {
    const handleClick = (): void => setContextMenu(null)
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------
  const activeWorkflowData = workflows.find((w) => w.id === activeWorkflow)
  const currentLayoutMode = activeWorkflowData?.layoutMode ?? 'free'

  // Initialize note content on mount, and sync from external changes (AI fix).
  useEffect(() => {
    activeWorkflowData?.notes.forEach((note) => {
      const el = editorRefs.current[note.id]
      if (!el) return

      if (!initializedNotes.current.has(note.id)) {
        el.innerHTML = note.content
        initializedNotes.current.add(note.id)
        return
      }

      // External update (AI fix) — only sync if user is NOT editing this note
      if (note.id !== activeEditor && el.innerHTML !== note.content) {
        el.innerHTML = note.content
      }
    })
  }, [activeWorkflowData?.notes, activeEditor])

  // ---------------------------------------------------------------------------
  // Prompt dialog (replaces window.prompt — crashes in Electron)
  // ---------------------------------------------------------------------------
  const showPrompt = (message: string): Promise<string | null> => {
    return new Promise((resolve) => {
      setPromptDialog({
        message,
        value: '',
        onSubmit: (value) => {
          setPromptDialog(null)
          resolve(value || null)
        }
      })
    })
  }

  // ---------------------------------------------------------------------------
  // Rich-text formatting helpers
  // ---------------------------------------------------------------------------
  const formatText = (command: string, value: string | null = null): void => {
    document.execCommand(command, false, value ?? undefined)
    if (activeEditor) {
      const content = editorRefs.current[activeEditor]?.innerHTML || ''
      updateNoteContent(activeEditor, content)
    }
  }

  const handleFormatText = async (command: string, value?: string): Promise<void> => {
    if (command === '__insertLink__') {
      const url = await showPrompt('Enter URL:')
      if (url) formatText('createLink', url)
      return
    }
    if (command === '__insertImage__') {
      const url = await showPrompt('Enter image URL:')
      if (url) formatText('insertImage', url)
      return
    }
    formatText(command, value ?? null)
  }

  // ---------------------------------------------------------------------------
  // Persistence
  // ---------------------------------------------------------------------------
  const saveToStorage = (updatedWorkflows: Workflow[]): void => {
    persistToStorage(updatedWorkflows as StoragePayload)
    setWorkflows(updatedWorkflows)
  }

  // ---------------------------------------------------------------------------
  // Note CRUD
  // ---------------------------------------------------------------------------
  const addNote = (): void => {
    const newNote: Note = {
      id: `note_${Date.now()}`,
      title: '',
      content: '',
      position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
      hasUnsavedChanges: false,
      savedContent: '',
      sectionId: null,
      order: (activeWorkflowData?.notes.length ?? 0)
    }
    const updated = workflows.map((w) =>
      w.id === activeWorkflow ? { ...w, notes: [...w.notes, newNote] } : w
    )
    saveToStorage(updated)
  }

  const updateNoteTitle = (noteId: string, title: string): void => {
    const updated = workflows.map((w) =>
      w.id === activeWorkflow
        ? { ...w, notes: w.notes.map((n) => (n.id === noteId ? { ...n, title } : n)) }
        : w
    )
    setWorkflows(updated)
  }

  const updateNoteContent = (noteId: string, content: string): void => {
    const updated = workflows.map((w) =>
      w.id === activeWorkflow
        ? {
            ...w,
            notes: w.notes.map((n) =>
              n.id === noteId
                ? { ...n, content, hasUnsavedChanges: content !== n.savedContent }
                : n
            )
          }
        : w
    )
    setWorkflows(updated)
  }

  const saveNote = (noteId: string): void => {
    const updated = workflows.map((w) =>
      w.id === activeWorkflow
        ? {
            ...w,
            notes: w.notes.map((n) =>
              n.id === noteId ? { ...n, savedContent: n.content, hasUnsavedChanges: false } : n
            )
          }
        : w
    )
    saveToStorage(updated)
  }

  const deleteNote = (noteId: string): void => {
    initializedNotes.current.delete(noteId)
    delete editorRefs.current[noteId]
    const updated = workflows.map((w) =>
      w.id === activeWorkflow
        ? { ...w, notes: w.notes.filter((n) => n.id !== noteId) }
        : w
    )
    saveToStorage(updated)
    setContextMenu(null)
  }

  const duplicateNote = (noteId: string): void => {
    const note = activeWorkflowData?.notes.find((n) => n.id === noteId)
    if (!note) return
    const newNote: Note = {
      ...note,
      id: `note_${Date.now()}`,
      position: { x: note.position.x + 20, y: note.position.y + 20 }
    }
    const updated = workflows.map((w) =>
      w.id === activeWorkflow ? { ...w, notes: [...w.notes, newNote] } : w
    )
    saveToStorage(updated)
    setContextMenu(null)
  }

  const assignNoteToSection = (noteId: string, sectionId: string | null): void => {
    const updated = workflows.map((w) =>
      w.id === activeWorkflow
        ? {
            ...w,
            notes: w.notes.map((n) => (n.id === noteId ? { ...n, sectionId } : n))
          }
        : w
    )
    saveToStorage(updated)
  }

  // ---------------------------------------------------------------------------
  // Section CRUD
  // ---------------------------------------------------------------------------
  const addSection = async (): Promise<void> => {
    const label = await showPrompt('Section label:')
    if (!label) return

    const existingSections = activeWorkflowData?.sections ?? []
    const colorIdx = existingSections.length % SECTION_COLORS.length

    const newSection: SectionHeader = {
      id: `sec_${Date.now()}`,
      label,
      position: { x: 80 + Math.random() * 200, y: 60 + existingSections.length * 120 },
      order: existingSections.length,
      color: SECTION_COLORS[colorIdx]
    }

    const updated = workflows.map((w) =>
      w.id === activeWorkflow
        ? { ...w, sections: [...w.sections, newSection] }
        : w
    )
    saveToStorage(updated)
  }

  const updateSectionLabel = (sectionId: string, label: string): void => {
    const updated = workflows.map((w) =>
      w.id === activeWorkflow
        ? {
            ...w,
            sections: w.sections.map((s) => (s.id === sectionId ? { ...s, label } : s))
          }
        : w
    )
    saveToStorage(updated)
  }

  const deleteSection = (sectionId: string): void => {
    const updated = workflows.map((w) =>
      w.id === activeWorkflow
        ? {
            ...w,
            sections: w.sections.filter((s) => s.id !== sectionId),
            // Unassign notes that belonged to this section
            notes: w.notes.map((n) =>
              n.sectionId === sectionId ? { ...n, sectionId: null } : n
            )
          }
        : w
    )
    saveToStorage(updated)
  }

  // ---------------------------------------------------------------------------
  // Layout mode toggle
  // ---------------------------------------------------------------------------
  const toggleLayoutMode = (mode: 'free' | 'stacked'): void => {
    const updated = workflows.map((w) =>
      w.id === activeWorkflow ? { ...w, layoutMode: mode } : w
    )
    saveToStorage(updated)
  }

  // ---------------------------------------------------------------------------
  // AI operations
  // ---------------------------------------------------------------------------
  const searchWithAI = async (noteId: string): Promise<void> => {
    const note = activeWorkflowData?.notes.find((n) => n.id === noteId)
    if (!note || !note.content.trim()) return

    setContextMenu(null)

    const loadingUpdated = workflows.map((w) =>
      w.id === activeWorkflow
        ? { ...w, notes: w.notes.map((n) => (n.id === noteId ? { ...n, isSearching: true } : n)) }
        : w
    )
    setWorkflows(loadingUpdated)

    try {
      let searchResults: string

      if (window.electronAPI) {
        searchResults = await window.electronAPI.searchWithAI(
          note.content.replace(/<[^>]*>/g, '')
        )
      } else {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2000,
            messages: [
              {
                role: 'user',
                content: `Search for and provide relevant information about: ${note.content.replace(/<[^>]*>/g, '')}. Give me a comprehensive summary with key points.`
              }
            ]
          })
        })
        const data = await response.json()
        searchResults = data.content?.[0]?.text || 'No results found'
      }

      const newNote: Note = {
        id: `note_${Date.now()}`,
        content: `<strong>Search Results:</strong><br/><br/>${searchResults}`,
        position: { x: note.position.x + 340, y: note.position.y },
        hasUnsavedChanges: true,
        savedContent: '',
        sectionId: null,
        order: (activeWorkflowData?.notes.length ?? 0) + 1
      }

      const updated = workflows.map((w) =>
        w.id === activeWorkflow
          ? {
              ...w,
              notes: [
                ...w.notes.map((n) => (n.id === noteId ? { ...n, isSearching: false } : n)),
                newNote
              ]
            }
          : w
      )
      setWorkflows(updated)
    } catch (error) {
      console.error('AI search failed:', error)
      const errorUpdated = workflows.map((w) =>
        w.id === activeWorkflow
          ? {
              ...w,
              notes: w.notes.map((n) => (n.id === noteId ? { ...n, isSearching: false } : n))
            }
          : w
      )
      setWorkflows(errorUpdated)
    }
  }

  const fixWithAI = async (noteId: string): Promise<void> => {
    const note = activeWorkflowData?.notes.find((n) => n.id === noteId)
    if (!note || !note.content.trim()) return

    const loadingUpdated = workflows.map((w) =>
      w.id === activeWorkflow
        ? { ...w, notes: w.notes.map((n) => (n.id === noteId ? { ...n, isFixing: true } : n)) }
        : w
    )
    setWorkflows(loadingUpdated)

    try {
      let fixedContent: string

      if (window.electronAPI) {
        fixedContent = await window.electronAPI.fixWithAI(
          note.content.replace(/<[^>]*>/g, '')
        )
      } else {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1000,
            messages: [
              {
                role: 'user',
                content: `Fix and improve the structure and clarity of this prompt/note. Make it more organized, clear, and effective. Return ONLY the improved text with no preamble or explanation:\n\n${note.content}`
              }
            ]
          })
        })
        const data = await response.json()
        fixedContent = data.content?.[0]?.text || note.content
      }

      const updated = workflows.map((w) =>
        w.id === activeWorkflow
          ? {
              ...w,
              notes: w.notes.map((n) =>
                n.id === noteId
                  ? { ...n, content: fixedContent, hasUnsavedChanges: true, isFixing: false }
                  : n
              )
            }
          : w
      )
      setWorkflows(updated)
    } catch (error) {
      console.error('AI fix failed:', error)
      const errorUpdated = workflows.map((w) =>
        w.id === activeWorkflow
          ? {
              ...w,
              notes: w.notes.map((n) => (n.id === noteId ? { ...n, isFixing: false } : n))
            }
          : w
      )
      setWorkflows(errorUpdated)
    }
  }

  // ---------------------------------------------------------------------------
  // Note drag handling
  // ---------------------------------------------------------------------------
  const handleNoteMouseDown = (noteId: string, e: React.MouseEvent<HTMLDivElement>): void => {
    const note = activeWorkflowData?.notes.find((n) => n.id === noteId)
    if (!note) return

    setIsDragging(noteId)

    const canvas = canvasRef.current!
    const canvasRect = canvas.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - canvasRect.left + canvas.scrollLeft - note.position.x,
      y: e.clientY - canvasRect.top + canvas.scrollTop - note.position.y
    })
  }

  // ---------------------------------------------------------------------------
  // Section drag handling
  // ---------------------------------------------------------------------------
  const handleSectionMouseDown = (
    sectionId: string,
    e: React.MouseEvent<HTMLDivElement>
  ): void => {
    const section = activeWorkflowData?.sections.find((s) => s.id === sectionId)
    if (!section) return

    setIsDraggingSection(sectionId)

    const canvas = canvasRef.current!
    const canvasRect = canvas.getBoundingClientRect()
    setSectionDragOffset({
      x: e.clientX - canvasRect.left + canvas.scrollLeft - section.position.x,
      y: e.clientY - canvasRect.top + canvas.scrollTop - section.position.y
    })
  }

  // ---------------------------------------------------------------------------
  // Unified mouse move / up for both notes and sections
  // ---------------------------------------------------------------------------
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>): void => {
    const canvas = canvasRef.current!
    const canvasRect = canvas.getBoundingClientRect()

    if (isDragging) {
      const newX = e.clientX - canvasRect.left + canvas.scrollLeft - dragOffset.x
      const newY = e.clientY - canvasRect.top + canvas.scrollTop - dragOffset.y

      const updated = workflows.map((w) =>
        w.id === activeWorkflow
          ? {
              ...w,
              notes: w.notes.map((n) =>
                n.id === isDragging ? { ...n, position: { x: newX, y: newY } } : n
              )
            }
          : w
      )
      setWorkflows(updated)
    }

    if (isDraggingSection) {
      const newX = e.clientX - canvasRect.left + canvas.scrollLeft - sectionDragOffset.x
      const newY = e.clientY - canvasRect.top + canvas.scrollTop - sectionDragOffset.y

      const updated = workflows.map((w) =>
        w.id === activeWorkflow
          ? {
              ...w,
              sections: w.sections.map((s) =>
                s.id === isDraggingSection ? { ...s, position: { x: newX, y: newY } } : s
              )
            }
          : w
      )
      setWorkflows(updated)
    }
  }

  const handleMouseUp = (): void => {
    if (isDragging || isDraggingSection) {
      setWorkflows((current) => {
        persistToStorage(current as StoragePayload)
        return current
      })
      setIsDragging(null)
      setIsDraggingSection(null)
    }
  }

  // ---------------------------------------------------------------------------
  // Workflow CRUD
  // ---------------------------------------------------------------------------
  const addWorkflow = async (): Promise<void> => {
    const name = await showPrompt('Enter workflow name:')
    if (name) {
      const newWorkflow: Workflow = {
        id: `w${Date.now()}`,
        name,
        notes: [],
        sections: [],
        layoutMode: 'free'
      }
      saveToStorage([...workflows, newWorkflow])
    }
  }

  // ---------------------------------------------------------------------------
  // Editor ref callback factory — stable identity per note ID
  // ---------------------------------------------------------------------------
  const editorRefCallback = (noteId: string) => (el: HTMLDivElement | null): void => {
    editorRefs.current[noteId] = el
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: '#ffffff',
        fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Header
        workflows={workflows}
        activeWorkflowId={activeWorkflow}
        onSelectWorkflow={setActiveWorkflow}
        onAddWorkflow={addWorkflow}
        onAddNote={addNote}
        onAddSection={addSection}
        layoutMode={currentLayoutMode}
        onToggleLayoutMode={toggleLayoutMode}
      />

      {currentLayoutMode === 'stacked' ? (
        <StackedCanvas
          notes={activeWorkflowData?.notes ?? []}
          sections={activeWorkflowData?.sections ?? []}
          onNoteContentChange={updateNoteContent}
          onNoteTitleChange={updateNoteTitle}
          onNoteFocus={setActiveEditor}
          onSaveNote={saveNote}
          onDeleteNote={deleteNote}
          onFixWithAI={fixWithAI}
          onAssignSection={assignNoteToSection}
          editorRefCallback={editorRefCallback}
        />
      ) : (
        <Canvas
          canvasRef={canvasRef}
          notes={activeWorkflowData?.notes ?? []}
          sections={activeWorkflowData?.sections ?? []}
          isDraggingId={isDragging}
          draggingSectionId={isDraggingSection}
          contextMenu={contextMenu}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onNoteMouseDown={handleNoteMouseDown}
          onSectionMouseDown={handleSectionMouseDown}
          onNoteContentChange={updateNoteContent}
          onNoteTitleChange={updateNoteTitle}
          onNoteFocus={setActiveEditor}
          onNoteContextMenu={(e, noteId) => {
            e.preventDefault()
            setContextMenu({ x: e.clientX, y: e.clientY, noteId })
          }}
          onSaveNote={saveNote}
          onDeleteNote={deleteNote}
          onFixWithAI={fixWithAI}
          onFormatText={handleFormatText}
          onSearchWithAI={searchWithAI}
          onDuplicateNote={duplicateNote}
          onNoteDoubleClick={(noteId) => setFullscreenNote({ noteId })}
          onDeleteSection={deleteSection}
          onUpdateSectionLabel={updateSectionLabel}
          editorRefCallback={editorRefCallback}
        />
      )}

      {fullscreenNote &&
        (() => {
          const note = activeWorkflowData?.notes.find((n) => n.id === fullscreenNote.noteId)
          if (!note) return null
          return (
            <FullscreenEditor
              note={note}
              onContentChange={(content) => updateNoteContent(note.id, content)}
              onTitleChange={(title) => updateNoteTitle(note.id, title)}
              onSave={() => saveNote(note.id)}
              onFixWithAI={() => fixWithAI(note.id)}
              onFormatText={handleFormatText}
              onClose={() => setFullscreenNote(null)}
            />
          )
        })()}

      {promptDialog && (
        <PromptDialog
          state={promptDialog}
          onUpdate={setPromptDialog}
          onClose={() => setPromptDialog(null)}
        />
      )}
    </div>
  )
}

export default WorkflowNotes
