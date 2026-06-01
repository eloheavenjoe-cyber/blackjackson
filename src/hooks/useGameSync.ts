import { useEffect } from 'react'
import { useGameStore } from '../stores/gameStore'
import { useAuthStore } from '../stores/authStore'
import { subscribeToGame, updateGameDoc } from '../firebase/games'
import { processAction, playDealer, settleHands, dealInitialHands, setPlayerBet, allBetsPlaced } from '../engine'
import type { PlayerAction } from '../engine/types'

export function useGameSync() {
  const { game, setGame, roomCode } = useGameStore()
  const { user } = useAuthStore()

  useEffect(() => {
    if (!roomCode) return
    const unsub = subscribeToGame(roomCode, (updated) => {
      if (updated) setGame(updated)
    })
    return () => unsub()
  }, [roomCode, setGame])

  async function submitAction(action: PlayerAction) {
    if (!game || !user) return
    const updated = processAction(game, { ...action, playerId: user.uid })

    if (updated.phase === 'dealer') {
      const afterDealer = playDealer(updated)
      const settled = settleHands(afterDealer)
      await updateGameDoc(game.id, { ...settled, shoe: settled.shoe as any, players: settled.players })
    } else {
      await updateGameDoc(game.id, { ...updated, shoe: updated.shoe as any, players: updated.players })
    }
  }

  async function submitBet(playerId: string, amount: number) {
    if (!game) return
    const updated = setPlayerBet(game, playerId, amount)
    await updateGameDoc(game.id, { players: updated.players })

    if (allBetsPlaced(updated)) {
      const dealt = dealInitialHands(updated)
      await updateGameDoc(game.id, { ...dealt, shoe: dealt.shoe as any, players: dealt.players })
    }
  }

  return { submitAction, submitBet }
}
