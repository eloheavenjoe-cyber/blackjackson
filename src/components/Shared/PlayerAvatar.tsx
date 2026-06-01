const COLORS = [
  'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
  'bg-purple-500', 'bg-pink-500', 'bg-teal-500', 'bg-orange-500',
]

type Props = {
  name: string
  seat: number
  size?: 'sm' | 'md' | 'lg'
  isActive?: boolean
}

const sizeClasses = { sm: 'w-8 h-8 text-sm', md: 'w-10 h-10 text-base', lg: 'w-14 h-14 text-xl' }

export function PlayerAvatar({ name, seat, size = 'md', isActive }: Props) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  const color = COLORS[seat % COLORS.length]

  return (
    <div
      className={`${sizeClasses[size]} rounded-full ${color} flex items-center justify-center font-bold text-white shadow-lg transition-all ${
        isActive ? 'ring-2 ring-gold ring-offset-2 ring-offset-gray-900' : ''
      }`}
    >
      {initials}
    </div>
  )
}
