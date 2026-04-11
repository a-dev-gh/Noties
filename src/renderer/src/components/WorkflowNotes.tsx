import React, { useState, useRef, useEffect } from 'react'
import type {
  Note,
  Workflow,
  Position,
  ContextMenuState,
  StoragePayload
} from '../types'
import Header from './Header'
import Canvas from './Canvas'
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const WorkflowNotes = (): JSX.Element => {
  const [workflows, setWorkflows] = useState<Workflow[]>([
    { id: 'w1', name: 'Frontend Development', notes: [] },
    { id: 'w2', name: 'API Integration', notes: [] },
    { id: 'w3', name: 'Database Design', notes: [] }
  ])
  const [activeWorkflow, setActiveWorkflow] = useState<string>('w1')
  const [isDragging, setIsDragging] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 })
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [activeEditor, setActiveEditor] = useState<string | null>(null)
  const [promptDialog, setPromptDialog] = useState<PromptDialogState | null>(null)

  const canvasRef = useRef<HTMLDivElement>(null)
  const editorRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const initializedNotes = useRef<Set<string>>(new Set())

  // Load persisted data on mount
  useEffect(() => {
    loadFromStorage()
      .then((saved) => {
        if (saved) setWorkflows(saved)
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

  // Initialize note content on mount, and sync from external changes (AI fix).
  // We never use dangerouslySetInnerHTML on the contentEditable div because React
  // would re-render innerHTML on every state change, resetting the cursor to
  // position 0 and causing text to type backwards.
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

  // Handles sentinel commands emitted by NoteToolbar via StickyNote
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
      content: '',
      position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
      hasUnsavedChanges: false,
      savedContent: ''
    }
    const updated = workflows.map((w) =>
      w.id === activeWorkflow ? { ...w, notes: [...w.notes, newNote] } : w
    )
    saveToStorage(updated)
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
              n.id === noteId
                ? { ...n, savedContent: n.content, hasUnsavedChanges: false }
                : n
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

  // ---------------------------------------------------------------------------
  // AI operations — prefer electronAPI IPC, fall back to direct fetch (web mode)
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
        savedContent: ''
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
          ? { ...w, notes: w.notes.map((n) => (n.id === noteId ? { ...n, isSearching: false } : n)) }
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
          ? { ...w, notes: w.notes.map((n) => (n.id === noteId ? { ...n, isFixing: false } : n)) }
          : w
      )
      setWorkflows(errorUpdated)
    }
  }

  // ---------------------------------------------------------------------------
  // Drag handling
  // ---------------------------------------------------------------------------
  const handleMouseDown = (noteId: string, e: React.MouseEvent<HTMLDivElement>): void => {
    const note = activeWorkflowData?.notes.find((n) => n.id === noteId)
    if (!note) return

    setIsDragging(noteId)

    // BUG-004 FIX: clientX/Y are viewport coords; note.position is canvas-relative.
    // Subtract the canvas rect so the offset stays consistent during the drag.
    const canvasRect = canvasRef.current!.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - canvasRect.left - note.position.x,
      y: e.clientY - canvasRect.top - note.position.y
    })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (!isDragging) return

    const canvasRect = canvasRef.current!.getBoundingClientRect()
    let newX = e.clientX - canvasRect.left - dragOffset.x
    let newY = e.clientY - canvasRect.top - dragOffset.y

    newX = Math.max(0, Math.min(newX, canvasRect.width - 320))
    newY = Math.max(0, Math.min(newY, canvasRect.height - 240))

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

  const handleMouseUp = (): void => {
    if (isDragging) {
      setWorkflows((current) => {
        persistToStorage(current as StoragePayload)
        return current
      })
      setIsDragging(null)
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
        notes: []
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
      />

      <Canvas
        canvasRef={canvasRef}
        notes={activeWorkflowData?.notes ?? []}
        isDraggingId={isDragging}
        contextMenu={contextMenu}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onNoteMouseDown={handleMouseDown}
        onNoteContentChange={updateNoteContent}
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
        editorRefCallback={editorRefCallback}
      />

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
