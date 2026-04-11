import React from 'react'

export interface PromptDialogState {
  message: string
  value: string
  onSubmit: (value: string) => void
}

interface PromptDialogProps {
  state: PromptDialogState
  onUpdate: (state: PromptDialogState) => void
  onClose: () => void
}

const PromptDialog = ({ state, onUpdate, onClose }: PromptDialogProps): JSX.Element => {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20000
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          minWidth: '320px'
        }}
      >
        <p style={{ marginBottom: '12px', fontWeight: 600, color: '#1e293b' }}>
          {state.message}
        </p>
        <input
          autoFocus
          type="text"
          value={state.value}
          onChange={(e) => onUpdate({ ...state, value: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') state.onSubmit(state.value)
            if (e.key === 'Escape') onClose()
          }}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: '8px',
            border: '2px solid #e2e8f0',
            fontSize: '14px',
            outline: 'none',
            fontFamily: "'Plus Jakarta Sans', sans-serif"
          }}
        />
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginTop: '16px',
            justifyContent: 'flex-end'
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              background: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => state.onSubmit(state.value)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600
            }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}

export default PromptDialog
