import { RouterProvider } from 'react-router-dom'
import { router } from './routes'
import { I18nProvider } from './i18n'
import { useAuthStore } from './store/auth'
import ResetPassword from './pages/ResetPassword'
import { PwaUpdatePrompt } from './components/PwaUpdatePrompt'

export default function App() {
  const authCallbackType = useAuthStore(s => s.authCallbackType)
  return (
    <I18nProvider>
      {authCallbackType === 'recovery'
        ? <ResetPassword />
        : <RouterProvider router={router} />}
      <PwaUpdatePrompt />
    </I18nProvider>
  )
}
