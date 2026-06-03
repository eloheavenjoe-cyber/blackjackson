import {
  doc, setDoc, getDoc, updateDoc, deleteDoc, onSnapshot,
  collection, addDoc,
  increment,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from './config'
import type { GameState } from '../engine/types'

const COLLECTION = 'games'

export function gameDoc(gameId: string) {
  return doc(db, COLLECTION, gameId.toUpperCase())
}

export async function createGameDoc(game: GameState): Promise<void> {
  await setDoc(gameDoc(game.id), {
    ...game,
    createdAt: serverTimestamp(),
  })
}

export async function getGameDoc(gameId: string): Promise<GameState | null> {
  const snap = await getDoc(gameDoc(gameId))
  if (!snap.exists()) return null
  return snap.data() as GameState
}

export async function updateGameDoc(gameId: string, data: Partial<GameState>): Promise<void> {
  await updateDoc(gameDoc(gameId), data as any)
}

export async function deleteGameDoc(gameId: string): Promise<void> {
  await deleteDoc(gameDoc(gameId))
}

export function subscribeToGame(
  gameId: string,
  callback: (game: GameState | null) => void
): Unsubscribe {
  return onSnapshot(gameDoc(gameId), (snap) => {
    if (!snap.exists()) {
      callback(null)
      return
    }
    callback(snap.data() as GameState)
  })
}

export function betIntentsCollection(gameId: string) {
  return collection(db, COLLECTION, gameId.toUpperCase(), 'bets')
}

export async function submitBetIntent(gameId: string, playerId: string, amount: number): Promise<void> {
  await addDoc(betIntentsCollection(gameId), {
    playerId,
    amount,
    timestamp: serverTimestamp(),
  })
}

export async function incrementPendingBet(
  gameId: string,
  playerId: string,
  delta: number,
): Promise<void> {
  await updateDoc(gameDoc(gameId), {
    [`pendingBets.${playerId}`]: increment(delta),
  } as any)
}

export async function clearPendingBet(
  gameId: string,
  playerId: string,
): Promise<void> {
  const snap = await getDoc(gameDoc(gameId))
  if (!snap.exists()) return
  const data = snap.data()
  const pendingBets = data.pendingBets || {}
  delete pendingBets[playerId]
  await updateDoc(gameDoc(gameId), { pendingBets } as any)
}
