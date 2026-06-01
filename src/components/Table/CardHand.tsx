import type { HandState } from '../../engine/types'
import { evaluateHand } from '../../engine'
import { CardComponent } from './CardComponent'

type Props = {
  hand: HandState
  handIndex: number
  activeHandIndex: number
}

export function CardHand({ hand, handIndex, activeHandIndex }: Props) {
  const ev = evaluateHand(hand.cards)
  const isActive = handIndex === activeHandIndex
  return (
    <div className={`flex flex-col items-center gap-1 ${!isActive ? 'opacity-60' : ''}`}>
      <div className="flex -space-x-3">
        {hand.cards.map((card, i) => (
          <CardComponent key={`${card.suit}${card.rank}-${i}`} card={card} size="sm" delay={i * 0.1} />
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
