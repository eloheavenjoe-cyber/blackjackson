import type { PlayerState } from '../../engine/types'
import { CardHand } from './CardHand'
import { motion } from 'framer-motion'

type Props = {
  player: PlayerState
  isCurrentTurn: boolean
  x: number
  y: number
  angle: number
  betAmount?: number
  dealIndex?: { first: number; second: number } | null
  originX?: number
  originY?: number
}

export function PlayerPosition({
  player, isCurrentTurn,
  x, y, angle: _angle,
  betAmount = 0,
  dealIndex, originX, originY,
}: Props) {
  const glowIntensity = Math.min(betAmount / 500, 1)
  const glowBase = 16 + glowIntensity * 24
  const glowAlpha = 0.15 + glowIntensity * 0.35
  const ringAlpha = 0.1 + glowIntensity * 0.2

  return (
    <div
      className="absolute"
      style={{
        left: x,
        top: y,
        transform: `translate(-50%, -50%)`,
      }}
    >
      <motion.div
        className="relative w-24 h-24 rounded-full mx-auto mb-1"
        animate={isCurrentTurn ? {
          boxShadow: [
            `0 0 ${glowBase}px rgba(212,168,67,${glowAlpha}), 0 0 0 ${2 + glowIntensity}px rgba(212,168,67,${ringAlpha})`,
            `0 0 ${glowBase + 16}px rgba(212,168,67,${glowAlpha + 0.1}), 0 0 0 ${3 + glowIntensity}px rgba(212,168,67,${ringAlpha + 0.1})`,
            `0 0 ${glowBase}px rgba(212,168,67,${glowAlpha}), 0 0 0 ${2 + glowIntensity}px rgba(212,168,67,${ringAlpha})`,
          ],
          scale: [1, 1.03, 1],
        } : {
          boxShadow: `0 0 ${glowBase}px rgba(212,168,67,${glowAlpha * 0.5}), 0 0 0 1px rgba(212,168,67,${ringAlpha * 0.3})`,
        }}
        transition={isCurrentTurn ? {
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        } : {}}
      >
        <div
          className="absolute inset-0 rounded-full border-2 border-dashed"
          style={{ borderColor: `rgba(212,168,67,${0.08 + glowIntensity * 0.15})` }}
        />
        {isCurrentTurn && (
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{ opacity: [0.05 + glowIntensity * 0.05, 0.15 + glowIntensity * 0.15, 0.05 + glowIntensity * 0.05] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ background: `radial-gradient(circle, rgba(212,168,67,${0.2 + glowIntensity * 0.2}) 0%, transparent 70%)` }}
          />
        )}
      </motion.div>

      <div className="flex justify-center" style={{ marginTop: '-64px' }}>
        {player.hands.length === 0 ? (
          <div className="w-12 h-18" />
        ) : (
          player.hands.map((hand, hi) => (
            <div key={hi} className={hi > 0 ? 'ml-2' : ''}>
              <CardHand
                hand={hand}
                handIndex={hi}
                activeHandIndex={player.activeHandIndex}
                dealIndex={dealIndex ? (hi === 0 ? dealIndex.first : dealIndex.second) : null}
                originX={originX}
                originY={originY}
              />
            </div>
          ))
        )}
      </div>

    </div>
  )
}
