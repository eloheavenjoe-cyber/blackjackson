import { create } from 'zustand'
import type { ChatMessage } from '../engine/types'

type ChatStoreState = {
  messages: ChatMessage[]
  lastReadTimestamp: number
  isOpen: boolean
  setMessages: (messages: ChatMessage[]) => void
  addMessage: (message: ChatMessage) => void
  setLastReadTimestamp: (ts: number) => void
  setIsOpen: (open: boolean) => void
  reset: () => void
}

export const useChatStore = create<ChatStoreState>((set) => ({
  messages: [],
  lastReadTimestamp: 0,
  isOpen: false,
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((s) => ({ messages: [...s.messages, message] })),
  setLastReadTimestamp: (ts) => set({ lastReadTimestamp: ts }),
  setIsOpen: (open) => set({ isOpen: open }),
  reset: () => set({ messages: [], lastReadTimestamp: 0, isOpen: false }),
}))
