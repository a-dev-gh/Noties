import React, { useState, useEffect, useRef } from 'react'
import type { WorkflowDropdownProps } from '../types'

const PAGE_SIZE = 5

const WorkflowDropdown = ({
  workflows,
  activeWorkflowId,
  onSelectWorkflow,
  onAddWorkflow,
  onClose
}: WorkflowDropdownProps): JSX.Element => {
  const [page, setPage] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const totalPages = Math.ceil(workflows.length / PAGE_SIZE)
  const pageStart = page * PAGE_SIZE
  const visibleWorkflows = workflows.slice(pageStart, pageStart + PAGE_SIZE)

  // Keep active workflow in view
  useEffect(() => {
    const idx = workflows.findIndex((w) => w.id === activeWorkflowId)
    if (idx !== -1) {
      setPage(Math.floor(idx / PAGE_SIZE))
    }
  }, [activeWorkflowId, workflows])

  // Close on outside click
  useEffect(() => {
    const handlePointerDown = (e: MouseEvent): void => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [onClose])

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleSelect = (workflowId: string): void => {
    onSelectWorkflow(workflowId)
    onClose()
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 'calc(100% + 6px)',
        left: 0,
        minWidth: '220px',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid #e2e8f0',
        zIndex: 1000,
        overflow: 'hidden',
        animation: 'dropdownFadeIn 0.12s ease'
      }}
    >
      <style>{`
        @keyframes dropdownFadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Workflow rows */}
      <div style={{ padding: '6px 0' }}>
        {visibleWorkflows.map((w) => {
          const isActive = w.id === activeWorkflowId
          return (
            <button
              key={w.id}
              onClick={() => handleSelect(w.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                padding: '9px 16px',
                border: 'none',
                background: isActive ? 'rgba(102, 126, 234, 0.07)' : 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                gap: '10px',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = '#f8fafc'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isActive
                  ? 'rgba(102, 126, 234, 0.07)'
                  : 'transparent'
              }}
            >
              {/* Active accent bar */}
              <span
                style={{
                  width: '3px',
                  height: '18px',
                  borderRadius: '2px',
                  background: isActive
                    ? 'linear-gradient(135deg, #667eea, #764ba2)'
                    : 'transparent',
                  flexShrink: 0
                }}
              />
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#667eea' : '#334155',
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {w.name}
              </span>
            </button>
          )
        })}
      </div>

      {/* Pagination — only shown when there are multiple pages */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 16px',
            borderTop: '1px solid #f1f5f9'
          }}
        >
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              background: 'white',
              cursor: page === 0 ? 'default' : 'pointer',
              opacity: page === 0 ? 0.3 : 1,
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
              color: '#64748b'
            }}
            aria-label="Previous page"
          >
            ‹
          </button>
          <span style={{ fontSize: '11px', color: '#94a3b8', userSelect: 'none' }}>
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              background: 'white',
              cursor: page === totalPages - 1 ? 'default' : 'pointer',
              opacity: page === totalPages - 1 ? 0.3 : 1,
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
              color: '#64748b'
            }}
            aria-label="Next page"
          >
            ›
          </button>
        </div>
      )}

      {/* Divider + New Workflow */}
      <div style={{ borderTop: '1px solid #f1f5f9', padding: '6px 0 6px' }}>
        <button
          onClick={() => {
            onAddWorkflow()
            onClose()
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            padding: '9px 16px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            gap: '10px',
            color: '#667eea',
            fontWeight: 600,
            fontSize: '13px',
            transition: 'background 0.15s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(102, 126, 234, 0.06)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        >
          <span
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
              flexShrink: 0
            }}
          >
            +
          </span>
          New Workflow
        </button>
      </div>
    </div>
  )
}

export default WorkflowDropdown
