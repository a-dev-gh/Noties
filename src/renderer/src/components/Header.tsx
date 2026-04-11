import React, { useState, useRef, useEffect } from 'react'
import type { HeaderProps } from '../types'

const MAX_VISIBLE = 5

const Header = ({
  workflows,
  activeWorkflowId,
  onSelectWorkflow,
  onAddWorkflow,
  onAddNote,
  onAddSection,
  layoutMode,
  onToggleLayoutMode
}: HeaderProps): JSX.Element => {
  const [carouselOffset, setCarouselOffset] = useState(0)
  const prevActiveRef = useRef(activeWorkflowId)

  // Keep the active workflow visible in the carousel window
  useEffect(() => {
    if (prevActiveRef.current === activeWorkflowId) return
    prevActiveRef.current = activeWorkflowId

    const idx = workflows.findIndex((w) => w.id === activeWorkflowId)
    if (idx === -1) return

    setCarouselOffset((prev) => {
      if (idx < prev) return idx
      if (idx >= prev + MAX_VISIBLE) return idx - MAX_VISIBLE + 1
      return prev
    })
  }, [activeWorkflowId, workflows])

  const canScrollLeft = carouselOffset > 0
  const canScrollRight = carouselOffset + MAX_VISIBLE < workflows.length
  const showSeeAll = workflows.length > MAX_VISIBLE

  const visibleWorkflows = workflows.slice(carouselOffset, carouselOffset + MAX_VISIBLE)

  const scrollLeft = (): void => {
    setCarouselOffset((prev) => Math.max(0, prev - 1))
  }

  const scrollRight = (): void => {
    setCarouselOffset((prev) => Math.min(workflows.length - MAX_VISIBLE, prev + 1))
  }

  return (
    <div
      style={{
        background: 'linear-gradient(to bottom, #ffffff, #fafafa)',
        borderBottom: '1px solid #e2e8f0',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px',
        position: 'relative',
        zIndex: 10,
        gap: '12px'
      }}
    >
      {/* Left: Logo */}
      <h1
        style={{
          fontSize: '20px',
          fontWeight: 700,
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          flexShrink: 0,
          userSelect: 'none'
        }}
      >
        Noties
      </h1>

      {/* Center: Workflow Carousel */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          flex: 1,
          overflow: 'hidden'
        }}
      >
        {/* Left arrow */}
        <button
          onClick={scrollLeft}
          disabled={!canScrollLeft}
          className="carousel-arrow"
          style={{
            opacity: canScrollLeft ? 1 : 0.25,
            cursor: canScrollLeft ? 'pointer' : 'default'
          }}
          aria-label="Scroll workflows left"
        >
          ‹
        </button>

        {/* Visible tabs */}
        <div
          style={{
            display: 'flex',
            gap: '2px',
            overflow: 'hidden',
            flex: 1
          }}
        >
          {visibleWorkflows.map((w) => (
            <button
              key={w.id}
              onClick={() => onSelectWorkflow(w.id)}
              className={`workflow-tab ${activeWorkflowId === w.id ? 'active' : ''}`}
              style={{ flexShrink: 0, maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              title={w.name}
            >
              {w.name}
            </button>
          ))}

          {/* + New Workflow */}
          <button
            onClick={onAddWorkflow}
            className="workflow-tab"
            style={{ color: '#667eea', fontWeight: 600, flexShrink: 0 }}
            title="New Workflow"
          >
            + New
          </button>
        </div>

        {/* Right arrow */}
        <button
          onClick={scrollRight}
          disabled={!canScrollRight}
          className="carousel-arrow"
          style={{
            opacity: canScrollRight ? 1 : 0.25,
            cursor: canScrollRight ? 'pointer' : 'default'
          }}
          aria-label="Scroll workflows right"
        >
          ›
        </button>

        {/* See All count badge */}
        {showSeeAll && (
          <span
            style={{
              fontSize: '11px',
              color: '#94a3b8',
              fontWeight: 500,
              flexShrink: 0,
              paddingLeft: '4px'
            }}
          >
            {workflows.length} total
          </span>
        )}
      </div>

      {/* Right: Layout toggle + Add Section + Add Note */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {/* Layout mode toggle */}
        <div
          style={{
            display: 'flex',
            background: '#f1f5f9',
            borderRadius: '8px',
            padding: '3px',
            gap: '2px'
          }}
        >
          <button
            onClick={() => onToggleLayoutMode('free')}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              border: 'none',
              background: layoutMode === 'free' ? 'white' : 'transparent',
              color: layoutMode === 'free' ? '#667eea' : '#94a3b8',
              fontWeight: layoutMode === 'free' ? 600 : 500,
              fontSize: '12px',
              cursor: 'pointer',
              boxShadow: layoutMode === 'free' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            Free
          </button>
          <button
            onClick={() => onToggleLayoutMode('stacked')}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              border: 'none',
              background: layoutMode === 'stacked' ? 'white' : 'transparent',
              color: layoutMode === 'stacked' ? '#667eea' : '#94a3b8',
              fontWeight: layoutMode === 'stacked' ? 600 : 500,
              fontSize: '12px',
              cursor: 'pointer',
              boxShadow: layoutMode === 'stacked' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            Stacked
          </button>
        </div>

        {/* Add Section */}
        <button
          onClick={onAddSection}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1.5px solid #e2e8f0',
            background: 'white',
            color: '#667eea',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.currentTarget.style.background = 'rgba(102, 126, 234, 0.06)'
            e.currentTarget.style.borderColor = '#667eea'
          }}
          onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.currentTarget.style.background = 'white'
            e.currentTarget.style.borderColor = '#e2e8f0'
          }}
        >
          + Section
        </button>

        {/* Add Note */}
        <button
          onClick={onAddNote}
          style={{
            padding: '10px 20px',
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
    </div>
  )
}

export default Header
