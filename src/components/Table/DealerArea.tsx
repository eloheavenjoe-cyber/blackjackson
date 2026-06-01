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
  const visibleCards = showHoleCard ? dealerHand : dealerHand.slice(0, 1)
  const ev = dealerHand.length > 0 ? evaluateHand(showHoleCard ? dealerHand : [dealerHand[0]]) : null

  return (
    <div className="flex flex-col items-center py-6">
      <div className="flex items-center gap-4 mb-2">
        <PlayerAvatar name="Dealer" seat={6} size="lg" />
        <span className="text-gold font-semibold text-lg">Dealer</span>
      </div>
      <div className="flex -space-x-3 mb-2">
        {dealerHand.map((card, i) => (
          <CardComponent
            key={i}
            card={card}
            faceDown={!showHoleCard && i === 1}
            size="lg"
            delay={i * 0.2}
          />
        ))}
      </div>
      {ev && phase !== 'waiting' && phase !== 'betting' && phase !== 'dealing' && (
        <div className="text-lg font-mono text-white">
          {showHoleCard ? ev.value : ev.soft ? `${ev.value - 10}/${ev.value}` : ev.value}
        </div>
      )}
    </div>
  )
}
