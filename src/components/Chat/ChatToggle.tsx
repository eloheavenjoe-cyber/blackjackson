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
      className="fixed z-[60] bg-gold/90 hover:bg-gold text-gray-900 font-bold rounded-full w-11 h-11 flex items-center justify-center shadow-2xl border-2 border-gold/30"
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
