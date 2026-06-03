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
      className={`fixed z-[60] bg-black/85 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl ${
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
              {visibleMessages.map((msg) => (
                <ChatMessage key={`${msg.playerId}-${msg.timestamp}`} message={msg} />
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
