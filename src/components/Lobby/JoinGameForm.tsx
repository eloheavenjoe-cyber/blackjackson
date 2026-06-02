import { useState } from 'react'
import { Button } from '../Shared/Button'
import { useAuthStore } from '../../stores/authStore'
import { useGameStore } from '../../stores/gameStore'
import { getGameDoc } from '../../firebase/games'
import { addPlayer } from '../../engine'
import { updateGameDoc } from '../../firebase/games'
import { useUIStore } from '../../stores/uiStore'

export function JoinGameForm() {
  const [code, setCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const { user, displayName, setDisplayName } = useAuthStore()
  const { setGame, setRoomCode, setIsHost } = useGameStore()
  const { setView } = useUIStore()

  async function handleJoin() {
    if (!user || !displayName.trim()) return
    setJoining(true)
    setError('')
    try {
      const game = await getGameDoc(code)
      if (!game) { setError('Room not found'); setJoining(false); return }
      if (game.phase !== 'waiting') { setError('Game already started'); setJoining(false); return }
      if (game.players.length >= 6) { setError('Room is full'); setJoining(false); return }

      const updated = addPlayer(game, {
        id: user.uid, name: displayName, seat: 0, hands: [],
        activeHandIndex: 0, chips: game.rules.startingChips, isActive: true, insuranceBet: 0, insuranceDecided: false,
      })
      await updateGameDoc(code, { players: updated.players })
      setGame(updated)
      setRoomCode(code)
      setIsHost(false)
      setView('waiting')
    } catch {
      setError('Failed to join')
    }
    setJoining(false)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-1">Your Name</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Enter your name"
          maxLength={20}
          className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-white focus:border-gold focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">Room Code</label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
          placeholder="ABC123"
          maxLength={6}
          className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-white text-center text-2xl tracking-widest font-mono focus:border-gold focus:outline-none"
        />
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <Button onClick={handleJoin} disabled={joining || !displayName.trim() || code.length < 6} className="w-full">
        {joining ? 'Joining...' : 'Join Game'}
      </Button>
    </div>
  )
}
