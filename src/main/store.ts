// electron-store v11 is pure ESM, so it cannot be statically imported from
// a CommonJS module (which is what electron-vite compiles main to).
// We use a dynamic import wrapped in a lazy singleton so the async boundary
// is crossed exactly once, and every caller gets the same Store instance.

import type StoreType from 'electron-store'

interface Workflow {
  id: string
  name: string
  notes: unknown[]
}

interface StoreSchema {
  workflows: Workflow[]
}

// Default workflows matching the app prototype
const defaults: StoreSchema = {
  workflows: [
    { id: 'w1', name: 'Frontend Development', notes: [] },
    { id: 'w2', name: 'API Integration', notes: [] },
    { id: 'w3', name: 'Database Design', notes: [] }
  ]
}

// Cache the in-flight promise (not just the resolved instance) to prevent
// a race where two IPC calls arrive before the first import resolves.
let storePromise: Promise<InstanceType<typeof StoreType<StoreSchema>>> | null = null

/**
 * Returns the singleton Store instance, creating it on first call.
 * Must be awaited; subsequent calls resolve immediately from the cache.
 */
export function getStore(): Promise<InstanceType<typeof StoreType<StoreSchema>>> {
  if (!storePromise) {
    storePromise = (async () => {
      // Dynamic import required because electron-store v11 is ESM-only
      const { default: Store } = await import('electron-store')
      return new (Store as typeof StoreType<StoreSchema>)({
        name: 'noties-data',
        defaults
      })
    })()
  }
  return storePromise
}
