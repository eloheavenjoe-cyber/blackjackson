import { useState } from 'react'
import { Chip } from './Chip'
import { Button } from '../Shared/Button'

type ChipValue = 10 | 25 | 50 | 100 | 250 | 500

type Props = {
  chips: number
  minBet: number
  maxBet: number
  onPlaceBet: (amount: number) => void
  alreadyBet: boolean
  currentBetAmount?: number
}

const allDenoms: ChipValue[] = [10, 25, 50, 100, 250, 500]

function ChipStackSimple({ amount }: { amount: number }) {
  if (amount <= 0) return null
  return <Chip value={amount >= 100 ? 100 : amount >= 50 ? 50 : amount >= 25 ? 25 : 10} size="small" />
}

export function BettingArea({ chips, minBet, maxBet, onPlaceBet, alreadyBet, currentBetAmount }: Props) {
  const [bet, setBet] = useState(0)

  if (alreadyBet) {
    return (
      <div className="flex justify-center items-center gap-3 pb-4">
        <div className="flex items-center gap-2 bg-black/30 rounded-xl px-4 py-2 border border-gold/20">
          <span className="text-gold text-sm font-bold">Bet placed:</span>
          <ChipStackSimple amount={currentBetAmount ?? 0} />
          <span className="text-white text-sm">{currentBetAmount}</span>
        </div>
      </div>
    )
  }

  if (chips < minBet) {
    return (
      <div className="flex justify-center pb-4">
        <p className="text-gray-500 text-sm">Not enough chips to bet</p>
      </div>
    )
  }

  const canAfford = (v: number) => v <= chips && v + bet <= maxBet && v + bet <= chips

  function clear() {
    setBet(0)
  }

  function placeBet() {
    if (bet >= minBet) {
      onPlaceBet(bet)
      setBet(0)
    }
  }

  return (
    <div className="flex items-center justify-center gap-6 pb-4">
      <div className="flex items-center gap-2">
        <button onClick={clear} className="text-gray-400 hover:text-white text-xs cursor-pointer">
          Clear
        </button>
        <ChipStackSimple amount={bet} />
        <span className="text-gold font-bold text-sm min-w-[3ch]">{bet || '0'}</span>
      </div>

      <div className="flex gap-1.5">
        {allDenoms.map((v) => (
          <Chip
            key={v}
            value={v}
            size="betting"
            onClick={canAfford(v) ? () => setBet((b) => b + v) : undefined}
            dimmed={!canAfford(v)}
          />
        ))}
      </div>

      <Button onClick={placeBet} disabled={bet < minBet} size="sm">
        Place Bet
      </Button>
    </div>
  )
}
