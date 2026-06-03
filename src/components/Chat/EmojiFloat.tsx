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
