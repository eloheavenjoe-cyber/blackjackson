import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../Shared/Button'
import { PlayerAvatar } from '../Shared/PlayerAvatar'
import { useGameStore } from '../../stores/gameStore'
import { useAuthStore } from '../../stores/authStore'
import { subscribeToGame, updateGameDoc } from '../../firebase/games'
import { startGame, removePlayer } from '../../engine'

export function WaitingRoom() {
  const { game, roomCode, isHost, setGame } = useGameStore()
  const { user } = useAuthStore()
  const [copied, setCopied] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!roomCode) return
    const unsub = subscribeToGame(roomCode, (updated) => {
      if (updated) {
        setGame(updated)
        if (updated.phase !== 'waiting') {
          navigate(`/table/${roomCode}`)
        }
      }
    })
    return () => unsub()
  }, [roomCode, setGame, navigate])

  async function handleStart() {
    if (!game || !isHost) return
    const updated = startGame(game)
    await updateGameDoc(game.id, { ...updated, shoe: updated.shoe as any, players: updated.players })
    setGame(updated)
    navigate(`/table/${roomCode}`)
  }

  async function handleKick(playerId: string) {
    if (!game || !isHost) return
    const updated = removePlayer(game, playerId)
    await updateGameDoc(game.id, { players: updated.players })
  }

  if (!game) return null

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gold mb-2">Waiting Room</h2>
        <div className="flex items-center justify-center">
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(roomCode || '')
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
            }}
            className="text-4xl font-mono tracking-[0.3em] text-white hover:text-gold transition-colors cursor-pointer"
          >
            {roomCode}
          </button>
        </div>
        {copied && <p className="text-sm text-green-400 mt-1">Copied!</p>}
        <p className="text-sm text-gray-500 mt-1">Click code to copy</p>
      </div>
      <div className="space-y-2">
        <h3 className="text-sm text-gray-400 uppercase tracking-wide">Players ({game.players.length}/6)</h3>
        {game.players.map((p, i) => (
          <div key={p.id} className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-3 border border-white/5">
            <PlayerAvatar name={p.name} seat={i} />
            <span className="flex-1 text-white">{p.name}</span>
            {p.id === game.hostId && <span className="text-xs text-gold bg-gold/10 px-2 py-0.5 rounded">HOST</span>}
            {isHost && p.id !== user?.uid && (
              <button onClick={() => handleKick(p.id)} className="text-red-400 text-sm hover:text-red-300 cursor-pointer">Kick</button>
            )}
          </div>
        ))}
      </div>
      {isHost ? (
        <Button onClick={handleStart} disabled={game.players.length === 0} className="w-full" size="lg">
          Start Game
        </Button>
      ) : (
        <p className="text-center text-gray-400">Waiting for host to start the game...</p>
      )}
    </div>
  )
}
