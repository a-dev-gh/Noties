import React, { useState, useRef, useEffect } from 'react'
import type { SectionHeader } from '../types'

interface SectionHeaderCardProps {
  section: SectionHeader
  isDragging: boolean
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void
  onDelete: () => void
  onLabelChange: (label: string) => void
}

const SectionHeaderCard = ({
  section,
  isDragging,
  onMouseDown,
  onDelete,
  onLabelChange
}: SectionHeaderCardProps): JSX.Element => {
  const [isHovered, setIsHovered] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [labelValue, setLabelValue] = useState(section.label)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync external label changes
  useEffect(() => {
    if (!isEditing) setLabelValue(section.label)
  }, [section.label, isEditing])

  const handleLabelDoubleClick = (e: React.MouseEvent): void => {
    e.stopPropagation()
    setIsEditing(true)
    setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    }, 0)
  }

  const commitLabel = (): void => {
    const trimmed = labelValue.trim() || 'Untitled Section'
    setLabelValue(trimmed)
    onLabelChange(trimmed)
    setIsEditing(false)
  }

  const accentColor = section.color ?? '#667eea'

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'absolute',
        left: section.position.x,
        top: section.position.y,
        width: '600px',
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: isDragging ? 999 : 2,
        userSelect: 'none'
      }}
    >
      {/* Drag handle strip */}
      <div
        onMouseDown={onMouseDown}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '8px 12px',
          background: isHovered || isDragging
            ? 'rgba(102, 126, 234, 0.06)'
            : 'transparent',
          borderRadius: '10px',
          transition: 'background 0.2s ease',
          transform: isDragging ? 'scale(1.01)' : 'none'
        }}
      >
        {/* Left line */}
        <div
          style={{
            height: '2px',
            width: '24px',
            background: `linear-gradient(90deg, transparent, ${accentColor})`,
            borderRadius: '2px',
            flexShrink: 0
          }}
        />

        {/* Label */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            minWidth: 0
          }}
        >
          {/* Color dot */}
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: accentColor,
              flexShrink: 0
            }}
          />

          {isEditing ? (
            <input
              ref={inputRef}
              value={labelValue}
              onChange={(e) => setLabelValue(e.target.value)}
              onBlur={commitLabel}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitLabel()
                if (e.key === 'Escape') {
                  setLabelValue(section.label)
                  setIsEditing(false)
                }
              }}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                border: 'none',
                borderBottom: `2px solid ${accentColor}`,
                outline: 'none',
                background: 'transparent',
                fontSize: '13px',
                fontWeight: 700,
                color: '#1e293b',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                width: '100%',
                padding: '1px 2px'
              }}
            />
          ) : (
            <span
              onDoubleClick={handleLabelDoubleClick}
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#64748b',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                cursor: 'text',
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
              title="Double-click to edit"
            >
              {labelValue}
            </span>
          )}
        </div>

        {/* Right line — fills remaining space */}
        <div
          style={{
            height: '2px',
            flex: 1,
            background: `linear-gradient(90deg, ${accentColor}, transparent)`,
            borderRadius: '2px',
            minWidth: '40px'
          }}
        />

        {/* Delete button — appears on hover */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: '18px',
            padding: '0 4px',
            lineHeight: 1,
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.15s ease, color 0.15s ease',
            flexShrink: 0
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) =>
            (e.currentTarget.style.color = '#ef4444')
          }
          onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) =>
            (e.currentTarget.style.color = '#94a3b8')
          }
          title="Delete section"
        >
          ×
        </button>
      </div>
    </div>
  )
}

export default SectionHeaderCard
