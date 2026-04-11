import React, { useRef, useState } from 'react'
import type { Note, SectionHeader, Position, ContextMenuState } from '../types'
import StickyNote from './StickyNote'
import SectionHeaderCard from './SectionHeaderCard'
import EmptyState from './EmptyState'
import ContextMenu from './ContextMenu'
import {
  GRID_SIZE,
  snapPosition,
  noteToGridRect,
  sectionToGridRect,
  resolveCollision
} from '../utils/grid'
import type { GridRect } from '../utils/grid'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface GridCanvasProps {
  notes: Note[]
  sections: SectionHeader[]
  contextMenu: ContextMenuState | null
  onNoteContentChange: (noteId: string, content: string) => void
  onNoteTitleChange: (noteId: string, title: string) => void
  onNoteFocus: (noteId: string) => void
  onNoteContextMenu: (e: React.MouseEvent, noteId: string) => void
  onSaveNote: (noteId: string) => void
  onDeleteNote: (noteId: string) => void
  onFixWithAI: (noteId: string) => void
  onFormatText: (command: string, value?: string) => void
  onSearchWithAI: (noteId: string) => void
  onDuplicateNote: (noteId: string) => void
  onNoteDoubleClick: (noteId: string) => void
  onDeleteSection: (sectionId: string) => void
  onUpdateSectionLabel: (sectionId: string, label: string) => void
  onNoteResize: (noteId: string, size: { width: number; height: number }) => void
  /** Called with the final snapped position after drag end */
  onNotePositionChange: (noteId: string, pos: Position) => void
  /** Called with the final snapped position after section drag end */
  onSectionPositionChange: (sectionId: string, pos: Position) => void
  editorRefCallback: (noteId: string) => (el: HTMLDivElement | null) => void
}

// ---------------------------------------------------------------------------
// Virtual canvas size
// ---------------------------------------------------------------------------

const VIRTUAL_WIDTH = 3000
const VIRTUAL_HEIGHT = 3000

// ---------------------------------------------------------------------------
// GridCanvas
// ---------------------------------------------------------------------------

const GridCanvas = ({
  notes,
  sections,
  contextMenu,
  onNoteContentChange,
  onNoteTitleChange,
  onNoteFocus,
  onNoteContextMenu,
  onSaveNote,
  onDeleteNote,
  onFixWithAI,
  onFormatText,
  onSearchWithAI,
  onDuplicateNote,
  onNoteDoubleClick,
  onDeleteSection,
  onUpdateSectionLabel,
  onNoteResize,
  onNotePositionChange,
  onSectionPositionChange,
  editorRefCallback
}: GridCanvasProps): JSX.Element => {
  const canvasRef = useRef<HTMLDivElement>(null)

  // ---------------------------------------------------------------------------
  // Local drag state — positions are tracked locally during the drag so the
  // note follows the cursor immediately, then snapped + committed on mouse up.
  // ---------------------------------------------------------------------------

  const [draggingNoteId, setDraggingNoteId] = useState<string | null>(null)
  const [dragNoteLivePos, setDragNoteLivePos] = useState<Position | null>(null)
  const [noteDragOffset, setNoteDragOffset] = useState<Position>({ x: 0, y: 0 })

  const [draggingSectionId, setDraggingSectionId] = useState<string | null>(null)
  const [dragSectionLivePos, setDragSectionLivePos] = useState<Position | null>(null)
  const [sectionDragOffset, setSectionDragOffset] = useState<Position>({ x: 0, y: 0 })

  // ---------------------------------------------------------------------------
  // Note drag
  // ---------------------------------------------------------------------------

  const handleNoteMouseDown = (noteId: string, e: React.MouseEvent<HTMLDivElement>): void => {
    const note = notes.find((n) => n.id === noteId)
    if (!note) return

    e.preventDefault()
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()

    setDraggingNoteId(noteId)
    setDragNoteLivePos({ x: note.position.x, y: note.position.y })
    setNoteDragOffset({
      x: e.clientX - rect.left + canvas.scrollLeft - note.position.x,
      y: e.clientY - rect.top + canvas.scrollTop - note.position.y
    })
  }

  // ---------------------------------------------------------------------------
  // Section drag
  // ---------------------------------------------------------------------------

  const handleSectionMouseDown = (
    sectionId: string,
    e: React.MouseEvent<HTMLDivElement>
  ): void => {
    const section = sections.find((s) => s.id === sectionId)
    if (!section) return

    e.preventDefault()
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()

    setDraggingSectionId(sectionId)
    setDragSectionLivePos({ x: section.position.x, y: section.position.y })
    setSectionDragOffset({
      x: e.clientX - rect.left + canvas.scrollLeft - section.position.x,
      y: e.clientY - rect.top + canvas.scrollTop - section.position.y
    })
  }

  // ---------------------------------------------------------------------------
  // Mouse move — update live position freely (no snapping during drag)
  // ---------------------------------------------------------------------------

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>): void => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()

    if (draggingNoteId) {
      const rawX = e.clientX - rect.left + canvas.scrollLeft - noteDragOffset.x
      const rawY = e.clientY - rect.top + canvas.scrollTop - noteDragOffset.y
      setDragNoteLivePos({ x: rawX, y: rawY })
    }

    if (draggingSectionId) {
      const rawX = e.clientX - rect.left + canvas.scrollLeft - sectionDragOffset.x
      const rawY = e.clientY - rect.top + canvas.scrollTop - sectionDragOffset.y
      setDragSectionLivePos({ x: rawX, y: rawY })
    }
  }

  // ---------------------------------------------------------------------------
  // Mouse up — snap to grid, resolve collisions, commit
  // ---------------------------------------------------------------------------

  const handleMouseUp = (): void => {
    if (draggingNoteId && dragNoteLivePos) {
      const draggedNote = notes.find((n) => n.id === draggingNoteId)

      if (draggedNote) {
        // Build obstacles: all notes + sections except the one being dragged
        const obstacles: GridRect[] = [
          ...notes.filter((n) => n.id !== draggingNoteId).map(noteToGridRect),
          ...sections.map(sectionToGridRect)
        ]

        const draggedRect = noteToGridRect({ ...draggedNote, position: dragNoteLivePos })
        const snapped = snapPosition(dragNoteLivePos)
        const finalPos = resolveCollision(snapped, draggedRect, obstacles)

        onNotePositionChange(draggingNoteId, finalPos)
      }

      setDraggingNoteId(null)
      setDragNoteLivePos(null)
    }

    if (draggingSectionId && dragSectionLivePos) {
      const draggedSection = sections.find((s) => s.id === draggingSectionId)

      if (draggedSection) {
        const obstacles: GridRect[] = [
          ...notes.map(noteToGridRect),
          ...sections.filter((s) => s.id !== draggingSectionId).map(sectionToGridRect)
        ]

        const draggedRect = sectionToGridRect({ ...draggedSection, position: dragSectionLivePos })
        const snapped = snapPosition(dragSectionLivePos)
        const finalPos = resolveCollision(snapped, draggedRect, obstacles)

        onSectionPositionChange(draggingSectionId, finalPos)
      }

      setDraggingSectionId(null)
      setDragSectionLivePos(null)
    }
  }

  // ---------------------------------------------------------------------------
  // Effective positions: use live pos during drag, stored pos otherwise
  // ---------------------------------------------------------------------------

  const notePosition = (note: Note): Position => {
    if (draggingNoteId === note.id && dragNoteLivePos) return dragNoteLivePos
    return note.position
  }

  const sectionPosition = (section: SectionHeader): Position => {
    if (draggingSectionId === section.id && dragSectionLivePos) return dragSectionLivePos
    return section.position
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        flex: 1,
        position: 'relative',
        overflow: 'auto',
        cursor: (draggingNoteId || draggingSectionId) ? 'grabbing' : 'default'
      }}
    >
      {/* Scrollable virtual surface */}
      <div
        style={{
          position: 'relative',
          width: `${VIRTUAL_WIDTH}px`,
          height: `${VIRTUAL_HEIGHT}px`,
          background: '#fafafa',
          // Grid lines drawn at GRID_SIZE intervals (40px)
          backgroundImage: `
            linear-gradient(rgba(102, 126, 234, 0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(102, 126, 234, 0.06) 1px, transparent 1px)
          `,
          backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`
        }}
      >
        {/* Section header cards */}
        {sections.map((section) => {
          const pos = sectionPosition(section)
          const displaySection = { ...section, position: pos }
          return (
            <SectionHeaderCard
              key={section.id}
              section={displaySection}
              isDragging={draggingSectionId === section.id}
              onMouseDown={(e) => handleSectionMouseDown(section.id, e)}
              onDelete={() => onDeleteSection(section.id)}
              onLabelChange={(label) => onUpdateSectionLabel(section.id, label)}
            />
          )
        })}

        {/* Sticky notes */}
        {notes.map((note) => {
          const pos = notePosition(note)
          const displayNote = { ...note, position: pos }
          return (
            <StickyNote
              key={note.id}
              note={displayNote}
              isDragging={draggingNoteId === note.id}
              onMouseDown={(e) => handleNoteMouseDown(note.id, e)}
              onContentChange={(content) => onNoteContentChange(note.id, content)}
              onTitleChange={(title) => onNoteTitleChange(note.id, title)}
              onFocus={() => onNoteFocus(note.id)}
              onContextMenu={(e) => onNoteContextMenu(e, note.id)}
              onSave={() => onSaveNote(note.id)}
              onDelete={() => onDeleteNote(note.id)}
              onFixWithAI={() => onFixWithAI(note.id)}
              onFormatText={onFormatText}
              onDoubleClick={() => onNoteDoubleClick(note.id)}
              onResize={(size) => onNoteResize(note.id, size)}
              editorRef={editorRefCallback(note.id)}
            />
          )
        })}

        {notes.length === 0 && sections.length === 0 && <EmptyState />}
      </div>

      {/* Grid snap indicator — faint dot at origin to orient the user */}
      <div
        style={{
          position: 'absolute',
          top: 8,
          left: 8,
          padding: '3px 8px',
          background: 'rgba(102, 126, 234, 0.1)',
          border: '1px solid rgba(102, 126, 234, 0.2)',
          borderRadius: '4px',
          fontSize: '10px',
          color: '#667eea',
          fontWeight: 600,
          letterSpacing: '0.04em',
          pointerEvents: 'none',
          userSelect: 'none'
        }}
      >
        GRID {GRID_SIZE}px
      </div>

      {contextMenu && (
        <ContextMenu
          state={contextMenu}
          onSearchWithAI={() => onSearchWithAI(contextMenu.noteId)}
          onDuplicate={() => onDuplicateNote(contextMenu.noteId)}
          onDelete={() => onDeleteNote(contextMenu.noteId)}
          onClose={() => {/* handled by document click listener in parent */}}
        />
      )}
    </div>
  )
}

export default GridCanvas
