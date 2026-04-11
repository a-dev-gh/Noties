import React from 'react'
import type { CanvasProps } from '../types'
import StickyNote from './StickyNote'
import SectionHeaderCard from './SectionHeaderCard'
import EmptyState from './EmptyState'
import ContextMenu from './ContextMenu'

interface CanvasExtendedProps extends CanvasProps {
  canvasRef: React.RefObject<HTMLDivElement>
  onSearchWithAI: (noteId: string) => void
  onDuplicateNote: (noteId: string) => void
  onNoteTitleChange: (noteId: string, title: string) => void
  editorRefCallback: (noteId: string) => (el: HTMLDivElement | null) => void
  onNoteResize: (noteId: string, size: { width: number; height: number }) => void
}

// Virtual canvas dimensions — notes can be placed anywhere within this space.
const VIRTUAL_WIDTH = 3000
const VIRTUAL_HEIGHT = 3000

const Canvas = ({
  canvasRef,
  notes,
  sections,
  isDraggingId,
  draggingSectionId,
  contextMenu,
  onMouseMove,
  onMouseUp,
  onNoteMouseDown,
  onSectionMouseDown,
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
  editorRefCallback,
  onNoteResize
}: CanvasExtendedProps): JSX.Element => {
  return (
    <div
      ref={canvasRef}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      style={{
        flex: 1,
        position: 'relative',
        overflow: 'auto',
        cursor: (isDraggingId || draggingSectionId) ? 'grabbing' : 'default'
      }}
    >
      {/* Scrollable virtual surface */}
      <div
        style={{
          position: 'relative',
          width: `${VIRTUAL_WIDTH}px`,
          height: `${VIRTUAL_HEIGHT}px`,
          background: '#fafafa',
          backgroundImage: `
            linear-gradient(rgba(102, 126, 234, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(102, 126, 234, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      >
        {/* Section header cards */}
        {sections.map((section) => (
          <SectionHeaderCard
            key={section.id}
            section={section}
            isDragging={draggingSectionId === section.id}
            onMouseDown={(e) => onSectionMouseDown(section.id, e)}
            onDelete={() => onDeleteSection(section.id)}
            onLabelChange={(label) => onUpdateSectionLabel(section.id, label)}
          />
        ))}

        {/* Sticky notes */}
        {notes.map((note) => (
          <StickyNote
            key={note.id}
            note={note}
            isDragging={isDraggingId === note.id}
            onMouseDown={(e) => onNoteMouseDown(note.id, e)}
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
        ))}

        {notes.length === 0 && sections.length === 0 && <EmptyState />}
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

export default Canvas
