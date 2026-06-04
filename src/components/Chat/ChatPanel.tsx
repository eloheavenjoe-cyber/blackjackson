import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
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

function loadPanelSize(roomCode: string, defaultW: number, defaultH: number) {
  try {
    const saved = localStorage.getItem(`panelSize_${roomCode}`)
    if (saved) return JSON.parse(saved) as { width: number; height: number }
  } catch {}
  return { width: defaultW, height: defaultH }
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

  const [panelSize, setPanelSize] = useState(() => loadPanelSize(roomCode, 340, 420))
  const resizeRef = useRef({ startX: 0, startY: 0, startW: 0, startH: 0 })
  const isResizingRef = useRef(false)

  useEffect(() => {
    try { localStorage.setItem(`panelSize_${roomCode}`, JSON.stringify(panelSize)) } catch {}
  }, [panelSize, roomCode])

  const onResizeDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation()
    e.preventDefault()
    isResizingRef.current = true
    resizeRef.current = { startX: e.clientX, startY: e.clientY, startW: panelSize.width, startH: panelSize.height }
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [panelSize])

  const onResizeMove = useCallback((e: React.PointerEvent) => {
    if (!isResizingRef.current) return
    const dx = e.clientX - resizeRef.current.startX
    const dy = e.clientY - resizeRef.current.startY
    setPanelSize({
      width: Math.max(240, resizeRef.current.startW + dx),
      height: Math.max(200, resizeRef.current.startH + dy),
    })
  }, [])

  const onResizeUp = useCallback(() => {
    isResizingRef.current = false
  }, [])

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
    <div
      className={`fixed z-[60] ${isDragging ? 'cursor-grabbing' : ''}`}
      style={{ left: position.x, top: position.y, width: panelSize.width }}
    >
      {/* Always-visible draggable header bar */}
      <div
        className="flex items-center justify-between px-4 py-1.5 bg-black/90 backdrop-blur-md border border-white/10 rounded-xl cursor-grab active:cursor-grabbing select-none shadow-2xl"
        style={{ borderRadius: isOpen ? '12px 12px 0 0' : '12px', width: panelSize.width }}
        {...dragHandlers}
      >
        <div className="flex items-center gap-2">
          <span className="text-gold/80 text-xs font-semibold">Chat</span>
          {!isOpen && (
            <span className="text-white/20 text-[10px]">
              {visibleMessages.length > 0 ? `${visibleMessages.length} messages` : 'Click to open'}
            </span>
          )}
        </div>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => setIsOpen(!isOpen)}
          className="text-white/40 hover:text-white/80 text-lg leading-none px-1"
        >
          {isOpen ? '\u2014' : '+'}
        </button>
      </div>

      {/* Expandable content */}
      {isOpen && (
        <div
          className="bg-black/85 backdrop-blur-md border-l border-r border-b border-white/10 rounded-b-xl shadow-2xl flex flex-col relative"
          style={{ height: panelSize.height - 32, width: panelSize.width }}
        >
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

          {/* Resize handle */}
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
            style={{
              background: 'linear-gradient(135deg, transparent 50%, rgba(212,168,67,0.3) 50%)',
              borderBottomRightRadius: 12,
            }}
            onPointerDown={onResizeDown}
            onPointerMove={onResizeMove}
            onPointerUp={onResizeUp}
          />
        </div>
      )}
    </div>,
    document.body,
  )
}
