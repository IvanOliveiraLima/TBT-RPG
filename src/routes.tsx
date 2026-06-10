import { createBrowserRouter, Navigate } from 'react-router-dom'
import CharSelect from '@/pages/CharSelect'
import Login from '@/pages/Login'
import CharacterSheet from '@/pages/CharacterSheet'
import CampaignSelect from '@/pages/CampaignSelect'
import CampaignDetail from '@/pages/CampaignDetail'
import CampaignCharacterView from '@/pages/CampaignCharacterView'
import JoinByLink from '@/pages/JoinByLink'

export const router = createBrowserRouter(
  [
    { path: '/',                                              element: <CharSelect /> },
    { path: '/login',                                         element: <Login /> },
    { path: '/character/:id',                                 element: <CharacterSheet /> },
    { path: '/campaigns',                                     element: <CampaignSelect /> },
    { path: '/campaigns/:id',                                 element: <CampaignDetail /> },
    { path: '/campaigns/:id/characters/:charId',              element: <CampaignCharacterView /> },
    { path: '/join/:code',                                    element: <JoinByLink /> },
    { path: '*',                                              element: <Navigate to="/" replace /> },
  ],
  {
    basename: import.meta.env.PROD ? '/TBT-RPG' : '/',
  }
)
