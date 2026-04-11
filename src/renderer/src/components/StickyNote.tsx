import React from 'react'
import type { NoteCardProps } from '../types'
import NoteToolbar from './NoteToolbar'
import LoadingOverlay from './LoadingOverlay'

interface StickyNoteProps extends NoteCardProps {
  editorRef: (el: HTMLDivElement | null) => void
}

const StickyNote = ({
  note,
  isDragging,
  onMouseDown,
  onContentChange,
  onTitleChange,
  onFocus,
  onContextMenu,
  onSave,
  onDelete,
  onFixWithAI,
  onFormatText,
  onDoubleClick,
  editorRef
}: StickyNoteProps): JSX.Element => {
  const isLoading = !!(note.isSearching || note.isFixing)
  const loadingMessage = note.isSearching ? 'Searching...' : 'Fixing...'

  return (
    <div
      className={`note-card ${isDragging ? 'dragging' : ''}`}
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
        cursor: isDragging ? 'grabbing' : 'grab',
        display: 'flex',
        flexDirection: 'column',
        zIndex: isDragging ? 1000 : 1
      }}
    >
      <LoadingOverlay isVisible={isLoading} message={loadingMessage} />

      {/* Drag handle */}
      <div
        onMouseDown={onMouseDown}
        onDoubleClick={onDoubleClick}
        style={{
          padding: '10px 12px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'grab',
          background:
            'linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05))',
          gap: '8px'
        }}
      >
        {/* Grip dots */}
        <div
          style={{
            fontSize: '18px',
            color: '#94a3b8',
            display: 'flex',
            gap: '4px',
            flexShrink: 0
          }}
        >
          <div
            style={{
              width: '3px',
              height: '16px',
              background: '#cbd5e1',
              borderRadius: '2px'
            }}
          />
          <div
            style={{
              width: '3px',
              height: '16px',
              background: '#cbd5e1',
              borderRadius: '2px'
            }}
          />
          <div
            style={{
              width: '3px',
              height: '16px',
              background: '#cbd5e1',
              borderRadius: '2px'
            }}
          />
        </div>

        {/* Editable title */}
        <input
          type="text"
          value={note.title ?? ''}
          placeholder="Untitled note"
          onChange={(e) => onTitleChange(e.target.value)}
          onMouseDown={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: '13px',
            fontWeight: 600,
            color: '#1e293b',
            cursor: 'text',
            padding: '2px 4px',
            borderRadius: '4px',
            transition: 'background 0.15s ease'
          }}
          onFocus={(e) => {
            e.currentTarget.style.background = 'rgba(102, 126, 234, 0.08)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.background = 'transparent'
          }}
        />

        <button
          onClick={onDelete}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: '20px',
            padding: '0 4px',
            transition: 'color 0.2s',
            flexShrink: 0
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

      <NoteToolbar
        onFormatText={onFormatText}
        onInsertLink={() => onFormatText('__insertLink__')}
        onInsertImage={() => onFormatText('__insertImage__')}
      />

      {/* Content editor — no dangerouslySetInnerHTML; parent manages innerHTML via ref */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        data-placeholder="Start typing your note..."
        onFocus={onFocus}
        onInput={(e: React.FormEvent<HTMLDivElement>) =>
          onContentChange(e.currentTarget.innerHTML)
        }
        onContextMenu={onContextMenu}
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
          onClick={onFixWithAI}
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
          onClick={onSave}
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
  )
}

export default StickyNote
