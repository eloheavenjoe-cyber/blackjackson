import type { Card } from '../../engine/types'
import { evaluateHand } from '../../engine'
import { CardComponent } from './CardComponent'
import { PlayerAvatar } from '../Shared/PlayerAvatar'

type Props = {
  dealerHand: Card[]
  showHoleCard: boolean
  phase: string
}

export function DealerArea({ dealerHand, showHoleCard, phase }: Props) {
  const ev = dealerHand.length > 0 ? evaluateHand(showHoleCard ? dealerHand : [dealerHand[0]]) : null
  const dealerBJ = dealerHand.length === 2 && evaluateHand(dealerHand).isBlackjack

  return (
    <div className="flex flex-col items-center py-4">
      <div className="flex items-center gap-2 mb-1">
        <PlayerAvatar name="Dealer" seat={6} size="sm" />
        <span className="text-gold/60 text-xs font-semibold uppercase tracking-wider">Dealer</span>
      </div>

      {phase === 'insurance' && (
        <div className="bg-gold/20 text-gold text-xs font-bold px-2 py-0.5 rounded mb-1">
          INSURANCE
        </div>
      )}
      {(phase === 'settlement' || phase === 'round_end') && dealerBJ && (
        <div className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-0.5 rounded mb-1">
          BLACKJACK
        </div>
      )}

      <div className="flex -space-x-3 mb-1">
        {dealerHand.map((card, i) => (
          <CardComponent
            key={i}
            card={card}
            faceDown={!showHoleCard && i === 1}
            size="lg"
            delay={i * 0.2}
          />
        ))}
        {dealerHand.length === 0 && (
          <div className="w-16 h-24 rounded-lg border border-dashed border-white/10 flex items-center justify-center">
            <span className="text-white/20 text-2xl">?</span>
          </div>
        )}
      </div>

      {ev && phase !== 'waiting' && phase !== 'betting' && phase !== 'dealing' && (
        <div className="text-base font-mono text-white bg-black/30 px-2 py-0.5 rounded">
          {showHoleCard ? ev.value : ev.soft ? `${ev.value - 10}/${ev.value}` : ev.value}
        </div>
      )}
    </div>
  )
}
