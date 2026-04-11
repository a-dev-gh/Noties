import React from 'react'
import type { CanvasProps } from '../types'
import StickyNote from './StickyNote'
import EmptyState from './EmptyState'
import ContextMenu from './ContextMenu'

interface CanvasExtendedProps extends CanvasProps {
  canvasRef: React.RefObject<HTMLDivElement>
  onSearchWithAI: (noteId: string) => void
  onDuplicateNote: (noteId: string) => void
  editorRefCallback: (noteId: string) => (el: HTMLDivElement | null) => void
}

const Canvas = ({
  canvasRef,
  notes,
  isDraggingId,
  contextMenu,
  onMouseMove,
  onMouseUp,
  onNoteMouseDown,
  onNoteContentChange,
  onNoteFocus,
  onNoteContextMenu,
  onSaveNote,
  onDeleteNote,
  onFixWithAI,
  onFormatText,
  onSearchWithAI,
  onDuplicateNote,
  editorRefCallback
}: CanvasExtendedProps): JSX.Element => {
  return (
    <div
      ref={canvasRef}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
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
        cursor: isDraggingId ? 'grabbing' : 'default'
      }}
    >
      {notes.map((note) => (
        <StickyNote
          key={note.id}
          note={note}
          isDragging={isDraggingId === note.id}
          onMouseDown={(e) => onNoteMouseDown(note.id, e)}
          onContentChange={(content) => onNoteContentChange(note.id, content)}
          onFocus={() => onNoteFocus(note.id)}
          onContextMenu={(e) => onNoteContextMenu(e, note.id)}
          onSave={() => onSaveNote(note.id)}
          onDelete={() => onDeleteNote(note.id)}
          onFixWithAI={() => onFixWithAI(note.id)}
          onFormatText={onFormatText}
          editorRef={editorRefCallback(note.id)}
        />
      ))}

      {notes.length === 0 && <EmptyState />}

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

export default Canvas
