import { motion } from 'framer-motion'
import type { Card } from '../../engine/types'

type Props = {
  card?: Card
  faceDown?: boolean
  size?: 'sm' | 'md' | 'lg'
  delay?: number
}

const suitSymbols: Record<string, string> = { S: '\u2660', H: '\u2665', D: '\u2666', C: '\u2663' }
const suitColors: Record<string, string> = { S: 'text-white', H: 'text-red-400', D: 'text-red-400', C: 'text-white' }

const sizeClasses = {
  sm: 'w-12 h-18',
  md: 'w-16 h-24',
  lg: 'w-20 h-28',
}

const textSizes = {
  sm: 'text-sm',
  md: 'text-lg',
  lg: 'text-xl',
}

export function CardComponent({ card, faceDown, size = 'md', delay = 0 }: Props) {
  return (
    <motion.div
      initial={{ x: -40, y: -200, rotate: -10, opacity: 0 }}
      animate={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay, type: 'spring', stiffness: 200 }}
      className={`${sizeClasses[size]} rounded-lg shadow-xl flex-shrink-0 ${
        faceDown || !card ? 'bg-blue-800' : 'bg-white'
      }`}
    >
      {faceDown ? (
        <div className="w-full h-full rounded-lg border-2 border-blue-400 bg-blue-700 flex items-center justify-center">
          <div className="w-3/4 h-3/4 rounded border border-blue-400 bg-blue-600 grid grid-cols-3 grid-rows-3 gap-0.5 p-0.5">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="bg-blue-500 rounded-sm" />
            ))}
          </div>
        </div>
      ) : card ? (
        <div className={`w-full h-full rounded-lg border border-gray-300 flex flex-col p-1 ${suitColors[card.suit]}`}>
          <div className={`${textSizes[size]} font-bold leading-none`}>{card.rank}</div>
          <div className={`${textSizes[size]} leading-none`}>{suitSymbols[card.suit]}</div>
          <div className="flex-1 flex items-center justify-center">
            <span className={`${size === 'sm' ? 'text-xl' : 'text-3xl'}`}>{suitSymbols[card.suit]}</span>
          </div>
        </div>
      ) : (
        <div className="w-full h-full rounded-lg border border-white/20 bg-white/5" />
      )}
    </motion.div>
  )
}
