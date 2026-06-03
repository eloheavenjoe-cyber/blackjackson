import type { ChipValue } from './Chip'
import { Chip } from './Chip'
import { Button } from '../Shared/Button'
import { useSound } from '../../hooks/useSound'

const allDenoms: ChipValue[] = [10, 25, 50, 100, 250, 500]

type Props = {
  chips: number
  minBet: number
  maxBet: number
  pendingBet: number
  onAddChip: (value: ChipValue) => void
  onClear: () => void
  onPlaceBet: (amount: number) => void
  onQuickBet: (amount: number) => void
  alreadyBet: boolean
  currentBetAmount?: number
}

export function BettingArea({
  chips, minBet, maxBet, pendingBet,
  onAddChip, onClear, onPlaceBet, onQuickBet,
  alreadyBet, currentBetAmount,
}: Props) {
  const { play } = useSound()

  function handleAddChip(value: ChipValue) {
    play('chip')
    onAddChip(value)
  }

  function handlePlaceBet(amount: number) {
    play('chip')
    onPlaceBet(amount)
  }
  if (alreadyBet) {
    return (
      <div className="flex justify-center pt-20 pb-3">
        <div className="flex items-center gap-3 bg-black/40 backdrop-blur rounded-2xl px-5 py-3 border border-gold/20">
          <span className="text-gold/60 text-xs uppercase tracking-wider">Bet placed</span>
          <span className="text-white text-sm font-bold">{currentBetAmount}</span>
        </div>
      </div>
    )
  }

  if (chips < minBet) {
    return (
      <div className="flex justify-center pt-20 pb-3">
        <p className="text-gray-500 text-sm">Not enough chips to bet</p>
      </div>
    )
  }

  const canAfford = (v: number) => v <= chips && v + pendingBet <= maxBet && v + pendingBet <= chips

  const halfBet = Math.floor(chips / 2)
  const clampedHalf = Math.min(halfBet, maxBet)
  const clampedMax = Math.min(chips, maxBet)

  return (
    <div className="pt-20 pb-3">
      <div className="flex items-center justify-center gap-6">
        <button
          onClick={onClear}
          className="text-gray-400 hover:text-white text-xs cursor-pointer uppercase tracking-wider"
        >
          Clear
        </button>

        <span className="text-gold font-bold text-sm w-12 text-center">
          {pendingBet || '0'}
        </span>

        <div className="flex gap-1.5">
          {allDenoms.map((v) => (
            <Chip
              key={v}
              value={v}
              size="betting"
              onClick={canAfford(v) ? () => handleAddChip(v) : undefined}
              dimmed={!canAfford(v)}
            />
          ))}
        </div>

        <Button onClick={() => handlePlaceBet(pendingBet)} disabled={pendingBet < minBet} size="sm">
          Place Bet
        </Button>
      </div>

      {/* Quick bet shortcuts */}
      <div className="flex items-center justify-center gap-2 mt-3">
        <button
          onClick={() => onQuickBet(minBet)}
          disabled={chips < minBet}
          className="text-xs text-gold/50 hover:text-gold border border-gold/15 hover:border-gold/30 rounded-full px-3 py-1 cursor-pointer disabled:opacity-30 disabled:cursor-default transition-colors"
        >
          Min
        </button>
        <button
          onClick={() => onQuickBet(clampedHalf)}
          disabled={clampedHalf < minBet}
          className="text-xs text-gold/50 hover:text-gold border border-gold/15 hover:border-gold/30 rounded-full px-3 py-1 cursor-pointer disabled:opacity-30 disabled:cursor-default transition-colors"
        >
          1/2
        </button>
        <button
          onClick={() => onQuickBet(clampedMax)}
          disabled={clampedMax < minBet}
          className="text-xs text-gold/50 hover:text-gold border border-gold/15 hover:border-gold/30 rounded-full px-3 py-1 cursor-pointer disabled:opacity-30 disabled:cursor-default transition-colors"
        >
          Max
        </button>
      </div>
    </div>
  )
}
