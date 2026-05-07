import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { useAuthStore } from './store/auth'
import { useCharactersStore } from './store/characters'
import { migrateV1Characters } from './data/migration'

// Initialise auth before rendering so the UI has the session state from the start
useAuthStore.getState().initAuth().catch(console.error)

// One-time migration: copy characters from v1 DB → v2 DB (idempotent)
migrateV1Characters()
  .then(({ migrated, skipped }) => {
    if (migrated > 0 || skipped > 0) {
      console.info(`[migration] migrated: ${migrated}, skipped: ${skipped}`)
    }
  })
  .catch(console.error)

// DEV-only: expose store helpers for manual cross-version validation
if (import.meta.env.DEV) {
  Object.assign(window, {
    __characterStore__: useCharactersStore,
    __flushPendingSaves__: useCharactersStore.getState().flushPendingSaves,
  })
}

const root = document.getElementById('root')
if (!root) throw new Error('No #root element found')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
