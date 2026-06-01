import { create } from 'zustand'
import type { GameState } from '../engine/types'

type GameStoreState = {
  game: GameState | null
  roomCode: string | null
  isHost: boolean
  isSyncing: boolean
  setGame: (game: GameState | null) => void
  setRoomCode: (code: string | null) => void
  setIsHost: (host: boolean) => void
  setIsSyncing: (syncing: boolean) => void
  reset: () => void
}

export const useGameStore = create<GameStoreState>((set) => ({
  game: null,
  roomCode: null,
  isHost: false,
  isSyncing: false,
  setGame: (game) => set({ game }),
  setRoomCode: (code) => set({ roomCode: code }),
  setIsHost: (host) => set({ isHost: host }),
  setIsSyncing: (syncing) => set({ isSyncing: syncing }),
  reset: () => set({ game: null, roomCode: null, isHost: false, isSyncing: false }),
}))
