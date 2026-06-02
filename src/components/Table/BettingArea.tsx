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

function breakdownDenoms(amount: number): ChipValue[] {
  const denoms: ChipValue[] = [500, 250, 100, 50, 25, 10]
  const result: ChipValue[] = []
  let remaining = amount
  for (const d of denoms) {
    while (remaining >= d) {
      result.push(d)
      remaining -= d
    }
  }
  return result
}

function ChipRow({ values, onClick }: { values: ChipValue[]; onClick?: (i: number) => void }) {
  if (values.length === 0) return null
  return (
    <div className="flex -space-x-3 items-center">
      {values.map((v, i) => (
        <div key={i} className="relative" style={{ zIndex: i }}>
          <Chip
            value={v}
            size="table"
            onClick={onClick ? () => onClick(i) : undefined}
          />
        </div>
      ))}
    </div>
  )
}

export function BettingArea({ chips, minBet, maxBet, onPlaceBet, alreadyBet, currentBetAmount }: Props) {
  const [chipStack, setChipStack] = useState<ChipValue[]>([])
  const bet = chipStack.reduce((a, b) => a + b, 0)

  if (alreadyBet) {
    return (
      <div className="absolute bottom-0 left-0 right-0 flex justify-center items-center gap-3 pb-6 z-20">
        <div className="flex items-center gap-3 bg-black/40 backdrop-blur rounded-2xl px-5 py-3 border border-gold/20">
          <span className="text-gold/60 text-xs uppercase tracking-wider">Bet placed</span>
          <ChipRow values={breakdownDenoms(currentBetAmount ?? 0)} />
          <span className="text-white text-sm font-bold">{currentBetAmount}</span>
        </div>
      </div>
    )
  }

  if (chips < minBet) {
    return (
      <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-6 z-20">
        <p className="text-gray-500 text-sm">Not enough chips to bet</p>
      </div>
    )
  }

  const canAfford = (v: number) => v <= chips && v + bet <= maxBet && v + bet <= chips

  function removeChip(index: number) {
    setChipStack((prev) => prev.filter((_, i) => i !== index))
  }

  function clear() {
    setChipStack([])
  }

  function placeBet() {
    if (bet >= minBet) {
      onPlaceBet(bet)
      setChipStack([])
    }
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 pb-6">
      <div className="flex items-center justify-center gap-6">
        <div className="flex items-center gap-3">
          <button onClick={clear} className="text-gray-400 hover:text-white text-xs cursor-pointer uppercase tracking-wider">
            Clear
          </button>
          <div className="flex flex-col items-center gap-1">
            <ChipRow values={chipStack} onClick={removeChip} />
            <span className="text-gold font-bold text-sm min-w-[3ch] text-center">{bet || '0'}</span>
          </div>
        </div>

        <div className="flex gap-1.5">
          {allDenoms.map((v) => (
            <Chip
              key={v}
              value={v}
              size="betting"
              onClick={canAfford(v) ? () => setChipStack((prev) => [...prev, v]) : undefined}
              dimmed={!canAfford(v)}
            />
          ))}
        </div>

        <Button onClick={placeBet} disabled={bet < minBet} size="sm">
          Place Bet
        </Button>
      </div>
    </div>
  )
}
