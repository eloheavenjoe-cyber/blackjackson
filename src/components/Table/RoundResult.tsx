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

export function RoundResult({ hands, visible }: Props) {
  const hasResult = hands.some(h => h.result && h.result !== 'pending')

  return (
    <AnimatePresence>
      {visible && hasResult && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="text-center py-4"
        >
          {hands.length === 1 ? (
            <div>
              <span className={`text-4xl font-black drop-shadow-lg ${handColor(hands[0])}`}>
                {handLabel(hands[0])}
              </span>
              {hands[0].payout > 0 && (
                <span className="block text-lg text-gold mt-1">+{hands[0].payout + hands[0].bet}</span>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {hands.map((hand, i) => (
                <div key={i} className={`text-2xl font-black drop-shadow-lg ${handColor(hand)}`}>
                  Hand {i + 1}: {handLabel(hand)}
                  {hand.payout > 0 && (
                    <span className="text-gold text-base ml-2">+{hand.payout + hand.bet}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
