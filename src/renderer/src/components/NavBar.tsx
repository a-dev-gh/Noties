import React, { useState, useRef } from 'react'
import type { NavBarProps } from '../types'
import WorkflowDropdown from './WorkflowDropdown'

const NavBar = ({
  workflows,
  activeWorkflowId,
  onSelectWorkflow,
  onAddWorkflow,
  onOpenSettings
}: NavBarProps): JSX.Element => {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const workflowsButtonRef = useRef<HTMLButtonElement>(null)

  const activeWorkflow = workflows.find((w) => w.id === activeWorkflowId)

  const toggleDropdown = (): void => {
    setDropdownOpen((prev) => !prev)
  }

  return (
    <div
      style={{
        height: '48px',
        background: 'white',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        justifyContent: 'space-between',
        position: 'relative',
        zIndex: 100,
        flexShrink: 0
      }}
    >
      {/* Left: Logo */}
      <h1
        style={{
          fontSize: '18px',
          fontWeight: 700,
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          userSelect: 'none',
          margin: 0,
          flexShrink: 0,
          letterSpacing: '-0.3px'
        }}
      >
        Noties
      </h1>

      {/* Center-left: Workflows button + dropdown */}
      <div style={{ position: 'relative', marginLeft: '16px', flex: 1 }}>
        <button
          ref={workflowsButtonRef}
          onClick={toggleDropdown}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            background: dropdownOpen ? 'rgba(102, 126, 234, 0.07)' : 'white',
            color: '#334155',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            maxWidth: '220px'
          }}
          onMouseEnter={(e) => {
            if (!dropdownOpen) e.currentTarget.style.background = '#f8fafc'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = dropdownOpen
              ? 'rgba(102, 126, 234, 0.07)'
              : 'white'
          }}
          aria-haspopup="listbox"
          aria-expanded={dropdownOpen}
        >
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '160px'
            }}
          >
            {activeWorkflow?.name ?? 'Workflows'}
          </span>
          <span
            style={{
              fontSize: '10px',
              color: '#94a3b8',
              flexShrink: 0,
              transition: 'transform 0.15s ease',
              transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              display: 'inline-block'
            }}
          >
            ▾
          </span>
        </button>

        {dropdownOpen && (
          <WorkflowDropdown
            workflows={workflows}
            activeWorkflowId={activeWorkflowId}
            onSelectWorkflow={onSelectWorkflow}
            onAddWorkflow={onAddWorkflow}
            onClose={() => setDropdownOpen(false)}
          />
        )}
      </div>

      {/* Right: Settings gear */}
      <button
        onClick={onOpenSettings}
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          background: 'white',
          color: '#64748b',
          fontSize: '16px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'all 0.15s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#f8fafc'
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

export default NavBar
