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
const MAX_VISIBLE = 15
const PER_ROW = 5

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

function consolidateChips(chips: ChipValue[]): ChipValue[] {
  const total = chips.reduce((a, b) => a + b, 0)
  const denom = breakdownDenoms(total)
  const denomTotal = denom.reduce((a, b) => a + b, 0)
  return denomTotal === total ? denom : chips
}

function ChipArea({ values, onClick }: { values: ChipValue[]; onClick?: (i: number) => void }) {
  if (values.length === 0) {
    return (
      <div className="w-48 h-20 bg-black/20 rounded-xl border border-white/5 flex items-center justify-center">
        <span className="text-white/15 text-xs">no chips</span>
      </div>
    )
  }

  const visible = values.slice(0, MAX_VISIBLE)
  const hidden = values.length - MAX_VISIBLE

  const rows: ChipValue[][] = []
  for (let i = 0; i < visible.length; i += PER_ROW) {
    rows.push(visible.slice(i, i + PER_ROW))
  }

  return (
    <div className="w-48 bg-black/20 rounded-xl border border-white/5 flex flex-col items-center justify-center py-2" style={{ minHeight: 80 }}>
      <div className="flex flex-col items-center" style={{ gap: 2 }}>
        {rows.map((row, ri) => (
          <div key={ri} className="flex -space-x-1.5 justify-center">
            {row.map((v, ci) => (
              <div key={ri * PER_ROW + ci} style={{ zIndex: ci }}>
                <Chip
                  value={v}
                  size="small"
                  onClick={onClick ? () => onClick(ri * PER_ROW + ci) : undefined}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
      {hidden > 0 && (
        <span className="text-gold/50 text-xs mt-1">+{hidden} more</span>
      )}
    </div>
  )
}

export function BettingArea({ chips, minBet, maxBet, onPlaceBet, alreadyBet, currentBetAmount }: Props) {
  const [chipStack, setChipStack] = useState<ChipValue[]>([])
  const bet = chipStack.reduce((a, b) => a + b, 0)

  if (alreadyBet) {
    const raw = breakdownDenoms(currentBetAmount ?? 0)
    const rawSum = raw.reduce((a, b) => a + b, 0)
    const values = rawSum === (currentBetAmount ?? 0) ? raw : []
    return (
      <div className="flex justify-center items-center gap-3 pt-8 pb-3">
        <div className="flex items-center gap-3 bg-black/40 backdrop-blur rounded-2xl px-5 py-3 border border-gold/20">
          <span className="text-gold/60 text-xs uppercase tracking-wider">Bet placed</span>
          <ChipArea values={values} />
          <span className="text-white text-sm font-bold">{currentBetAmount}</span>
        </div>
      </div>
    )
  }

  if (chips < minBet) {
    return (
      <div className="flex justify-center pt-8 pb-3">
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
    <div className="pt-8 pb-3">
      <div className="flex items-center justify-center gap-6">
        <div className="flex items-center gap-3">
          <button onClick={clear} className="text-gray-400 hover:text-white text-xs cursor-pointer uppercase tracking-wider">
            Clear
          </button>
          <div className="flex flex-col items-center gap-1">
            <ChipArea values={chipStack} onClick={removeChip} />
            <span className="text-gold font-bold text-sm">{bet || '0'}</span>
          </div>
        </div>

        <div className="flex gap-1.5">
          {allDenoms.map((v) => (
            <Chip
              key={v}
              value={v}
              size="betting"
              onClick={canAfford(v) ? () => setChipStack((prev) => consolidateChips([...prev, v])) : undefined}
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
