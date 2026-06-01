type Props = {
  amount: number
  size?: 'sm' | 'md'
}

const chipColors = [
  'bg-chip-white border-gray-300 text-gray-800',
  'bg-chip-red border-red-700 text-white',
  'bg-chip-blue border-blue-700 text-white',
  'bg-chip-green border-green-700 text-white',
  'bg-chip-black border-gray-600 text-white',
]

export function ChipStack({ amount, size = 'sm' }: Props) {
  const chips = Math.min(Math.ceil(amount / 100), 5)
  if (amount <= 0) return null

  return (
    <div className="relative inline-flex flex-col items-center">
      {[...Array(chips)].map((_, i) => (
        <div
          key={i}
          className={`${size === 'sm' ? 'w-6 h-1.5' : 'w-8 h-2'} rounded-full border ${chipColors[i % chipColors.length]}`}
          style={{ marginTop: i === 0 ? 0 : '-3px', zIndex: chips - i }}
        />
      ))}
      <span className="text-xs font-bold text-gold mt-1">{amount}</span>
    </div>
  )
}
