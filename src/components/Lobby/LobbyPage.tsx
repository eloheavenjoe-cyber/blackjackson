import { useState } from 'react'
import { CreateGameForm } from './CreateGameForm'
import { JoinGameForm } from './JoinGameForm'
import { WaitingRoom } from './WaitingRoom'
import { useUIStore } from '../../stores/uiStore'

export function LobbyPage() {
  const [tab, setTab] = useState<'create' | 'join'>('create')
  const { currentView } = useUIStore()

  if (currentView === 'waiting') return <WaitingRoom />

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <h1 className="text-5xl font-bold text-center text-gold mb-2">Blackjackson</h1>
        <p className="text-center text-gray-400 mb-8">Multiplayer Blackjack for friends</p>
        <div className="flex mb-6 bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setTab('create')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              tab === 'create' ? 'bg-gold text-gray-950' : 'text-gray-400 hover:text-white'
            }`}
          >Create Game</button>
          <button
            onClick={() => setTab('join')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              tab === 'join' ? 'bg-gold text-gray-950' : 'text-gray-400 hover:text-white'
            }`}
          >Join Game</button>
        </div>
        <div className="bg-gray-900/50 backdrop-blur border border-white/10 rounded-xl p-6">
          {tab === 'create' ? <CreateGameForm /> : <JoinGameForm />}
        </div>
      </div>
    </div>
  )
}
