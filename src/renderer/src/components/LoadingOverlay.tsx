import React from 'react'

interface LoadingOverlayProps {
  isVisible: boolean
  message: string
}

const LoadingOverlay = ({ isVisible, message }: LoadingOverlayProps): JSX.Element | null => {
  if (!isVisible) return null

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(255, 255, 255, 0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '12px',
        zIndex: 10,
        backdropFilter: 'blur(4px)'
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontSize: '32px',
            marginBottom: '8px',
            animation: 'pulse 1.5s ease-in-out infinite'
          }}
        >
          ✨
        </div>
        <p style={{ color: '#667eea', fontWeight: 600, fontSize: '14px' }}>
          {message}
        </p>
      </div>
    </div>
  )
}

export default LoadingOverlay
