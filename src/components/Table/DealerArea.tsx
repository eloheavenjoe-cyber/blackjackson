import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { Card } from '../../engine/types'
import { evaluateHand } from '../../engine'
import { CardComponent, CardBack } from './CardComponent'
import { PlayerAvatar } from '../Shared/PlayerAvatar'

type Props = {
  dealerHand: Card[]
  showHoleCard: boolean
  phase: string
  dealIndex?: number | null
  originX?: number
  originY?: number
}

export function DealerArea({ dealerHand, showHoleCard, phase, dealIndex, originX, originY }: Props) {
  const [flipping, setFlipping] = useState(false)
  const [flipComplete, setFlipComplete] = useState(false)
  const showFull = showHoleCard && flipComplete

  const ev = dealerHand.length > 0 ? evaluateHand(showFull ? dealerHand : [dealerHand[0]]) : null
  const dealerBJ = dealerHand.length === 2 && evaluateHand(dealerHand).isBlackjack

  useEffect(() => {
    if (showHoleCard && dealerHand.length >= 2) {
      const delay = setTimeout(() => setFlipping(true), 300)
      return () => clearTimeout(delay)
    }
    if (!showHoleCard) {
      setFlipping(false)
      setFlipComplete(false)
    }
  }, [showHoleCard, dealerHand.length])

  useEffect(() => {
    if (flipping) {
      const done = setTimeout(() => setFlipComplete(true), 500)
      return () => clearTimeout(done)
    }
  }, [flipping])

  return (
    <div
      className="flex flex-col items-center relative"
      style={{
        background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
        padding: '10px 40px 20px',
        borderRadius: '12px 12px 0 0',
        marginBottom: -10,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <PlayerAvatar name="Dealer" seat={6} size="sm" />
        <span className="text-gold/70 text-xs font-semibold uppercase tracking-widest">Dealer</span>
      </div>

      {phase === 'insurance' && (
        <div className="bg-gold/30 text-gold text-xs font-bold px-3 py-0.5 rounded-full mb-2">
          INSURANCE
        </div>
      )}
      {(phase === 'settlement' || phase === 'round_end') && dealerBJ && (
        <div className="bg-red-500/30 text-red-300 text-xs font-bold px-3 py-0.5 rounded-full mb-2">
          BLACKJACK
        </div>
      )}

      <div
        className="flex -space-x-4"
        style={{ perspective: 600 }}
      >
        {dealerHand.map((card, i) => {
          const cardDelay = dealIndex != null
            ? (dealIndex + i) * 0.15
            : i * 0.2
          return (
            <CardComponent
              key={i}
              card={card}
              size="lg"
              delay={cardDelay}
              originX={originX}
              originY={originY}
              isFlipping={i === 1 ? (flipping ? true : false) : undefined}
            />
          )
        })}
        {dealerHand.length === 0 && (
          <div className="w-16 h-24 rounded-lg border-2 border-dashed border-white/10 flex items-center justify-center">
            <span className="text-white/15 text-xl">?</span>
          </div>
        )}
      </div>

      {/* Burn card — face-down card near shoe position */}
      <div
        className="absolute pointer-events-none"
        style={{
          right: '8%',
          top: '35%',
          transform: 'rotate(15deg)',
          width: 40,
          height: 56,
          boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
          zIndex: 1,
        }}
      >
        <CardBack />
      </div>

      {ev && phase !== 'waiting' && phase !== 'betting' && phase !== 'dealing' && (
        <motion.div
          key={showFull ? 'full' : 'partial'}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="text-sm font-mono text-white bg-black/40 px-3 py-0.5 rounded-full mt-2"
        >
          {showFull ? ev.value : ev.soft ? `${ev.value - 10}/${ev.value}` : ev.value}
        </motion.div>
      )}
    </div>
  )
}
