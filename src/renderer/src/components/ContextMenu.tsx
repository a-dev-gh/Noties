import React from 'react'
import type { ContextMenuProps } from '../types'

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

const ContextMenu = ({
  state,
  onSearchWithAI,
  onDuplicate,
  onDelete,
  onClose
}: ContextMenuProps): JSX.Element => {
  return (
    <div
      style={{
        position: 'fixed',
        left: state.x,
        top: state.y,
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
        onClick={onSearchWithAI}
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
        onClick={onDuplicate}
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
        onClick={onDelete}
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
  )
}

export default ContextMenu
