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
