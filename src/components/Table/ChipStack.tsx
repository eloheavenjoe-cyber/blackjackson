import { Chip } from './Chip'

type ChipValue = 10 | 25 | 50 | 100 | 250 | 500

type Props = {
  amount: number
  size?: 'sm' | 'md'
}

function getChipValues(amount: number): ChipValue[] {
  const denoms: ChipValue[] = [500, 250, 100, 50, 25, 10]
  const result: ChipValue[] = []
  let remaining = amount
  for (const d of denoms) {
    while (remaining >= d && result.length < 5) {
      result.push(d)
      remaining -= d
    }
  }
  return result
}

export function ChipStack({ amount, size = 'sm' }: Props) {
  if (amount <= 0) return null
  const values = getChipValues(amount)
  const chipSize = size === 'sm' ? 'small' : 'table'

  return (
    <div className="relative inline-flex flex-col items-center">
      <div className="relative" style={{ height: 28 + (values.length - 1) * 4, width: 30 }}>
        {values.map((v, i) => (
          <div
            key={i}
            className="absolute left-1/2 -translate-x-1/2"
            style={{ top: i * 4, zIndex: values.length - i }}
          >
            <Chip value={v} size={chipSize as 'small' | 'table'} />
          </div>
        ))}
      </div>
      <span className="text-xs font-bold text-gold mt-1">{amount}</span>
    </div>
  )
}
