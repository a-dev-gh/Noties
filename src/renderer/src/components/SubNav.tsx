import React from 'react'
import type { SubNavProps } from '../types'

const SubNav = ({
  layoutMode,
  onToggleLayoutMode,
  onAddNote,
  onAddSection,
  onOpenSettings
}: SubNavProps): JSX.Element => {
  return (
    <div
      style={{
        height: '40px',
        background: '#f8fafc',
        borderBottom: '1px solid #e9eef5',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: '8px',
        flexShrink: 0,
        zIndex: 90
      }}
    >
      {/* Layout toggle pill */}
      <div
        style={{
          display: 'flex',
          background: '#edf2f7',
          borderRadius: '8px',
          padding: '2px',
          gap: '1px'
        }}
      >
        <button
          onClick={() => onToggleLayoutMode('free')}
          style={{
            padding: '4px 10px',
            borderRadius: '6px',
            border: 'none',
            background: layoutMode === 'free' ? 'white' : 'transparent',
            color: layoutMode === 'free' ? '#667eea' : '#94a3b8',
            fontWeight: layoutMode === 'free' ? 600 : 500,
            fontSize: '12px',
            cursor: 'pointer',
            boxShadow: layoutMode === 'free' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          Free
        </button>
        <button
          onClick={() => onToggleLayoutMode('grid')}
          style={{
            padding: '4px 10px',
            borderRadius: '6px',
            border: 'none',
            background: layoutMode === 'grid' ? 'white' : 'transparent',
            color: layoutMode === 'grid' ? '#667eea' : '#94a3b8',
            fontWeight: layoutMode === 'grid' ? 600 : 500,
            fontSize: '12px',
            cursor: 'pointer',
            boxShadow: layoutMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          Grid
        </button>
      </div>

      {/* Divider */}
      <div
        style={{
          width: '1px',
          height: '20px',
          background: '#e2e8f0',
          flexShrink: 0
        }}
      />

      {/* + Add Note */}
      <button
        onClick={onAddNote}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '5px 12px',
          borderRadius: '7px',
          border: 'none',
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          color: 'white',
          fontWeight: 600,
          fontSize: '12px',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(102, 126, 234, 0.28)',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)'
          e.currentTarget.style.boxShadow = '0 4px 14px rgba(102, 126, 234, 0.38)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.28)'
        }}
      >
        + Add Note
      </button>

      {/* + Add Section */}
      <button
        onClick={onAddSection}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '5px 12px',
          borderRadius: '7px',
          border: '1.5px solid #e2e8f0',
          background: 'white',
          color: '#667eea',
          fontWeight: 600,
          fontSize: '12px',
          cursor: 'pointer',
          transition: 'all 0.15s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(102, 126, 234, 0.06)'
          e.currentTarget.style.borderColor = '#667eea'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'white'
          e.currentTarget.style.borderColor = '#e2e8f0'
        }}
      >
        + Add Section
      </button>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Settings gear */}
      <button
        onClick={onOpenSettings}
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '7px',
          border: '1px solid #e2e8f0',
          background: 'white',
          color: '#64748b',
          fontSize: '14px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'all 0.15s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#f1f5f9'
          e.currentTarget.style.color = '#334155'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'white'
          e.currentTarget.style.color = '#64748b'
        }}
        aria-label="Open settings"
        title="Settings"
      >
        ⚙
      </button>
    </div>
  )
}

export default SubNav
