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
    <div className="flex justify-center relative z-20">
      <div
        className="flex flex-col items-center -mb-6"
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
          padding: '12px 32px 24px',
          borderRadius: '16px 16px 0 0',
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <PlayerAvatar name="Dealer" seat={6} size="sm" />
          <div className="flex flex-col">
            <span className="text-gold/80 text-xs font-semibold uppercase tracking-widest">Dealer</span>
          </div>
        </div>

        {phase === 'insurance' && (
          <div className="bg-gold/30 text-gold text-xs font-bold px-3 py-0.5 rounded-full mb-2 animate-pulse">
            INSURANCE AVAILABLE
          </div>
        )}
        {(phase === 'settlement' || phase === 'round_end') && dealerBJ && (
          <div className="bg-red-500/30 text-red-300 text-xs font-bold px-3 py-0.5 rounded-full mb-2">
            BLACKJACK
          </div>
        )}

        <div className="flex -space-x-4">
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
    </div>
  )
}
