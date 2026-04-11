import React, { useEffect, useRef } from 'react'
import type { FullscreenEditorProps } from '../types'
import NoteToolbar from './NoteToolbar'

const FullscreenEditor = ({
  note,
  onContentChange,
  onTitleChange,
  onSave,
  onFixWithAI,
  onFormatText,
  onClose
}: FullscreenEditorProps): JSX.Element => {
  const editorRef = useRef<HTMLDivElement>(null)
  const initialized = useRef(false)

  // Initialize content once on mount — same pattern as WorkflowNotes to avoid
  // cursor-jumping from dangerouslySetInnerHTML.
  useEffect(() => {
    if (editorRef.current && !initialized.current) {
      editorRef.current.innerHTML = note.content
      initialized.current = true
      // Place cursor at end of content
      editorRef.current.focus()
      const range = document.createRange()
      range.selectNodeContents(editorRef.current)
      range.collapse(false)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
    }
  }, [])

  // Sync content back if externally changed (e.g. AI fix) while open
  useEffect(() => {
    if (editorRef.current && initialized.current) {
      if (editorRef.current.innerHTML !== note.content) {
        editorRef.current.innerHTML = note.content
      }
    }
  }, [note.content])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9000,
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div
        style={{
          width: '80vw',
          height: '80vh',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 24px 80px rgba(102, 126, 234, 0.3)',
          border: '2px solid transparent',
          backgroundImage:
            'linear-gradient(white, white), linear-gradient(135deg, #667eea, #764ba2, #f093fb)',
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, border-box',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header bar */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background:
              'linear-gradient(135deg, rgba(102, 126, 234, 0.06), rgba(118, 75, 162, 0.06))',
            flexShrink: 0
          }}
        >
          {/* Grip dots — decorative in fullscreen */}
          <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: '3px',
                  height: '16px',
                  background: '#cbd5e1',
                  borderRadius: '2px'
                }}
              />
            ))}
          </div>

          {/* Title input */}
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
              fontSize: '16px',
              fontWeight: 600,
              color: '#1e293b',
              cursor: 'text',
              padding: '4px 6px',
              borderRadius: '6px',
              transition: 'background 0.15s ease'
            }}
            onFocus={(e) => {
              e.currentTarget.style.background = 'rgba(102, 126, 234, 0.08)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          />

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '24px',
              lineHeight: 1,
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

        {/* Toolbar */}
        <div style={{ flexShrink: 0 }}>
          <NoteToolbar
            onFormatText={onFormatText}
            onInsertLink={() => onFormatText('__insertLink__')}
            onInsertImage={() => onFormatText('__insertImage__')}
          />
        </div>

        {/* Content editor */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          data-placeholder="Start typing your note..."
          onInput={(e: React.FormEvent<HTMLDivElement>) =>
            onContentChange(e.currentTarget.innerHTML)
          }
          style={{
            flex: 1,
            padding: '24px 28px',
            fontSize: '15px',
            lineHeight: '1.7',
            color: '#1e293b',
            overflowY: 'auto',
            outline: 'none'
          }}
        />

        {/* Action bar */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            gap: '10px',
            justifyContent: 'flex-end',
            background: '#fafafa',
            flexShrink: 0
          }}
        >
          <button
            onClick={onFixWithAI}
            disabled={note.isFixing || !note.content.trim()}
            className="ai-button"
            style={{
              padding: '9px 20px',
              borderRadius: '8px',
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
              padding: '9px 20px',
              borderRadius: '8px',
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

          <button
            onClick={onClose}
            style={{
              padding: '9px 20px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              background: 'white',
              color: '#64748b',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.currentTarget.style.background = '#f1f5f9'
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.currentTarget.style.background = 'white'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default FullscreenEditor
