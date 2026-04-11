import React from 'react'

const EmptyState = (): JSX.Element => {
  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        color: '#94a3b8'
      }}
    >
      <div style={{ fontSize: '64px', marginBottom: '16px' }}>📝</div>
      <p style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
        No notes yet
      </p>
      <p style={{ fontSize: '14px' }}>
        Click &quot;Add Note&quot; to create your first sticky note
      </p>
    </div>
  )
}

export default EmptyState
