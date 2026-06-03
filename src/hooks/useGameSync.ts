import { useEffect, useRef } from 'react'
import { useGameStore } from '../stores/gameStore'
import { useAuthStore } from '../stores/authStore'
import { subscribeToGame, updateGameDoc, submitBetIntent, getGameDoc, incrementPendingBet, clearPendingBet } from '../firebase/games'
import { processAction, playDealer, settleHands, settleInsurance, dealInitialHands, setPlayerBet, allBetsPlaced, startNewRound, evaluateHand } from '../engine'
import { collection, onSnapshot as fsOnSnapshot, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import type { PlayerAction, GameState } from '../engine/types'

export function useGameSync() {
  const { game, setGame, roomCode, isHost } = useGameStore()
  const { user } = useAuthStore()
  const nextRoundTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoStandTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const gameRef = useRef<GameState | null>(null)

  useEffect(() => {
    if (!roomCode) return
    const unsub = subscribeToGame(roomCode, (updated) => {
      gameRef.current = updated
      setGame(updated)
    })
    return () => unsub()
  }, [roomCode, setGame])

  useEffect(() => {
    if (!roomCode || !isHost) return
    const betsCol = collection(db, 'games', roomCode.toUpperCase(), 'bets')
    const unsub = fsOnSnapshot(betsCol, async (snapshot) => {
      const current = await getGameDoc(roomCode)
      if (!current) return
      for (const change of snapshot.docChanges()) {
        if (change.type === 'added') {
          const data = change.doc.data()
          try {
            let updated = setPlayerBet(current, data.playerId, data.amount)
            await updateGameDoc(roomCode, { players: updated.players })
            await clearPendingBet(roomCode, data.playerId)
            if (allBetsPlaced(updated)) {
              const dealt = dealInitialHands(updated)
              const finalized = finalizeState(dealt)
              await writeAndSchedule(finalized)
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
      let updated = processAction(current, { type: 'stand', playerId: currentPlayer.id })

      const timeoutKey = currentPlayer.id + '_timeouts'
      const prevTimeouts = (current.lastActionAt?.[timeoutKey] as number) || 0
      const newTimeouts = prevTimeouts + 1

      if (newTimeouts >= 2) {
        updated = {
          ...updated,
          players: updated.players.map((p: any) =>
            p.id === currentPlayer.id ? { ...p, isActive: false } : p
          ),
        }
      }

      updated = {
        ...updated,
        lastActionAt: { ...updated.lastActionAt, [timeoutKey]: newTimeouts },
      }

      const finalized = finalizeState(updated)
      await writeAndSchedule(finalized)
    }, remaining)

    return () => clearTimeout(timer)
  }, [game?.currentTurn, game?.turnStartedAt, game?.turnTimeLimit, game?.phase, isHost, user])

  useEffect(() => {
    return () => {
      if (nextRoundTimer.current) clearTimeout(nextRoundTimer.current)
      if (autoStandTimer.current) clearTimeout(autoStandTimer.current)
    }
  }, [])

  function finalizeState(state: GameState): GameState {
    if (state.phase === 'dealer') {
      return settleInsurance(settleHands(playDealer(state)))
    }
    if (state.phase === 'settlement') {
      return settleInsurance(settleHands(state))
    }
    return state
  }

  async function writeAndSchedule(state: GameState) {
    const gameId = state.id
    await updateGameDoc(gameId, { ...state, shoe: state.shoe as any, players: state.players })
    if (state.phase === 'round_end') {
      scheduleNewRound()
    }
  }

  async function addBetChip(value: number) {
    if (!game || !user) return
    await incrementPendingBet(game.id, user.uid, value)
  }

  async function clearBetChip() {
    if (!game || !user) return
    await clearPendingBet(game.id, user.uid)
  }

  async function submitAction(action: PlayerAction) {
    if (!game || !user) return
    const updated = processAction(game, { ...action, playerId: user.uid })
    const finalized = finalizeState(updated)
    await writeAndSchedule(finalized)

    if (action.type === 'hit' && isHost && !game.gameOver) {
      const player = finalized.players.find(p => p.id === user.uid)
      if (player) {
        const activeHand = player.hands[player.activeHandIndex]
        if (activeHand && !activeHand.isStood) {
          const ev = evaluateHand(activeHand.cards)
          if (ev.value === 21 && !ev.isBust) {
            if (autoStandTimer.current) clearTimeout(autoStandTimer.current)
            autoStandTimer.current = setTimeout(async () => {
              autoStandTimer.current = null
              const current = useGameStore.getState().game
              if (!current || current.phase !== 'playing') return
              const cp = current.players.find(p => p.id === user.uid)
              if (!cp) return
              const cpIdx = current.players.indexOf(cp)
              if (cpIdx !== current.currentTurn) return
              const activeH = cp.hands[cp.activeHandIndex]
              if (!activeH || activeH.isStood) return
              const evCheck = evaluateHand(activeH.cards)
              if (evCheck.value === 21 && !evCheck.isBust) {
                try {
                  const standResult = processAction(current, { type: 'stand', playerId: user.uid })
                  const standFinal = finalizeState(standResult)
                  await writeAndSchedule(standFinal)
                } catch { /* guard: state may have changed */ }
              }
            }, 800)
          }
        }
      }
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
      const current = gameRef.current
      if (!current || current.phase !== 'round_end') return
      const next = startNewRound(current)
      await updateGameDoc(current.id, { ...next, shoe: next.shoe as any, players: next.players })
    }, 5000)
  }

  return { submitAction, submitBet, scheduleNewRound, addBetChip, clearBetChip }
}
