import { create } from 'zustand'

type UIState = {
  soundEnabled: boolean
  toggleSound: () => void
  volume: number
  setVolume: (v: number) => void
  currentView: 'lobby' | 'waiting'
  setView: (view: 'lobby' | 'waiting') => void
}

export const useUIStore = create<UIState>((set) => ({
  soundEnabled: false,
  toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
  volume: 0.5,
  setVolume: (volume) => set({ volume }),
  currentView: 'lobby',
  setView: (view) => set({ currentView: view }),
}))
