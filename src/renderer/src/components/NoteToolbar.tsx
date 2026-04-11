import React from 'react'
import type { NoteToolbarProps } from '../types'

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

const NoteToolbar = ({ onFormatText, onInsertLink, onInsertImage }: NoteToolbarProps): JSX.Element => {
  return (
    <div
      style={{
        padding: '8px 12px',
        borderBottom: '1px solid #e2e8f0',
        background: '#fafafa'
      }}
    >
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        <button
          onClick={() => onFormatText('bold')}
          style={toolbarButtonStyle}
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          onClick={() => onFormatText('italic')}
          style={toolbarButtonStyle}
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          onClick={() => onFormatText('underline')}
          style={toolbarButtonStyle}
          title="Underline"
        >
          <u>U</u>
        </button>
        <button
          onClick={() => onFormatText('insertUnorderedList')}
          style={toolbarButtonStyle}
          title="Bullet List"
        >
          ≡
        </button>
        <button
          onClick={() => onFormatText('insertOrderedList')}
          style={toolbarButtonStyle}
          title="Numbered List"
        >
          1.
        </button>
        <button
          onClick={() => onFormatText('formatBlock', 'pre')}
          style={toolbarButtonStyle}
          title="Code Block"
        >
          &lt;/&gt;
        </button>
        <button onClick={onInsertLink} style={toolbarButtonStyle} title="Insert Link">
          🔗
        </button>
        <button onClick={onInsertImage} style={toolbarButtonStyle} title="Insert Image">
          🖼️
        </button>
      </div>
    </div>
  )
}

export default NoteToolbar
