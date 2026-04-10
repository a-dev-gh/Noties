import React, { useState, useRef, useEffect } from 'react'
import type {
  Note,
  Workflow,
  Position,
  ContextMenuState,
  StoragePayload
} from '../types'

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
  // Web-mode fallback
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
    // Web-mode fallback
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
  const canvasRef = useRef<HTMLDivElement>(null)
  const editorRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Load persisted data on mount — async-safe via .then()
  useEffect(() => {
    loadFromStorage()
      .then((saved) => {
        if (saved) {
          setWorkflows(saved)
        }
      })
      .catch((err) => console.error('[storage] load failed:', err))
  }, [])

  // Sync editor DOM after AI operations — contentEditable owns the DOM node,
  // so React's dangerouslySetInnerHTML won't update an already-mounted element.
  // This imperatively writes the new content when it changes from outside the editor.
  useEffect(() => {
    activeWorkflowData?.notes.forEach((note) => {
      const el = editorRefs.current[note.id]
      if (el && el !== document.activeElement && el.innerHTML !== note.content) {
        el.innerHTML = note.content
      }
    })
  }, [activeWorkflowData?.notes])

  // Close context menu on any document click
  useEffect(() => {
    const handleClick = (): void => setContextMenu(null)
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

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

  const insertLink = (): void => {
    const url = prompt('Enter URL:')
    if (url) {
      formatText('createLink', url)
    }
  }

  const insertImage = (): void => {
    const url = prompt('Enter image URL:')
    if (url) {
      formatText('insertImage', url)
    }
  }

  const handleContextMenu = (e: React.MouseEvent, noteId: string): void => {
    e.preventDefault()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      noteId
    })
  }

  // ---------------------------------------------------------------------------
  // Persistence
  // ---------------------------------------------------------------------------
  const saveToStorage = (updatedWorkflows: Workflow[]): void => {
    persistToStorage(updatedWorkflows as StoragePayload)
    setWorkflows(updatedWorkflows)
  }

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------
  const activeWorkflowData = workflows.find((w) => w.id === activeWorkflow)

  // ---------------------------------------------------------------------------
  // Note CRUD
  // ---------------------------------------------------------------------------
  const addNote = (): void => {
    const newNote = {
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

    const newNote = {
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

    // Set loading state
    const loadingUpdated = workflows.map((w) =>
      w.id === activeWorkflow
        ? {
            ...w,
            notes: w.notes.map((n) =>
              n.id === noteId ? { ...n, isSearching: true } : n
            )
          }
        : w
    )
    setWorkflows(loadingUpdated)

    try {
      let searchResults: string

      if (window.electronAPI) {
        // BUG fix applied: use IPC — API key lives safely in the main process
        searchResults = await window.electronAPI.searchWithAI(
          note.content.replace(/<[^>]*>/g, '')
        )
      } else {
        // Web-mode fallback — direct fetch (will fail without a key, fails gracefully)
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

      const newNote = {
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
                ...w.notes.map((n) =>
                  n.id === noteId ? { ...n, isSearching: false } : n
                ),
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
              notes: w.notes.map((n) =>
                n.id === noteId ? { ...n, isSearching: false } : n
              )
            }
          : w
      )
      setWorkflows(errorUpdated)
    }
  }

  const fixWithAI = async (noteId: string): Promise<void> => {
    const note = activeWorkflowData?.notes.find((n) => n.id === noteId)
    if (!note || !note.content.trim()) return

    // Set loading state
    const loadingUpdated = workflows.map((w) =>
      w.id === activeWorkflow
        ? {
            ...w,
            notes: w.notes.map((n) =>
              n.id === noteId ? { ...n, isFixing: true } : n
            )
          }
        : w
    )
    setWorkflows(loadingUpdated)

    try {
      let fixedContent: string

      if (window.electronAPI) {
        // BUG fix applied: use IPC — API key lives safely in the main process
        // Strip HTML tags before sending to AI (same pattern as searchWithAI)
        fixedContent = await window.electronAPI.fixWithAI(
          note.content.replace(/<[^>]*>/g, '')
        )
      } else {
        // Web-mode fallback — direct fetch (will fail without a key, fails gracefully)
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
              notes: w.notes.map((n) =>
                n.id === noteId ? { ...n, isFixing: false } : n
              )
            }
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

    // Constrain to canvas boundaries (prevent going behind navbar or off-screen)
    newX = Math.max(0, Math.min(newX, canvasRect.width - 320))  // 320 is note width
    newY = Math.max(0, Math.min(newY, canvasRect.height - 240)) // 240 is min note height

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
      // Use functional updater to avoid stale closure — handleMouseUp captures
      // the workflows snapshot from the render it was created in, but
      // handleMouseMove may have updated state many times since then.
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
  const addWorkflow = (): void => {
    const name = prompt('Enter workflow name:')
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
  // Styles
  // ---------------------------------------------------------------------------

  // BUG-002 FIX: contextMenuItemStyle was defined AFTER the return statement in the
  // prototype (line 877) so it was `undefined` when the JSX referencing it was
  // evaluated.  Moved here, before the return, so it is always initialised.
  const contextMenuItemStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 16px',
    background: 'white',
    border: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    color: '#1e293b',
    transition: 'all 0.15s',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  }

  const toolbarButtonStyle: React.CSSProperties = {
    padding: '6px 10px',
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#64748b',
    transition: 'all 0.2s',
    fontFamily: "'Plus Jakarta Sans', sans-serif"
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
      {/* CSS extracted to global.css */}
      {/*
        Removed from here:
          - @import url('https://fonts.googleapis.com/...') — already in global.css
          - * { box-sizing: border-box; margin: 0; padding: 0; } — already in global.css
        Remaining classes (.aurora-glow, .note-card, .dragging, .ai-button,
        .workflow-tab, [contenteditable] rules) are extracted to global.css by
        the CSS-extraction agent.
      */}

      {/* ------------------------------------------------------------------ */}
      {/* Header                                                               */}
      {/* ------------------------------------------------------------------ */}
      <div
        style={{
          background: 'linear-gradient(to bottom, #ffffff, #fafafa)',
          borderBottom: '1px solid #e2e8f0',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '64px',
          position: 'relative',
          zIndex: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <h1
            style={{
              fontSize: '20px',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            Noties
          </h1>

          <div style={{ display: 'flex', gap: '4px' }}>
            {workflows.map((w) => (
              <button
                key={w.id}
                onClick={() => setActiveWorkflow(w.id)}
                className={`workflow-tab ${activeWorkflow === w.id ? 'active' : ''}`}
              >
                {w.name}
              </button>
            ))}
            <button
              onClick={addWorkflow}
              className="workflow-tab"
              style={{ color: '#667eea', fontWeight: 600 }}
            >
              + New Workflow
            </button>
          </div>
        </div>

        <button
          onClick={addNote}
          style={{
            padding: '10px 24px',
            borderRadius: '8px',
            border: 'none',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: 'white',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)'
          }}
          onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)'
          }}
        >
          + Add Note
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Canvas                                                               */}
      {/* ------------------------------------------------------------------ */}
      <div
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{
          flex: 1,
          position: 'relative',
          background: '#fafafa',
          backgroundImage: `
            linear-gradient(rgba(102, 126, 234, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(102, 126, 234, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          overflow: 'hidden',
          cursor: isDragging ? 'grabbing' : 'default'
        }}
      >
        {activeWorkflowData?.notes.map((note) => (
          <div
            key={note.id}
            className={`note-card ${isDragging === note.id ? 'dragging' : ''}`}
            style={{
              position: 'absolute',
              left: note.position.x,
              top: note.position.y,
              width: '320px',
              minHeight: '240px',
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              border: '2px solid transparent',
              backgroundImage:
                'linear-gradient(white, white), linear-gradient(135deg, #667eea, #764ba2, #f093fb)',
              backgroundOrigin: 'border-box',
              backgroundClip: 'padding-box, border-box',
              cursor: isDragging === note.id ? 'grabbing' : 'grab',
              display: 'flex',
              flexDirection: 'column',
              zIndex: isDragging === note.id ? 1000 : 1
            }}
          >
            {/* Loading overlay for AI operations */}
            {(note.isSearching || note.isFixing) && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(255, 255, 255, 0.95)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '12px',
                  zIndex: 10,
                  backdropFilter: 'blur(4px)'
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      fontSize: '32px',
                      marginBottom: '8px',
                      animation: 'pulse 1.5s ease-in-out infinite'
                    }}
                  >
                    ✨
                  </div>
                  <p style={{ color: '#667eea', fontWeight: 600, fontSize: '14px' }}>
                    {note.isSearching ? 'Searching...' : 'Fixing...'}
                  </p>
                </div>
              </div>
            )}

            {/* Drag handle */}
            <div
              onMouseDown={(e: React.MouseEvent<HTMLDivElement>) =>
                handleMouseDown(note.id, e)
              }
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'grab',
                background:
                  'linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05))'
              }}
            >
              <div
                style={{
                  fontSize: '18px',
                  color: '#94a3b8',
                  display: 'flex',
                  gap: '4px'
                }}
              >
                <div
                  style={{
                    width: '3px',
                    height: '16px',
                    background: '#cbd5e1',
                    borderRadius: '2px'
                  }}
                ></div>
                <div
                  style={{
                    width: '3px',
                    height: '16px',
                    background: '#cbd5e1',
                    borderRadius: '2px'
                  }}
                ></div>
                <div
                  style={{
                    width: '3px',
                    height: '16px',
                    background: '#cbd5e1',
                    borderRadius: '2px'
                  }}
                ></div>
              </div>

              <button
                onClick={() => deleteNote(note.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '20px',
                  padding: '0 4px',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) =>
                  (e.currentTarget.style.color = '#ef4444')
                }
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) =>
                  (e.currentTarget.style.color = '#94a3b8')
                }
              >
                ×
              </button>
            </div>

            {/* Formatting toolbar */}
            <div
              style={{
                padding: '8px 12px',
                borderBottom: '1px solid #e2e8f0',
                background: '#fafafa'
              }}
            >
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => formatText('bold')}
                  style={toolbarButtonStyle}
                  title="Bold"
                >
                  <strong>B</strong>
                </button>
                <button
                  onClick={() => formatText('italic')}
                  style={toolbarButtonStyle}
                  title="Italic"
                >
                  <em>I</em>
                </button>
                <button
                  onClick={() => formatText('underline')}
                  style={toolbarButtonStyle}
                  title="Underline"
                >
                  <u>U</u>
                </button>
                <button
                  onClick={() => formatText('insertUnorderedList')}
                  style={toolbarButtonStyle}
                  title="Bullet List"
                >
                  ≡
                </button>
                <button
                  onClick={() => formatText('insertOrderedList')}
                  style={toolbarButtonStyle}
                  title="Numbered List"
                >
                  1.
                </button>
                <button
                  onClick={() => formatText('formatBlock', 'pre')}
                  style={toolbarButtonStyle}
                  title="Code Block"
                >
                  &lt;/&gt;
                </button>
                <button onClick={insertLink} style={toolbarButtonStyle} title="Insert Link">
                  🔗
                </button>
                <button onClick={insertImage} style={toolbarButtonStyle} title="Insert Image">
                  🖼️
                </button>
              </div>
            </div>

            {/* Content editor */}
            <div
              ref={(el) => {
                editorRefs.current[note.id] = el
              }}
              contentEditable
              suppressContentEditableWarning
              data-placeholder="Start typing your note..."
              onFocus={() => setActiveEditor(note.id)}
              onInput={(e: React.FormEvent<HTMLDivElement>) =>
                updateNoteContent(note.id, e.currentTarget.innerHTML)
              }
              onContextMenu={(e: React.MouseEvent) => handleContextMenu(e, note.id)}
              style={{
                flex: 1,
                padding: '16px',
                fontSize: '14px',
                lineHeight: '1.6',
                color: '#1e293b',
                minHeight: '140px',
                maxHeight: '300px',
                overflowY: 'auto'
              }}
              dangerouslySetInnerHTML={{ __html: note.content }}
            />

            {/* Action buttons */}
            <div
              style={{
                padding: '12px 16px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                gap: '8px',
                background: '#fafafa'
              }}
            >
              <button
                onClick={() => fixWithAI(note.id)}
                disabled={note.isFixing || !note.content.trim()}
                className="ai-button"
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: note.isFixing
                    ? 'linear-gradient(135deg, #94a3b8, #cbd5e1)'
                    : 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: note.isFixing || !note.content.trim() ? 'not-allowed' : 'pointer',
                  opacity: !note.content.trim() ? 0.5 : 1,
                  transition: 'all 0.2s ease'
                }}
              >
                {note.isFixing ? '✨ Fixing...' : '✨ Fix with AI'}
              </button>

              <button
                onClick={() => saveNote(note.id)}
                disabled={!note.hasUnsavedChanges}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '2px solid #667eea',
                  background: note.hasUnsavedChanges ? '#667eea' : 'white',
                  color: note.hasUnsavedChanges ? 'white' : '#667eea',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: note.hasUnsavedChanges ? 'pointer' : 'not-allowed',
                  opacity: note.hasUnsavedChanges ? 1 : 0.6,
                  transition: 'all 0.2s ease'
                }}
              >
                {note.hasUnsavedChanges ? '💾 Save' : '✓ Saved'}
              </button>
            </div>
          </div>
        ))}

        {/* Empty-state */}
        {activeWorkflowData?.notes.length === 0 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              color: '#94a3b8'
            }}
          >
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📝</div>
            <p style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
              No notes yet
            </p>
            <p style={{ fontSize: '14px' }}>
              Click &quot;Add Note&quot; to create your first sticky note
            </p>
          </div>
        )}

        {/* Context menu */}
        {contextMenu && (
          <div
            style={{
              position: 'fixed',
              left: contextMenu.x,
              top: contextMenu.y,
              background: 'white',
              borderRadius: '8px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
              border: '1px solid #e2e8f0',
              zIndex: 10000,
              minWidth: '180px',
              overflow: 'hidden'
            }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <button
              onClick={() => searchWithAI(contextMenu.noteId)}
              style={contextMenuItemStyle}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) =>
                (e.currentTarget.style.background = '#f8fafc')
              }
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) =>
                (e.currentTarget.style.background = 'white')
              }
            >
              ✨ Search with AI
            </button>
            <button
              onClick={() => duplicateNote(contextMenu.noteId)}
              style={contextMenuItemStyle}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) =>
                (e.currentTarget.style.background = '#f8fafc')
              }
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) =>
                (e.currentTarget.style.background = 'white')
              }
            >
              📋 Duplicate
            </button>
            <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }}></div>
            <button
              onClick={() => deleteNote(contextMenu.noteId)}
              style={{ ...contextMenuItemStyle, color: '#ef4444' }}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.background = '#fef2f2'
                e.currentTarget.style.color = '#dc2626'
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.background = 'white'
                e.currentTarget.style.color = '#ef4444'
              }}
            >
              🗑️ Delete
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default WorkflowNotes
