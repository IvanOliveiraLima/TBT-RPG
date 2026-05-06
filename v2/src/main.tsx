import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { useAuthStore } from './store/auth'
import { useCharacterStore } from './store/character'
import { flushPendingSaves } from './lib/save-debounce'

// Initialise auth before rendering so the UI has the session state from the start
useAuthStore.getState().initAuth().catch(console.error)

// DEV-only: expose store for manual cross-version validation (C.1.a follow-up)
if (import.meta.env.DEV) {
  Object.assign(window, { __characterStore__: useCharacterStore, __flushPendingSaves__: flushPendingSaves })
}

const root = document.getElementById('root')
if (!root) throw new Error('No #root element found')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
