import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../App'
import { getSupportedAssets, searchAssets } from '../api/backtest'
import { saveStrategy, deleteStrategy } from '../api/strategies'
import Editor from '@monaco-editor/react'
import VisualBlocksEditor from '../components/VisualBlocksEditor'

export default function StrategyBuilder() {
  const navigate = useNavigate()
  const { strategy, setStrategy, strategyCode, setStrategyCode, activeStrategyId, refreshData } = useApp()
  const [draft, setDraft] = useState(strategy)
  const [draftCode, setDraftCode] = useState(strategyCode)
  const [mode, setMode] = useState('CODE') // 'CODE' or 'VISUAL'
  const [supportedAssets, setSupportedAssets] = useState([strategy.asset])
  const [editorMarkers, setEditorMarkers] = useState([])
  const [saveStatus, setSaveStatus] = useState(null) // null | 'saving' | 'saved' | 'error'
  const [showAssetDropdown, setShowAssetDropdown] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const assetInputRef = useRef(null)
  const editorRef = useRef(null)
  const monacoRef = useRef(null)

  useEffect(() => {
    getSupportedAssets()
      .then(data => {
        if (data.assets && data.assets.length > 0) {
          setSupportedAssets(data.assets)
        }
      })
      .catch(() => {})
  }, [])

  // Sync when global strategy changes (e.g. from Dashboard click)
  useEffect(() => {
    setDraft(strategy)
  }, [strategy])
  useEffect(() => {
    setDraftCode(strategyCode)
  }, [strategyCode])

  const update = (key, value) => setDraft((d) => ({ ...d, [key]: value }))
  
  const handleAssetSearch = async (query) => {
    update('asset', query.toUpperCase())
    if (query.length >= 2) {
      try {
        const data = await searchAssets(query)
        if (data.assets && data.assets.length > 0) {
          setSupportedAssets(Array.from(new Set([...data.assets, strategy.asset])))
        }
      } catch (err) {
        // Ignore search errors, fallback to existing options
      }
    }
  }

  const handleContinue = () => {
    // Date validation: end date must not precede start date
    if (draft.startDate && draft.endDate && draft.endDate < draft.startDate) {
      alert('End date cannot be before start date. Please adjust the date range.')
      return
    }
    setStrategy(draft)
    setStrategyCode(draftCode)
    navigate('/parameters')
  }

  // Save to backend
  const handleSave = async () => {
    if (!activeStrategyId) {
      // No active strategy — just apply locally
      setStrategy(draft)
      setStrategyCode(draftCode)
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus(null), 2000)
      return
    }
    setSaveStatus('saving')
    try {
      // Extract parameter values from draft (non-metadata keys)
      const metaKeys = ['name', 'asset', 'timeframe', 'startDate', 'endDate']
      const paramValues = {}
      Object.entries(draft).forEach(([k, v]) => {
        if (!metaKeys.includes(k) && typeof v === 'number') paramValues[k] = v
      })

      await saveStrategy(activeStrategyId, {
        name: draft.name,
        asset: draft.asset,
        timeframe: draft.timeframe,
        startDate: draft.startDate,
        endDate: draft.endDate,
        pythonCode: draftCode,
        parameterValues: paramValues,
      })

      setStrategy(draft)
      setStrategyCode(draftCode)
      await refreshData()
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus(null), 2000)
    } catch (err) {
      console.error('Save failed:', err)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus(null), 3000)
    }
  }

  // Delete from backend
  const confirmDelete = () => {
    setShowDeleteModal(true)
  }

  const handleDelete = async () => {
    if (!activeStrategyId) return
    setShowDeleteModal(false)
    try {
      await deleteStrategy(activeStrategyId)
      await refreshData()
      navigate('/dashboard')
    } catch (err) {
      console.error('Delete failed:', err)
      alert('Failed to delete strategy. It might already be removed.')
    }
  }

  // Handle clicking outside asset dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (assetInputRef.current && !assetInputRef.current.contains(event.target)) {
        setShowAssetDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Monaco editor mount handler
  const handleEditorDidMount = useCallback((editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    // Add Ctrl+Enter shortcut to run backtest
    editor.addAction({
      id: 'run-backtest',
      label: 'Run Backtest',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => handleContinue()
    })
  }, [])

  // Validate Python code on change and set markers
  const handleEditorChange = useCallback((value) => {
    setDraftCode(value || '')

    if (!monacoRef.current || !editorRef.current) return
    const monaco = monacoRef.current
    const model = editorRef.current.getModel()
    if (!model) return

    const markers = []
    const lines = (value || '').split('\n')

    lines.forEach((line, idx) => {
      // Flag mixed tabs and spaces
      if (/^\t+ /.test(line) || /^ +\t/.test(line)) {
        markers.push({
          severity: monaco.MarkerSeverity.Warning,
          message: 'Mixed tabs and spaces — Python will throw an IndentationError.',
          startLineNumber: idx + 1, startColumn: 1,
          endLineNumber: idx + 1, endColumn: line.length + 1,
        })
      }
      // Flag common Python syntax mistakes
      if (/def\s+\w+\s*\([^)]*\)\s*[^:]\s*$/.test(line.trimEnd()) && !line.trimEnd().endsWith(':') && line.trim().startsWith('def ')) {
        markers.push({
          severity: monaco.MarkerSeverity.Error,
          message: 'Missing colon (:) at end of function definition.',
          startLineNumber: idx + 1, startColumn: 1,
          endLineNumber: idx + 1, endColumn: line.length + 1,
        })
      }
      if (/class\s+\w+.*[^:]\s*$/.test(line.trimEnd()) && !line.trimEnd().endsWith(':') && line.trim().startsWith('class ')) {
        markers.push({
          severity: monaco.MarkerSeverity.Error,
          message: 'Missing colon (:) at end of class definition.',
          startLineNumber: idx + 1, startColumn: 1,
          endLineNumber: idx + 1, endColumn: line.length + 1,
        })
      }
    })

    monaco.editor.setModelMarkers(model, 'python-lint', markers)
    setEditorMarkers(markers)
  }, [])

  // Generate code from visual blocks
  const handleBlocksCodeGenerated = useCallback((generatedCode) => {
    setDraftCode(generatedCode)
  }, [])

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <div className="eyebrow">Step 1 of 3</div>
          <h1>Strategy Builder</h1>
          <p>Define the rules that generate trading actions using Python code or visual blocks.</p>
        </div>
        <div className="header-actions">
          {saveStatus === 'saving' && <span className="muted save-status">Saving...</span>}
          {saveStatus === 'saved' && <span className="save-status ok">✓ Saved</span>}
          {saveStatus === 'error' && <span className="save-status err">✕ Save failed</span>}

          {activeStrategyId && (
            <button className="button danger-outline" onClick={confirmDelete} aria-label="Delete strategy">🗑 Delete</button>
          )}
          <button className="button secondary" onClick={handleSave} aria-label="Save strategy">💾 Save</button>
          <button className="button secondary" onClick={() => navigate('/dashboard')} aria-label="Back to Dashboard">Back to Dashboard</button>
        </div>
      </div>

      <div className="builder-controls">
        <div className="mode-toggle">
          <button className={`toggle-btn ${mode === 'CODE' ? 'active' : ''}`} onClick={() => setMode('CODE')} aria-label="Switch to code editor">CODE</button>
          <button className={`toggle-btn ${mode === 'VISUAL' ? 'active' : ''}`} onClick={() => setMode('VISUAL')} aria-label="Switch to visual blocks editor">VISUAL BLOCKS</button>
        </div>
      </div>

      <div className="builder-layout">
        <section className="panel builder-panel">
          {mode === 'CODE' ? (
            <div className="code-editor-container">
              <div className="section-title">
                <h2>Python QCAlgorithm</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="muted">LEAN Engine Compatible</span>
                  {editorMarkers.length > 0 && (
                    <span className={`issue-badge ${editorMarkers.some(m => m.severity === 8) ? 'error' : 'warn'}`}>
                      {editorMarkers.length} issue{editorMarkers.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
              <div className="editor-frame">
                <Editor
                  height="500px"
                  defaultLanguage="python"
                  value={draftCode}
                  onChange={handleEditorChange}
                  onMount={handleEditorDidMount}
                  theme="vs-dark"
                  options={{
                    fontSize: 13,
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    lineNumbers: 'on',
                    automaticLayout: true,
                    tabSize: 4,
                    insertSpaces: true,
                    wordWrap: 'on',
                    bracketPairColorization: { enabled: true },
                    padding: { top: 12 },
                    renderLineHighlight: 'line',
                    smoothScrolling: true,
                    cursorBlinking: 'smooth',
                    cursorSmoothCaretAnimation: 'on',
                  }}
                />
              </div>
              <div className="editor-footer">
                <span>Press <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to run backtest</span>
                <span>Python · UTF-8 · LF</span>
              </div>
            </div>
          ) : (
            <VisualBlocksEditor
              draft={draft}
              draftCode={draftCode}
              onCodeGenerated={handleBlocksCodeGenerated}
            />
          )}
        </section>

        <aside className="panel inspector">
          <div className="section-title"><h2>Strategy Metadata</h2></div>
          <label>Strategy Name<input value={draft.name} onChange={(e) => update('name', e.target.value)} /></label>
          <label style={{ position: 'relative' }} ref={assetInputRef}>Asset
            <input 
              value={draft.asset} 
              onChange={(e) => {
                handleAssetSearch(e.target.value)
                setShowAssetDropdown(true)
              }}
              onFocus={() => setShowAssetDropdown(true)}
              placeholder="Type ticker symbol..."
              autoComplete="off"
              aria-label="Search for stock ticker"
            />
            {showAssetDropdown && supportedAssets.length > 0 && (
              <div className="dropdown-menu">
                {supportedAssets.map(a => (
                  <div
                    key={a}
                    className="dropdown-item"
                    onClick={() => {
                      update('asset', a)
                      setShowAssetDropdown(false)
                    }}
                  >
                    {a}
                  </div>
                ))}
              </div>
            )}
          </label>
          <label>Timeframe
            <select value={draft.timeframe} onChange={(e) => update('timeframe', e.target.value)}>
              <option>Daily</option>
              <option>30 Min</option>
              <option>Weekly</option>
            </select>
          </label>
          <label>Start Date<input type="date" value={draft.startDate} onChange={(e) => update('startDate', e.target.value)} /></label>
          <label>End Date<input type="date" value={draft.endDate} onChange={(e) => update('endDate', e.target.value)} /></label>
          <div className="form-actions" style={{ marginTop: 'auto' }}>
            <button className="button secondary" onClick={() => setShowResetModal(true)} aria-label="Reset to last saved">Reset</button>
            <button className="button primary" onClick={handleContinue}>Continue to Parameters →</button>
          </div>
        </aside>
      </div>

      {showDeleteModal && (
        <div className="modal-backdrop">
          <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
            <h3 id="delete-modal-title">Delete Strategy</h3>
            <p>
              Are you sure you want to delete <strong>"{draft.name}"</strong>?<br/><br/>
              This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button className="button secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="button danger" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {showResetModal && (
        <div className="modal-backdrop">
          <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="reset-modal-title">
            <h3 id="reset-modal-title">Reset Strategy</h3>
            <p>
              This will discard all unsaved changes to <strong>"{draft.name}"</strong> and revert to the last saved version.<br/><br/>
              Are you sure you want to continue?
            </p>
            <div className="modal-actions">
              <button className="button secondary" onClick={() => setShowResetModal(false)}>Cancel</button>
              <button className="button primary" onClick={() => { setDraft(strategy); setDraftCode(strategyCode); setShowResetModal(false); }}>Reset</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
