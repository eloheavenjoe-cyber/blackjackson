import { useEffect, useRef } from 'react'
import { useGameStore } from '../stores/gameStore'
import { useAuthStore } from '../stores/authStore'
import { subscribeToGame, updateGameDoc } from '../firebase/games'
import { processAction, playDealer, settleHands, settleInsurance, dealInitialHands, setPlayerBet, allBetsPlaced, startNewRound } from '../engine'
import type { PlayerAction } from '../engine/types'

export function useGameSync() {
  const { game, setGame, roomCode, isHost } = useGameStore()
  const { user } = useAuthStore()
  const nextRoundTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!roomCode) return
    const unsub = subscribeToGame(roomCode, (updated) => {
      setGame(updated)
    })
    return () => unsub()
  }, [roomCode, setGame])

  useEffect(() => {
    if (!game || !isHost || !user) return
    if (game.phase !== 'playing') return
    if (game.currentTurn < 0) return
    if (!game.turnStartedAt || game.turnTimeLimit <= 0) return

    const currentPlayer = game.players[game.currentTurn]
    if (!currentPlayer) return

    const elapsed = Date.now() - game.turnStartedAt
    const remaining = game.turnTimeLimit * 1000 - elapsed
    if (remaining <= 0) return

    const timer = setTimeout(async () => {
      const current = useGameStore.getState().game
      if (!current || current.phase !== 'playing' || current.currentTurn !== game.currentTurn) return
      const updated = processAction(current, { type: 'stand', playerId: currentPlayer.id })
      await updateGameDoc(current.id, { ...updated, shoe: updated.shoe as any, players: updated.players })
    }, remaining)

    return () => clearTimeout(timer)
  }, [game?.currentTurn, game?.turnStartedAt, game?.turnTimeLimit, game?.phase, isHost, user])

  useEffect(() => {
    return () => {
      if (nextRoundTimer.current) clearTimeout(nextRoundTimer.current)
    }
  }, [])

  async function submitAction(action: PlayerAction) {
    if (!game || !user) return
    const updated = processAction(game, { ...action, playerId: user.uid })

    if (updated.phase === 'dealer') {
      const afterDealer = playDealer(updated)
      const settled = settleInsurance(settleHands(afterDealer))
      await updateGameDoc(game.id, { ...settled, shoe: settled.shoe as any, players: settled.players })
      scheduleNewRound()
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

  function scheduleNewRound() {
    if (!isHost) return
    if (nextRoundTimer.current) clearTimeout(nextRoundTimer.current)
    nextRoundTimer.current = setTimeout(async () => {
      nextRoundTimer.current = null
      const current = useGameStore.getState().game
      if (!current || current.phase !== 'round_end') return
      const next = startNewRound(current)
      await updateGameDoc(current.id, { ...next, shoe: next.shoe as any, players: next.players })
    }, 5000)
  }

  return { submitAction, submitBet }
}
