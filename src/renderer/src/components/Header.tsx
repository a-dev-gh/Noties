import React from 'react'
import type { HeaderProps } from '../types'

const Header = ({
  workflows,
  activeWorkflowId,
  onSelectWorkflow,
  onAddWorkflow,
  onAddNote
}: HeaderProps): JSX.Element => {
  return (
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
              onClick={() => onSelectWorkflow(w.id)}
              className={`workflow-tab ${activeWorkflowId === w.id ? 'active' : ''}`}
            >
              {w.name}
            </button>
          ))}
          <button
            onClick={onAddWorkflow}
            className="workflow-tab"
            style={{ color: '#667eea', fontWeight: 600 }}
          >
            + New Workflow
          </button>
        </div>
      </div>

      <button
        onClick={onAddNote}
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
  )
}

export default Header
