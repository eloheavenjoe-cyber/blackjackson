import { motion, AnimatePresence } from 'framer-motion'
import type { HandState } from '../../engine/types'

type Props = {
  hands: HandState[]
  visible: boolean
}

export function RoundResult({ hands, visible }: Props) {
  const result = hands[0]?.result
  if (!result || result === 'pending') return null

  const label = result === 'blackjack' ? 'BLACKJACK!' : result === 'win' ? 'WIN!' : result === 'push' ? 'PUSH' : 'BUST'
  const color = result === 'blackjack' ? 'text-gold' : result === 'win' ? 'text-green-400' : result === 'push' ? 'text-gray-400' : 'text-red-400'

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className={`text-4xl font-black ${color} text-center py-4 drop-shadow-lg`}
        >
          {label}
          {hands[0].payout > 0 && (
            <span className="block text-lg text-gold">+{hands[0].payout + hands[0].bet}</span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
