import { create } from 'zustand'

type UIState = {
  soundEnabled: boolean
  toggleSound: () => void
  currentView: 'lobby' | 'waiting'
  setView: (view: 'lobby' | 'waiting') => void
}

export const useUIStore = create<UIState>((set) => ({
  soundEnabled: false,
  toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
  currentView: 'lobby',
  setView: (view) => set({ currentView: view }),
}))
