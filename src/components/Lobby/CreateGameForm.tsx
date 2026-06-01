import { useState } from 'react'
import { Button } from '../Shared/Button'
import { RulesConfig } from './RulesConfig'
import type { GameRules } from '../../engine/types'
import { createGame } from '../../engine'
import { useAuthStore } from '../../stores/authStore'
import { useGameStore } from '../../stores/gameStore'
import { createGameDoc } from '../../firebase/games'
import { useUIStore } from '../../stores/uiStore'

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

const defaultRules: GameRules = {
  decks: 6, dealerSoft17: 'stand', blackjackPayout: '3:2',
  surrender: 'none', insurance: false, doubleDown: 'any',
  splits: 'once', startingChips: 1000, minBet: 10, maxBet: 500,
  turnTimeLimit: 30,
}

export function CreateGameForm() {
  const [rules, setRules] = useState<GameRules>(defaultRules)
  const [creating, setCreating] = useState(false)
  const { user, displayName, setDisplayName } = useAuthStore()
  const { setGame, setRoomCode, setIsHost } = useGameStore()
  const { setView } = useUIStore()

  async function handleCreate() {
    if (!user) return
    setCreating(true)
    const code = generateRoomCode()
    const game = createGame(code, user.uid, rules)
    await createGameDoc(game)
    setGame(game)
    setRoomCode(code)
    setIsHost(true)
    setView('waiting')
    setCreating(false)
  }

  return (
    <div className="space-y-6">
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
      <RulesConfig rules={rules} onChange={setRules} />
      <Button onClick={handleCreate} disabled={creating || !displayName.trim()} size="lg" className="w-full">
        {creating ? 'Creating...' : 'Create Game'}
      </Button>
    </div>
  )
}
