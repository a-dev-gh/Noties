import React from 'react'
import type { Note, SectionHeader } from '../types'

interface StackedCanvasProps {
  notes: Note[]
  sections: SectionHeader[]
  onNoteContentChange: (noteId: string, content: string) => void
  onNoteTitleChange: (noteId: string, title: string) => void
  onNoteFocus: (noteId: string) => void
  onSaveNote: (noteId: string) => void
  onDeleteNote: (noteId: string) => void
  onFixWithAI: (noteId: string) => void
  onAssignSection: (noteId: string, sectionId: string | null) => void
  editorRefCallback: (noteId: string) => (el: HTMLDivElement | null) => void
}

// ---------------------------------------------------------------------------
// Stacked note card — simplified version for list layout
// ---------------------------------------------------------------------------
const StackedNoteCard = ({
  note,
  sections,
  onContentChange,
  onTitleChange,
  onFocus,
  onSave,
  onDelete,
  onFixWithAI,
  onAssignSection,
  editorRef
}: {
  note: Note
  sections: SectionHeader[]
  onContentChange: (content: string) => void
  onTitleChange: (title: string) => void
  onFocus: () => void
  onSave: () => void
  onDelete: () => void
  onFixWithAI: () => void
  onAssignSection: (sectionId: string | null) => void
  editorRef: (el: HTMLDivElement | null) => void
}): JSX.Element => {
  return (
    <div
      className="stacked-note-card"
      style={{
        background: 'white',
        borderRadius: '10px',
        border: '1.5px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'box-shadow 0.2s ease'
      }}
    >
      {/* Header row */}
      <div
        style={{
          padding: '8px 12px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'linear-gradient(135deg, rgba(102,126,234,0.04), rgba(118,75,162,0.04))'
        }}
      >
        {/* Title */}
        <input
          type="text"
          value={note.title ?? ''}
          placeholder="Untitled note"
          onChange={(e) => onTitleChange(e.target.value)}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: '13px',
            fontWeight: 600,
            color: '#1e293b'
          }}
        />

        {/* Section selector */}
        <select
          value={note.sectionId ?? ''}
          onChange={(e) => onAssignSection(e.target.value || null)}
          style={{
            fontSize: '11px',
            color: '#64748b',
            border: '1px solid #e2e8f0',
            borderRadius: '5px',
            padding: '2px 6px',
            background: 'white',
            cursor: 'pointer',
            maxWidth: '120px'
          }}
          title="Assign to section"
        >
          <option value="">Ungrouped</option>
          {sections.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>

        {/* Delete */}
        <button
          onClick={onDelete}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: '18px',
            padding: '0 2px',
            lineHeight: 1
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) =>
            (e.currentTarget.style.color = '#ef4444')
          }
          onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) =>
            (e.currentTarget.style.color = '#94a3b8')
          }
          title="Delete note"
        >
          ×
        </button>
      </div>

      {/* Content editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        data-placeholder="Start typing your note..."
        onFocus={onFocus}
        onInput={(e: React.FormEvent<HTMLDivElement>) =>
          onContentChange(e.currentTarget.innerHTML)
        }
        style={{
          padding: '12px 14px',
          fontSize: '13px',
          lineHeight: '1.6',
          color: '#1e293b',
          minHeight: '80px',
          maxHeight: '200px',
          overflowY: 'auto',
          outline: 'none'
        }}
      />

      {/* Footer actions */}
      <div
        style={{
          padding: '8px 12px',
          borderTop: '1px solid #f1f5f9',
          display: 'flex',
          gap: '6px',
          background: '#fafafa'
        }}
      >
        <button
          onClick={onFixWithAI}
          disabled={note.isFixing || !note.content.trim()}
          className="ai-button"
          style={{
            flex: 1,
            padding: '6px 10px',
            borderRadius: '6px',
            border: 'none',
            background: note.isFixing
              ? 'linear-gradient(135deg, #94a3b8, #cbd5e1)'
              : 'linear-gradient(135deg, #667eea, #764ba2)',
            color: 'white',
            fontWeight: 600,
            fontSize: '12px',
            cursor: note.isFixing || !note.content.trim() ? 'not-allowed' : 'pointer',
            opacity: !note.content.trim() ? 0.5 : 1
          }}
        >
          {note.isFixing ? '✨ Fixing...' : '✨ Fix'}
        </button>

        <button
          onClick={onSave}
          disabled={!note.hasUnsavedChanges}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1.5px solid #667eea',
            background: note.hasUnsavedChanges ? '#667eea' : 'white',
            color: note.hasUnsavedChanges ? 'white' : '#667eea',
            fontWeight: 600,
            fontSize: '12px',
            cursor: note.hasUnsavedChanges ? 'pointer' : 'not-allowed',
            opacity: note.hasUnsavedChanges ? 1 : 0.55
          }}
        >
          {note.hasUnsavedChanges ? '💾 Save' : '✓ Saved'}
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section group wrapper
// ---------------------------------------------------------------------------
const SectionGroup = ({
  title,
  color,
  notes,
  sections,
  onNoteContentChange,
  onNoteTitleChange,
  onNoteFocus,
  onSaveNote,
  onDeleteNote,
  onFixWithAI,
  onAssignSection,
  editorRefCallback
}: {
  title: string
  color?: string
  notes: Note[]
  sections: SectionHeader[]
  onNoteContentChange: (noteId: string, content: string) => void
  onNoteTitleChange: (noteId: string, title: string) => void
  onNoteFocus: (noteId: string) => void
  onSaveNote: (noteId: string) => void
  onDeleteNote: (noteId: string) => void
  onFixWithAI: (noteId: string) => void
  onAssignSection: (noteId: string, sectionId: string | null) => void
  editorRefCallback: (noteId: string) => (el: HTMLDivElement | null) => void
}): JSX.Element => {
  const accentColor = color ?? '#94a3b8'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0',
        minWidth: 0
      }}
    >
      {/* Section heading */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '0 0 10px 0',
          marginBottom: '4px'
        }}
      >
        <div
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: accentColor,
            flexShrink: 0
          }}
        />
        <span
          style={{
            fontSize: '12px',
            fontWeight: 700,
            color: '#64748b',
            letterSpacing: '0.07em',
            textTransform: 'uppercase'
          }}
        >
          {title}
        </span>
        <div
          style={{
            flex: 1,
            height: '1px',
            background: `linear-gradient(90deg, ${accentColor}40, transparent)`
          }}
        />
        <span
          style={{
            fontSize: '11px',
            color: '#94a3b8',
            fontWeight: 500
          }}
        >
          {notes.length} {notes.length === 1 ? 'note' : 'notes'}
        </span>
      </div>

      {/* Note cards in this section */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        {notes.length === 0 ? (
          <div
            style={{
              padding: '20px',
              textAlign: 'center',
              color: '#94a3b8',
              fontSize: '13px',
              border: '1.5px dashed #e2e8f0',
              borderRadius: '10px',
              background: '#fafafa'
            }}
          >
            No notes in this section
          </div>
        ) : (
          notes.map((note) => (
            <StackedNoteCard
              key={note.id}
              note={note}
              sections={sections}
              onContentChange={(content) => onNoteContentChange(note.id, content)}
              onTitleChange={(title) => onNoteTitleChange(note.id, title)}
              onFocus={() => onNoteFocus(note.id)}
              onSave={() => onSaveNote(note.id)}
              onDelete={() => onDeleteNote(note.id)}
              onFixWithAI={() => onFixWithAI(note.id)}
              onAssignSection={(sectionId) => onAssignSection(note.id, sectionId)}
              editorRef={editorRefCallback(note.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// StackedCanvas — main export
// ---------------------------------------------------------------------------
const StackedCanvas = ({
  notes,
  sections,
  onNoteContentChange,
  onNoteTitleChange,
  onNoteFocus,
  onSaveNote,
  onDeleteNote,
  onFixWithAI,
  onAssignSection,
  editorRefCallback
}: StackedCanvasProps): JSX.Element => {
  // Sort sections by order
  const sortedSections = [...sections].sort((a, b) => a.order - b.order)

  // Group notes by sectionId
  const notesBySection = (sectionId: string | null): Note[] =>
    notes
      .filter((n) => (n.sectionId ?? null) === sectionId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  const ungroupedNotes = notesBySection(null)

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        background: '#fafafa',
        backgroundImage: `
          linear-gradient(rgba(102, 126, 234, 0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(102, 126, 234, 0.025) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px'
      }}
    >
      <div
        style={{
          maxWidth: '760px',
          margin: '0 auto',
          padding: '32px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '32px'
        }}
      >
        {/* Named sections */}
        {sortedSections.map((section) => (
          <SectionGroup
            key={section.id}
            title={section.label}
            color={section.color}
            notes={notesBySection(section.id)}
            sections={sections}
            onNoteContentChange={onNoteContentChange}
            onNoteTitleChange={onNoteTitleChange}
            onNoteFocus={onNoteFocus}
            onSaveNote={onSaveNote}
            onDeleteNote={onDeleteNote}
            onFixWithAI={onFixWithAI}
            onAssignSection={onAssignSection}
            editorRefCallback={editorRefCallback}
          />
        ))}

        {/* Ungrouped section — always rendered */}
        <SectionGroup
          title="Ungrouped"
          color="#94a3b8"
          notes={ungroupedNotes}
          sections={sections}
          onNoteContentChange={onNoteContentChange}
          onNoteTitleChange={onNoteTitleChange}
          onNoteFocus={onNoteFocus}
          onSaveNote={onSaveNote}
          onDeleteNote={onDeleteNote}
          onFixWithAI={onFixWithAI}
          onAssignSection={onAssignSection}
          editorRefCallback={editorRefCallback}
        />

        {notes.length === 0 && sections.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '80px 20px',
              color: '#94a3b8'
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📝</div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>
              No notes yet
            </div>
            <div style={{ fontSize: '13px' }}>
              Use "+ Add Note" to create your first note
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default StackedCanvas
