import { create } from 'zustand'

type UIState = {
  soundEnabled: boolean
  toggleSound: () => void
  currentView: 'lobby' | 'waiting' | 'table'
  setView: (view: 'lobby' | 'waiting' | 'table') => void
}

export const useUIStore = create<UIState>((set) => ({
  soundEnabled: false,
  toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
  currentView: 'lobby',
  setView: (view) => set({ currentView: view }),
}))
