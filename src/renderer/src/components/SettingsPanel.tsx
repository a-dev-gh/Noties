import React, { useState, useEffect, useCallback } from 'react'
import type { SettingsPanelProps } from '../types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** True when running inside Electron with the full API surface. */
const hasElectron = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.electronAPI !== 'undefined' &&
  typeof (window.electronAPI as { saveApiKey?: unknown }).saveApiKey === 'function'

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface ComingSoonSectionProps {
  label: string
}

const ComingSoonSection = ({ label }: ComingSoonSectionProps): JSX.Element => (
  <div
    style={{
      padding: '16px 0',
      borderBottom: '1px solid #f1f5f9'
    }}
  >
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      <span
        style={{
          fontSize: '13px',
          fontWeight: 600,
          color: '#cbd5e1'
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: '10px',
          fontWeight: 600,
          color: '#94a3b8',
          background: '#f1f5f9',
          padding: '2px 8px',
          borderRadius: '20px',
          letterSpacing: '0.4px',
          textTransform: 'uppercase'
        }}
      >
        Coming soon
      </span>
    </div>
  </div>
)

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const SettingsPanel = ({ isOpen, onClose }: SettingsPanelProps): JSX.Element => {
  const [apiKey, setApiKey] = useState<string>('')
  const [showKey, setShowKey] = useState<boolean>(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [isConfigured, setIsConfigured] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // Load existing key whenever the panel opens
  useEffect(() => {
    if (!isOpen) return

    setIsLoading(true)
    setSaveStatus('idle')

    if (hasElectron()) {
      const electronAPI = window.electronAPI as {
        loadApiKey: () => Promise<string | null>
      }
      electronAPI
        .loadApiKey()
        .then((stored) => {
          if (stored) {
            // Show a masked placeholder — do not expose the actual key in the input
            setApiKey('')
            setIsConfigured(true)
          } else {
            setApiKey('')
            setIsConfigured(false)
          }
        })
        .catch(() => {
          setIsConfigured(false)
        })
        .finally(() => {
          setIsLoading(false)
        })
    } else {
      setIsLoading(false)
    }
  }, [isOpen])

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  const handleSave = async (): Promise<void> => {
    const trimmed = apiKey.trim()
    if (!trimmed) return

    setSaveStatus('saving')
    try {
      if (hasElectron()) {
        const electronAPI = window.electronAPI as {
          saveApiKey: (key: string) => Promise<void>
        }
        await electronAPI.saveApiKey(trimmed)
      }
      setIsConfigured(true)
      setApiKey('')
      setSaveStatus('saved')
      // Reset status label after 3 s
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  const handleDelete = async (): Promise<void> => {
    try {
      if (hasElectron()) {
        const electronAPI = window.electronAPI as {
          deleteApiKey: () => Promise<void>
        }
        await electronAPI.deleteApiKey()
      }
      setApiKey('')
      setIsConfigured(false)
      setSaveStatus('idle')
    } catch {
      /* ignore */
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') handleSave()
  }

  // ---------------------------------------------------------------------------
  // Derived UI values
  // ---------------------------------------------------------------------------

  const statusLabel = (): { text: string; color: string } => {
    if (saveStatus === 'saving') return { text: 'Saving…', color: '#667eea' }
    if (saveStatus === 'saved') return { text: 'Saved', color: '#22c55e' }
    if (saveStatus === 'error') return { text: 'Save failed', color: '#ef4444' }
    if (isConfigured) return { text: 'Configured', color: '#22c55e' }
    return { text: 'Not configured', color: '#f59e0b' }
  }

  const { text: statusText, color: statusColor } = statusLabel()

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.35)',
          zIndex: 900,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.22s ease'
        }}
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '360px',
          height: '100vh',
          background: 'white',
          boxShadow: '-4px 0 32px rgba(15, 23, 42, 0.12), -1px 0 0 #e2e8f0',
          zIndex: 901,
          display: 'flex',
          flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif"
        }}
      >
        {/* Header */}
        <div
          style={{
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            borderBottom: '1px solid #f1f5f9',
            flexShrink: 0
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '15px',
              fontWeight: 700,
              color: '#0f172a',
              letterSpacing: '-0.2px'
            }}
          >
            Settings
          </h2>
          <button
            onClick={onClose}
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
              transition: 'all 0.15s ease',
              flexShrink: 0,
              lineHeight: 1
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f8fafc'
              e.currentTarget.style.color = '#0f172a'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white'
              e.currentTarget.style.color = '#64748b'
            }}
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px'
          }}
        >
          {/* ---- API Key section ----------------------------------------- */}
          <section style={{ marginBottom: '8px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px'
              }}
            >
              <label
                htmlFor="settings-api-key"
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#334155',
                  letterSpacing: '-0.1px'
                }}
              >
                Anthropic API Key
              </label>

              {/* Status badge */}
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: statusColor,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: statusColor,
                    flexShrink: 0,
                    display: 'inline-block'
                  }}
                />
                {statusText}
              </span>
            </div>

            {/* Input row */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '10px'
              }}
            >
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  id="settings-api-key"
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isConfigured ? '••••••••••••••••••••' : 'sk-ant-api03-…'}
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '9px 36px 9px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid #e2e8f0',
                    fontSize: '13px',
                    color: '#334155',
                    background: isLoading ? '#f8fafc' : 'white',
                    outline: 'none',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#667eea'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.12)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                  autoComplete="off"
                  spellCheck={false}
                />
                {/* Show/hide toggle */}
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px',
                    color: '#94a3b8',
                    fontSize: '13px',
                    lineHeight: 1,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  aria-label={showKey ? 'Hide API key' : 'Show API key'}
                  title={showKey ? 'Hide' : 'Show'}
                >
                  {showKey ? '🙈' : '👁'}
                </button>
              </div>

              {/* Save button */}
              <button
                type="button"
                onClick={handleSave}
                disabled={!apiKey.trim() || saveStatus === 'saving'}
                style={{
                  padding: '9px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background:
                    !apiKey.trim() || saveStatus === 'saving'
                      ? '#e2e8f0'
                      : 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: !apiKey.trim() || saveStatus === 'saving' ? '#94a3b8' : 'white',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: !apiKey.trim() || saveStatus === 'saving' ? 'not-allowed' : 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                  fontFamily: 'inherit',
                  boxShadow:
                    !apiKey.trim() || saveStatus === 'saving'
                      ? 'none'
                      : '0 2px 8px rgba(102, 126, 234, 0.28)'
                }}
                onMouseEnter={(e) => {
                  if (apiKey.trim() && saveStatus !== 'saving') {
                    e.currentTarget.style.boxShadow = '0 4px 14px rgba(102, 126, 234, 0.38)'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow =
                    !apiKey.trim() || saveStatus === 'saving'
                      ? 'none'
                      : '0 2px 8px rgba(102, 126, 234, 0.28)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                {saveStatus === 'saving' ? 'Saving…' : 'Save'}
              </button>
            </div>

            {/* Remove key link */}
            {isConfigured && (
              <div style={{ marginBottom: '10px' }}>
                <button
                  type="button"
                  onClick={handleDelete}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontSize: '12px',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textDecoration: 'underline',
                    textUnderlineOffset: '2px'
                  }}
                >
                  Remove saved key
                </button>
              </div>
            )}

            {/* Helper text */}
            <p
              style={{
                margin: 0,
                fontSize: '11.5px',
                color: '#94a3b8',
                lineHeight: 1.55
              }}
            >
              Your key is stored locally and never sent anywhere except Anthropic's API.{' '}
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noreferrer"
                style={{ color: '#667eea', textDecoration: 'none' }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
              >
                Get a key
              </a>
            </p>
          </section>

          {/* Divider */}
          <div
            style={{
              height: '1px',
              background: '#f1f5f9',
              margin: '20px 0 4px'
            }}
          />

          {/* ---- Placeholder sections ------------------------------------ */}
          <ComingSoonSection label="Theme" />
          <ComingSoonSection label="Font Size" />
          <ComingSoonSection label="Export" />
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid #f1f5f9',
            flexShrink: 0
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: '11px',
              color: '#cbd5e1',
              textAlign: 'center'
            }}
          >
            Noties — settings are saved automatically
          </p>
        </div>
      </div>
    </>
  )
}

export default SettingsPanel
