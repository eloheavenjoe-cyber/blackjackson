import { motion, AnimatePresence } from 'framer-motion'
import type { HandState } from '../../engine/types'
import { evaluateHand } from '../../engine'

type Props = {
  hands: HandState[]
  visible: boolean
}

function handLabel(hand: HandState): string {
  if (hand.isSurrendered) return 'SURRENDER'
  if (hand.result === 'blackjack') return 'BLACKJACK!'
  if (hand.result === 'win') return 'WIN!'
  if (hand.result === 'push') return 'PUSH'
  if (hand.result === 'lose') {
    const ev = evaluateHand(hand.cards)
    return ev.isBust ? 'BUST' : 'LOSE'
  }
  return ''
}

function handColor(hand: HandState): string {
  if (hand.result === 'blackjack') return 'text-gold'
  if (hand.result === 'win') return 'text-green-400'
  if (hand.result === 'push' || hand.isSurrendered) return 'text-gray-400'
  if (hand.result === 'lose') return 'text-red-400'
  return 'text-white'
}

function ResultLabel({ hand, delay }: { hand: HandState; delay?: number }) {
  if (hand.result === 'blackjack') {
    return (
      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: [0, 1.3, 1], rotate: 0 }}
        transition={{ delay: delay ?? 0, duration: 0.6, ease: 'easeOut' }}
      >
        <div className="text-4xl font-black drop-shadow-lg text-gold">BLACKJACK!</div>
      </motion.div>
    )
  }
  if (hand.result === 'win') {
    return (
      <motion.div
        initial={{ scale: 0, y: 20 }}
        animate={{ scale: [0, 1.1, 1], y: 0 }}
        transition={{ delay: delay ?? 0, type: 'spring', stiffness: 200, damping: 12 }}
      >
        <div className="text-4xl font-black drop-shadow-lg text-green-400">WIN!</div>
      </motion.div>
    )
  }
  if (hand.result === 'lose') {
    return (
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, x: [-4, 4, -4, 0], opacity: 1 }}
        transition={{ delay: delay ?? 0, duration: 0.5 }}
      >
        <div className={`text-4xl font-black drop-shadow-lg ${handColor(hand)}`}>
          {handLabel(hand)}
        </div>
      </motion.div>
    )
  }
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: delay ?? 0, duration: 0.3 }}
    >
      <div className={`text-4xl font-black drop-shadow-lg ${handColor(hand)}`}>
        {handLabel(hand)}
      </div>
    </motion.div>
  )
}

export function RoundResult({ hands, visible }: Props) {
  const hasResult = hands.some(h => h.result && h.result !== 'pending')

  return (
    <AnimatePresence>
      {visible && hasResult && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-center py-4"
        >
          {hands.length === 1 ? (
            <div>
              <ResultLabel hand={hands[0]} />
              {hands[0].payout > 0 && (
                <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="block text-lg text-gold mt-1"
                >
                  +{hands[0].payout + hands[0].bet}
                </motion.span>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {hands.map((hand, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.2, duration: 0.35 }}
                  className={`text-2xl font-black drop-shadow-lg ${handColor(hand)}`}
                >
                  Hand {i + 1}: {handLabel(hand)}
                  {hand.payout > 0 && (
                    <motion.span
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.2 + 0.3, duration: 0.3 }}
                      className="text-gold text-base ml-2"
                    >
                      +{hand.payout + hand.bet}
                    </motion.span>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
