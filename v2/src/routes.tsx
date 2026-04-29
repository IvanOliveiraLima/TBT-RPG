import { createBrowserRouter, Navigate } from 'react-router-dom'
import CharSelect from '@/pages/CharSelect'
import Login from '@/pages/Login'
import CharacterSheet from '@/pages/CharacterSheet'

export const router = createBrowserRouter(
  [
    { path: '/',              element: <CharSelect /> },
    { path: '/login',         element: <Login /> },
    { path: '/character/:id', element: <CharacterSheet /> },
    { path: '*',              element: <Navigate to="/" replace /> },
  ],
  {
    basename: import.meta.env.PROD ? '/TBT-RPG/v2' : '/',
  }
)
