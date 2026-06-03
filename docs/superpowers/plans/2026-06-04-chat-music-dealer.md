# Chat, Music Player & Dealer Image — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add floating chat panel with emoji reactions and `/tip` command, host-controlled draggable music player (YouTube + playlist), and selectable dealer persona portraits.

**Architecture:** Chat messages via Firestore subcollection `games/{code}/chat/` with `/tip` intents via `games/{code}/tips/` (same pattern as bet intents). Music state stored as a top-level `music` field on `GameState`, synced via existing game doc `onSnapshot`. Dealer personas via static PNG files in `public/dealers/`, selected by host at game creation.

**Tech Stack:** React 19 + TypeScript, Framer Motion, Firestore, Zustand, YouTube IFrame API

---

### Task 1: Engine Types & Constants

**Files:**
- Modify: `src/engine/types.ts`
- Create: `src/constants/emojis.ts`
- Create: `src/constants/music.ts`

- [ ] **Step 1: Add types to engine/types.ts**

Add after the existing type exports:

```ts
export type ChatMessage = {
  playerId: string
  playerName: string
  text: string
  type: 'message' | 'tip' | 'emoji' | 'system'
  timestamp: number
}

export type TipIntent = {
  fromId: string
  toPlayerId: string
  amount: number
  timestamp: number
}

export type MusicSource = 'youtube' | 'playlist'

export type MusicState = {
  source: MusicSource
  url: string
  title: string
  playing: boolean
  currentTime: number
  lastCommandAt: number
}

export type DealerPersona = 'default' | 'lady_gold' | 'mr_velvet' | 'the_house'
```

Add to `GameState` interface (before the closing `}`):

```ts
  dealerPersona?: DealerPersona
  music?: MusicState
```

- [ ] **Step 2: Create constants/emojis.ts**

```ts
export const CHAT_EMOJIS = [
  '\u{1F602}', '\u{2764}\u{FE0F}', '\u{1F525}',
  '\u{1F44F}', '\u{1F389}', '\u{1F480}',
  '\u{1F0CF}', '\u{1F4B0}', '\u{1F440}',
  '\u{1F44D}', '\u{2615}', '\u{1F3B2}',
]
```

- [ ] **Step 3: Create constants/music.ts**

```ts
export type PlaylistTrack = {
  title: string
  url: string
}

export const PLAYLIST_TRACKS: PlaylistTrack[] = [
  { title: 'Casino Lounge (Pixabay)', url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_6d5c9b6a1e.mp3' },
  { title: 'Smooth Jazz (Pixabay)', url: 'https://cdn.pixabay.com/audio/2022/03/10/audio_5a3f2b8c9d.mp3' },
  { title: 'Night Vibes (Pixabay)', url: 'https://cdn.pixabay.com/audio/2022/05/17/audio_7e8d1c4f2a.mp3' },
  { title: 'Lo-Fi Chill (Pixabay)', url: 'https://cdn.pixabay.com/audio/2022/01/20/audio_2b4e6f8a1c.mp3' },
  { title: 'Jazz Club (Pixabay)', url: 'https://cdn.pixabay.com/audio/2022/10/25/audio_9a1b3c5d7e.mp3' },
  { title: 'Ambient Casino (Pixabay)', url: 'https://cdn.pixabay.com/audio/2022/08/14/audio_4f6d2e8a0b.mp3' },
]

export const DEALER_IMAGES: Record<string, string> = {
  default: '/dealers/default.png',
  lady_gold: '/dealers/lady_gold.png',
  mr_velvet: '/dealers/mr_velvet.png',
  the_house: '/dealers/the_house.png',
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/engine/types.ts src/constants/emojis.ts src/constants/music.ts
git commit -m "feat: add chat, music, dealer types and constants"
```

---

### Task 2: Draggable Hook

**Files:**
- Create: `src/hooks/useDraggable.ts`

- [ ] **Step 1: Create useDraggable hook**

```ts
import { useState, useCallback, useEffect, useRef } from 'react'

type Position = { x: number; y: number }

export function useDraggable(storageKey: string, defaultPos: Position) {
  const [position, setPosition] = useState<Position>(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) return JSON.parse(saved) as Position
    } catch {}
    return defaultPos
  })
  const [isDragging, setIsDragging] = useState(false)
  const offsetRef = useRef({ x: 0, y: 0 })
  const posRef = useRef(position)
  posRef.current = position

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(position))
    } catch {}
  }, [position, storageKey])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const el = e.currentTarget as HTMLElement
    el.setPointerCapture(e.pointerId)
    const rect = el.getBoundingClientRect()
    offsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
    setIsDragging(true)
    e.stopPropagation()
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return
    const vw = window.innerWidth
    const vh = window.innerHeight
    const panelW = 340
    const panelH = 420
    const x = Math.max(0, Math.min(e.clientX - offsetRef.current.x, vw - panelW))
    const y = Math.max(0, Math.min(e.clientY - offsetRef.current.y, vh - panelH))
    setPosition({ x, y })
  }, [isDragging])

  const onPointerUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const resetPosition = useCallback(() => {
    setPosition(defaultPos)
  }, [defaultPos])

  return {
    position,
    isDragging,
    dragHandlers: { onPointerDown, onPointerMove, onPointerUp },
    resetPosition,
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useDraggable.ts
git commit -m "feat: add useDraggable hook for floating panels"
```

---

### Task 3: Firestore Helpers (Chat + Tips)

**Files:**
- Create: `src/firebase/chat.ts`
- Create: `src/firebase/tips.ts`

- [ ] **Step 1: Create firebase/chat.ts**

```ts
import {
  collection, addDoc, orderBy, query,
  onSnapshot, serverTimestamp, limit,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from './config'
import type { ChatMessage } from '../engine/types'

const GAMES = 'games'

export function chatCollection(gameId: string) {
  return collection(db, GAMES, gameId.toUpperCase(), 'chat')
}

export async function addChatMessage(
  gameId: string,
  message: Omit<ChatMessage, 'timestamp'>,
): Promise<void> {
  await addDoc(chatCollection(gameId), {
    ...message,
    timestamp: serverTimestamp(),
  })
}

export function subscribeToChat(
  gameId: string,
  callback: (messages: ChatMessage[]) => void,
): Unsubscribe {
  const q = query(
    chatCollection(gameId),
    orderBy('timestamp', 'asc'),
    limit(200),
  )
  return onSnapshot(q, (snapshot) => {
    const messages: ChatMessage[] = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      messages.push({
        playerId: data.playerId,
        playerName: data.playerName,
        text: data.text,
        type: data.type,
        timestamp: data.timestamp?.toMillis?.() ?? Date.now(),
      })
    })
    callback(messages)
  })
}
```

- [ ] **Step 2: Create firebase/tips.ts**

```ts
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './config'

const GAMES = 'games'

export function tipIntentsCollection(gameId: string) {
  return collection(db, GAMES, gameId.toUpperCase(), 'tips')
}

export async function submitTipIntent(
  gameId: string,
  fromId: string,
  toPlayerId: string,
  amount: number,
): Promise<void> {
  await addDoc(tipIntentsCollection(gameId), {
    fromId,
    toPlayerId,
    amount,
    timestamp: serverTimestamp(),
  })
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/firebase/chat.ts src/firebase/tips.ts
git commit -m "feat: add Firestore helpers for chat and tips"
```

---

### Task 4: Chat Store (Zustand)

**Files:**
- Create: `src/stores/chatStore.ts`

- [ ] **Step 1: Create chat store**

```ts
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/stores/chatStore.ts
git commit -m "feat: add chat Zustand store"
```

---

### Task 5: Chat UI Sub-Components

**Files:**
- Create: `src/components/Chat/ChatMessage.tsx`
- Create: `src/components/Chat/EmojiBar.tsx`
- Create: `src/components/Chat/ChatToggle.tsx`

- [ ] **Step 1: Create ChatMessage.tsx**

```ts
import type { ChatMessage as ChatMessageType } from '../../engine/types'

type Props = {
  message: ChatMessageType
}

function formatTime(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  return `${Math.floor(diff / 3600000)}h ago`
}

export function ChatMessage({ message }: Props) {
  if (message.type === 'system') {
    return (
      <div className="text-center py-1 px-4">
        <span className="text-red-400 text-xs font-semibold">{message.text}</span>
      </div>
    )
  }

  if (message.type === 'tip') {
    return (
      <div className="flex items-start gap-2 px-4 py-1">
        <span className="text-gold/70 text-xs font-medium shrink-0">{message.playerName}</span>
        <span className="text-white/60 text-xs">tipped {message.text} chips</span>
        <span className="text-white/30 text-[10px] ml-auto">{formatTime(message.timestamp)}</span>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-2 px-4 py-1">
      <div
        className="w-2 h-2 rounded-full mt-1 shrink-0"
        style={{ backgroundColor: stringToColor(message.playerId) }}
      />
      <span className="text-gold/70 text-xs font-medium shrink-0">{message.playerName}</span>
      <span className="text-white/80 text-xs break-words">{message.text}</span>
      <span className="text-white/30 text-[10px] ml-auto shrink-0">{formatTime(message.timestamp)}</span>
    </div>
  )
}

function stringToColor(str: string): string {
  const colors = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#ec4899', '#14b8a6', '#f97316']
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}
```

- [ ] **Step 2: Create EmojiBar.tsx**

```ts
import { CHAT_EMOJIS } from '../../constants/emojis'

type Props = {
  onEmoji: (emoji: string) => void
}

export function EmojiBar({ onEmoji }: Props) {
  return (
    <div className="flex items-center gap-1 px-3 py-2 border-t border-white/10 overflow-x-auto">
      {CHAT_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onEmoji(emoji)}
          className="text-lg hover:scale-125 active:scale-90 transition-transform duration-100 flex-shrink-0 p-1 rounded hover:bg-white/5"
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Create ChatToggle.tsx**

```ts
import { motion } from 'framer-motion'

type Props = {
  unreadCount: number
  onClick: () => void
}

export function ChatToggle({ unreadCount, onClick }: Props) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed z-50 bg-gold/90 hover:bg-gold text-gray-900 font-bold rounded-full w-11 h-11 flex items-center justify-center shadow-2xl border-2 border-gold/30"
      style={{ bottom: 24, right: 24 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
    >
      <span className="text-lg">{'\u{1F4AC}'}</span>
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </motion.button>
  )
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/components/Chat/ChatMessage.tsx src/components/Chat/EmojiBar.tsx src/components/Chat/ChatToggle.tsx
git commit -m "feat: add chat UI sub-components"
```

---

### Task 6: ChatPanel + EmojiFloat

**Files:**
- Create: `src/components/Chat/ChatPanel.tsx`
- Create: `src/components/Chat/EmojiFloat.tsx`

- [ ] **Step 1: Create EmojiFloat.tsx**

```ts
import { motion } from 'framer-motion'

type Props = {
  emoji: string
  x: number
  y: number
  onComplete: () => void
}

export function EmojiFloat({ emoji, x, y, onComplete }: Props) {
  return (
    <motion.div
      initial={{ opacity: 1, scale: 0.8, x, y }}
      animate={{ opacity: 0, scale: 1.5, y: y - 120 }}
      transition={{ duration: 1.8, ease: 'easeOut' }}
      onAnimationComplete={onComplete}
      className="absolute pointer-events-none text-2xl z-30"
      style={{ left: 0, top: 0 }}
    >
      {emoji}
    </motion.div>
  )
}
```

- [ ] **Step 2: Create ChatPanel.tsx**

```ts
import { useState, useRef, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useDraggable } from '../../hooks/useDraggable'
import { useChatStore } from '../../stores/chatStore'
import { ChatMessage } from './ChatMessage'
import { EmojiBar } from './EmojiBar'
import type { PlayerState } from '../../engine/types'

type Props = {
  roomCode: string
  players: PlayerState[]
  onSendMessage: (text: string) => void
  onSendEmoji: (emoji: string) => void
  onSendTip: (recipientId: string, amount: number) => string | null
}

export function ChatPanel({ roomCode, players, onSendMessage, onSendEmoji, onSendTip }: Props) {
  const { messages, isOpen, setIsOpen, setLastReadTimestamp } = useChatStore()
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const feedRef = useRef<HTMLDivElement>(null)

  const { position, isDragging, dragHandlers } = useDraggable(
    `chatPanelPos_${roomCode}`,
    { x: window.innerWidth - 360, y: 120 },
  )

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    if (isOpen) {
      const latest = messages[messages.length - 1]
      if (latest) setLastReadTimestamp(latest.timestamp)
    }
  }, [isOpen, messages, setLastReadTimestamp])

  const visibleMessages = useMemo(
    () => messages.filter((m) => m.type !== 'emoji'),
    [messages],
  )

  function handleSend() {
    const text = input.trim()
    if (!text) return
    setInput('')
    setError(null)

    if (text.startsWith('/tip ')) {
      const parts = text.slice(5).trim().split(/\s+/)
      if (parts.length < 2) {
        setError('Usage: /tip <name> <amount>')
        return
      }
      const searchName = parts.slice(0, -1).join(' ').toLowerCase()
      const amountStr = parts[parts.length - 1]
      const amount = parseInt(amountStr, 10)
      if (isNaN(amount) || amount <= 0) {
        setError('Invalid amount')
        return
      }
      const matches = players.filter((p) =>
        p.name.toLowerCase().startsWith(searchName),
      )
      if (matches.length === 0) {
        setError(`No player found matching '${searchName}'`)
        return
      }
      if (matches.length > 1) {
        const names = matches.map((p) => p.name).join(', ')
        setError(`Multiple players match '${searchName}': ${names}`)
        return
      }
      const err = onSendTip(matches[0].id, amount)
      if (err) {
        setError(err)
        return
      }
      return
    }

    onSendMessage(text)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return createPortal(
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{
        opacity: 1,
        scale: 1,
        x: position.x,
        y: position.y,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`fixed z-50 bg-black/85 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl ${
        isDragging ? 'cursor-grabbing' : ''
      }`}
      style={{ width: 340, height: 420 }}
    >
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col h-full"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 cursor-grab active:cursor-grabbing select-none"
              {...dragHandlers}
            >
              <span className="text-gold text-sm font-semibold">Chat</span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/40 hover:text-white/80 text-lg leading-none px-1"
              >
                {'\u2014'}
              </button>
            </div>

            {/* Messages */}
            <div
              ref={feedRef}
              className="flex-1 overflow-y-auto py-2 space-y-0.5"
              style={{ scrollBehavior: 'smooth' }}
            >
              {visibleMessages.length === 0 && (
                <div className="text-center text-white/20 text-xs py-8">
                  No messages yet
                </div>
              )}
              {visibleMessages.map((msg, i) => (
                <ChatMessage key={i} message={msg} />
              ))}
            </div>

            {/* Error */}
            {error && (
              <div className="px-4 py-1 text-red-400 text-xs">{error}</div>
            )}

            {/* Input */}
            <div className="flex items-center gap-2 px-3 py-2 border-t border-white/10">
              <input
                type="text"
                value={input}
                onChange={(e) => { setInput(e.target.value); setError(null) }}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                maxLength={280}
                className="flex-1 bg-white/5 text-white text-sm rounded-lg px-3 py-1.5 border border-white/10 focus:border-gold/50 focus:outline-none placeholder:text-white/20"
                autoFocus
              />
              <button
                onClick={handleSend}
                className="text-gold text-sm font-semibold hover:text-gold/80 shrink-0 px-2"
              >
                Send
              </button>
            </div>

            {/* Emoji bar */}
            <EmojiBar onEmoji={onSendEmoji} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>,
    document.body,
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/components/Chat/ChatPanel.tsx src/components/Chat/EmojiFloat.tsx
git commit -m "feat: add ChatPanel with drag, collapse, emoji bar"
```

---

### Task 7: useChat Hook

**Files:**
- Create: `src/hooks/useChat.ts`

- [ ] **Step 1: Create useChat hook**

```ts
import { useEffect, useCallback } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useChatStore } from '../stores/chatStore'
import { subscribeToChat, addChatMessage } from '../firebase/chat'
import { submitTipIntent } from '../firebase/tips'
import type { PlayerState } from '../engine/types'

export function useChat(roomCode: string | null) {
  const { user, displayName } = useAuthStore()
  const { setMessages, reset } = useChatStore()

  useEffect(() => {
    if (!roomCode) return
    const unsub = subscribeToChat(roomCode, (messages) => {
      setMessages(messages)
    })
    return () => {
      unsub()
      reset()
    }
  }, [roomCode, setMessages, reset])

  const sendMessage = useCallback(
    (text: string) => {
      if (!roomCode || !user) return
      addChatMessage(roomCode, {
        playerId: user.uid,
        playerName: displayName || 'Player',
        text,
        type: 'message',
      })
    },
    [roomCode, user, displayName],
  )

  const sendEmoji = useCallback(
    (emoji: string) => {
      if (!roomCode || !user) return
      addChatMessage(roomCode, {
        playerId: user.uid,
        playerName: displayName || 'Player',
        text: emoji,
        type: 'emoji',
      })
    },
    [roomCode, user, displayName],
  )

  const sendTip = useCallback(
    (recipientId: string, amount: number, players: PlayerState[]): string | null => {
      if (!roomCode || !user) return 'Not connected'
      const sender = players.find((p) => p.id === user.uid)
      if (!sender) return 'Sender not found'
      if (amount > sender.chips) return 'Insufficient chips'
      if (amount <= 0) return 'Invalid amount'
      if (recipientId === user.uid) return 'Cannot tip yourself'

      submitTipIntent(roomCode, user.uid, recipientId, amount)
      addChatMessage(roomCode, {
        playerId: user.uid,
        playerName: displayName || 'Player',
        text: String(amount),
        type: 'tip',
      })
      return null
    },
    [roomCode, user, displayName],
  )

  return { sendMessage, sendEmoji, sendTip }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useChat.ts
git commit -m "feat: add useChat hook with message/emoji/tip sending"
```

---

### Task 8: Chat Integration (TablePage + useGameSync Tip Listener)

**Files:**
- Modify: `src/hooks/useGameSync.ts`
- Modify: `src/components/Table/TablePage.tsx`

- [ ] **Step 1: Update ChatToggle to subscribe to store reactively**

Modify `src/components/Chat/ChatToggle.tsx` — replace the entire file:

```ts
import { motion } from 'framer-motion'
import { useChatStore } from '../../stores/chatStore'

type Props = {
  onClick: () => void
}

export function ChatToggle({ onClick }: Props) {
  const messages = useChatStore((s) => s.messages)
  const lastReadTimestamp = useChatStore((s) => s.lastReadTimestamp)
  const unreadCount = messages.filter(
    (m) => m.timestamp > lastReadTimestamp && m.type !== 'emoji'
  ).length

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed z-50 bg-gold/90 hover:bg-gold text-gray-900 font-bold rounded-full w-11 h-11 flex items-center justify-center shadow-2xl border-2 border-gold/30"
      style={{ bottom: 24, right: 24 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
    >
      <span className="text-lg">{'\u{1F4AC}'}</span>
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </motion.button>
  )
}
```

- [ ] **Step 2: Add tip intent listener to useGameSync.ts**

The existing imports already include `collection`, `onSnapshot`, `deleteDoc` from firebase/firestore, and `db` from config. Add this import:

```ts
import { addChatMessage } from '../firebase/chat'
```

After the bet intent `useEffect`, add the tip intent listener:

```ts
  useEffect(() => {
    if (!roomCode || !isHost) return
    const tipsCol = collection(db, 'games', roomCode.toUpperCase(), 'tips')
    const unsub = onSnapshot(tipsCol, async (snapshot) => {
      const current = await getGameDoc(roomCode)
      if (!current) return
      for (const change of snapshot.docChanges()) {
        if (change.type === 'added') {
          const data = change.doc.data()
          const { fromId, toPlayerId, amount } = data
          const sender = current.players.find((p: any) => p.id === fromId)
          const recipient = current.players.find((p: any) => p.id === toPlayerId)
          if (!sender || !recipient) {
            deleteDoc(change.doc.ref).catch(() => {})
            continue
          }
          if (sender.chips < amount) {
            addChatMessage(roomCode, {
              playerId: 'SYSTEM',
              playerName: 'SYSTEM',
              text: 'SYSTEM: Tip failed \u2014 insufficient chips.',
              type: 'system',
            })
            deleteDoc(change.doc.ref).catch(() => {})
            continue
          }
          const updatedPlayers = current.players.map((p: any) => {
            if (p.id === fromId) return { ...p, chips: p.chips - amount }
            if (p.id === toPlayerId) return { ...p, chips: p.chips + amount }
            return p
          })
          await updateGameDoc(roomCode, { players: updatedPlayers })
          addChatMessage(roomCode, {
            playerId: 'SYSTEM',
            playerName: 'SYSTEM',
            text: `SYSTEM: ${sender.name} tipped ${amount} chips to ${recipient.name}`,
            type: 'system',
          })
          deleteDoc(change.doc.ref).catch(() => {})
        }
      }
    })
    return () => unsub()
  }, [roomCode, isHost])
```

- [ ] **Step 3: Integrate chat into TablePage.tsx**

Add these imports (alongside existing ones):

```ts
import { useChat } from '../../hooks/useChat'
import { ChatPanel } from '../Chat/ChatPanel'
import { EmojiFloat } from '../Chat/EmojiFloat'
import { ChatToggle } from '../Chat/ChatToggle'
import { useChatStore } from '../../stores/chatStore'
```

After `const { play } = useSound()`:

```ts
  const { sendMessage, sendEmoji, sendTip } = useChat(game?.id ?? null)
```

After `const prevTurnRef = useRef(game?.currentTurn)`:

```ts
  const prevMessageCountRef = useRef(0)
  const processedEmojiIdsRef = useRef<Set<string>>(new Set())
```

After `const [showRoundIntro, setShowRoundIntro] = useState(false)`:

```ts
  const [emojiFloats, setEmojiFloats] = useState<{ id: string; emoji: string; x: number; y: number }[]>([])
```

Add emoji float detection effect (after the `useEffect` for `game?.currentTurn`):

```ts
  useEffect(() => {
    if (!game) return
    const unsub = useChatStore.subscribe((state) => {
      const newMessages = state.messages.slice(prevMessageCountRef.current)
      prevMessageCountRef.current = state.messages.length
      for (const msg of newMessages) {
        if (msg.type !== 'emoji') continue
        const id = `${msg.playerId}-${msg.timestamp}`
        if (processedEmojiIdsRef.current.has(id)) continue
        processedEmojiIdsRef.current.add(id)
        const playerIdx = game.players.findIndex((p) => p.id === msg.playerId)
        if (playerIdx === -1) continue
        const pos = positions[playerIdx]
        if (!pos) continue
        setEmojiFloats((prev) => [...prev, { id, emoji: msg.text, x: pos.x, y: pos.y }])
      }
    })
    return () => unsub()
  }, [game, positions])
```

Add near the end of the JSX, before the closing `</div>` of the outer container (right after the host buttons div):

```tsx
      {!game.gameOver && (
        <ChatPanel
          roomCode={game.id}
          players={game.players}
          onSendMessage={sendMessage}
          onSendEmoji={sendEmoji}
          onSendTip={(recipientId, amount) => {
            if (!game) return 'Not connected'
            return sendTip(recipientId, amount, game.players)
          }}
        />
      )}

      <ChatToggle onClick={() => useChatStore.getState().setIsOpen(true)} />

      {emojiFloats.map((ef) => (
        <EmojiFloat
          key={ef.id}
          emoji={ef.emoji}
          x={ef.x}
          y={ef.y}
          onComplete={() => setEmojiFloats((prev) => prev.filter((e) => e.id !== ef.id))}
        />
      ))}
```

- [ ] **Step 4: Verify TypeScript compiles + build**

```bash
npx tsc --noEmit && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useGameSync.ts src/components/Table/TablePage.tsx src/components/Chat/ChatToggle.tsx
git commit -m "feat: integrate chat panel, tip listener, emoji floats into table"
```

---

### Task 9: Dealer Portrait + Integration

**Files:**
- Create: `src/components/Dealer/DealerPortrait.tsx`
- Modify: `src/components/Table/DealerArea.tsx`
- Modify: `src/engine/game.ts`
- Modify: `src/components/Lobby/CreateGameForm.tsx`
- Create: `public/dealers/default.png` (placeholder)
- Create: `public/dealers/lady_gold.png` (placeholder)
- Create: `public/dealers/mr_velvet.png` (placeholder)
- Create: `public/dealers/the_house.png` (placeholder)

- [ ] **Step 1: Create placeholder dealer images**

Generate simple placeholder SVGs as PNGs, or create them as inline SVGs. Create empty placeholder files:

```bash
mkdir -p public/dealers
```

Placeholder approach — use inline SVG as fallback in code. For now, create a single placeholder file `public/dealers/default.png` by copying the card back SVG or any small image.

Actually, since we need 4 distinct placeholders, let's use data URIs of simple colored silhouettes. Create `public/dealers/default.png` by copying a small test image, and handle `onError` fallback in code.

For a pragmatic approach: create a `public/dealers/` directory and add 4 named SVG files that serve as placeholders:

**public/dealers/default.svg:**
```svg
<svg xmlns='http://www.w3.org/2000/svg' width='200' height='240' viewBox='0 0 200 240'>
  <rect width='200' height='240' fill='#2a1a3a' rx='12'/>
  <circle cx='100' cy='100' r='60' fill='#4a3060'/>
  <text x='100' y='195' text-anchor='middle' fill='#d4a843' font-size='16' font-family='serif'>Default</text>
  <text x='100' y='215' text-anchor='middle' fill='#d4a843' font-size='12' font-family='serif'>Dealer</text>
</svg>
```

**public/dealers/lady_gold.svg:**
```svg
<svg xmlns='http://www.w3.org/2000/svg' width='200' height='240' viewBox='0 0 200 240'>
  <rect width='200' height='240' fill='#3a1a2a' rx='12'/>
  <circle cx='100' cy='100' r='60' fill='#603040'/>
  <text x='100' y='195' text-anchor='middle' fill='#d4a843' font-size='16' font-family='serif'>Lady Gold</text>
  <text x='100' y='215' text-anchor='middle' fill='#d4a843' font-size='12' font-family='serif'>Dealer</text>
</svg>
```

**public/dealers/mr_velvet.svg:**
```svg
<svg xmlns='http://www.w3.org/2000/svg' width='200' height='240' viewBox='0 0 200 240'>
  <rect width='200' height='240' fill='#1a2a3a' rx='12'/>
  <circle cx='100' cy='100' r='60' fill='#304060'/>
  <text x='100' y='195' text-anchor='middle' fill='#d4a843' font-size='16' font-family='serif'>Mr Velvet</text>
  <text x='100' y='215' text-anchor='middle' fill='#d4a843' font-size='12' font-family='serif'>Dealer</text>
</svg>
```

**public/dealers/the_house.svg:**
```svg
<svg xmlns='http://www.w3.org/2000/svg' width='200' height='240' viewBox='0 0 200 240'>
  <rect width='200' height='240' fill='#1a3a2a' rx='12'/>
  <circle cx='100' cy='100' r='60' fill='#406030'/>
  <text x='100' y='195' text-anchor='middle' fill='#d4a843' font-size='16' font-family='serif'>The House</text>
  <text x='100' y='215' text-anchor='middle' fill='#d4a843' font-size='12' font-family='serif'>Dealer</text>
</svg>
```

Then update `DEALER_IMAGES` in `constants/music.ts` to use `.svg` extensions.

- [ ] **Step 2: Create DealerPortrait.tsx**

```ts
import { useState } from 'react'
import { DEALER_IMAGES } from '../../constants/music'
import type { DealerPersona } from '../../engine/types'

type Props = {
  persona?: DealerPersona
}

export function DealerPortrait({ persona = 'default' }: Props) {
  const [error, setError] = useState(false)
  const src = DEALER_IMAGES[persona] ?? DEALER_IMAGES.default

  if (error) {
    return (
      <div
        className="flex items-center justify-center rounded-xl"
        style={{ width: 100, height: 120, background: 'linear-gradient(135deg, #2a1a3a, #1a2a3a)', border: '2px solid rgba(212,168,67,0.2)' }}
      >
        <div className="text-center text-gold/30">
          <div className="text-2xl">{'\u2660'} {'\u2665'}</div>
          <div className="text-2xl">{'\u2666'} {'\u2663'}</div>
        </div>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={`${persona} dealer`}
      onError={() => setError(true)}
      className="rounded-xl object-cover shadow-lg"
      style={{ width: 100, height: 120, border: '2px solid rgba(212,168,67,0.15)' }}
    />
  )
}
```

- [ ] **Step 3: Modify DealerArea.tsx**

Remove the dealer name + avatar section and add DealerPortrait. Replace lines 53-56 (the div with PlayerAvatar + name span):

Old code to remove:
```tsx
      <div className="flex items-center gap-2 mb-2">
        <PlayerAvatar name="Dealer" seat={6} size="sm" />
        <span className="text-gold/70 text-xs font-semibold uppercase tracking-widest">Dealer</span>
      </div>
```

Add import:
```ts
import { DealerPortrait } from '../Dealer/DealerPortrait'
import type { DealerPersona } from '../../engine/types'
```

Add `persona` prop:
```ts
type Props = {
  dealerHand: Card[]
  showHoleCard: boolean
  phase: string
  dealIndex?: number | null
  originX?: number
  originY?: number
  persona?: DealerPersona
}
```

Replace the removed block with:
```tsx
      <div className="flex flex-col items-center gap-1 mb-1">
        <DealerPortrait persona={persona} />
      </div>
```

Shift cards down by adding `mt-1` to the card container (line ~69):
```tsx
      <div
        className="flex -space-x-4 mt-1"
        style={{ perspective: 600 }}
      >
```

Remove the unused import: delete `import { PlayerAvatar } from '../Shared/PlayerAvatar'`.

- [ ] **Step 4: Add dealerPersona to createGame() in engine/game.ts**

```ts
export function createGame(id: string, hostId: string, rules: GameRules, dealerPersona?: DealerPersona): GameState {
  return {
    id,
    phase: 'waiting',
    hostId,
    rules,
    dealerPersona: dealerPersona ?? 'default',
    shoe: createShoe(rules.decks),
    discard: [],
    dealerHand: [],
    dealerHoleCard: null,
    players: [],
    currentTurn: -1,
    turnTimeLimit: rules.turnTimeLimit,
    turnStartedAt: null,
    roundNumber: 0,
    createdAt: Date.now(),
  }
}
```

Add import at top:
```ts
import type { GameState, GameRules, PlayerState, DealerPersona } from './types'
```

- [ ] **Step 5: Add persona selection to CreateGameForm.tsx**

Add state:
```ts
  const [dealerPersona, setDealerPersona] = useState<string>('default')
```

Update `createGame` call:
```ts
    let game = createGame(code, user.uid, rules, dealerPersona as any)
```

Add persona dropdown in JSX (after the name input, before RulesConfig):
```tsx
      <div>
        <label className="block text-sm text-gray-400 mb-1">Dealer Persona</label>
        <select
          value={dealerPersona}
          onChange={(e) => setDealerPersona(e.target.value)}
          className="block w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-white text-sm focus:border-gold focus:outline-none"
        >
          <option value="default">Default</option>
          <option value="lady_gold">Lady Gold</option>
          <option value="mr_velvet">Mr Velvet</option>
          <option value="the_house">The House</option>
        </select>
      </div>
```

- [ ] **Step 6: Pass persona to DealerArea in TablePage.tsx**

Find `<DealerArea` and add the `persona` prop:
```tsx
        <DealerArea
          dealerHand={game.dealerHand}
          showHoleCard={game.phase === 'dealer' || game.phase === 'settlement' || game.phase === 'round_end'}
          phase={game.phase}
          dealIndex={game.phase === 'dealing' ? game.players.length : null}
          originX={shoeOriginPos.x - dims.width / 2}
          originY={shoeOriginPos.y - 50}
          persona={game.dealerPersona}
        />
```

Update the engine test that creates a game to use the updated signature. In `src/engine/__tests__/game.test.ts`, the `createGame` calls need the optional 4th parameter — but since it's optional, tests should pass without changes. Verify.

- [ ] **Step 7: Verify build + tests**

```bash
npx tsc --noEmit && npx vitest run && npm run build
```

- [ ] **Step 8: Commit**

```bash
git add src/components/Dealer/DealerPortrait.tsx public/dealers/ src/components/Table/DealerArea.tsx src/engine/game.ts src/components/Lobby/CreateGameForm.tsx src/components/Table/TablePage.tsx
git commit -m "feat: add dealer persona portraits and selection"
```

---

### Task 10: Music Player Components

**Files:**
- Create: `src/components/Music/MusicControls.tsx`
- Create: `src/components/Music/YoutubePlayer.tsx`
- Create: `src/components/Music/PlaylistPicker.tsx`
- Create: `src/components/Music/MusicPanel.tsx`

- [ ] **Step 1: Create MusicControls.tsx**

```ts
type Props = {
  playing: boolean
  currentTime: number
  duration: number
  source: 'youtube' | 'playlist'
  volume: number
  onPlayPause: () => void
  onSeek: (time: number) => void
  onVolumeChange: (vol: number) => void
}

export function MusicControls({ playing, currentTime, duration, source, volume, onPlayPause, onSeek, onVolumeChange }: Props) {
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={onPlayPause}
          className="text-gold hover:text-gold/80 text-2xl leading-none w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors"
        >
          {playing ? '\u23F8' : '\u25B6'}
        </button>
      </div>
      {source === 'youtube' && duration > 0 && (
        <div className="space-y-1">
          <input
            type="range"
            min={0}
            max={duration}
            value={currentTime}
            onChange={(e) => onSeek(Number(e.target.value))}
            className="w-full h-1 accent-gold bg-white/10 rounded-full appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-white/30">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      )}
      {source === 'playlist' && playing && (
        <div className="flex justify-center">
          <span className="text-[10px] text-white/20">Now Playing</span>
        </div>
      )}
      <div className="flex items-center gap-2">
        <span className="text-white/30 text-xs">{'\u{1F50A}'}</span>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(volume * 100)}
          onChange={(e) => onVolumeChange(Number(e.target.value) / 100)}
          className="flex-1 h-1 accent-gold bg-white/10 rounded-full appearance-none cursor-pointer"
        />
        <span className="text-white/30 text-xs w-8 text-right">{Math.round(volume * 100)}%</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create YoutubePlayer.tsx**

```ts
import { useEffect, useRef, useCallback } from 'react'

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void
    YT: any
  }
}

type Props = {
  videoId: string
  playing: boolean
  currentTime: number
  volume: number
  onReady: (duration: number) => void
  onTimeUpdate: (time: number) => void
  onEnded: () => void
}

export function YoutubePlayer({ videoId, playing, currentTime, volume, onReady, onTimeUpdate, onEnded }: Props) {
  const playerRef = useRef<any>(null)
  const apiLoadedRef = useRef(false)
  const timeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const initPlayer = useCallback(() => {
    if (!window.YT?.Player) return
    playerRef.current = new window.YT.Player(`yt-player-${videoId}`, {
      videoId,
      playerVars: { autoplay: 0, controls: 0, modestbranding: 1, rel: 0 },
      events: {
        onReady: (e: any) => {
          onReady(e.target.getDuration())
          e.target.setVolume(Math.round(volume * 100))
        },
        onStateChange: (e: any) => {
          if (e.data === 0) onEnded()
        },
      },
    })
  }, [videoId, volume, onReady, onEnded])

  useEffect(() => {
    if (!apiLoadedRef.current) {
      if (window.YT?.Player) {
        apiLoadedRef.current = true
        initPlayer()
      } else {
        const tag = document.createElement('script')
        tag.src = 'https://www.youtube.com/iframe_api'
        const firstScriptTag = document.getElementsByTagName('script')[0]
        firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag)
        window.onYouTubeIframeAPIReady = () => {
          apiLoadedRef.current = true
          initPlayer()
        }
      }
    }
    return () => {
      if (timeIntervalRef.current) clearInterval(timeIntervalRef.current)
      playerRef.current?.destroy()
    }
  }, [videoId])

  useEffect(() => {
    if (!playerRef.current?.playVideo) return
    if (playing) {
      playerRef.current.playVideo()
      timeIntervalRef.current = setInterval(() => {
        if (playerRef.current?.getCurrentTime) {
          onTimeUpdate(playerRef.current.getCurrentTime())
        }
      }, 1000)
    } else {
      playerRef.current.pauseVideo()
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current)
        timeIntervalRef.current = null
      }
    }
    return () => {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current)
        timeIntervalRef.current = null
      }
    }
  }, [playing])

  useEffect(() => {
    if (playerRef.current?.seekTo && currentTime > 0) {
      playerRef.current.seekTo(currentTime)
    }
  }, [currentTime])

  useEffect(() => {
    if (playerRef.current?.setVolume) {
      playerRef.current.setVolume(Math.round(volume * 100))
    }
  }, [volume])

  return (
    <div
      id={`yt-player-${videoId}`}
      style={{ width: 1, height: 1, opacity: 0, pointerEvents: 'none', position: 'absolute' }}
    />
  )
}
```

- [ ] **Step 3: Create PlaylistPicker.tsx**

```ts
import { PLAYLIST_TRACKS } from '../../constants/music'

type Props = {
  currentUrl: string
  onSelect: (url: string, title: string) => void
}

export function PlaylistPicker({ currentUrl, onSelect }: Props) {
  return (
    <div className="space-y-1 max-h-32 overflow-y-auto">
      {PLAYLIST_TRACKS.map((track) => (
        <button
          key={track.url}
          onClick={() => onSelect(track.url, track.title)}
          className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors ${
            currentUrl === track.url
              ? 'bg-gold/20 text-gold'
              : 'text-white/60 hover:bg-white/5 hover:text-white/80'
          }`}
        >
          {track.title}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Create MusicPanel.tsx**

```ts
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useDraggable } from '../../hooks/useDraggable'
import { MusicControls } from './MusicControls'
import { YoutubePlayer } from './YoutubePlayer'
import { PlaylistPicker } from './PlaylistPicker'
import type { MusicState } from '../../engine/types'

type Props = {
  roomCode: string
  isHost: boolean
  music: MusicState | null | undefined
  volume: number
  onCommand: (cmd: Partial<MusicState>) => void
  onVolumeChange: (vol: number) => void
  onTimeUpdate: (time: number) => void
}

export function MusicPanel({ roomCode, isHost, music, volume, onCommand, onVolumeChange, onTimeUpdate }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [activeTab, setActiveTab] = useState<'youtube' | 'playlist'>('youtube')

  const { position, isDragging, dragHandlers } = useDraggable(
    `musicPanelPos_${roomCode}`,
    { x: window.innerWidth - 360, y: 560 },
  )

  function handlePlayPause() {
    if (!music) return
    onCommand({ playing: !music.playing, currentTime: music.currentTime, lastCommandAt: Date.now() })
  }

  function handleSeek(time: number) {
    if (!music) return
    onCommand({ currentTime: time, lastCommandAt: Date.now() })
  }

  function handleSourceSelect(url: string, title: string) {
    onCommand({
      source: 'youtube',
      url,
      title,
      playing: false,
      currentTime: 0,
      lastCommandAt: Date.now(),
    })
  }

  function handlePlaylistSelect(url: string, title: string) {
    onCommand({
      source: 'playlist',
      url,
      title,
      playing: true,
      currentTime: 0,
      lastCommandAt: Date.now(),
    })
  }

  function handleYoutubeSubmit() {
    const trimmed = youtubeUrl.trim()
    if (!trimmed) return
    let videoId = ''
    try {
      const u = new URL(trimmed)
      if (u.hostname.includes('youtube.com')) {
        videoId = u.searchParams.get('v') || ''
      } else if (u.hostname.includes('youtu.be')) {
        videoId = u.pathname.slice(1)
      }
    } catch {
      videoId = trimmed
    }
    if (!videoId) return
    handleSourceSelect(videoId, 'YouTube')
    setYoutubeUrl('')
  }

  const videoId = (music?.source === 'youtube' && music.url) ? music.url : ''

  return createPortal(
    <motion.div
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`fixed z-50 bg-black/85 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl ${
        isDragging ? 'cursor-grabbing' : ''
      }`}
      style={{ width: 340, minHeight: isOpen ? 220 : 0 }}
    >
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 cursor-grab active:cursor-grabbing select-none"
              {...dragHandlers}
            >
              <span className="text-gold text-sm font-semibold">{'\u266A'} Music Player</span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/40 hover:text-white/80 text-lg leading-none px-1"
              >
                {'\u2014'}
              </button>
            </div>

            {isHost && (
              <div className="flex border-b border-white/10">
                <button
                  onClick={() => setActiveTab('youtube')}
                  className={`flex-1 text-xs py-2 transition-colors ${activeTab === 'youtube' ? 'text-gold border-b-2 border-gold' : 'text-white/40 hover:text-white/60'}`}
                >
                  YouTube
                </button>
                <button
                  onClick={() => setActiveTab('playlist')}
                  className={`flex-1 text-xs py-2 transition-colors ${activeTab === 'playlist' ? 'text-gold border-b-2 border-gold' : 'text-white/40 hover:text-white/60'}`}
                >
                  Playlist
                </button>
              </div>
            )}

            <div className="p-4 space-y-3">
              {music ? (
                <div className="text-center">
                  <p className="text-white/80 text-xs truncate">{music.title}</p>
                  <p className="text-white/25 text-[10px] capitalize mt-0.5">{music.source}</p>
                </div>
              ) : (
                <p className="text-white/30 text-xs text-center">No music playing</p>
              )}

              <MusicControls
                playing={music?.playing ?? false}
                currentTime={music?.currentTime ?? 0}
                duration={0}
                source={music?.source ?? 'youtube'}
                volume={volume}
                onPlayPause={handlePlayPause}
                onSeek={handleSeek}
                onVolumeChange={onVolumeChange}
              />

              {isHost && activeTab === 'youtube' && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleYoutubeSubmit()}
                    placeholder="YouTube URL or video ID..."
                    className="flex-1 bg-white/5 text-white text-xs rounded-lg px-3 py-1.5 border border-white/10 focus:border-gold/50 focus:outline-none placeholder:text-white/20"
                  />
                  <button
                    onClick={handleYoutubeSubmit}
                    className="text-gold text-xs font-semibold hover:text-gold/80 shrink-0 px-2"
                  >
                    Load
                  </button>
                </div>
              )}

              {isHost && activeTab === 'playlist' && (
                <PlaylistPicker
                  currentUrl={music?.url ?? ''}
                  onSelect={handlePlaylistSelect}
                />
              )}
            </div>

            {videoId && (
              <YoutubePlayer
                key={videoId}
                videoId={videoId}
                playing={music?.playing ?? false}
                currentTime={music?.currentTime ?? 0}
                volume={volume}
                onReady={() => {}}
                onTimeUpdate={onTimeUpdate}
                onEnded={() => {}}
              />
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>,
    document.body,
  )
}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add src/components/Music/
git commit -m "feat: add music player UI components"
```

---

### Task 11: useMusic Hook

**Files:**
- Create: `src/hooks/useMusic.ts`

- [ ] **Step 1: Create useMusic hook**

```ts
import { useEffect, useRef, useCallback } from 'react'
import { useGameStore } from '../stores/gameStore'
import { updateGameDoc } from '../firebase/games'
import type { MusicState } from '../engine/types'

export function useMusic(roomCode: string | null, isHost: boolean) {
  const music = useGameStore((s) => s.game?.music)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const volumeRef = useRef(0.5)
  const driftIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const localTimeRef = useRef(0)

  const updateMusic = useCallback(
    async (patch: Partial<MusicState>) => {
      if (!roomCode || !isHost) return
      await updateGameDoc(roomCode, { music: patch } as any)
    },
    [roomCode, isHost],
  )

  // Playlist audio playback
  useEffect(() => {
    if (!music || music.source !== 'playlist') {
      audioRef.current?.pause()
      audioRef.current = null
      return
    }

    if (!audioRef.current || audioRef.current.src !== music.url) {
      audioRef.current = new Audio(music.url)
      audioRef.current.loop = true
      audioRef.current.volume = volumeRef.current
    }

    const audio = audioRef.current
    if (music.playing) {
      audio.currentTime = music.currentTime
      audio.play().catch(() => {})
    } else {
      audio.pause()
    }

    return () => {
      audio.pause()
      audioRef.current = null
    }
  }, [music?.url, music?.source, music?.playing, music?.currentTime])

  // Drift correction for playlist
  useEffect(() => {
    if (driftIntervalRef.current) clearInterval(driftIntervalRef.current)
    if (!music || music.source !== 'playlist' || !music.playing) return

    driftIntervalRef.current = setInterval(() => {
      const expected = music.currentTime + (Date.now() - music.lastCommandAt) / 1000
      const audio = audioRef.current
      if (audio && Math.abs(audio.currentTime - expected) > 2) {
        audio.currentTime = expected
      }
    }, 5000)

    return () => {
      if (driftIntervalRef.current) clearInterval(driftIntervalRef.current)
    }
  }, [music?.lastCommandAt, music?.currentTime, music?.source, music?.playing])

  // Host: periodically sync currentTime to Firestore for drift correction
  useEffect(() => {
    if (!isHost || !music?.playing) return
    const interval = setInterval(() => {
      updateMusic({ currentTime: localTimeRef.current, lastCommandAt: Date.now() })
    }, 10000)
    return () => clearInterval(interval)
  }, [isHost, music?.playing, updateMusic])

  const setVolume = useCallback((vol: number) => {
    volumeRef.current = vol
    if (audioRef.current) {
      audioRef.current.volume = vol
    }
  }, [])

  const onTimeUpdate = useCallback(
    (time: number) => {
      localTimeRef.current = time
    },
    [],
  )

  return { music, updateMusic, setVolume, onTimeUpdate }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useMusic.ts
git commit -m "feat: add useMusic hook for YouTube + playlist sync"
```

---

### Task 12: Music Integration into TablePage

**Files:**
- Modify: `src/components/Table/TablePage.tsx`

- [ ] **Step 1: Create MusicToggle.tsx** (add to Task 10 file list)

Create `src/components/Music/MusicToggle.tsx`:
```ts
import { motion } from 'framer-motion'

type Props = {
  isPlaying: boolean
  onClick: () => void
}

export function MusicToggle({ isPlaying, onClick }: Props) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`fixed z-50 rounded-full w-11 h-11 flex items-center justify-center shadow-2xl border-2 transition-colors ${
        isPlaying
          ? 'bg-gold/90 hover:bg-gold text-gray-900 border-gold/30'
          : 'bg-black/70 hover:bg-black/80 text-white/70 border-white/10'
      }`}
      style={{ bottom: 24, right: 88 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.span
        className="text-lg"
        animate={isPlaying ? { opacity: [1, 0.5, 1] } : {}}
        transition={isPlaying ? { duration: 1, repeat: Infinity } : {}}
      >
        {'\u266B'}
      </motion.span>
    </motion.button>
  )
}
```

- [ ] **Step 2: Update MusicPanel to accept isOpen/onClose props instead of internal state**

In `src/components/Music/MusicPanel.tsx`, replace:
```ts
  const [isOpen, setIsOpen] = useState(false)
```
with props:
```ts
type Props = {
  // ... existing props
  isOpen: boolean
  onClose: () => void
}
```

And replace `setIsOpen(false)` calls with `onClose()`.

- [ ] **Step 3: Add music to TablePage.tsx**

Add imports:
```ts
import { useMusic } from '../../hooks/useMusic'
import { MusicPanel } from '../Music/MusicPanel'
import { MusicToggle } from '../Music/MusicToggle'
```

After `useChat` hook call, add:
```ts
  const { updateMusic, setVolume, onTimeUpdate } = useMusic(game?.id ?? null, isHost)
  const [musicVolume, setMusicVolume] = useState(0.5)
  const [isMusicOpen, setIsMusicOpen] = useState(false)
```

Add near the end of JSX (alongside ChatPanel + ChatToggle):
```tsx
      <MusicToggle
        isPlaying={!!(game?.music?.playing)}
        onClick={() => setIsMusicOpen(true)}
      />

      {!game.gameOver && (
        <MusicPanel
          roomCode={game?.id ?? ''}
          isHost={isHost}
          music={game?.music}
          volume={musicVolume}
          isOpen={isMusicOpen}
          onClose={() => setIsMusicOpen(false)}
          onCommand={updateMusic}
          onVolumeChange={(v) => { setMusicVolume(v); setVolume(v) }}
          onTimeUpdate={onTimeUpdate}
        />
      )}
```

- [ ] **Step 4: Verify build + tests**

```bash
npx tsc --noEmit && npx vitest run && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/components/Table/TablePage.tsx src/components/Music/MusicPanel.tsx src/components/Music/MusicToggle.tsx
git commit -m "feat: integrate music player into table page"
```<｜end▁of▁thinking｜>The plan has the remaining tasks — let me finish it properly. Let me read the very end and append the missing sections:

<｜｜DSML｜｜tool_calls>
<｜｜DSML｜｜invoke name="read">
<｜｜DSML｜｜parameter name="offset" string="false">1000<｜end▁of▁thinking｜>Let me check the `authStore` to understand how user displayName is accessed:

<｜｜DSML｜｜tool_calls>
<｜｜DSML｜｜invoke name="read">
<｜｜DSML｜｜parameter name="filePath" string="true">C:\Users\Faber\Projects\Blackjackson\src\stores\authStore.ts