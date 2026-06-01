import { create } from 'zustand'
import type { User } from 'firebase/auth'
import { signIn, onAuthChange } from '../firebase/auth'

type AuthState = {
  user: User | null
  loading: boolean
  displayName: string
  initialize: () => () => void
  setDisplayName: (name: string) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  displayName: '',
  initialize: () => {
    signIn()
    const unsubscribe = onAuthChange((user) => {
      set({ user, loading: false })
    })
    return unsubscribe
  },
  setDisplayName: (name) => set({ displayName: name }),
}))
