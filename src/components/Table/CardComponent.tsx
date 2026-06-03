import { motion } from 'framer-motion'
import type { Card } from '../../engine/types'

type Props = {
  card?: Card
  faceDown?: boolean
  size?: 'sm' | 'md' | 'lg'
  delay?: number
  originX?: number
  originY?: number
  isFlipping?: boolean
}

const suitSymbols: Record<string, string> = { S: '\u2660', H: '\u2665', D: '\u2666', C: '\u2663' }
const suitColors: Record<string, string> = { S: 'text-gray-900', H: 'text-red-600', D: 'text-red-600', C: 'text-gray-900' }

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

function CardFace({ card, size = 'md' }: { card?: Card; size?: 'sm' | 'md' | 'lg' }) {
  if (!card) {
    return <div className="w-full h-full rounded-lg border border-white/20 bg-white/5" />
  }
  return (
    <div className={`w-full h-full rounded-lg border border-gray-300 flex flex-col p-1 ${suitColors[card.suit]}`}>
      <div className={`${textSizes[size]} font-bold leading-none`}>{card.rank}</div>
      <div className={`${textSizes[size]} leading-none`}>{suitSymbols[card.suit]}</div>
      <div className="flex-1 flex items-center justify-center">
        <span className={`${size === 'sm' ? 'text-xl' : 'text-3xl'}`}>{suitSymbols[card.suit]}</span>
      </div>
    </div>
  )
}

function CardBack() {
  return (
    <div className="w-full h-full rounded-lg border-2 border-blue-400 bg-blue-700 flex items-center justify-center">
      <div className="w-3/4 h-3/4 rounded border border-blue-400 bg-blue-600 grid grid-cols-3 grid-rows-3 gap-0.5 p-0.5">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="bg-blue-500 rounded-sm" />
        ))}
      </div>
    </div>
  )
}

export function CardComponent({
  card, faceDown, size = 'md', delay = 0,
  originX = -60, originY = -300,
  isFlipping,
}: Props) {
  const rot = (Math.random() - 0.5) * 6

  return (
    <motion.div
      initial={{ x: originX, y: originY, rotate: -15 + rot, opacity: 0 }}
      animate={
        isFlipping !== undefined
          ? { x: 0, y: 0, rotateY: isFlipping ? 180 : 0, rotate: 0, opacity: 1 }
          : { x: 0, y: 0, rotate: 0, opacity: 1 }
      }
      transition={{
        duration: isFlipping !== undefined ? 0.5 : 0.6,
        delay,
        type: isFlipping !== undefined ? 'tween' : 'spring',
        stiffness: 120,
        damping: 14,
      }}
      className={`${sizeClasses[size]} rounded-lg shadow-xl flex-shrink-0`}
      style={{
        transformStyle: 'preserve-3d',
        perspective: 600,
      }}
    >
      {/* Face-down (back) — visible at rotateY=0 */}
      <div
        className="absolute inset-0 rounded-lg"
        style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
      >
        <CardBack />
      </div>
      {/* Face-up (front) — visible at rotateY=180 */}
      <div
        className="absolute inset-0 rounded-lg"
        style={{
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
        }}
      >
        <CardFace card={card} size={size} />
      </div>
    </motion.div>
  )
}
