import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { LobbyPage } from './components/Lobby/LobbyPage'
import { TablePage } from './components/Table/TablePage'
import { VolumeControl } from './components/Shared/VolumeControl'

function AutoJoin() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { setDisplayName } = useAuthStore()

  useEffect(() => {
    const code = params.get('code')
    if (code) {
      setDisplayName('Player')
      navigate(`/table/${code}`)
    }
  }, [])

  return null
}

function AppRoutes() {
  return (
    <>
      <AutoJoin />
      <Routes>
        <Route path="/" element={<LobbyPage />} />
        <Route path="/table/:roomCode" element={<TablePage />} />
      </Routes>
      <VolumeControl />
    </>
  )
}

export default function App() {
  const { initialize } = useAuthStore()

  useEffect(() => {
    const unsub = initialize()
    return () => unsub()
  }, [initialize])

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <AppRoutes />
    </BrowserRouter>
  )
}
