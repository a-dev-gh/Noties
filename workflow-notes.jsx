import React, { useState, useRef, useEffect } from 'react';

const WorkflowNotes = () => {
  const [workflows, setWorkflows] = useState([
    { id: 'w1', name: 'Frontend Development', notes: [] },
    { id: 'w2', name: 'API Integration', notes: [] },
    { id: 'w3', name: 'Database Design', notes: [] }
  ]);
  const [activeWorkflow, setActiveWorkflow] = useState('w1');
  const [isDragging, setIsDragging] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState(null);
  const [activeEditor, setActiveEditor] = useState(null);
  const canvasRef = useRef(null);
  const editorRefs = useRef({});

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('workflow-notes-data');
    if (saved) {
      setWorkflows(JSON.parse(saved));
    }
  }, []);

  // Close context menu on click
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Rich text formatting functions
  const formatText = (command, value = null) => {
    document.execCommand(command, false, value);
    if (activeEditor) {
      const content = editorRefs.current[activeEditor]?.innerHTML || '';
      updateNoteContent(activeEditor, content);
    }
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      formatText('createLink', url);
    }
  };

  const insertImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      formatText('insertImage', url);
    }
  };

  const handleContextMenu = (e, noteId) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      noteId
    });
  };

  // Save to localStorage whenever workflows change
  const saveToStorage = (updatedWorkflows) => {
    localStorage.setItem('workflow-notes-data', JSON.stringify(updatedWorkflows));
    setWorkflows(updatedWorkflows);
  };

  const activeWorkflowData = workflows.find(w => w.id === activeWorkflow);

  const addNote = () => {
    const newNote = {
      id: `note_${Date.now()}`,
      content: '',
      position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
      hasUnsavedChanges: false,
      savedContent: ''
    };

    const updated = workflows.map(w => 
      w.id === activeWorkflow 
        ? { ...w, notes: [...w.notes, newNote] }
        : w
    );
    saveToStorage(updated);
  };

  const updateNoteContent = (noteId, content) => {
    const updated = workflows.map(w => 
      w.id === activeWorkflow 
        ? { 
            ...w, 
            notes: w.notes.map(n => 
              n.id === noteId 
                ? { ...n, content, hasUnsavedChanges: content !== n.savedContent }
                : n
            )
          }
        : w
    );
    setWorkflows(updated);
  };

  const saveNote = (noteId) => {
    const updated = workflows.map(w => 
      w.id === activeWorkflow 
        ? { 
            ...w, 
            notes: w.notes.map(n => 
              n.id === noteId 
                ? { ...n, savedContent: n.content, hasUnsavedChanges: false }
                : n
            )
          }
        : w
    );
    saveToStorage(updated);
  };

  const deleteNote = (noteId) => {
    const updated = workflows.map(w => 
      w.id === activeWorkflow 
        ? { ...w, notes: w.notes.filter(n => n.id !== noteId) }
        : w
    );
    saveToStorage(updated);
    setContextMenu(null);
  };

  const duplicateNote = (noteId) => {
    const note = activeWorkflowData.notes.find(n => n.id === noteId);
    if (!note) return;

    const newNote = {
      ...note,
      id: `note_${Date.now()}`,
      position: { x: note.position.x + 20, y: note.position.y + 20 }
    };

    const updated = workflows.map(w => 
      w.id === activeWorkflow 
        ? { ...w, notes: [...w.notes, newNote] }
        : w
    );
    saveToStorage(updated);
    setContextMenu(null);
  };

  const searchWithAI = async (noteId) => {
    const note = activeWorkflowData.notes.find(n => n.id === noteId);
    if (!note || !note.content.trim()) return;

    setContextMenu(null);

    // Update note to show loading state
    const loadingUpdated = workflows.map(w => 
      w.id === activeWorkflow 
        ? { 
            ...w, 
            notes: w.notes.map(n => 
              n.id === noteId 
                ? { ...n, isSearching: true }
                : n
            )
          }
        : w
    );
    setWorkflows(loadingUpdated);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          messages: [{
            role: 'user',
            content: `Search for and provide relevant information about: ${note.content.replace(/<[^>]*>/g, '')}. Give me a comprehensive summary with key points.`
          }]
        })
      });

      const data = await response.json();
      const searchResults = data.content?.[0]?.text || 'No results found';

      // Create a new note with search results
      const newNote = {
        id: `note_${Date.now()}`,
        content: `<strong>Search Results:</strong><br/><br/>${searchResults}`,
        position: { x: note.position.x + 340, y: note.position.y },
        hasUnsavedChanges: true,
        savedContent: ''
      };

      const updated = workflows.map(w => 
        w.id === activeWorkflow 
          ? { 
              ...w, 
              notes: [
                ...w.notes.map(n => 
                  n.id === noteId 
                    ? { ...n, isSearching: false }
                    : n
                ),
                newNote
              ]
            }
          : w
      );
      setWorkflows(updated);
    } catch (error) {
      console.error('AI search failed:', error);
      const errorUpdated = workflows.map(w => 
        w.id === activeWorkflow 
          ? { 
              ...w, 
              notes: w.notes.map(n => 
                n.id === noteId 
                  ? { ...n, isSearching: false }
                  : n
              )
            }
          : w
      );
      setWorkflows(errorUpdated);
    }
  };

  const fixWithAI = async (noteId) => {
    const note = activeWorkflowData.notes.find(n => n.id === noteId);
    if (!note || !note.content.trim()) return;

    // Update note to show loading state
    const loadingUpdated = workflows.map(w => 
      w.id === activeWorkflow 
        ? { 
            ...w, 
            notes: w.notes.map(n => 
              n.id === noteId 
                ? { ...n, isFixing: true }
                : n
            )
          }
        : w
    );
    setWorkflows(loadingUpdated);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `Fix and improve the structure and clarity of this prompt/note. Make it more organized, clear, and effective. Return ONLY the improved text with no preamble or explanation:\n\n${note.content}`
          }]
        })
      });

      const data = await response.json();
      const fixedContent = data.content?.[0]?.text || note.content;

      const updated = workflows.map(w => 
        w.id === activeWorkflow 
          ? { 
              ...w, 
              notes: w.notes.map(n => 
                n.id === noteId 
                  ? { ...n, content: fixedContent, hasUnsavedChanges: true, isFixing: false }
                  : n
              )
            }
          : w
      );
      setWorkflows(updated);
    } catch (error) {
      console.error('AI fix failed:', error);
      const errorUpdated = workflows.map(w => 
        w.id === activeWorkflow 
          ? { 
              ...w, 
              notes: w.notes.map(n => 
                n.id === noteId 
                  ? { ...n, isFixing: false }
                  : n
              )
            }
          : w
      );
      setWorkflows(errorUpdated);
    }
  };

  const handleMouseDown = (noteId, e) => {
    const note = activeWorkflowData.notes.find(n => n.id === noteId);
    const rect = e.currentTarget.getBoundingClientRect();
    setIsDragging(noteId);
    setDragOffset({
      x: e.clientX - note.position.x,
      y: e.clientY - note.position.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const canvasRect = canvasRef.current.getBoundingClientRect();
    let newX = e.clientX - canvasRect.left - dragOffset.x;
    let newY = e.clientY - canvasRect.top - dragOffset.y;

    // Constrain to canvas boundaries (prevent going behind navbar or off-screen)
    newX = Math.max(0, Math.min(newX, canvasRect.width - 320)); // 320 is note width
    newY = Math.max(0, Math.min(newY, canvasRect.height - 240)); // 240 is min note height

    const updated = workflows.map(w => 
      w.id === activeWorkflow 
        ? { 
            ...w, 
            notes: w.notes.map(n => 
              n.id === isDragging 
                ? { ...n, position: { x: newX, y: newY } }
                : n
            )
          }
        : w
    );
    setWorkflows(updated);
  };

  const handleMouseUp = () => {
    if (isDragging) {
      saveToStorage(workflows);
      setIsDragging(null);
    }
  };

  const addWorkflow = () => {
    const name = prompt('Enter workflow name:');
    if (name) {
      const newWorkflow = {
        id: `w${Date.now()}`,
        name,
        notes: []
      };
      saveToStorage([...workflows, newWorkflow]);
    }
  };

  const toolbarButtonStyle = {
    padding: '6px 10px',
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#64748b',
    transition: 'all 0.2s',
    fontFamily: "'Plus Jakarta Sans', sans-serif"
  };

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      background: '#ffffff',
      fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .aurora-glow {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          background-size: 200% 200%;
          animation: aurora-shift 8s ease infinite;
        }

        @keyframes aurora-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }

        .note-card {
          transition: box-shadow 0.2s ease, transform 0.1s ease;
        }

        .note-card:hover {
          box-shadow: 0 12px 40px rgba(102, 126, 234, 0.2);
        }

        .dragging {
          cursor: grabbing !important;
          transform: rotate(2deg) scale(1.02);
          box-shadow: 0 16px 60px rgba(102, 126, 234, 0.3) !important;
        }

        .ai-button {
          position: relative;
          overflow: hidden;
        }

        .ai-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transition: left 0.5s;
        }

        .ai-button:hover::before {
          left: 100%;
        }

        .workflow-tab {
          position: relative;
          padding: 12px 24px;
          cursor: pointer;
          background: transparent;
          border: none;
          color: #64748b;
          font-weight: 500;
          font-size: 14px;
          transition: all 0.3s ease;
          border-bottom: 3px solid transparent;
        }

        .workflow-tab:hover {
          color: #667eea;
          background: rgba(102, 126, 234, 0.05);
        }

        .workflow-tab.active {
          color: #667eea;
          border-bottom-color: #667eea;
          font-weight: 600;
        }

        [contenteditable] {
          outline: none;
        }

        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #94a3b8;
          font-style: italic;
        }

        [contenteditable] a {
          color: #667eea;
          text-decoration: underline;
        }

        [contenteditable] pre {
          background: #1e293b;
          color: #e2e8f0;
          padding: 12px;
          border-radius: 6px;
          overflow-x: auto;
          margin: 8px 0;
          font-family: 'Courier New', monospace;
          font-size: 13px;
        }

        [contenteditable] img {
          max-width: 100%;
          border-radius: 6px;
          margin: 8px 0;
        }

        [contenteditable] ul, [contenteditable] ol {
          margin: 8px 0;
          padding-left: 24px;
        }

        [contenteditable] li {
          margin: 4px 0;
        }

        [contenteditable] strong {
          font-weight: 700;
          color: #1e293b;
        }

        [contenteditable] em {
          font-style: italic;
        }

        [contenteditable] u {
          text-decoration: underline;
        }
      `}</style>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(to bottom, #ffffff, #fafafa)',
        borderBottom: '1px solid #e2e8f0',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <h1 style={{
            fontSize: '20px',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Noties
          </h1>

          <div style={{ display: 'flex', gap: '4px' }}>
            {workflows.map(w => (
              <button
                key={w.id}
                onClick={() => setActiveWorkflow(w.id)}
                className={`workflow-tab ${activeWorkflow === w.id ? 'active' : ''}`}
              >
                {w.name}
              </button>
            ))}
            <button
              onClick={addWorkflow}
              className="workflow-tab"
              style={{ color: '#667eea', fontWeight: 600 }}
            >
              + New Workflow
            </button>
          </div>
        </div>

        <button
          onClick={addNote}
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
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
          }}
        >
          + Add Note
        </button>
      </div>

      {/* Canvas */}
      <div 
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{
          flex: 1,
          position: 'relative',
          background: '#fafafa',
          backgroundImage: `
            linear-gradient(rgba(102, 126, 234, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(102, 126, 234, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          overflow: 'hidden',
          cursor: isDragging ? 'grabbing' : 'default'
        }}
      >
        {activeWorkflowData?.notes.map(note => (
          <div
            key={note.id}
            className={`note-card ${isDragging === note.id ? 'dragging' : ''}`}
            style={{
              position: 'absolute',
              left: note.position.x,
              top: note.position.y,
              width: '320px',
              minHeight: '240px',
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              border: '2px solid transparent',
              backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #667eea, #764ba2, #f093fb)',
              backgroundOrigin: 'border-box',
              backgroundClip: 'padding-box, border-box',
              cursor: isDragging === note.id ? 'grabbing' : 'grab',
              display: 'flex',
              flexDirection: 'column',
              zIndex: isDragging === note.id ? 1000 : 1
            }}
          >
            {/* Loading overlay for AI operations */}
            {(note.isSearching || note.isFixing) && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(255, 255, 255, 0.95)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '12px',
                zIndex: 10,
                backdropFilter: 'blur(4px)'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '32px', 
                    marginBottom: '8px',
                    animation: 'pulse 1.5s ease-in-out infinite'
                  }}>
                    ✨
                  </div>
                  <p style={{ 
                    color: '#667eea', 
                    fontWeight: 600,
                    fontSize: '14px'
                  }}>
                    {note.isSearching ? 'Searching...' : 'Fixing...'}
                  </p>
                </div>
              </div>
            )}

            {/* Drag handle */}
            <div
              onMouseDown={(e) => handleMouseDown(note.id, e)}
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'grab',
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05))'
              }}
            >
              <div style={{ 
                fontSize: '18px',
                color: '#94a3b8',
                display: 'flex',
                gap: '4px'
              }}>
                <div style={{ width: '3px', height: '16px', background: '#cbd5e1', borderRadius: '2px' }}></div>
                <div style={{ width: '3px', height: '16px', background: '#cbd5e1', borderRadius: '2px' }}></div>
                <div style={{ width: '3px', height: '16px', background: '#cbd5e1', borderRadius: '2px' }}></div>
              </div>

              <button
                onClick={() => deleteNote(note.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '20px',
                  padding: '0 4px',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
              >
                ×
              </button>
            </div>

            {/* Content editor */}
            <div style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', background: '#fafafa' }}>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                <button onClick={() => formatText('bold')} style={toolbarButtonStyle} title="Bold">
                  <strong>B</strong>
                </button>
                <button onClick={() => formatText('italic')} style={toolbarButtonStyle} title="Italic">
                  <em>I</em>
                </button>
                <button onClick={() => formatText('underline')} style={toolbarButtonStyle} title="Underline">
                  <u>U</u>
                </button>
                <button onClick={() => formatText('insertUnorderedList')} style={toolbarButtonStyle} title="Bullet List">
                  ≡
                </button>
                <button onClick={() => formatText('insertOrderedList')} style={toolbarButtonStyle} title="Numbered List">
                  1.
                </button>
                <button onClick={() => formatText('formatBlock', 'pre')} style={toolbarButtonStyle} title="Code Block">
                  &lt;/&gt;
                </button>
                <button onClick={insertLink} style={toolbarButtonStyle} title="Insert Link">
                  🔗
                </button>
                <button onClick={insertImage} style={toolbarButtonStyle} title="Insert Image">
                  🖼️
                </button>
              </div>
            </div>

            <div
              ref={el => editorRefs.current[note.id] = el}
              contentEditable
              suppressContentEditableWarning
              data-placeholder="Start typing your note..."
              onFocus={() => setActiveEditor(note.id)}
              onInput={(e) => updateNoteContent(note.id, e.currentTarget.innerHTML)}
              onContextMenu={(e) => handleContextMenu(e, note.id)}
              style={{
                flex: 1,
                padding: '16px',
                fontSize: '14px',
                lineHeight: '1.6',
                color: '#1e293b',
                minHeight: '140px',
                maxHeight: '300px',
                overflowY: 'auto'
              }}
              dangerouslySetInnerHTML={{ __html: note.content }}
            />

            {/* Action buttons */}
            <div style={{
              padding: '12px 16px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              gap: '8px',
              background: '#fafafa'
            }}>
              <button
                onClick={() => fixWithAI(note.id)}
                disabled={note.isFixing || !note.content.trim()}
                className="ai-button"
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: note.isFixing 
                    ? 'linear-gradient(135deg, #94a3b8, #cbd5e1)'
                    : 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: note.isFixing || !note.content.trim() ? 'not-allowed' : 'pointer',
                  opacity: !note.content.trim() ? 0.5 : 1,
                  transition: 'all 0.2s ease'
                }}
              >
                {note.isFixing ? '✨ Fixing...' : '✨ Fix with AI'}
              </button>

              <button
                onClick={() => saveNote(note.id)}
                disabled={!note.hasUnsavedChanges}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '2px solid #667eea',
                  background: note.hasUnsavedChanges ? '#667eea' : 'white',
                  color: note.hasUnsavedChanges ? 'white' : '#667eea',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: note.hasUnsavedChanges ? 'pointer' : 'not-allowed',
                  opacity: note.hasUnsavedChanges ? 1 : 0.6,
                  transition: 'all 0.2s ease'
                }}
              >
                {note.hasUnsavedChanges ? '💾 Save' : '✓ Saved'}
              </button>
            </div>
          </div>
        ))}

        {activeWorkflowData?.notes.length === 0 && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: '#94a3b8'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📝</div>
            <p style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>No notes yet</p>
            <p style={{ fontSize: '14px' }}>Click "Add Note" to create your first sticky note</p>
          </div>
        )}

        {/* Context Menu */}
        {contextMenu && (
          <div
            style={{
              position: 'fixed',
              left: contextMenu.x,
              top: contextMenu.y,
              background: 'white',
              borderRadius: '8px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
              border: '1px solid #e2e8f0',
              zIndex: 10000,
              minWidth: '180px',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => searchWithAI(contextMenu.noteId)}
              style={contextMenuItemStyle}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
            >
              ✨ Search with AI
            </button>
            <button
              onClick={() => duplicateNote(contextMenu.noteId)}
              style={contextMenuItemStyle}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
            >
              📋 Duplicate
            </button>
            <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }}></div>
            <button
              onClick={() => deleteNote(contextMenu.noteId)}
              style={{ ...contextMenuItemStyle, color: '#ef4444' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#fef2f2';
                e.currentTarget.style.color = '#dc2626';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.color = '#ef4444';
              }}
            >
              🗑️ Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const contextMenuItemStyle = {
    width: '100%',
    padding: '10px 16px',
    background: 'white',
    border: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    color: '#1e293b',
    transition: 'all 0.15s',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };
};

export default WorkflowNotes;
