import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { useAuthStore } from './store/auth'
import { useCharactersStore } from './store/characters'
import { startPeriodicSync, stopPeriodicSync, syncAll, initSyncListeners } from './services/sync'

// Register online/offline event listeners once at startup
initSyncListeners()

// Initialise auth before rendering so the UI has the session state from the start
useAuthStore.getState().initAuth().then(() => {
  if (useAuthStore.getState().user) {
    startPeriodicSync()
    void syncAll()
  }
}).catch(console.error)

// Manage periodic sync lifecycle when auth state changes (login / logout)
useAuthStore.subscribe((state, prevState) => {
  if (state.user && !prevState.user) {
    startPeriodicSync()
    void syncAll()
  } else if (!state.user && prevState.user) {
    stopPeriodicSync()
  }
})

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
