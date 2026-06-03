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
