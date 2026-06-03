import { useMemo } from 'react'
import { motion } from 'framer-motion'
import type { Card } from '../../engine/types'

type Props = {
  card?: Card
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

const faceCardSizeClasses: Record<string, string> = { sm: '24', md: '30', lg: '36' }

function FaceCardFigure({ rank, suit, size = 'md' }: { rank: string; suit: string; size: string }) {
  const color = suit === 'H' || suit === 'D' ? '#dc2626' : '#111827'
  const dim = faceCardSizeClasses[size] || '30'
  const vb = '0 0 40 40'

  if (rank === 'K') {
    return (
      <svg viewBox={vb} width={dim} height={dim} className="mx-auto">
        {/* Stylized crown */}
        <path d="M 6,28 L 4,16 L 10,22 L 14,12 L 18,22 L 24,16 L 22,28 Z" fill={color} opacity="0.85" />
        {/* Crown jewels */}
        <circle cx="10" cy="20" r="2.5" fill={color} />
        <circle cx="14" cy="12" r="2" fill={color} />
        <circle cx="18" cy="20" r="2.5" fill={color} />
        {/* Crown base band */}
        <rect x="6" y="28" width="16" height="3" rx="1" fill={color} />
        {/* Downward sword */}
        <rect x="13.5" y="28" width="1.5" height="8" rx="0.5" fill={color} opacity="0.6" />
        <rect x="12" y="34" width="4" height="2" rx="0.5" fill={color} opacity="0.6" />
      </svg>
    )
  }

  if (rank === 'Q') {
    return (
      <svg viewBox={vb} width={dim} height={dim} className="mx-auto">
        {/* Curved tiara — 5 arches */}
        <path d="M 5,28 L 2,16 Q 4,14 5,16 L 8,20 L 10,12 Q 12,10 14,12 L 16,20 L 18,16 Q 19,14 20,16 L 23,28 Z" fill={color} opacity="0.85" />
        {/* Tiara pearls */}
        <circle cx="6" cy="18" r="1.5" fill={color} />
        <circle cx="10" cy="14" r="1.5" fill={color} />
        <circle cx="14" cy="12" r="1.5" fill={color} />
        <circle cx="18" cy="14" r="1.5" fill={color} />
        <circle cx="22" cy="18" r="1.5" fill={color} />
        {/* Base band */}
        <rect x="5" y="28" width="18" height="2.5" rx="1" fill={color} />
        {/* Rose motif below */}
        <circle cx="14" cy="35" r="3" fill={color} opacity="0.5" />
        <circle cx="14" cy="35" r="1.5" fill={color} opacity="0.3" />
      </svg>
    )
  }

  if (rank === 'J') {
    return (
      <svg viewBox={vb} width={dim} height={dim} className="mx-auto">
        {/* Flat cap crown */}
        <path d="M 4,28 L 2,16 Q 6,14 14,12 Q 22,14 26,16 L 24,28 Z" fill={color} opacity="0.85" />
        {/* Cap brim */}
        <rect x="2" y="26" width="24" height="2" rx="1" fill={color} />
        {/* Feathered plume */}
        <path d="M 14,12 Q 12,6 10,4" fill="none" stroke={color} strokeWidth="1.2" opacity="0.6" />
        <path d="M 14,12 Q 14,5 16,2" fill="none" stroke={color} strokeWidth="1" opacity="0.5" />
        {/* Halberd behind */}
        <rect x="15" y="14" width="2" height="20" rx="0.5" fill={color} opacity="0.35" />
        <path d="M 12,16 L 20,16 L 18,18 L 14,18 Z" fill={color} opacity="0.35" />
      </svg>
    )
  }

  return null
}

function CardFace({ card, size = 'md' }: { card?: Card; size?: 'sm' | 'md' | 'lg' }) {
  if (!card) {
    return <div className="w-full h-full rounded-lg border border-white/20 bg-white/5" />
  }
  return (
    <div className={`w-full h-full rounded-lg border border-gray-300 bg-white flex flex-col p-1 ${suitColors[card.suit]}`}>
      <div className={`${textSizes[size]} font-bold leading-none`}>{card.rank}</div>
      <div className={`${textSizes[size]} leading-none`}>{suitSymbols[card.suit]}</div>
        <div className="flex-1 flex items-center justify-center">
          {['K', 'Q', 'J'].includes(card.rank) && size !== 'sm' ? (
            <FaceCardFigure rank={card.rank} suit={card.suit} size={size} />
          ) : (
            <span className={`${size === 'sm' ? 'text-xl' : 'text-3xl'}`}>{suitSymbols[card.suit]}</span>
          )}
        </div>
    </div>
  )
}

export function CardBack() {
  return (
    <div className="w-full h-full rounded-lg border-2 border-blue-400 bg-blue-700 flex items-center justify-center overflow-hidden">
      <svg viewBox="0 0 60 84" className="w-full h-full" preserveAspectRatio="none">
        {/* Navy field */}
        <rect x="0" y="0" width="60" height="84" rx="6" fill="#1a2744" />
        {/* Outer gold border */}
        <rect x="4" y="4" width="52" height="76" rx="3" fill="none" stroke="#d4a843" strokeWidth="1" />
        {/* Inner gold border */}
        <rect x="7" y="7" width="46" height="70" rx="2" fill="none" stroke="#d4a843" strokeWidth="0.5" />
        {/* Burgundy diamond medallion */}
        <rect x="18" y="30" width="24" height="24" rx="2" fill="#7b1a2b" transform="rotate(45 30 42)" />
        {/* Diamond inner shadow */}
        <rect x="18" y="30" width="24" height="24" rx="2" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" transform="rotate(45 30 42)" />
        {/* Top-left filigree */}
        <path d="M 7,7 Q 10,11 13,7 M 7,7 Q 11,10 7,13" fill="none" stroke="#d4a843" strokeWidth="0.5" />
        <path d="M 13,7 Q 17,15 22,10" fill="none" stroke="#d4a843" strokeWidth="0.5" />
        {/* Top-right filigree (mirror) */}
        <path d="M 53,7 Q 50,11 47,7 M 53,7 Q 49,10 53,13" fill="none" stroke="#d4a843" strokeWidth="0.5" />
        <path d="M 47,7 Q 43,15 38,10" fill="none" stroke="#d4a843" strokeWidth="0.5" />
        {/* Bottom-left filigree (mirror) */}
        <path d="M 7,77 Q 10,73 13,77 M 7,77 Q 11,74 7,71" fill="none" stroke="#d4a843" strokeWidth="0.5" />
        <path d="M 13,77 Q 17,69 22,74" fill="none" stroke="#d4a843" strokeWidth="0.5" />
        {/* Bottom-right filigree (mirror) */}
        <path d="M 53,77 Q 50,73 47,77 M 53,77 Q 49,74 53,71" fill="none" stroke="#d4a843" strokeWidth="0.5" />
        <path d="M 47,77 Q 43,69 38,74" fill="none" stroke="#d4a843" strokeWidth="0.5" />
      </svg>
    </div>
  )
}

export function CardComponent({
  card, size = 'md', delay = 0,
  originX = -60, originY = -300,
  isFlipping,
}: Props) {
  const rot = useMemo(() => (Math.random() - 0.5) * 6, [])

  return (
    <div style={{ perspective: 600 }}>
    <motion.div
      initial={{ x: originX, y: originY, rotate: -15 + rot, opacity: 0 }}
      animate={
        isFlipping !== undefined
          ? { x: 0, y: 0, rotateY: isFlipping ? 180 : 0, rotate: 0, opacity: 1 }
          : { x: 0, y: 0, rotateY: 180, rotate: 0, opacity: 1 }
      }
      transition={{
        duration: isFlipping !== undefined ? 0.5 : 0.6,
        delay,
        type: isFlipping !== undefined ? 'tween' : 'spring',
        stiffness: 120,
        damping: 14,
      }}
      className={`${sizeClasses[size]} rounded-lg flex-shrink-0`}
      style={{
        transformStyle: 'preserve-3d',
        boxShadow: '0 1px 2px rgba(0,0,0,0.8), 0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
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
        className="absolute inset-0 rounded-lg bg-white"
        style={{
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
        }}
      >
        <CardFace card={card} size={size} />
      </div>
    </motion.div>
    </div>
  )
}
