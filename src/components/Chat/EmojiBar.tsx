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
