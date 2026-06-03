import { useEffect, useState } from 'react'
import type { Card } from '../../engine/types'
import { evaluateHand } from '../../engine'
import { CardComponent } from './CardComponent'
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
  const ev = dealerHand.length > 0 ? evaluateHand(showHoleCard ? dealerHand : [dealerHand[0]]) : null
  const dealerBJ = dealerHand.length === 2 && evaluateHand(dealerHand).isBlackjack
  const [flipping, setFlipping] = useState(false)
  const [wasShowing, setWasShowing] = useState(showHoleCard)

  useEffect(() => {
    if (showHoleCard && !wasShowing && dealerHand.length >= 2) {
      const timer = setTimeout(() => setFlipping(true), 300)
      return () => clearTimeout(timer)
    }
    setWasShowing(showHoleCard)
  }, [showHoleCard, wasShowing, dealerHand.length])

  return (
    <div
      className="flex flex-col items-center"
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
          const isHoleCard = i === 1 && !showHoleCard
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
              isFlipping={i === 1 ? (flipping ? true : showHoleCard ? false : undefined) : undefined}
            />
          )
        })}
        {dealerHand.length === 0 && (
          <div className="w-16 h-24 rounded-lg border-2 border-dashed border-white/10 flex items-center justify-center">
            <span className="text-white/15 text-xl">?</span>
          </div>
        )}
      </div>

      {ev && phase !== 'waiting' && phase !== 'betting' && phase !== 'dealing' && (
        <div className="text-sm font-mono text-white bg-black/40 px-3 py-0.5 rounded-full mt-2">
          {showHoleCard ? ev.value : ev.soft ? `${ev.value - 10}/${ev.value}` : ev.value}
        </div>
      )}
    </div>
  )
}
