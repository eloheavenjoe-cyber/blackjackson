import {
  doc, setDoc, getDoc, updateDoc, deleteDoc, onSnapshot,
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
