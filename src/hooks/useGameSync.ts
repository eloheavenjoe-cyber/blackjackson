import { useEffect, useRef } from 'react'
import { useGameStore } from '../stores/gameStore'
import { useAuthStore } from '../stores/authStore'
import { subscribeToGame, updateGameDoc, submitBetIntent } from '../firebase/games'
import { processAction, playDealer, settleHands, settleInsurance, dealInitialHands, setPlayerBet, allBetsPlaced, startNewRound } from '../engine'
import { collection, onSnapshot as fsOnSnapshot, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
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
    if (!roomCode || !isHost) return
    const betsCol = collection(db, 'games', roomCode.toUpperCase(), 'bets')
    const unsub = fsOnSnapshot(betsCol, async (snapshot) => {
      const current = useGameStore.getState().game
      if (!current) return
      for (const change of snapshot.docChanges()) {
        if (change.type === 'added') {
          const data = change.doc.data()
          try {
            let updated = setPlayerBet(current, data.playerId, data.amount)
            await updateGameDoc(roomCode, { players: updated.players })
            if (allBetsPlaced(updated)) {
              let dealt = dealInitialHands(updated)
              if (dealt.phase === 'settlement') {
                const settled = settleInsurance(settleHands(dealt))
                await updateGameDoc(roomCode, { ...settled, shoe: settled.shoe as any, players: settled.players })
                scheduleNewRound()
              } else {
                await updateGameDoc(roomCode, { ...dealt, shoe: dealt.shoe as any, players: dealt.players })
              }
            }
          } catch (e) {
            // Ignore duplicate/invalid bets
          }
          deleteDoc(change.doc.ref).catch(() => {})
        }
      }
    })
    return () => unsub()
  }, [roomCode, isHost])

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

      const timeoutKey = currentPlayer.id + '_timeouts'
      const prevTimeouts = (current.lastActionAt?.[timeoutKey] as number) || 0
      const newTimeouts = prevTimeouts + 1
      const lastActionPatch = {
        lastActionAt: { ...current.lastActionAt, [timeoutKey]: newTimeouts }
      }

      if (newTimeouts >= 2) {
        const marked = {
          ...updated,
          players: updated.players.map((p: any) =>
            p.id === currentPlayer.id ? { ...p, isActive: false } : p
          ),
          ...lastActionPatch,
        }
        await updateGameDoc(current.id, { ...marked, shoe: marked.shoe as any, players: marked.players })
      } else {
        await updateGameDoc(current.id, { ...updated, ...lastActionPatch, shoe: updated.shoe as any, players: updated.players })
      }
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
    await submitBetIntent(game.id, playerId, amount)
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
