import type { HandState } from '../../engine/types'
import { evaluateHand } from '../../engine'
import { CardComponent } from './CardComponent'

type Props = {
  hand: HandState
  handIndex: number
  activeHandIndex: number
  dealIndex?: number | null
  originX?: number
  originY?: number
}

export function CardHand({ hand, handIndex, activeHandIndex, dealIndex, originX, originY }: Props) {
  const ev = evaluateHand(hand.cards)
  const isActive = handIndex === activeHandIndex
  return (
    <div className={`flex flex-col items-center gap-1 ${!isActive ? 'opacity-60' : ''}`}>
      <div className="flex -space-x-3">
        {hand.cards.map((card, i) => (
          <CardComponent
            key={`${card.suit}${card.rank}-${i}`}
            card={card}
            size="sm"
            delay={dealIndex != null ? (dealIndex + i) * 0.15 : i * 0.2}
            originX={originX}
            originY={originY}
          />
        ))}
      </div>
      <div className="text-xs font-mono mt-1">
        <span className={`${ev.isBust ? 'text-red-400' : ev.isBlackjack ? 'text-gold' : 'text-white'}`}>
          {ev.isBlackjack ? 'BJ' : ev.isBust ? 'Bust' : ev.soft ? `${ev.value - 10}/${ev.value}` : ev.value}
        </span>
      </div>
      {hand.bet > 0 && (
        <div className="text-xs text-gold">Bet: {hand.bet}</div>
      )}
    </div>
  )
}
