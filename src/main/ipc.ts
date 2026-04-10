import { ipcMain, BrowserWindow } from 'electron'
import { getStore } from './store'

// ---------------------------------------------------------------------------
// Anthropic API helper
// ---------------------------------------------------------------------------

interface AnthropicMessage {
  role: 'user'
  content: string
}

interface AnthropicRequest {
  model: string
  max_tokens: number
  messages: AnthropicMessage[]
}

interface AnthropicResponse {
  content: Array<{ type: string; text: string }>
  error?: { message: string }
}

/**
 * Sends a single-turn message to the Anthropic Messages API.
 * Returns the assistant's text response, or an error string if the call fails.
 *
 * @param prompt     - The user message to send
 * @param maxTokens  - Upper bound on response length
 */
async function callAnthropic(prompt: string, maxTokens: number): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    return 'API key not configured. Set the ANTHROPIC_API_KEY environment variable to enable AI features.'
  }

  const body: AnthropicRequest = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }]
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Anthropic API error ${response.status}: ${errorText}`)
    }

    const data = (await response.json()) as AnthropicResponse

    // Extract the first text block from the response content array
    const textBlock = data.content?.find((block) => block.type === 'text')
    if (!textBlock) {
      throw new Error('Anthropic response contained no text block')
    }

    return textBlock.text
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[ipc] Anthropic call failed:', message)
    return `AI request failed: ${message}`
  }
}

// ---------------------------------------------------------------------------
// IPC handler registration
// ---------------------------------------------------------------------------

/**
 * Registers all IPC handlers for the main process.
 * Call this once inside app.whenReady().
 */
export function registerIPC(): void {

  // ---- Storage: load -------------------------------------------------------
  // Renderer calls: window.electronAPI.loadData()
  // Returns the full workflows array from electron-store.
  ipcMain.handle('storage:load', async () => {
    const store = await getStore()
    return store.get('workflows')
  })

  // ---- Storage: save -------------------------------------------------------
  // Renderer calls: window.electronAPI.saveData(workflows)
  // Persists the entire workflows array to electron-store.
  ipcMain.handle('storage:save', async (_event, data: unknown) => {
    const store = await getStore()
    store.set('workflows', data)
  })

  // ---- AI: fix -------------------------------------------------------------
  // Renderer calls: window.electronAPI.fixWithAI(noteContent)
  // Asks the model to fix/improve the provided note content.
  // max_tokens: 1000 — suitable for short editing tasks.
  ipcMain.handle('ai:fix', async (_event, content: string) => {
    return callAnthropic(content, 1000)
  })

  // ---- AI: search ----------------------------------------------------------
  // Renderer calls: window.electronAPI.searchWithAI(query)
  // Asks the model to search or summarise across note content.
  // max_tokens: 2000 — larger budget for aggregation tasks.
  ipcMain.handle('ai:search', async (_event, content: string) => {
    return callAnthropic(content, 2000)
  })

  // ---- Window: minimize ----------------------------------------------------
  // Renderer calls: window.electronAPI.minimize()
  // Uses ipcMain.on (one-way send) because the renderer does not await a reply.
  ipcMain.on('window:minimize', () => {
    BrowserWindow.getFocusedWindow()?.minimize()
  })

  // ---- Window: maximize / unmaximize toggle --------------------------------
  // Renderer calls: window.electronAPI.maximize()
  ipcMain.on('window:maximize', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return
    if (win.isMaximized()) {
      win.unmaximize()
    } else {
      win.maximize()
    }
  })

  // ---- Window: close -------------------------------------------------------
  // Renderer calls: window.electronAPI.close()
  ipcMain.on('window:close', () => {
    BrowserWindow.getFocusedWindow()?.close()
  })
}
